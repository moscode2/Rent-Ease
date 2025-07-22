/*
  # Fix user signup database error

  1. Changes
    - Update handle_new_user function to handle potential conflicts
    - Add ON CONFLICT clause to prevent unique constraint violations
    - Make profile creation more robust for edge cases

  2. Security
    - Maintains existing RLS policies
    - Preserves SECURITY DEFINER function properties
*/

-- Create function to handle new user signup with conflict resolution
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, role, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        role = COALESCE(EXCLUDED.role, profiles.role),
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;