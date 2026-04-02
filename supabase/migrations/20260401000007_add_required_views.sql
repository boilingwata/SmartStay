-- 20260401000007_add_required_views_and_safety_columns.sql

-- Rule DB-03: Rent Price Snapshot
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS rent_price_snapshot NUMERIC;

-- Rule DB-04: Service Price Snapshot
ALTER TABLE public.contract_services 
ADD COLUMN IF NOT EXISTS unit_price_snapshot NUMERIC;

-- Backfill snapshots from current values for existing records
UPDATE public.contracts SET rent_price_snapshot = monthly_rent WHERE rent_price_snapshot IS NULL;
UPDATE public.contract_services SET unit_price_snapshot = fixed_price WHERE unit_price_snapshot IS NULL;

-- RULE DB-01: Meter Reading View
CREATE OR REPLACE VIEW public.vw_LatestMeterReading AS
WITH numbered_readings AS (
    SELECT 
        id as reading_id,
        room_id,
        billing_period,
        electricity_current,
        water_current,
        electricity_usage,
        water_usage,
        reading_date,
        ROW_NUMBER() OVER (
            PARTITION BY room_id 
            ORDER BY billing_period DESC, created_at DESC
        ) as rn
    FROM public.meter_readings
)
-- Virtualize Electricity
SELECT 
    CAST(room_id AS TEXT) || '-elec' as "MeterId",
    electricity_current as "CurrentIndex",
    electricity_usage as "Usage",
    billing_period as "BillingPeriod",
    reading_date as "ReadingDate",
    reading_id as "ReadingId"
FROM numbered_readings
WHERE rn = 1
UNION ALL
-- Virtualize Water
SELECT 
    CAST(room_id AS TEXT) || '-water' as "MeterId",
    water_current as "CurrentIndex",
    water_usage as "Usage",
    billing_period as "BillingPeriod",
    reading_date as "ReadingDate",
    reading_id as "ReadingId"
FROM numbered_readings
WHERE rn = 1;

-- RULE DB-02: Building Room Count View
CREATE OR REPLACE VIEW public.vw_BuildingRoomCount AS
SELECT 
    building_id as "BuildingId",
    COUNT(*) as "Total",
    SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as "Occupied",
    SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as "Vacant"
FROM public.rooms
WHERE is_deleted = false
GROUP BY building_id;

-- Comment for standard adherence
COMMENT ON VIEW public.vw_LatestMeterReading IS 'RULE-01: Standardized entry point for latest meter reading indices.';
COMMENT ON VIEW public.vw_BuildingRoomCount IS 'RULE-02: Standardized room statistics per building.';
