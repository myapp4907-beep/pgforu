-- Create profiles table for owner/manager information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('Single', 'Double', 'Sharing')),
  monthly_rent DECIMAL(10,2) NOT NULL,
  max_occupancy INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant')),
  current_guests INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, room_number)
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Owners can view their own rooms"
  ON public.rooms FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own rooms"
  ON public.rooms FOR DELETE
  USING (auth.uid() = owner_id);

-- Create guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_proof_type TEXT,
  id_proof_number TEXT,
  joining_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on guests
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Guests policies
CREATE POLICY "Owners can view their own guests"
  ON public.guests FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own guests"
  ON public.guests FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own guests"
  ON public.guests FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own guests"
  ON public.guests FOR DELETE
  USING (auth.uid() = owner_id);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Owners can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = owner_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_rooms
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_guests
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();