/*
  # Create user profile trigger

  1. Functions
    - `handle_new_user()` - Creates a profile entry when a new user signs up
    - Extracts role from user metadata and creates profile record

  2. Triggers
    - `on_auth_user_created` - Executes after new user is created in auth.users

  3. Security
    - Ensures every authenticated user has a corresponding profile
    - Handles role assignment from signup metadata
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'tenant')::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();