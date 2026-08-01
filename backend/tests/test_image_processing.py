import io

import pytest
from PIL import Image

from image_processing import ImageProcessingError, process_image, variant_path
from image_resources import build_image_resource


def encoded(size=(800, 400), *, exif=None):
    stream = io.BytesIO()
    Image.new("RGB", size, "#336699").save(stream, "JPEG", exif=exif)
    stream.seek(0)
    return stream


def test_landscape_original_storage_and_no_upscale(tmp_path):
    source = encoded()
    original = source.getvalue()
    result = process_image(source, tmp_path, "a" * 32, "holiday.jpg")
    assert (result.width, result.height, result.aspect_ratio) == (800, 400, 2)
    assert (tmp_path / result.original_location).read_bytes() == original
    assert variant_path(tmp_path, "a" * 32, result.generation, "large", "jpeg").is_file()
    assert {max(v.width, v.height) for v in result.variants if v.variant == "large"} == {800}
    assert not any(v.variant == "xlarge" for v in result.variants)


def test_portrait_and_conditional_xlarge(tmp_path):
    result = process_image(encoded((1000, 2000)), tmp_path, "b" * 32, "p.jpg")
    assert (result.width, result.height) == (1000, 2000)
    assert "xlarge" in {v.variant for v in result.variants}


def test_exif_orientation_is_applied(tmp_path):
    exif = Image.Exif()
    exif[274] = 6
    result = process_image(encoded((120, 240), exif=exif), tmp_path, "c" * 32, "r.jpg")
    assert (result.width, result.height) == (240, 120)


def test_public_variant_strips_metadata(tmp_path):
    exif = Image.Exif()
    exif[315] = "private"
    result = process_image(encoded(exif=exif), tmp_path, "d" * 32, "meta.jpg")
    with Image.open(variant_path(tmp_path, "d" * 32, result.generation, "thumb", "jpeg")) as public:
        assert not public.getexif()


def test_corrupt_input_cleanup(tmp_path):
    with pytest.raises(ImageProcessingError):
        process_image(io.BytesIO(b"bad"), tmp_path, "e" * 32, "bad.jpg")
    assert not (tmp_path / "originals" / ("e" * 32)).exists()
    assert not (tmp_path / "variants" / ("e" * 32)).exists()


def test_serializer_fallback_alias_and_omission(tmp_path):
    result = process_image(encoded((500, 250)), tmp_path, "f" * 32, "same.jpg")
    class Record:
        image_uid = id = "f" * 32
        title = subtitle = ig_link = None
        width, height, aspect_ratio = result.width, result.height, result.aspect_ratio
        variant_generation = result.generation
    resource = build_image_resource(Record(), lambda value: "/" + value)
    assert resource["url"] == resource["fallbackUrl"]
    assert resource["fallbackUrl"].endswith(f"/{result.generation}/large.jpg")
    assert resource["placeholder"].endswith(f"/{result.generation}/placeholder.jpg")
    assert not any(v["variant"] == "xlarge" for v in resource["sources"]["jpeg"])


def test_reprocessing_publishes_distinct_immutable_generation_urls(tmp_path):
    image_id = "1" * 32
    first = process_image(encoded((640, 320)), tmp_path, image_id, "first.jpg")
    second = process_image(encoded((800, 400)), tmp_path, image_id, "second.jpg")

    def resource_for(result):
        class Record:
            id = image_uid = image_id
            title = subtitle = ig_link = None
            width, height, aspect_ratio = result.width, result.height, result.aspect_ratio
            variant_generation = result.generation
            generated_variants = result.variants_json()
            relative_url = f"images/{image_id}/{result.generation}/large.jpg"

        return build_image_resource(Record(), lambda value: "/" + value)

    first_url = resource_for(first)["fallbackUrl"]
    second_url = resource_for(second)["fallbackUrl"]
    assert first.generation != second.generation
    assert first_url != second_url

    first_path = variant_path(tmp_path, image_id, first.generation, "large", "jpeg")
    second_path = variant_path(tmp_path, image_id, second.generation, "large", "jpeg")
    assert first_url == f"/images/{image_id}/{first.generation}/large.jpg"
    assert second_url == f"/images/{image_id}/{second.generation}/large.jpg"

    def storage_path(url):
        return tmp_path.joinpath("variants", *url.removeprefix("/images/").split("/"))

    assert storage_path(first_url) == first_path
    assert storage_path(second_url) == second_path
    assert storage_path(first_url) != second_path
    assert storage_path(second_url) != first_path
    assert first_path.is_file()
    assert second_path.is_file()
    assert first_path.parent != second_path.parent