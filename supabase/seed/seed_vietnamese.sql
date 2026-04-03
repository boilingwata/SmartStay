-- SEED: Vietnamese demo data
-- Generated: 2026-04-03
-- SmartStay BMS — 30 buildings, ~450 rooms, 100 tenants, 95 contracts, invoices, payments
-- Run with: Supabase MCP execute_sql (split into sections if needed)

BEGIN;

-- ============================================================
-- TEMP TABLES for cross-section ID tracking
-- ============================================================
CREATE TEMP TABLE _building (seq INT PRIMARY KEY, id INT);
CREATE TEMP TABLE _room     (seq INT PRIMARY KEY, id INT, building_seq INT, status TEXT DEFAULT 'available');
CREATE TEMP TABLE _tenant   (seq INT PRIMARY KEY, id INT);
CREATE TEMP TABLE _contract (seq INT PRIMARY KEY, id INT, room_id INT, tenant_id INT, status TEXT);
CREATE TEMP TABLE _invoice  (seq INT PRIMARY KEY, id INT, contract_id INT, period TEXT, status TEXT, total_amount NUMERIC);

-- ============================================================
-- 1. BUILDINGS (30)
-- ============================================================
WITH ins AS (
  INSERT INTO smartstay.buildings (name, address, owner_id, total_floors, created_at)
  VALUES
    -- Hồ Chí Minh (12)
    ('Chung cư An Phú Plaza',       '123 Lê Văn Lương, Phường An Phú, Quận 7, Hồ Chí Minh',           NULL, 10, NOW()),
    ('Nhà trọ Bình An',             '45 Nguyễn Thị Minh Khai, Phường 6, Quận 3, Hồ Chí Minh',          NULL,  5, NOW()),
    ('Khu nhà ở Tân Cảng',          '78 Xô Viết Nghệ Tĩnh, Phường 26, Bình Thạnh, Hồ Chí Minh',        NULL,  7, NOW()),
    ('Chung cư Sunrise City',       '27 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, Hồ Chí Minh',         NULL, 15, NOW()),
    ('Nhà trọ Thanh Xuân',          '12 Lê Thị Riêng, Phường Bến Thành, Quận 1, Hồ Chí Minh',          NULL,  4, NOW()),
    ('Khu căn hộ Vinhomes',         '208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, Hồ Chí Minh',         NULL, 20, NOW()),
    ('Chung cư Minh Khai',          '99 Trường Chinh, Phường 12, Tân Bình, Hồ Chí Minh',                NULL,  8, NOW()),
    ('Nhà trọ Hòa Bình',            '33 Phan Văn Trị, Phường 10, Bình Thạnh, Hồ Chí Minh',             NULL,  3, NOW()),
    ('Khu nhà ở Thủ Đức Xanh',     '56 Võ Văn Ngân, Phường Bình Thọ, Thủ Đức, Hồ Chí Minh',          NULL,  6, NOW()),
    ('Chung cư Bình Dương Tower',   '14 Kha Vạn Cân, Phường Linh Đông, Thủ Đức, Hồ Chí Minh',          NULL, 12, NOW()),
    ('Nhà trọ Cô Giang',            '7 Cô Giang, Phường Cô Giang, Quận 1, Hồ Chí Minh',                NULL,  3, NOW()),
    ('Khu căn hộ Tân Bình Center',  '88 Hoàng Văn Thụ, Phường 4, Tân Bình, Hồ Chí Minh',               NULL,  9, NOW()),
    -- Hà Nội (10)
    ('Chung cư Hoàn Kiếm Residence','15 Hàng Bông, Phường Hàng Gai, Hoàn Kiếm, Hà Nội',                NULL,  8, NOW()),
    ('Nhà trọ Đống Đa',             '42 Khâm Thiên, Phường Khâm Thiên, Đống Đa, Hà Nội',               NULL,  4, NOW()),
    ('Khu căn hộ Cầu Giấy',         '71 Trần Duy Hưng, Phường Trung Hòa, Cầu Giấy, Hà Nội',            NULL, 10, NOW()),
    ('Chung cư Hai Bà Trưng Plaza',  '29 Lê Đại Hành, Phường Lê Đại Hành, Hai Bà Trưng, Hà Nội',       NULL,  7, NOW()),
    ('Nhà trọ Thanh Xuân Bắc',      '5 Ngụy Như Kon Tum, Phường Thanh Xuân Nam, Thanh Xuân, Hà Nội',   NULL,  5, NOW()),
    ('Khu nhà ở Kim Mã',             '101 Kim Mã, Phường Kim Mã, Ba Đình, Hà Nội',                       NULL,  6, NOW()),
    ('Chung cư Mỹ Đình Pearl',      '67 Lê Đức Thọ, Phường Mỹ Đình 2, Nam Từ Liêm, Hà Nội',            NULL, 12, NOW()),
    ('Nhà trọ Giảng Võ',            '18 Giảng Võ, Phường Giảng Võ, Ba Đình, Hà Nội',                   NULL,  3, NOW()),
    ('Khu căn hộ Tây Hồ',           '38 Xuân Diệu, Phường Quảng An, Tây Hồ, Hà Nội',                   NULL,  8, NOW()),
    ('Chung cư Long Biên Green',    '95 Nguyễn Văn Cừ, Phường Ngọc Lâm, Long Biên, Hà Nội',             NULL,  9, NOW()),
    -- Đà Nẵng (4)
    ('Chung cư Hải Châu Center',    '24 Trần Phú, Phường Hải Châu 1, Hải Châu, Đà Nẵng',               NULL,  7, NOW()),
    ('Nhà trọ Sơn Trà View',        '8 Đường 2/9, Phường Mân Thái, Sơn Trà, Đà Nẵng',                  NULL,  4, NOW()),
    ('Khu căn hộ Mỹ Khê',           '49 Trường Sa, Phường Mỹ An, Ngũ Hành Sơn, Đà Nẵng',               NULL,  6, NOW()),
    ('Chung cư Liên Chiểu Tower',   '112 Nguyễn Lương Bằng, Phường Hòa Khánh, Liên Chiểu, Đà Nẵng',    NULL,  8, NOW()),
    -- Cần Thơ (2)
    ('Chung cư Ninh Kiều River',    '36 Hai Bà Trưng, Phường Tân An, Ninh Kiều, Cần Thơ',               NULL,  6, NOW()),
    ('Nhà trọ Cần Thơ Center',      '17 Phan Đình Phùng, Phường An Phú, Ninh Kiều, Cần Thơ',            NULL,  4, NOW()),
    -- Nha Trang (1)
    ('Chung cư Lộc Thọ Seaside',    '55 Trần Phú, Phường Lộc Thọ, Lộc Thọ, Nha Trang',                NULL,  8, NOW()),
    -- Huế (1)
    ('Nhà trọ Phú Hội Heritage',    '22 Lê Lợi, Phường Phú Hội, Thành phố Huế',                        NULL,  4, NOW())
  RETURNING id
)
INSERT INTO _building (seq, id)
SELECT row_number() OVER (ORDER BY id) AS seq, id FROM ins;

