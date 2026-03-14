-- Quick Setup: Add coordinates to restaurants
-- Run this in Supabase SQL Editor after running the migration

-- First, add the columns if not already added
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);

-- Sample coordinates for Yangon restaurants
-- These are spread across different townships in Yangon
-- Replace these with actual restaurant locations

-- Method 1: Update by restaurant name (if you know the names)
UPDATE restaurants SET latitude = 16.7833, longitude = 96.1667 WHERE name = 'Golden Palace Restaurant';
UPDATE restaurants SET latitude = 16.8050, longitude = 96.1560 WHERE name = 'Shwe Myanmar Restaurant';
UPDATE restaurants SET latitude = 16.8300, longitude = 96.1400 WHERE name = 'Royal Garden';

-- Method 2: Update first 10 restaurants with sample coordinates
-- (Use this if you just want to test the map feature quickly)

WITH numbered_restaurants AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM restaurants
  WHERE latitude IS NULL
)
UPDATE restaurants r
SET
  latitude = CASE nr.rn
    WHEN 1 THEN 16.7833  -- Downtown Yangon
    WHEN 2 THEN 16.8050  -- Bahan Township
    WHEN 3 THEN 16.8300  -- Kamayut Township
    WHEN 4 THEN 16.8100  -- Sanchaung Township
    WHEN 5 THEN 16.8400  -- Yankin Township
    WHEN 6 THEN 16.8700  -- Mayangone Township
    WHEN 7 THEN 16.8200  -- Hlaing Township
    WHEN 8 THEN 16.8900  -- Insein Township
    WHEN 9 THEN 16.7700  -- Mingalar Taung Nyunt
    WHEN 10 THEN 16.7600 -- Pazundaung Township
  END,
  longitude = CASE nr.rn
    WHEN 1 THEN 96.1667
    WHEN 2 THEN 96.1560
    WHEN 3 THEN 96.1400
    WHEN 4 THEN 96.1300
    WHEN 5 THEN 96.1500
    WHEN 6 THEN 96.1200
    WHEN 7 THEN 96.1100
    WHEN 8 THEN 96.1000
    WHEN 9 THEN 96.1800
    WHEN 10 THEN 96.1900
  END
FROM numbered_restaurants nr
WHERE r.id = nr.id AND nr.rn <= 10;

-- Verify the update
SELECT id, name, address, latitude, longitude
FROM restaurants
WHERE latitude IS NOT NULL
ORDER BY created_at
LIMIT 10;

-- Check how many restaurants still need coordinates
SELECT
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as with_coordinates,
  COUNT(*) FILTER (WHERE latitude IS NULL) as without_coordinates,
  COUNT(*) as total
FROM restaurants;
