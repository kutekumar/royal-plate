-- Add latitude and longitude columns to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(latitude, longitude);

-- Add comment to columns
COMMENT ON COLUMN restaurants.latitude IS 'Restaurant latitude coordinate';
COMMENT ON COLUMN restaurants.longitude IS 'Restaurant longitude coordinate';

-- Update existing restaurants with sample Yangon coordinates
-- These are placeholder coordinates in different areas of Yangon
-- You should update these with actual restaurant locations

UPDATE restaurants SET latitude = 16.8661, longitude = 96.1951 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 0);
UPDATE restaurants SET latitude = 16.8050, longitude = 96.1560 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 1);
UPDATE restaurants SET latitude = 16.8700, longitude = 96.2000 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 2);
UPDATE restaurants SET latitude = 16.8500, longitude = 96.1800 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 3);
UPDATE restaurants SET latitude = 16.8400, longitude = 96.1700 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 4);
UPDATE restaurants SET latitude = 16.8800, longitude = 96.1650 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 5);
UPDATE restaurants SET latitude = 16.8300, longitude = 96.1900 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 6);
UPDATE restaurants SET latitude = 16.8600, longitude = 96.1750 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 7);
UPDATE restaurants SET latitude = 16.8450, longitude = 96.1850 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 8);
UPDATE restaurants SET latitude = 16.8550, longitude = 96.1950 WHERE latitude IS NULL AND id = (SELECT id FROM restaurants ORDER BY created_at LIMIT 1 OFFSET 9);