-- ============================================================
-- 2. ROOMS (~450: 5 floors × 3 units × 30 buildings)
-- ============================================================
INSERT INTO smartstay.rooms
  (building_id, room_code, floor_number, room_type, base_rent, status, area_sqm, created_at)
SELECT
  b.id,
  LPAD((f.floor * 100 + u.unit)::TEXT, 3, '0'),
  f.floor,
  (ARRAY['Studio','Studio','1BR','2BR','Dormitory'])
    [(((b.seq - 1)*15 + (f.floor - 1)*3 + (u.unit - 1)) % 5) + 1],
  CASE (ARRAY['Studio','Studio','1BR','2BR','Dormitory'])
         [(((b.seq - 1)*15 + (f.floor - 1)*3 + (u.unit - 1)) % 5) + 1]
    WHEN 'Studio'    THEN 3000000  + ((b.seq * 17 + f.floor * 7 + u.unit * 3) % 2500001)
    WHEN '1BR'       THEN 5000000  + ((b.seq * 19 + f.floor * 5 + u.unit * 7) % 4000001)
    WHEN '2BR'       THEN 8000000  + ((b.seq * 13 + f.floor * 9 + u.unit * 2) % 6000001)
    WHEN 'Dormitory' THEN 1800000  + ((b.seq * 11 + f.floor * 3 + u.unit * 5) % 1000001)
    ELSE             3000000  + ((b.seq * 17 + f.floor * 7 + u.unit * 3) % 2500001)
  END,
  'available',
  CASE (ARRAY['Studio','Studio','1BR','2BR','Dormitory'])
         [(((b.seq - 1)*15 + (f.floor - 1)*3 + (u.unit - 1)) % 5) + 1]
    WHEN 'Studio'    THEN 25 + ((b.seq + f.floor + u.unit) % 10)
    WHEN '1BR'       THEN 40 + ((b.seq + f.floor + u.unit) % 15)
    WHEN '2BR'       THEN 60 + ((b.seq + f.floor + u.unit) % 20)
    WHEN 'Dormitory' THEN 15 + ((b.seq + f.floor + u.unit) % 5)
    ELSE             30 + ((b.seq + f.floor + u.unit) % 10)
  END,
  NOW()
FROM _building b
CROSS JOIN generate_series(1, 5) AS f(floor)
CROSS JOIN generate_series(1, 3) AS u(unit);

INSERT INTO _room (seq, id, building_seq, status)
SELECT
  row_number() OVER (ORDER BY b.seq, r.floor_number, r.room_code) AS seq,
  r.id,
  b.seq,
  'available'
