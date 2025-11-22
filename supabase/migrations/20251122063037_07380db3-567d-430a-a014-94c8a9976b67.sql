-- Add bed_number to guests table
ALTER TABLE public.guests ADD COLUMN bed_number text;

-- Add status options for guest history (keep moved_out guests for history)
COMMENT ON COLUMN public.guests.status IS 'Status: active, moved_out, inactive';

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create property_managers junction table
CREATE TABLE public.property_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (property_id, manager_id)
);

ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'owner'));

-- RLS policies for property_managers
CREATE POLICY "Property owners can manage their managers"
ON public.property_managers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Managers can view their assignments"
ON public.property_managers FOR SELECT
USING (auth.uid() = manager_id);

-- Update properties RLS to allow managers
CREATE POLICY "Managers can view assigned properties"
ON public.properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers
    WHERE property_id = properties.id AND manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can update assigned properties"
ON public.properties FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers
    WHERE property_id = properties.id AND manager_id = auth.uid()
  )
);

-- Update rooms RLS to allow managers
CREATE POLICY "Managers can view rooms in assigned properties"
ON public.rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers
    WHERE property_id = rooms.property_id AND manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can manage rooms in assigned properties"
ON public.rooms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers
    WHERE property_id = rooms.property_id AND manager_id = auth.uid()
  )
);

-- Update guests RLS to allow managers
CREATE POLICY "Managers can view guests in assigned properties"
ON public.guests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers pm
    JOIN public.rooms r ON r.property_id = pm.property_id
    WHERE r.id = guests.room_id AND pm.manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can manage guests in assigned properties"
ON public.guests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers pm
    JOIN public.rooms r ON r.property_id = pm.property_id
    WHERE r.id = guests.room_id AND pm.manager_id = auth.uid()
  )
);

-- Update expenses RLS to allow managers
CREATE POLICY "Managers can view expenses in assigned properties"
ON public.expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers
    WHERE property_id = expenses.property_id AND manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can manage expenses in assigned properties"
ON public.expenses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.property_managers
    WHERE property_id = expenses.property_id AND manager_id = auth.uid()
  )
);