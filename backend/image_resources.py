"""Shared public/admin image resource serialization."""
import json

from image_processing import VARIANT_MANIFEST


def build_image_resource(image, build_public_url, *, admin=False):
    variants = json.loads(image.generated_variants or "[]")
    sources = {"webp": [], "jpeg": []}
    placeholder = None

    if not image.image_uid:
        raise ValueError("Image has no image_uid")

    if not image.variant_generation:
        raise ValueError(
            f"Image {image.image_uid} has no published variant generation"
        )

    for item in variants:
        ext = "jpg" if item["format"] == "jpeg" else item["format"]
        url = build_public_url(f"images/{image.image_uid}/{image.variant_generation}/{item['variant']}.{ext}")
        if item["variant"] == "placeholder":
            placeholder = url
        elif item["format"] in sources:
            sources[item["format"]].append({
                "variant": item["variant"], "width": item["width"],
                "height": item["height"], "url": url,
            })
    order = {name: index for index, name in enumerate(VARIANT_MANIFEST)}
    for items in sources.values():
        items.sort(key=lambda item: order[item["variant"]])
    jpegs = sources["jpeg"]
    fallback = next((item for item in jpegs if item["variant"] == "large"), None)
    if fallback is None and jpegs:
        fallback = max(jpegs, key=lambda item: max(item["width"], item["height"]))
    fallback_url = fallback["url"] if fallback else build_public_url(image.relative_url)
    resource = {
        "id": image.image_uid or image.id,
        "title": image.title, "subtitle": image.subtitle, "igLink": image.ig_link,
        "width": image.width, "height": image.height,
        "aspectRatio": float(image.aspect_ratio) if image.aspect_ratio is not None else None,
        "placeholder": placeholder, "sources": sources, "fallbackUrl": fallback_url,
        # Transitional alias: remove only after PhotoCard and admin consumers migrate.
        "url": fallback_url,
    }
    if admin:
        resource.update({"lat": image.lat, "lng": image.lng,
            "originalFilename": image.original_filename,
            "originalFormat": image.original_format,
            "originalDownloadUrl": (build_public_url(f"api/admin/images/{image.image_uid}/original")
                                    if image.image_uid else None),
            "processingStatus": image.processing_status,
            "processingVersion": image.processing_version,
            "variantGeneration": image.variant_generation,})
    return resource