FROM smartstay.rooms r
JOIN _building b ON b.id = r.building_id;

-- ============================================================
-- 3. TENANTS (100)
-- ============================================================
INSERT INTO smartstay.tenants
  (full_name, phone, id_number, date_of_birth, gender, permanent_address,
   documents, profile_id, is_deleted, created_at)
SELECT
  n.full_name, n.phone, n.id_number, n.date_of_birth::DATE,
  n.gender::smartstay.gender_type,
  n.permanent_address,
  CASE WHEN n.documents IS NULL THEN '[]'::jsonb ELSE n.documents::jsonb END,
  NULL, FALSE, NOW()
FROM (VALUES
  ('Nguyễn Văn An',       '0912345678', '001082012301', '1990-03-15', 'male',   'Hà Nội',                 '{"vehicle_plates":["51B1-12345"]}'),
  ('Trần Thị Bình',       '0387654321', '001193023402', '1985-07-22', 'female', 'Hồ Chí Minh',            '{"vehicle_plates":["29A-54321"]}'),
  ('Lê Văn Cường',        '0923456789', '001204034503', '1992-11-08', 'male',   'Đà Nẵng',                NULL),
  ('Phạm Thị Dung',       '0398765432', '001315045604', '1988-02-14', 'female', 'Hải Phòng',              NULL),
  ('Hoàng Văn Em',        '0934567890', '001426056705', '1995-06-30', 'male',   'Cần Thơ',                NULL),
  ('Vũ Thị Phương',       '0309876543', '001537067806', '1983-09-17', 'female', 'Nghệ An',                '{"vehicle_plates":["51C1-67890"]}'),
  ('Đặng Văn Giang',      '0945678901', '001648078907', '1997-01-05', 'male',   'Thanh Hóa',              '{"vehicle_plates":["30A-09876"]}'),
  ('Bùi Thị Hoa',         '0320987654', '001759089008', '1991-04-28', 'female', 'Hà Tĩnh',                NULL),
  ('Ngô Văn Inh',         '0956789012', '001860090109', '1986-12-11', 'male',   'Quảng Bình',             NULL),
  ('Dương Thị Kim',       '0331098765', '001971001210', '1993-08-03', 'female', 'Quảng Trị',              NULL),
  ('Nguyễn Thị Lan',      '0967890123', '002082012311', '1989-05-19', 'female', 'Thừa Thiên Huế',         '{"vehicle_plates":["51D1-11111"]}'),
  ('Trần Văn Minh',       '0342109876', '002193023412', '1996-10-25', 'male',   'Quảng Nam',              '{"vehicle_plates":["29B-22222"]}'),
  ('Lê Thị Ngọc',         '0978901234', '002204034513', '1984-03-07', 'female', 'Quảng Ngãi',             NULL),
  ('Phạm Văn Oanh',       '0353210987', '002315045614', '1998-07-14', 'male',   'Bình Định',              NULL),
  ('Hoàng Thị Phúc',      '0989012345', '002426056715', '1987-11-21', 'female', 'Phú Yên',                NULL),
  ('Vũ Văn Quang',        '0364321098', '002537067816', '1994-01-09', 'male',   'Khánh Hòa',              '{"vehicle_plates":["51E1-33333"]}'),
  ('Đặng Thị Rương',      '0990123456', '002648078917', '1982-06-16', 'female', 'Ninh Thuận',             '{"vehicle_plates":["30B-44444"]}'),
  ('Bùi Văn Sơn',         '0375432109', '002759089018', '1999-09-23', 'male',   'Bình Thuận',             NULL),
  ('Ngô Thị Tâm',         '0901234567', '002860090119', '1990-02-01', 'female', 'Đồng Nai',               NULL),
  ('Dương Văn Uy',        '0386543210', '002971001220', '1985-05-10', 'male',   'Bình Dương',              NULL),
  ('Nguyễn Văn Vinh',     '0912233445', '003082012321', '1992-08-18', 'male',   'Bà Rịa - Vũng Tàu',     '{"vehicle_plates":["51F1-55555"]}'),
  ('Trần Thị Xuân',       '0387766554', '003193023422', '1988-12-27', 'female', 'Long An',                '{"vehicle_plates":["29C-66666"]}'),
  ('Lê Văn Yên',          '0923344556', '003204034523', '1995-04-05', 'male',   'Tiền Giang',             NULL),
  ('Phạm Thị Zung',       '0398877665', '003315045624', '1983-07-13', 'female', 'Bến Tre',                NULL),
  ('Hoàng Văn Anh',       '0934455667', '003426056725', '1997-10-22', 'male',   'Vĩnh Long',              NULL),
  ('Vũ Thị Bảo',          '0309988776', '003537067826', '1991-01-30', 'female', 'Trà Vinh',               '{"vehicle_plates":["51G1-77777"]}'),
  ('Đặng Văn Chi',        '0945566778', '003648078927', '1986-05-08', 'male',   'Đồng Tháp',              '{"vehicle_plates":["30C-88888"]}'),
  ('Bùi Thị Dào',         '0320099887', '003759089028', '1993-09-15', 'female', 'An Giang',               NULL),
  ('Ngô Văn Đức',         '0956677889', '003860090129', '1989-02-23', 'male',   'Kiên Giang',             NULL),
  ('Dương Thị Em',        '0331100998', '003971001230', '1996-06-01', 'female', 'Hậu Giang',              NULL),
  ('Nguyễn Thị Phương',   '0967788990', '034082012331', '1984-10-09', 'female', 'Sóc Trăng',              '{"vehicle_plates":["51H1-99999"]}'),
  ('Trần Văn Giàu',       '0342011009', '034193023432', '1998-01-17', 'male',   'Bạc Liêu',               '{"vehicle_plates":["29D-00001"]}'),
  ('Lê Thị Hạnh',         '0978899100', '034204034533', '1987-04-25', 'female', 'Cà Mau',                 NULL),
  ('Phạm Văn Ích',        '0353122010', '034315045634', '1994-08-03', 'male',   'Nam Định',               NULL),
  ('Hoàng Thị Khánh',     '0989900211', '034426056735', '1982-11-11', 'female', 'Thái Bình',              NULL),
  ('Vũ Văn Long',         '0364033122', '034537067836', '1999-03-19', 'male',   'Hà Nam',                 '{"vehicle_plates":["51K1-11112"]}'),
  ('Đặng Thị Mai',        '0990011233', '034648078937', '1990-07-27', 'female', 'Ninh Bình',              '{"vehicle_plates":["30D-22223"]}'),
  ('Bùi Văn Nam',         '0375144344', '034759089038', '1985-11-05', 'male',   'Bắc Ninh',               NULL),
  ('Ngô Thị Oanh',        '0901255455', '034860090139', '1992-02-13', 'female', 'Bắc Giang',              NULL),
  ('Dương Văn Phú',       '0386366566', '034971001240', '1988-06-21', 'male',   'Hải Dương',              NULL),
  ('Nguyễn Văn Quý',      '0912477677', '035082012341', '1995-10-29', 'male',   'Hưng Yên',               '{"vehicle_plates":["51L1-33334"]}'),
  ('Trần Thị Ren',        '0387588788', '035193023442', '1983-02-07', 'female', 'Vĩnh Phúc',              '{"vehicle_plates":["29E-44445"]}'),
  ('Lê Văn Sáng',         '0923699899', '035204034543', '1997-05-16', 'male',   'Phú Thọ',                NULL),
  ('Phạm Thị Tài',        '0398710910', '035315045644', '1991-09-24', 'female', 'Thái Nguyên',            NULL),
  ('Hoàng Văn Ước',       '0934822021', '035426056745', '1986-01-02', 'male',   'Bắc Kạn',                NULL),
  ('Vũ Thị Vân',          '0309933132', '035537067846', '1993-04-10', 'female', 'Lạng Sơn',               '{"vehicle_plates":["51M1-55556"]}'),
  ('Đặng Văn Xứng',       '0945044243', '035648078947', '1989-08-18', 'male',   'Cao Bằng',               '{"vehicle_plates":["30E-66667"]}'),
  ('Bùi Thị Yến',         '0320155354', '035759089048', '1996-12-26', 'female', 'Hà Giang',               NULL),
  ('Ngô Văn Zứng',        '0956266465', '035860090149', '1984-03-06', 'male',   'Tuyên Quang',            NULL),
  ('Dương Thị Ái',        '0331377576', '035971001250', '1998-07-14', 'female', 'Yên Bái',                NULL),
  ('Nguyễn Văn Bách',     '0967488687', '036082012351', '1987-10-22', 'male',   'Lào Cai',                '{"vehicle_plates":["51N1-77778"]}'),
  ('Trần Thị Cúc',        '0342599798', '036193023452', '1994-02-01', 'female', 'Điện Biên',              '{"vehicle_plates":["29F-88889"]}'),
  ('Lê Văn Dũng',         '0978600809', '036204034553', '1982-05-09', 'male',   'Lai Châu',               NULL),
  ('Phạm Thị Ê',          '0353711910', '036315045654', '1999-09-17', 'female', 'Sơn La',                 NULL),
  ('Hoàng Văn Phát',      '0989822021', '036426056755', '1990-01-25', 'male',   'Hòa Bình',               NULL),
  ('Vũ Thị Giao',         '0364933132', '036537067856', '1985-05-03', 'female', 'Hà Nội',                 '{"vehicle_plates":["51P1-99990"]}'),
  ('Đặng Văn Hùng',       '0990044243', '036648078957', '1992-09-11', 'male',   'Hồ Chí Minh',            '{"vehicle_plates":["30F-00002"]}'),
  ('Bùi Thị Inh',         '0375155354', '036759089058', '1988-01-19', 'female', 'Đà Nẵng',                NULL),
  ('Ngô Văn Kiên',        '0901266465', '036860090159', '1995-05-27', 'male',   'Hải Phòng',              NULL),
  ('Dương Thị Lý',        '0386377576', '036971001260', '1983-09-05', 'female', 'Cần Thơ',                NULL),
  ('Nguyễn Thị Mơ',       '0912488687', '038082012361', '1997-01-13', 'female', 'Nghệ An',                '{"vehicle_plates":["51Q1-11123"]}'),
  ('Trần Văn Nhân',       '0387599798', '038193023462', '1991-05-21', 'male',   'Thanh Hóa',              '{"vehicle_plates":["29G-22234"]}'),
  ('Lê Thị Oanh',         '0923600809', '038204034563', '1986-09-29', 'female', 'Hà Tĩnh',                NULL),
  ('Phạm Văn Phong',      '0398711910', '038315045664', '1993-01-07', 'male',   'Quảng Bình',             NULL),
  ('Hoàng Thị Quyên',     '0934822021', '038426056765', '1989-05-15', 'female', 'Quảng Trị',              NULL),
  ('Vũ Văn Rạng',         '0309933132', '038537067866', '1996-09-23', 'male',   'Thừa Thiên Huế',         '{"vehicle_plates":["51R1-33345"]}'),
  ('Đặng Thị Sương',      '0945044243', '038648078967', '1984-01-01', 'female', 'Quảng Nam',              '{"vehicle_plates":["30G-44456"]}'),
  ('Bùi Văn Thành',       '0320155354', '038759089068', '1998-05-09', 'male',   'Quảng Ngãi',             NULL),
  ('Ngô Thị Uyên',        '0956266465', '038860090169', '1987-09-17', 'female', 'Bình Định',              NULL),
  ('Dương Văn Vỹ',        '0331377576', '038971001270', '1994-01-25', 'male',   'Phú Yên',                NULL),
  ('Nguyễn Văn Xuân',     '0967488687', '040082012371', '1982-05-03', 'male',   'Khánh Hòa',              '{"vehicle_plates":["51S1-55567"]}'),
  ('Trần Thị Ý',          '0342599798', '040193023472', '1999-09-11', 'female', 'Ninh Thuận',             '{"vehicle_plates":["29H-66678"]}'),
  ('Lê Văn Điền',         '0978600809', '040204034573', '1990-01-19', 'male',   'Bình Thuận',             NULL),
  ('Phạm Thị Băng',       '0353711910', '040315045674', '1985-05-27', 'female', 'Đồng Nai',               NULL),
  ('Hoàng Văn Công',      '0989822021', '040426056775', '1992-09-05', 'male',   'Bình Dương',              NULL),
  ('Vũ Thị Đào',          '0364933132', '040537067876', '1988-01-13', 'female', 'Bà Rịa - Vũng Tàu',     '{"vehicle_plates":["51T1-77789"]}'),
  ('Đặng Văn Gia',        '0990044243', '040648078977', '1995-05-21', 'male',   'Long An',                '{"vehicle_plates":["30H-88890"]}'),
  ('Bùi Thị Hằng',        '0375155354', '040759089078', '1983-09-29', 'female', 'Tiền Giang',             NULL),
  ('Ngô Văn Iêu',         '0901266465', '040860090179', '1997-01-07', 'male',   'Bến Tre',                NULL),
  ('Dương Thị Kiều',      '0386377576', '040971001280', '1991-05-15', 'female', 'Vĩnh Long',              NULL),
  ('Nguyễn Văn Lâm',      '0912488687', '046082012381', '1986-09-23', 'male',   'Trà Vinh',               '{"vehicle_plates":["51U1-99901"]}'),
  ('Trần Thị Mỹ',         '0387599798', '046193023482', '1993-01-01', 'female', 'Đồng Tháp',              '{"vehicle_plates":["29K-00012"]}'),
  ('Lê Văn Nguyên',       '0923600809', '046204034583', '1989-05-09', 'male',   'An Giang',               NULL),
  ('Phạm Thị Oanh',       '0398711910', '046315045684', '1996-09-17', 'female', 'Kiên Giang',             NULL),
  ('Hoàng Văn Phát',      '0934822021', '046426056785', '1984-01-25', 'male',   'Hậu Giang',              NULL),
  ('Vũ Thị Quỳnh',        '0309933132', '046537067886', '1998-05-03', 'female', 'Sóc Trăng',              '{"vehicle_plates":["51V1-11123"]}'),
  ('Đặng Văn Rực',        '0945044243', '046648078987', '1987-09-11', 'male',   'Bạc Liêu',               '{"vehicle_plates":["30K-22234"]}'),
  ('Bùi Thị Sắc',         '0320155354', '046759089088', '1994-01-19', 'female', 'Cà Mau',                 NULL),
  ('Ngô Văn Thịnh',       '0956266465', '046860090189', '1982-05-27', 'male',   'Nam Định',               NULL),
  ('Dương Thị Uyên',      '0331377576', '046971001290', '1999-09-05', 'female', 'Thái Bình',              NULL),
  ('Nguyễn Thị Vàng',     '0967488687', '048082012391', '1990-01-13', 'female', 'Hà Nam',                 '{"vehicle_plates":["51X1-33345"]}'),
  ('Trần Văn Xuyên',      '0342599798', '048193023492', '1985-05-21', 'male',   'Ninh Bình',              '{"vehicle_plates":["29L-44456"]}'),
  ('Lê Thị Yên',          '0978600809', '048204034593', '1992-09-29', 'female', 'Bắc Ninh',               NULL),
  ('Phạm Văn Ẩn',         '0353711910', '048315045694', '1988-01-07', 'male',   'Bắc Giang',              NULL),
  ('Hoàng Thị Bách',      '0989822021', '048426056795', '1995-05-15', 'female', 'Hải Dương',              NULL),
  ('Vũ Văn Cẩm',          '0364933132', '048537067896', '1983-09-23', 'male',   'Hưng Yên',               '{"vehicle_plates":["51Y1-55567"]}'),
  ('Đặng Thị Dịu',        '0990044243', '048648078997', '1997-01-01', 'female', 'Vĩnh Phúc',              '{"vehicle_plates":["30L-66678"]}'),
  ('Bùi Văn Ẽo',          '0375155354', '048759089098', '1991-05-09', 'male',   'Phú Thọ',                NULL),
  ('Ngô Thị Phú',         '0901266465', '048860090199', '1986-09-17', 'female', 'Thái Nguyên',            NULL),
  ('Dương Văn Giỏi',      '0386377576', '048971001200', '1993-01-25', 'male',   'Bắc Kạn',                NULL)
) AS n(full_name, phone, id_number, date_of_birth, gender, permanent_address, documents);

