"""Canonical, filesystem-safe image processing for Geo Portfolio.

Originals are byte-for-byte copies.  Public derivatives deliberately omit EXIF
and ICC metadata; transparent pixels are composited onto white for JPEG.
"""
from __future__ import annotations

import json
import os
import shutil
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

PROCESSING_VERSION = 1
VARIANT_MANIFEST = {
    "placeholder": {"long_edge": 40, "formats": ("jpeg",)},
    "thumb": {"long_edge": 320, "formats": ("jpeg", "webp")},
    "small": {"long_edge": 640, "formats": ("jpeg", "webp")},
    "medium": {"long_edge": 1280, "formats": ("jpeg", "webp")},
    "large": {"long_edge": 1920, "formats": ("jpeg", "webp")},
    "xlarge": {"long_edge": 2560, "formats": ("jpeg", "webp"), "minimum_source_edge": 1921},
}
FORMAT_EXTENSIONS = {"jpeg": "jpg", "webp": "webp"}
SOURCE_EXTENSIONS = {"JPEG": "jpg", "PNG": "png", "GIF": "gif", "WEBP": "webp"}
JPEG_QUALITY = 86
WEBP_QUALITY = 84
PLACEHOLDER_QUALITY = 35


class ImageProcessingError(ValueError):
    """A safe, user-facing processing failure."""


@dataclass(frozen=True)
class GeneratedVariant:
    variant: str
    format: str
    width: int
    height: int
    location: str


@dataclass(frozen=True)
class ProcessingResult:
    image_id: str
    original_filename: str
    original_format: str
    original_location: str
    width: int
    height: int
    aspect_ratio: float
    variants: tuple[GeneratedVariant, ...]

    def variants_json(self) -> str:
        return json.dumps([asdict(item) for item in self.variants], separators=(",", ":"))


def valid_image_id(value: str) -> bool:
    try:
        return len(value) == 32 and uuid.UUID(hex=value).hex == value.lower()
    except (ValueError, AttributeError):
        return False


def original_path(storage_root: str | Path, image_id: str, extension: str) -> Path:
    if not valid_image_id(image_id) or extension not in SOURCE_EXTENSIONS.values():
        raise ValueError("invalid storage key")
    return Path(storage_root) / "originals" / image_id / f"original.{extension}"


def variant_path(storage_root: str | Path, image_id: str, variant: str, fmt: str) -> Path:
    if not valid_image_id(image_id) or variant not in VARIANT_MANIFEST or fmt not in VARIANT_MANIFEST[variant]["formats"]:
        raise ValueError("invalid variant key")
    return Path(storage_root) / "variants" / image_id / f"{variant}.{FORMAT_EXTENSIONS[fmt]}"


def _public_image(image: Image.Image, fmt: str) -> Image.Image:
    if fmt == "jpeg":
        if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
            rgba = image.convert("RGBA")
            background = Image.new("RGB", rgba.size, "white")
            background.paste(rgba, mask=rgba.getchannel("A"))
            return background
        return image.convert("RGB")
    return image.convert("RGBA" if "A" in image.getbands() else "RGB")


def process_image(source, storage_root: str | Path, image_id: str, original_filename: str, *, replace_original: bool = True) -> ProcessingResult:
    """Validate ``source``, preserve it unchanged, and atomically publish variants."""
    if not valid_image_id(image_id):
        raise ImageProcessingError("Invalid image identifier")
    root = Path(storage_root)
    staging = root / ".staging" / f"{image_id}-{uuid.uuid4().hex}"
    staging_original = staging / "originals" / image_id
    staging_variants = staging / "variants" / image_id
    try:
        staging_original.mkdir(parents=True)
        staging_variants.mkdir(parents=True)
        incoming = staging / "upload"
        if hasattr(source, "read"):
            source.seek(0)
            with incoming.open("wb") as output:
                shutil.copyfileobj(source, output)
            source.seek(0)
        else:
            shutil.copyfile(source, incoming)

        try:
            with Image.open(incoming) as decoded:
                decoded.verify()
            with Image.open(incoming) as decoded:
                source_format = (decoded.format or "").upper()
                if source_format not in SOURCE_EXTENSIONS:
                    raise ImageProcessingError("Unsupported image type. Use JPEG, PNG, GIF, or WebP")
                oriented = ImageOps.exif_transpose(decoded).copy()
        except (UnidentifiedImageError, OSError, SyntaxError) as exc:
            raise ImageProcessingError("The uploaded file is not a readable image") from exc

        extension = SOURCE_EXTENSIONS[source_format]
        staged_original_file = staging_original / f"original.{extension}"
        os.replace(incoming, staged_original_file)
        width, height = oriented.size
        generated: list[GeneratedVariant] = []
        long_edge = max(width, height)
        for name, spec in VARIANT_MANIFEST.items():
            if long_edge < spec.get("minimum_source_edge", 0):
                continue
            resized = oriented.copy()
            resized.thumbnail((spec["long_edge"], spec["long_edge"]), Image.Resampling.LANCZOS)
            for fmt in spec["formats"]:
                ext = FORMAT_EXTENSIONS[fmt]
                destination = staging_variants / f"{name}.{ext}"
                public = _public_image(resized, fmt)
                options = ({"quality": PLACEHOLDER_QUALITY if name == "placeholder" else JPEG_QUALITY,
                            "optimize": True, "progressive": True} if fmt == "jpeg" else
                           {"quality": WEBP_QUALITY, "method": 6})
                public.save(destination, format="JPEG" if fmt == "jpeg" else "WEBP", **options)
                generated.append(GeneratedVariant(name, fmt, public.width, public.height,
                    f"variants/{image_id}/{name}.{ext}"))

        final_original_dir = root / "originals" / image_id
        final_variant_dir = root / "variants" / image_id
        final_original_dir.parent.mkdir(parents=True, exist_ok=True)
        final_variant_dir.parent.mkdir(parents=True, exist_ok=True)
        # Variants are swapped only after every encode succeeds. Existing originals
        # remain untouched during regeneration.
        if replace_original or not final_original_dir.exists():
            if final_original_dir.exists():
                shutil.rmtree(final_original_dir)
            os.replace(staging_original, final_original_dir)
        backup = staging / "old-variants"
        had_variants = final_variant_dir.exists()
        if had_variants:
            os.replace(final_variant_dir, backup)
        try:
            os.replace(staging_variants, final_variant_dir)
        except Exception:
            if had_variants and backup.exists():
                os.replace(backup, final_variant_dir)
            raise
        shutil.rmtree(staging, ignore_errors=True)
        return ProcessingResult(image_id, Path(original_filename).name, source_format,
            f"originals/{image_id}/original.{extension}", width, height, width / height,
            tuple(generated))
    except ImageProcessingError:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(staging, ignore_errors=True)
        raise ImageProcessingError("Unable to process the image") from exc


def remove_image_files(storage_root: str | Path, image_id: str) -> None:
    if valid_image_id(image_id):
        shutil.rmtree(Path(storage_root) / "originals" / image_id, ignore_errors=True)
        shutil.rmtree(Path(storage_root) / "variants" / image_id, ignore_errors=True)