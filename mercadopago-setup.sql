-- ============================================================
-- MenuAltas — Integrações (Mercado Pago)
-- Rode este SQL no seu Supabase (SQL editor).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                 -- 'mercadopago'
  access_token TEXT,                      -- MP access token (server key)
  public_key TEXT,                        -- MP public key
  device_id TEXT,                         -- Point (maquininha) device id
  sandbox BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_integrations TO authenticated;
GRANT ALL ON public.restaurant_integrations TO service_role;

ALTER TABLE public.restaurant_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integrations_admin_select" ON public.restaurant_integrations;
CREATE POLICY "integrations_admin_select" ON public.restaurant_integrations
  FOR SELECT TO authenticated
  USING (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

DROP POLICY IF EXISTS "integrations_admin_insert" ON public.restaurant_integrations;
CREATE POLICY "integrations_admin_insert" ON public.restaurant_integrations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

DROP POLICY IF EXISTS "integrations_admin_update" ON public.restaurant_integrations;
CREATE POLICY "integrations_admin_update" ON public.restaurant_integrations
  FOR UPDATE TO authenticated
  USING (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'))
  WITH CHECK (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

DROP POLICY IF EXISTS "integrations_admin_delete" ON public.restaurant_integrations;
CREATE POLICY "integrations_admin_delete" ON public.restaurant_integrations
  FOR DELETE TO authenticated
  USING (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

-- Status novo "concluded" para o kanban de pedidos.
-- (a coluna orders.status é TEXT, aceita qualquer valor.)
-- Nada a alterar no schema — apenas o app começa a usar.