INSERT INTO _tenant (seq, id)
SELECT row_number() OVER (ORDER BY id) AS seq, id
FROM smartstay.tenants
WHERE profile_id IS NULL;

-- ============================================================
-- 4. CONTRACTS (95: 80 active, 10 expired, 5 terminated)
-- ============================================================
INSERT INTO smartstay.contracts
  (room_id, start_date, end_date, status, monthly_rent, deposit_amount,
   deposit_status, payment_cycle_months, termination_reason, created_at)
SELECT
  r.id,
  CASE
    WHEN r.seq <= 80 THEN (CURRENT_DATE - (180 + (r.seq * 7 % 540)) * INTERVAL '1 day')::DATE
    WHEN r.seq <= 90 THEN (CURRENT_DATE - (400 + ((r.seq-80) * 30)) * INTERVAL '1 day')::DATE
    ELSE                  (CURRENT_DATE - (270 + ((r.seq-90) * 45)) * INTERVAL '1 day')::DATE
  END,
  CASE
    WHEN r.seq <= 80 THEN (CURRENT_DATE + (180 + (r.seq * 3 % 360)) * INTERVAL '1 day')::DATE
    WHEN r.seq <= 90 THEN (CURRENT_DATE - (30  + ((r.seq-80) * 15)) * INTERVAL '1 day')::DATE
    ELSE                  (CURRENT_DATE - (90  + ((r.seq-90) * 30)) * INTERVAL '1 day')::DATE
  END,
  CASE
    WHEN r.seq <= 80 THEN 'active'::smartstay.contract_status
    WHEN r.seq <= 90 THEN 'expired'::smartstay.contract_status
    ELSE                  'terminated'::smartstay.contract_status
  END,
  rm.base_rent,
  rm.base_rent * 2,
  'received'::smartstay.deposit_status,
  1,
  CASE WHEN r.seq > 90 THEN 'Vi phạm điều khoản hợp đồng' ELSE NULL END,
  NOW()
