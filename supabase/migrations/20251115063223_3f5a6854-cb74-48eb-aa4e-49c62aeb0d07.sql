-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Owners can view their own properties"
ON public.properties
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own properties"
ON public.properties
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own properties"
ON public.properties
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own properties"
ON public.properties
FOR DELETE
USING (auth.uid() = owner_id);

-- Add property_id to existing tables
ALTER TABLE public.rooms ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
ALTER TABLE public.guests ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Add trigger for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();