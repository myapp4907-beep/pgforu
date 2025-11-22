-- Create function to get user ID by email from profiles
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = user_email
  )
  LIMIT 1
$$;