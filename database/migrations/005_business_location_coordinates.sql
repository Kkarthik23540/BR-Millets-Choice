ALTER TABLE business_details
  ADD COLUMN latitude DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION,
  ADD CONSTRAINT business_details_coordinates_together
    CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
  ADD CONSTRAINT business_details_latitude_range
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT business_details_longitude_range
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
