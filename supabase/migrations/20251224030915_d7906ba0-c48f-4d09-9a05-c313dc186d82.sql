-- Create a security definer function to get the current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Update is_guest_of_room to use the new function
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

-- Drop and recreate rooms policy using the function
DROP POLICY IF EXISTS "Guests can view their room" ON public.rooms;
CREATE POLICY "Guests can view their room" ON public.rooms
FOR SELECT USING (
  public.is_guest_of_room(id, public.get_current_user_email())
);

-- Fix guests policies
DROP POLICY IF EXISTS "Guests can view their own profile" ON public.guests;
CREATE POLICY "Guests can view their own profile" ON public.guests
FOR SELECT USING (email = public.get_current_user_email());

DROP POLICY IF EXISTS "Guests can update their own profile" ON public.guests;
CREATE POLICY "Guests can update their own profile" ON public.guests
FOR UPDATE USING (email = public.get_current_user_email())
WITH CHECK (email = public.get_current_user_email());

-- Fix payments policy for guests
DROP POLICY IF EXISTS "Guests can view their own payments" ON public.payments;
CREATE POLICY "Guests can view their own payments" ON public.payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = payments.guest_id
      AND g.email = public.get_current_user_email()
  )
);

-- Fix maintenance_requests policies for guests
DROP POLICY IF EXISTS "Guests can view their maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Guests can view their maintenance requests" ON public.maintenance_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = maintenance_requests.guest_id
      AND g.email = public.get_current_user_email()
  )
);

DROP POLICY IF EXISTS "Guests can create maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Guests can create maintenance requests" ON public.maintenance_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = maintenance_requests.guest_id
      AND g.email = public.get_current_user_email()
      AND g.status = 'active'
  )
);

-- Fix announcements policy for guests
DROP POLICY IF EXISTS "Guests can view property announcements" ON public.announcements;
CREATE POLICY "Guests can view property announcements" ON public.announcements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    JOIN public.rooms r ON g.room_id = r.id
    WHERE g.email = public.get_current_user_email()
      AND r.property_id = announcements.property_id
      AND g.status = 'active'
  )
);

-- Fix pg_rules policy for guests
DROP POLICY IF EXISTS "Guests can view property rules" ON public.pg_rules;
CREATE POLICY "Guests can view property rules" ON public.pg_rules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    JOIN public.rooms r ON g.room_id = r.id
    WHERE g.email = public.get_current_user_email()
      AND r.property_id = pg_rules.property_id
      AND g.status = 'active'
  )
);