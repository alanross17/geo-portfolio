"""Shared public/admin image resource serialization."""
import json
import random
from typing import List

from sqlalchemy import select

from database import Image
from image_processing import VARIANT_MANIFEST, valid_generation, valid_image_id
from config import ROUND_LIMIT


def _variants_from(value):
    """Return manifest entries that are safe and complete enough to publish."""
    try:
        variants = json.loads(value or "[]") if isinstance(value, str) else value or []
    except (TypeError, ValueError, json.JSONDecodeError):
        return []

    if not isinstance(variants, list):
        return []

    valid = []
    for item in variants:
        if not isinstance(item, dict):
            continue
        variant = item.get("variant")
        image_format = item.get("format")
        width = item.get("width")
        height = item.get("height")
        manifest_entry = VARIANT_MANIFEST.get(variant)
        if (
            not manifest_entry
            or image_format not in manifest_entry["formats"]
            or isinstance(width, bool)
            or isinstance(height, bool)
            or not isinstance(width, (int, float))
            or not isinstance(height, (int, float))
            or width <= 0
            or height <= 0
        ):
            continue
        valid.append(item)
    return valid


def _nullable_float(value):
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError, OverflowError):
        return None


def build_image_resource(image, build_public_url, *, admin=False):
    """Serialize both legacy rows and rows with published image variants.

    Migration is intentionally allowed to run after application deployment: a
    missing or incomplete variant manifest merely makes ``relative_url`` the
    public fallback rather than making the containing API response fail.
    """
    image_uid = getattr(image, "image_uid", None)
    generation = getattr(image, "variant_generation", None)
    can_publish_variants = valid_image_id(image_uid) and valid_generation(generation)
    variants = _variants_from(getattr(image, "generated_variants", None))
    sources = {"webp": [], "jpeg": []}
    placeholder = None

    if can_publish_variants:
        for item in variants:
            image_format = item["format"]
            ext = "jpg" if image_format == "jpeg" else image_format
            url = build_public_url(
                f"images/{image_uid}/{generation}/{item['variant']}.{ext}"
            )
            if item["variant"] == "placeholder":
                placeholder = url
            elif image_format in sources:
                sources[image_format].append({
                    "variant": item["variant"], "width": item["width"],
                    "height": item["height"], "url": url,
                })

    order = {name: index for index, name in enumerate(VARIANT_MANIFEST)}
    for fmt, items in sources.items():
        items.sort(key=lambda item: order[item["variant"]])
        # Older manifests may contain several canonical names for the same
        # no-upscale dimensions. Prefer the later (larger) canonical variant.
        sources[fmt] = list({item["width"]: item for item in items}.values())
    jpegs = sources["jpeg"]
    fallback = next((item for item in jpegs if item["variant"] == "large"), None)
    if fallback is None and jpegs:
        fallback = max(jpegs, key=lambda item: max(item["width"], item["height"]))
    fallback_url = fallback["url"] if fallback else build_public_url(
        getattr(image, "relative_url", "") or ""
    )
    resource = {
        "id": image_uid or getattr(image, "id", None),
        "title": getattr(image, "title", None),
        "subtitle": getattr(image, "subtitle", None),
        "igLink": getattr(image, "ig_link", None),
        "width": getattr(image, "width", None),
        "height": getattr(image, "height", None),
        "aspectRatio": _nullable_float(getattr(image, "aspect_ratio", None)),
        "placeholder": placeholder, "sources": sources, "fallbackUrl": fallback_url,
        # Transitional alias: remove only after PhotoCard and admin consumers migrate.
        "url": fallback_url,
    }
    if admin:
        resource.update({"lat": getattr(image, "lat", None),
            "lng": getattr(image, "lng", None),
            "originalFilename": getattr(image, "original_filename", None),
            "originalFormat": getattr(image, "original_format", None),
            "originalDownloadUrl": (build_public_url(f"api/admin/images/{image_uid}/original")
                                    if valid_image_id(image_uid) else None),
            "processingStatus": getattr(image, "processing_status", None),
            "processingVersion": getattr(image, "processing_version", None),
            "variantGeneration": generation,})
    return resource


def classify_orientation(aspect_ratio: float) -> str:
    # classifies what is considered portrait or landscape
    # exact aspect ratio is slightly over shot in both directions in case of rounding errors
    # considers square images as both orientations
    if aspect_ratio > 1.05:
        return "landscape"

    if aspect_ratio < 0.95:
        return "portrait"

    return "square"


def choose_image_order(session, viewport_aspect_ratio: float) -> List[str]:
    """Choose images matching the viewport orientation where possible."""
    # there's some obvious flaws here, but this is just simple start to better adapt images to screens
    # - with a certain aspect ratio there are still large variations that may lead to cropping (i.e. 5:4 vs 2:1)
    # - image list is set on session creation, therefore if users window size changes, the matching breaks.

    # get all images where aspect ratio has been calculated
    images = session.scalars(
        select(Image).where(Image.aspect_ratio.is_not(None))
    ).all()

    if not images:
        raise ValueError("No images available")

    # classify orientation of aspect ratio passed from user via API
    viewport_orientation = (
        "landscape"
        if viewport_aspect_ratio > 1
        else "portrait"
    )

    matching_images = []
    fallback_images = []

    # loop db image list
    for image in images:
        # detrmine orientation class
        image_orientation = classify_orientation(
            float(image.aspect_ratio)
        )

        # sort by whether they fit the users orientation
        if image_orientation in (viewport_orientation, "square"):
            matching_images.append(image.id)
        else:
            fallback_images.append(image.id)

    # shuffle the lists
    random.shuffle(matching_images)
    random.shuffle(fallback_images)

    desired_count = ROUND_LIMIT + 2

    # this should be cleaned up to avoid even processing the fallback images if enough matches exist.
    # Matching images are always used first. Other orientations only fill gaps.
    image_ids = matching_images + fallback_images

    if not image_ids:
        raise ValueError("No usable images available")

    return image_ids[:desired_count]