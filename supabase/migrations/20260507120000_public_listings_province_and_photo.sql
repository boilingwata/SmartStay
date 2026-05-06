-- Province on buildings + cover image URL on public_room_listings for honest marketplace UI.

ALTER TABLE smartstay.buildings
  ADD COLUMN IF NOT EXISTS province text;

COMMENT ON COLUMN smartstay.buildings.province IS 'Normalized province/city label for public filtering (best-effort backfill from address).';

-- Best-effort backfill from address text (Vietnamese labels). Order: more specific / metro patterns first.
UPDATE smartstay.buildings SET province = 'TP. Hồ Chí Minh'
WHERE province IS NULL AND (
  address ILIKE '%Thành phố Hồ Chí Minh%'
  OR address ILIKE '%TP. Hồ Chí Minh%'
  OR address ILIKE '%TP.HCM%'
  OR address ILIKE '%TP. Ho Chi Minh%'
  OR address ILIKE '%Ho Chi Minh%'
  OR (address ILIKE '%Quận %' AND address ILIKE '%Hồ Chí Minh%')
);

UPDATE smartstay.buildings SET province = 'Hà Nội'
WHERE province IS NULL AND (
  address ILIKE '%Hà Nội%'
  OR address ILIKE '%Ha Noi%'
  OR address ILIKE '%Hanoi%'
);

UPDATE smartstay.buildings SET province = 'Đà Nẵng'
WHERE province IS NULL AND (
  address ILIKE '%Đà Nẵng%'
  OR address ILIKE '%Da Nang%'
);

UPDATE smartstay.buildings SET province = 'Cần Thơ'
WHERE province IS NULL AND (
  address ILIKE '%Cần Thơ%'
  OR address ILIKE '%Can Tho%'
);

UPDATE smartstay.buildings SET province = 'Hải Phòng'
WHERE province IS NULL AND (
  address ILIKE '%Hải Phòng%'
  OR address ILIKE '%Hai Phong%'
);

UPDATE smartstay.buildings SET province = 'Huế'
WHERE province IS NULL AND (
  address ILIKE '%Huế%'
  OR address ILIKE '%Hue%'
  OR address ILIKE '%Thừa Thiên Huế%'
);

UPDATE smartstay.buildings SET province = 'Khánh Hòa'
WHERE province IS NULL AND (
  address ILIKE '%Nha Trang%'
  OR address ILIKE '%Khánh Hòa%'
);

UPDATE smartstay.buildings SET province = 'Bình Dương'
WHERE province IS NULL AND (
  address ILIKE '%Bình Dương%'
  OR address ILIKE '%Binh Duong%'
);

UPDATE smartstay.buildings SET province = 'Đồng Nai'
WHERE province IS NULL AND (
  address ILIKE '%Đồng Nai%'
  OR address ILIKE '%Dong Nai%'
);

-- Replacing the view column layout requires drop + create (CREATE OR REPLACE cannot rename columns).
DROP VIEW IF EXISTS smartstay.public_room_listings CASCADE;

CREATE VIEW smartstay.public_room_listings AS
 SELECT r.id AS room_id,
    r.uuid AS room_uuid,
    r.room_code,
    r.room_type,
    r.area_sqm,
    r.base_rent,
    r.max_occupants,
    r.floor_number,
    r.has_balcony,
    r.has_private_bathroom,
    r.facing,
    r.condition_score,
        CASE
            WHEN jsonb_typeof(r.amenities) = 'array'::text THEN r.amenities
            ELSE '[]'::jsonb
        END AS room_amenities,
    b.id AS building_id,
    b.uuid AS building_uuid,
    b.name AS building_name,
    b.address AS building_address,
    b.description AS building_description,
        CASE
            WHEN jsonb_typeof(b.amenities) = 'array'::text THEN b.amenities
            ELSE '[]'::jsonb
        END AS building_amenities,
    b.province AS province,
    ( SELECT ri.url
           FROM smartstay.room_images ri
          WHERE ri.room_id = r.id
          ORDER BY ri.is_main DESC NULLS LAST, ri.sort_order ASC NULLS LAST, ri.id ASC
         LIMIT 1) AS cover_image_url,
    'available_now'::text AS availability_status
   FROM smartstay.rooms r
     JOIN smartstay.buildings b ON b.id = r.building_id
  WHERE r.status = 'available'::smartstay.room_status AND COALESCE(r.is_deleted, false) = false AND COALESCE(b.is_deleted, false) = false;

ALTER VIEW smartstay.public_room_listings OWNER TO postgres;

GRANT SELECT ON TABLE smartstay.public_room_listings TO anon;
GRANT SELECT ON TABLE smartstay.public_room_listings TO authenticated;
GRANT SELECT ON TABLE smartstay.public_room_listings TO service_role;
