/*
  # Initial Schema for Photographer Gear Rental Platform
  
  1. New Tables
    - `profiles` - User profile information (extends auth.users)
    - `gear` - Camera equipment listings with details
    - `gear_pricing` - Hourly and daily rates for equipment
    - `bookings` - Rental reservations with payment status
    - `gear_images` - Photos of equipment
  
  2. Security
    - Enable RLS on all tables
    - Restrict access based on user ownership and booking permissions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create gear table
CREATE TABLE IF NOT EXISTS gear (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  condition text NOT NULL DEFAULT 'excellent',
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gear ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available gear"
  ON gear FOR SELECT
  TO authenticated
  USING (available = true OR auth.uid() = owner_id);

CREATE POLICY "Users can insert their own gear"
  ON gear FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own gear"
  ON gear FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own gear"
  ON gear FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create gear_pricing table
CREATE TABLE IF NOT EXISTS gear_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gear_id uuid NOT NULL REFERENCES gear ON DELETE CASCADE,
  hourly_rate integer NOT NULL DEFAULT 0,
  daily_rate integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(gear_id)
);

ALTER TABLE gear_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing for available gear"
  ON gear_pricing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_pricing.gear_id
      AND (gear.available = true OR auth.uid() = gear.owner_id)
    )
  );

CREATE POLICY "Users can insert pricing for their gear"
  ON gear_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_pricing.gear_id
      AND gear.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pricing for their gear"
  ON gear_pricing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_pricing.gear_id
      AND gear.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_pricing.gear_id
      AND gear.owner_id = auth.uid()
    )
  );

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gear_id uuid NOT NULL REFERENCES gear ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rental_type text NOT NULL CHECK (rental_type IN ('hourly', 'daily')),
  total_price integer NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
  stripe_session_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Renters and owners can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Renters can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Renters and owners can update booking status"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

-- Create gear_images table
CREATE TABLE IF NOT EXISTS gear_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gear_id uuid NOT NULL REFERENCES gear ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gear_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view images for available gear"
  ON gear_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_images.gear_id
      AND (gear.available = true OR auth.uid() = gear.owner_id)
    )
  );

CREATE POLICY "Users can manage images for their gear"
  ON gear_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_images.gear_id
      AND gear.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from their gear"
  ON gear_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear
      WHERE gear.id = gear_images.gear_id
      AND gear.owner_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gear_owner_id ON gear(owner_id);
CREATE INDEX IF NOT EXISTS idx_gear_category ON gear(category);
CREATE INDEX IF NOT EXISTS idx_gear_available ON gear(available);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gear_id ON bookings(gear_id);
CREATE INDEX IF NOT EXISTS idx_gear_images_gear_id ON gear_images(gear_id);
