/*
  # Optimize RLS Policies for Performance

  1. Performance Improvements
    - Replace all `auth.uid()` calls with `(select auth.uid())` in RLS policies
    - This prevents re-evaluation of auth functions for each row, significantly improving query performance at scale
    - Affects all tables: profiles, gear, gear_pricing, bookings, gear_images, stripe_customers, stripe_subscriptions, stripe_orders

  2. Index Cleanup
    - Remove unused indexes to reduce write overhead
    - Indexes being removed: idx_gear_category, idx_gear_available, idx_bookings_renter_id, idx_bookings_owner_id, idx_bookings_gear_id, idx_gear_images_gear_id

  3. Security
    - All policies maintain the same security guarantees
    - Only the performance characteristics are improved
*/

-- ============================================================================
-- PROFILES TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- GEAR TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view available gear" ON gear;
DROP POLICY IF EXISTS "Users can insert their own gear" ON gear;
DROP POLICY IF EXISTS "Users can update their own gear" ON gear;
DROP POLICY IF EXISTS "Users can delete their own gear" ON gear;

CREATE POLICY "Anyone can view available gear"
  ON gear FOR SELECT
  TO authenticated
  USING (
    available = true OR 
    owner_id = (select auth.uid())
  );

CREATE POLICY "Users can insert their own gear"
  ON gear FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update their own gear"
  ON gear FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete their own gear"
  ON gear FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- ============================================================================
-- GEAR_PRICING TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view pricing for available gear" ON gear_pricing;
DROP POLICY IF EXISTS "Users can insert pricing for their gear" ON gear_pricing;
DROP POLICY IF EXISTS "Users can update pricing for their gear" ON gear_pricing;

CREATE POLICY "Anyone can view pricing for available gear"
  ON gear_pricing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_pricing.gear_id 
      AND (gear.available = true OR gear.owner_id = (select auth.uid()))
    )
  );

CREATE POLICY "Users can insert pricing for their gear"
  ON gear_pricing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_pricing.gear_id 
      AND gear.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update pricing for their gear"
  ON gear_pricing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_pricing.gear_id 
      AND gear.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_pricing.gear_id 
      AND gear.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- BOOKINGS TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Renters and owners can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Renters can create bookings" ON bookings;
DROP POLICY IF EXISTS "Renters and owners can update booking status" ON bookings;

CREATE POLICY "Renters and owners can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    renter_id = (select auth.uid()) OR 
    owner_id = (select auth.uid())
  );

CREATE POLICY "Renters can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (renter_id = (select auth.uid()));

CREATE POLICY "Renters and owners can update booking status"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    renter_id = (select auth.uid()) OR 
    owner_id = (select auth.uid())
  )
  WITH CHECK (
    renter_id = (select auth.uid()) OR 
    owner_id = (select auth.uid())
  );

-- ============================================================================
-- GEAR_IMAGES TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view images for available gear" ON gear_images;
DROP POLICY IF EXISTS "Users can manage images for their gear" ON gear_images;
DROP POLICY IF EXISTS "Users can delete images from their gear" ON gear_images;

CREATE POLICY "Anyone can view images for available gear"
  ON gear_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_images.gear_id 
      AND (gear.available = true OR gear.owner_id = (select auth.uid()))
    )
  );

CREATE POLICY "Users can manage images for their gear"
  ON gear_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_images.gear_id 
      AND gear.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete images from their gear"
  ON gear_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gear 
      WHERE gear.id = gear_images.gear_id 
      AND gear.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- STRIPE_CUSTOMERS TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) AND deleted_at IS NULL);

-- ============================================================================
-- STRIPE_SUBSCRIPTIONS TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- STRIPE_ORDERS TABLE - Optimize RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

CREATE POLICY "Users can view their own order data"
  ON stripe_orders FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- ============================================================================
-- REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_gear_category;
DROP INDEX IF EXISTS idx_gear_available;
DROP INDEX IF EXISTS idx_bookings_renter_id;
DROP INDEX IF EXISTS idx_bookings_owner_id;
DROP INDEX IF EXISTS idx_bookings_gear_id;
DROP INDEX IF EXISTS idx_gear_images_gear_id;