/*
  # Add Location Fields for Distance-Based Search
  
  1. Changes
    - Add latitude and longitude columns to profiles table
    - Add location_updated_at to track when location was last updated
  
  2. Security
    - RLS policies remain unchanged
    - Location data is only visible to authenticated users for distance calculations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude numeric(10, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude numeric(11, 8);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_updated_at timestamptz;
  END IF;
END $$;