FROM _room r
JOIN smartstay.rooms rm ON rm.id = r.id
WHERE r.seq <= 95;

INSERT INTO _contract (seq, id, room_id, tenant_id, status)
SELECT
  r.seq,
  c.id,
  r.id,
  t.id,
  c.status::TEXT
FROM smartstay.contracts c
JOIN _room   r ON r.id = c.room_id AND r.seq <= 95
JOIN _tenant t ON t.seq = r.seq;

-- ============================================================
-- 5. UPDATE ROOM STATUS
-- ============================================================
UPDATE smartstay.rooms SET status = 'occupied'
WHERE id IN (SELECT room_id FROM _contract WHERE status = 'active');

UPDATE smartstay.rooms SET status = 'maintenance'
WHERE id IN (SELECT id FROM _room WHERE seq IN (96,97,98,99));

UPDATE smartstay.rooms SET status = 'reserved'
WHERE id IN (SELECT id FROM _room WHERE seq IN (100,101));

UPDATE _room r SET status = rm.status::TEXT
FROM smartstay.rooms rm WHERE rm.id = r.id;

-- ============================================================
-- 6. CONTRACT_TENANTS
-- ============================================================
INSERT INTO smartstay.contract_tenants (contract_id, tenant_id, is_primary)
SELECT id, tenant_id, TRUE FROM _contract;

