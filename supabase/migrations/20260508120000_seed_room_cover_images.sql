-- Demo-friendly covers for available rooms missing images (picsum: stable hotlinks, no Unsplash 401).
-- Safe to re-run: only inserts where no row exists for that room_id.

WITH missing AS (
  SELECT r.id AS room_id
  FROM smartstay.rooms r
  WHERE coalesce(r.is_deleted, false) = false
    AND r.status = 'available'::smartstay.room_status
    AND NOT EXISTS (
      SELECT 1 FROM smartstay.room_images ri WHERE ri.room_id = r.id
    )
)
INSERT INTO smartstay.room_images (room_id, url, is_main, sort_order, created_at)
SELECT
  m.room_id,
  (
    ARRAY[
      'https://picsum.photos/id/208/1200/900',
      'https://picsum.photos/id/209/1200/900',
      'https://picsum.photos/id/210/1200/900',
      'https://picsum.photos/id/211/1200/900',
      'https://picsum.photos/id/217/1200/900',
      'https://picsum.photos/id/219/1200/900',
      'https://picsum.photos/id/220/1200/900',
      'https://picsum.photos/id/237/1200/900',
      'https://picsum.photos/id/238/1200/900',
      'https://picsum.photos/id/241/1200/900',
      'https://picsum.photos/id/244/1200/900',
      'https://picsum.photos/id/247/1200/900',
      'https://picsum.photos/id/248/1200/900',
      'https://picsum.photos/id/249/1200/900',
      'https://picsum.photos/id/250/1200/900',
      'https://picsum.photos/id/251/1200/900',
      'https://picsum.photos/id/252/1200/900',
      'https://picsum.photos/id/254/1200/900',
      'https://picsum.photos/id/255/1200/900',
      'https://picsum.photos/id/257/1200/900',
      'https://picsum.photos/id/258/1200/900',
      'https://picsum.photos/id/288/1200/900',
      'https://picsum.photos/id/293/1200/900',
      'https://picsum.photos/id/307/1200/900'
    ]
  )[1 + (abs(hashtext(m.room_id::text)) % 24)],
  true,
  0,
  now()
FROM missing m;
