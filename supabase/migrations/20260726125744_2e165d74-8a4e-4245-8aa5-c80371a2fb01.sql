
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  coupon_code TEXT,
  address JSONB,
  pickup BOOLEAN NOT NULL DEFAULT false,
  payment JSONB NOT NULL,
  eta_minutes INTEGER NOT NULL DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_confirmed_at TIMESTAMPTZ,
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rated BOOLEAN NOT NULL DEFAULT false,
  rating_food INTEGER,
  rating_delivery INTEGER,
  rating_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_device_id_idx ON public.orders (device_id, created_at DESC);
CREATE INDEX orders_short_id_idx ON public.orders (short_id);

GRANT SELECT, INSERT, UPDATE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Demo app: no real auth. Orders are scoped client-side by device_id.
-- Broad policies allow the client (anon key) to read/write; app filters by device_id.
CREATE POLICY "orders_public_read" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders_public_update" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.orders_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER orders_touch_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_touch_updated_at();
