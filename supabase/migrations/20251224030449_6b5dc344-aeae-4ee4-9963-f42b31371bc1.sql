-- Create a security definer function to check if user is a guest for a room
CREATE OR REPLACE FUNCTION public.is_guest_of_room(_room_id uuid, _user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guests
    WHERE room_id = _room_id
      AND email = _user_email
      AND status = 'active'
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Guests can view their room" ON public.rooms;

-- Recreate with security definer function
CREATE POLICY "Guests can view their room" ON public.rooms
FOR SELECT USING (
  public.is_guest_of_room(id, (SELECT email FROM auth.users WHERE id = auth.uid()))
);