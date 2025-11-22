-- Create security definer function to check property ownership
CREATE OR REPLACE FUNCTION public.is_property_owner(_property_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties
    WHERE id = _property_id
      AND owner_id = _user_id
  )
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Managers can view assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Managers can update assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Property owners can manage their managers" ON public.property_managers;

-- Recreate property_managers policies using the function
CREATE POLICY "Property owners can manage their managers"
ON public.property_managers
FOR ALL
USING (public.is_property_owner(property_id, auth.uid()));

-- Recreate properties policies for managers using the function
CREATE POLICY "Managers can view assigned properties"
ON public.properties
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.property_managers
    WHERE property_id = properties.id
      AND manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can update assigned properties"
ON public.properties
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.property_managers
    WHERE property_id = properties.id
      AND manager_id = auth.uid()
  )
);