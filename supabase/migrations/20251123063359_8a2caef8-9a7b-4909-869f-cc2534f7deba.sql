-- Create payments table for tracking rent payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_month DATE NOT NULL, -- The month this payment is for (e.g., 2024-01-01 for January 2024)
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Owners can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own payments"
ON public.payments
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own payments"
ON public.payments
FOR DELETE
USING (auth.uid() = owner_id);

-- Managers can manage payments in assigned properties
CREATE POLICY "Managers can view payments in assigned properties"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.property_managers
    WHERE property_id = payments.property_id
      AND manager_id = auth.uid()
  )
);

CREATE POLICY "Managers can manage payments in assigned properties"
ON public.payments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.property_managers
    WHERE property_id = payments.property_id
      AND manager_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_payments_owner_id ON public.payments(owner_id);
CREATE INDEX idx_payments_guest_id ON public.payments(guest_id);
CREATE INDEX idx_payments_payment_month ON public.payments(payment_month);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();