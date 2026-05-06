-- Replace random Picsum *seed* covers with fixed /id/* photos skewed toward urban architecture & skylines.
-- Keeps picsum.photos (hotlink-friendly); avoids seed=room_id lottery (animals, plants, etc.).

UPDATE smartstay.room_images ri
SET url = (
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
)[1 + (abs(hashtext(concat(ri.room_id::text, '|', ri.id::text))) % 24)];