-- Secondary tenants for first 20 contracts (tenants 81-100)
INSERT INTO smartstay.contract_tenants (contract_id, tenant_id, is_primary)
SELECT c.id, t.id, FALSE
FROM _contract c
JOIN _tenant   t ON t.seq = c.seq + 80
WHERE c.seq <= 20;

-- ============================================================
-- 7. INVOICES (active+expired contracts × 3 billing periods)
-- ============================================================
INSERT INTO smartstay.invoices
  (contract_id, billing_period, status, total_amount, subtotal, due_date, paid_date, created_at)
SELECT
  c.id,
  p.period,          -- CHAR column — pass '2026-01' directly
  CASE
    WHEN ct.status = 'expired'              THEN 'overdue'::smartstay.invoice_status
    WHEN p.p_num = 3 AND (ct.seq % 10) < 3 THEN 'draft'::smartstay.invoice_status
    WHEN p.p_num = 3 AND (ct.seq % 10) < 7 THEN 'paid'::smartstay.invoice_status
    WHEN p.p_num = 3                        THEN 'pending_payment'::smartstay.invoice_status
    WHEN (ct.seq % 10) < 7                  THEN 'paid'::smartstay.invoice_status
    WHEN (ct.seq % 10) < 9                  THEN 'partially_paid'::smartstay.invoice_status
    ELSE                                         'overdue'::smartstay.invoice_status
  END,
  rm.base_rent
    + (50 + ((ct.seq * 7 + p.p_num * 13) % 151)) * 3500
    + (3  + ((ct.seq * 11 + p.p_num * 7) % 10)) * 15000,
  rm.base_rent
    + (50 + ((ct.seq * 7 + p.p_num * 13) % 151)) * 3500
    + (3  + ((ct.seq * 11 + p.p_num * 7) % 10)) * 15000,
  (('2026-' || LPAD(p.p_num::TEXT, 2, '0') || '-01')::DATE + INTERVAL '1 month' + INTERVAL '9 days')::DATE,
  -- paid_date required when status = 'paid' (chk_invoice_paid constraint)
  CASE WHEN (ct.status = 'active' AND p.p_num = 3 AND (ct.seq % 10) BETWEEN 3 AND 6)
         OR (ct.status = 'active' AND p.p_num < 3 AND (ct.seq % 10) < 7)
       THEN (('2026-' || LPAD(p.p_num::TEXT, 2, '0') || '-01')::DATE + (ct.seq % 28 + 1) * INTERVAL '1 day')
       ELSE NULL END,
  NOW()
