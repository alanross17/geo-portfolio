-- Responsive image metadata. Apply with the normal database deployment before
-- rolling out the new backend (SQLite/MySQL compatible column definitions).
ALTER TABLE images ADD COLUMN image_uid VARCHAR(32);
ALTER TABLE images ADD COLUMN original_filename VARCHAR(255);
ALTER TABLE images ADD COLUMN original_format VARCHAR(16);
ALTER TABLE images ADD COLUMN original_location VARCHAR(255);
ALTER TABLE images ADD COLUMN width INTEGER;
ALTER TABLE images ADD COLUMN height INTEGER;
ALTER TABLE images ADD COLUMN aspect_ratio NUMERIC(16,8);
ALTER TABLE images ADD COLUMN generated_variants TEXT;
ALTER TABLE images ADD COLUMN processing_status VARCHAR(32);
ALTER TABLE images ADD COLUMN processing_version INTEGER;
CREATE UNIQUE INDEX ix_images_image_uid ON images(image_uid);