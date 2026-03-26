-- Donations table for manual payment tracking.

CREATE TABLE IF NOT EXISTS public.donations (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id       uuid NOT NULL REFERENCES public.profiles(id),
  amount         decimal(10,2) NOT NULL,
  currency       text DEFAULT 'ETB',
  payment_method text CHECK (payment_method IN ('bank_transfer', 'telebirr', 'cash', 'other')),
  receipt_url    text,
  notes          text,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by    uuid REFERENCES public.profiles(id),
  verified_at    timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
