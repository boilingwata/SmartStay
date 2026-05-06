-- Per-building count of available rooms for honest marketplace badges (homepage cards, etc.).

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
    ( SELECT count(*)::integer AS count
           FROM smartstay.rooms r2
             JOIN smartstay.buildings b2 ON b2.id = r2.building_id
          WHERE r2.building_id = r.building_id
            AND r2.status = 'available'::smartstay.room_status
            AND COALESCE(r2.is_deleted, false) = false
            AND COALESCE(b2.is_deleted, false) = false) AS building_available_room_count,
    'available_now'::text AS availability_status
   FROM smartstay.rooms r
     JOIN smartstay.buildings b ON b.id = r.building_id
  WHERE r.status = 'available'::smartstay.room_status AND COALESCE(r.is_deleted, false) = false AND COALESCE(b.is_deleted, false) = false;

ALTER VIEW smartstay.public_room_listings OWNER TO postgres;

GRANT SELECT ON TABLE smartstay.public_room_listings TO anon;
GRANT SELECT ON TABLE smartstay.public_room_listings TO authenticated;
GRANT SELECT ON TABLE smartstay.public_room_listings TO service_role;