FROM _contract ct
JOIN smartstay.contracts c  ON c.id  = ct.id
JOIN smartstay.rooms     rm ON rm.id = ct.room_id
CROSS JOIN (VALUES ('2026-01',1),('2026-02',2),('2026-03',3)) AS p(period, p_num)
WHERE ct.status IN ('active','expired');

INSERT INTO _invoice (seq, id, contract_id, period, status, total_amount)
SELECT
  row_number() OVER (ORDER BY ct.seq, i.billing_period) AS seq,
  i.id,
  ct.id,
  i.billing_period,
  i.status::TEXT,
  i.total_amount
FROM smartstay.invoices i
JOIN _contract ct ON ct.id = i.contract_id
ORDER BY ct.seq, i.billing_period;

-- ============================================================
-- 8. INVOICE ITEMS (~3 per invoice: rent, electricity, water)
-- ============================================================
-- Rent
INSERT INTO smartstay.invoice_items (invoice_id, description, quantity, unit_price, line_total, sort_order)
SELECT
  inv.id,
  'Tiền thuê tháng ' || _inv.period,
  1,
  sc.monthly_rent,
  sc.monthly_rent,
  1
FROM _invoice _inv
JOIN smartstay.invoices  inv ON inv.id = _inv.id
JOIN smartstay.contracts sc  ON sc.id  = inv.contract_id
WHERE _inv.status NOT IN ('draft','cancelled');

