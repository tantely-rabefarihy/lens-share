/*
  # Fix Gear-Profiles Foreign Key Relationship
  
  1. Changes
    - Add explicit foreign key from gear(owner_id) to profiles(id)
    - This allows proper nested select in Supabase queries
  
  2. Security
    - RLS policies remain unchanged
*/

ALTER TABLE gear
DROP CONSTRAINT IF EXISTS gear_owner_id_fkey;

ALTER TABLE gear
ADD CONSTRAINT gear_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;