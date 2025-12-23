-- Add email column to guests table for authentication
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Add emergency_contact column to guests table
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS emergency_contact text;

-- Create announcements table for PG owner notices
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Owners can manage their announcements
CREATE POLICY "Owners can manage their announcements"
ON public.announcements FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Guests can view announcements for their property
CREATE POLICY "Guests can view property announcements"
ON public.announcements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    JOIN public.rooms r ON g.room_id = r.id
    WHERE g.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND r.property_id = announcements.property_id
    AND g.status = 'active'
  )
);

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id uuid REFERENCES public.guests(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Guests can manage their own maintenance requests
CREATE POLICY "Guests can view their maintenance requests"
ON public.maintenance_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = maintenance_requests.guest_id
    AND g.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Guests can create maintenance requests"
ON public.maintenance_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = guest_id
    AND g.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND g.status = 'active'
  )
);

-- Owners can manage maintenance requests for their properties
CREATE POLICY "Owners can manage maintenance requests"
ON public.maintenance_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = maintenance_requests.property_id
    AND p.owner_id = auth.uid()
  )
);

-- Create pg_rules table
CREATE TABLE IF NOT EXISTS public.pg_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  rule_text text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.pg_rules ENABLE ROW LEVEL SECURITY;

-- Owners can manage their rules
CREATE POLICY "Owners can manage their PG rules"
ON public.pg_rules FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Guests can view rules for their property
CREATE POLICY "Guests can view property rules"
ON public.pg_rules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    JOIN public.rooms r ON g.room_id = r.id
    WHERE g.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND r.property_id = pg_rules.property_id
    AND g.status = 'active'
  )
);

-- Allow guests to view their own data
CREATE POLICY "Guests can view their own profile"
ON public.guests FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow guests to update their own basic info
CREATE POLICY "Guests can update their own profile"
ON public.guests FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow guests to view their payments
CREATE POLICY "Guests can view their own payments"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.id = payments.guest_id
    AND g.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow guests to view their room
CREATE POLICY "Guests can view their room"
ON public.rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.guests g
    WHERE g.room_id = rooms.id
    AND g.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Add guest role to app_role enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'guest' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'guest';
  END IF;
END $$;