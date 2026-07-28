"""Restartable migration of database-known legacy images."""
from __future__ import annotations

import json
import os
import uuid
from pathlib import Path

import click
from sqlalchemy import select

from database import Image, get_session
from image_processing import PROCESSING_VERSION, ImageProcessingError, process_image


def register_image_migration(app, storage_root):
    @app.cli.command("migrate-images")
    @click.option("--dry-run", is_flag=True, help="Report changes without writing files or rows.")
    @click.option("--regenerate", is_flag=True, help="Rebuild even complete current-version images.")
    def migrate_images(dry_run=False, regenerate=False):
        counts = {"total": 0, "migrated": 0, "skipped": 0, "failed": 0}
        with get_session() as session:
            record_ids = list(session.scalars(select(Image.id)))
        for record_id in record_ids:
            counts["total"] += 1
            try:
                with get_session() as session:
                    image = session.get(Image, record_id)
                    complete = (image.image_uid and image.processing_status == "ready" and
                                image.processing_version == PROCESSING_VERSION and
                                image.generated_variants)
                    if complete and not regenerate:
                        counts["skipped"] += 1
                        click.echo(f"SKIP {record_id}: already migrated")
                        continue
                    image_uid = image.image_uid or uuid.uuid4().hex
                    legacy_name = os.path.basename((image.relative_url or "").replace("\\", "/"))
                    source = None
                    if image.original_location:
                        candidate = Path(storage_root).joinpath(*image.original_location.split("/"))
                        if candidate.is_file():
                            source = candidate
                    if source is None:
                        candidate = Path(storage_root) / legacy_name
                        if candidate.is_file():
                            source = candidate
                    if source is None:
                        raise ImageProcessingError(f"legacy source is missing ({legacy_name})")
                    if dry_run:
                        counts["migrated"] += 1
                        click.echo(f"WOULD MIGRATE {record_id} as {image_uid}")
                        continue
                    result = process_image(source, storage_root, image_uid,
                        image.original_filename or legacy_name,
                        replace_original=not bool(image.original_location))
                    image.image_uid = image_uid
                    image.original_filename = result.original_filename
                    image.original_format = result.original_format
                    image.original_location = result.original_location
                    image.width, image.height = result.width, result.height
                    image.aspect_ratio = result.aspect_ratio
                    image.generated_variants = result.variants_json()
                    image.processing_status = "ready"
                    image.processing_version = PROCESSING_VERSION
                    session.flush()
                    counts["migrated"] += 1
                    click.echo(f"MIGRATED {record_id} as {image_uid}")
            except Exception as exc:
                counts["failed"] += 1
                click.echo(f"FAILED {record_id}: {exc}", err=True)
        click.echo(f"Total records: {counts['total']}")
        click.echo(f"Migrated: {counts['migrated']}")
        click.echo(f"Already migrated: {counts['skipped']}")
        click.echo(f"Failed: {counts['failed']}")
        if counts["failed"]:
            raise click.exceptions.Exit(1)