-- Electricity
INSERT INTO smartstay.invoice_items (invoice_id, description, quantity, unit_price, line_total, sort_order)
SELECT
  inv.id,
  'Tiền điện tháng ' || _inv.period,
  (50 + ((_inv.seq * 7 + 13) % 151))::NUMERIC,
  3500,
  (50 + ((_inv.seq * 7 + 13) % 151)) * 3500,
  2
FROM _invoice _inv
JOIN smartstay.invoices inv ON inv.id = _inv.id
WHERE _inv.status NOT IN ('draft','cancelled');

-- Water
INSERT INTO smartstay.invoice_items (invoice_id, description, quantity, unit_price, line_total, sort_order)
SELECT
  inv.id,
  'Tiền nước tháng ' || _inv.period,
  (3 + ((_inv.seq * 11 + 7) % 10))::NUMERIC,
  15000,
  (3 + ((_inv.seq * 11 + 7) % 10)) * 15000,
  3
FROM _invoice _inv
JOIN smartstay.invoices inv ON inv.id = _inv.id
WHERE _inv.status NOT IN ('draft','cancelled');

-- ============================================================
-- 9. PAYMENTS (paid and partially_paid invoices)
-- ============================================================
INSERT INTO smartstay.payments
  (invoice_id, amount, method, notes, payment_date, created_at)
SELECT
  inv.id,
  CASE _inv.status
    WHEN 'paid'           THEN _inv.total_amount
    WHEN 'partially_paid' THEN (_inv.total_amount * (0.5 + (_inv.seq % 4) * 0.1))::NUMERIC
  END,
  CASE (_inv.seq % 10)
    WHEN 0 THEN 'cash'::smartstay.payment_method
    WHEN 1 THEN 'cash'::smartstay.payment_method
    WHEN 2 THEN 'cash'::smartstay.payment_method
    WHEN 3 THEN 'momo'::smartstay.payment_method
    WHEN 4 THEN 'momo'::smartstay.payment_method
    WHEN 5 THEN 'zalopay'::smartstay.payment_method
    WHEN 6 THEN 'bank_transfer'::smartstay.payment_method
    WHEN 7 THEN 'bank_transfer'::smartstay.payment_method
    WHEN 8 THEN 'bank_transfer'::smartstay.payment_method
    ELSE        'bank_transfer'::smartstay.payment_method
  END,
  CASE _inv.status
    WHEN 'paid'           THEN 'Thanh toán đầy đủ'
    WHEN 'partially_paid' THEN 'Thanh toán một phần'
  END,
  ((_inv.period || '-01')::DATE + ((_inv.seq % 28) + 1) * INTERVAL '1 day'),
  NOW()
FROM _invoice _inv
JOIN smartstay.invoices inv ON inv.id = _inv.id
WHERE _inv.status IN ('paid','partially_paid');

-- ============================================================
-- 10. METER READINGS (occupied rooms, 3 billing periods)
-- ============================================================
INSERT INTO smartstay.meter_readings
  (room_id, billing_period, electricity_previous, electricity_current,
   water_previous, water_current, created_at)
SELECT
  r.id,
  p.period,       -- CHAR column
  100 + (r.seq * 17 % 401),
  100 + (r.seq * 17 % 401) + 50 + (r.seq * 13 % 151),
  5   + (r.seq * 7  % 26),
  5   + (r.seq * 7  % 26)  + 3  + (r.seq * 11 % 10),
  NOW()
FROM _room r
CROSS JOIN (VALUES ('2026-01'),('2026-02'),('2026-03')) AS p(period)
WHERE r.status = 'occupied';

-- ============================================================
-- CLEANUP
-- ============================================================
DROP TABLE _building;
DROP TABLE _room;
DROP TABLE _tenant;
DROP TABLE _contract;
DROP TABLE _invoice;

COMMIT;

-- ============================================================
-- VERIFICATION (run separately)
-- ============================================================
/*
SELECT 'buildings'      AS tbl, COUNT(*) FROM smartstay.buildings;
SELECT 'rooms'          AS tbl, COUNT(*) FROM smartstay.rooms;
SELECT 'tenants'        AS tbl, COUNT(*) FROM smartstay.tenants;
SELECT 'contracts'      AS tbl, COUNT(*) FROM smartstay.contracts;
SELECT 'active_cont'    AS tbl, COUNT(*) FROM smartstay.contracts WHERE status = 'active';
SELECT 'contract_ten'   AS tbl, COUNT(*) FROM smartstay.contract_tenants;
SELECT 'invoices'       AS tbl, COUNT(*) FROM smartstay.invoices;
SELECT 'invoice_items'  AS tbl, COUNT(*) FROM smartstay.invoice_items;
SELECT 'payments'       AS tbl, COUNT(*) FROM smartstay.payments;
SELECT 'meter_readings' AS tbl, COUNT(*) FROM smartstay.meter_readings;
*/
