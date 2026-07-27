CREATE TYPE public.app_role AS ENUM ('admin', 'caixa', 'cozinha');

CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurants_anon_read_active" ON public.restaurants FOR SELECT TO anon USING (active = true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_owner_read"   ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.restaurant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, restaurant_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_members TO authenticated;
GRANT ALL ON public.restaurant_members TO service_role;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(_user_id uuid, _restaurant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_members WHERE user_id = _user_id AND restaurant_id = _restaurant_id);
$$;

CREATE OR REPLACE FUNCTION public.has_restaurant_role(_user_id uuid, _restaurant_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurant_members WHERE user_id = _user_id AND restaurant_id = _restaurant_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_restaurant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT restaurant_id FROM public.restaurant_members WHERE user_id = auth.uid() ORDER BY created_at ASC LIMIT 1;
$$;

CREATE POLICY "members_self_or_admin_read" ON public.restaurant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));
CREATE POLICY "members_admin_insert" ON public.restaurant_members FOR INSERT TO authenticated
  WITH CHECK (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));
CREATE POLICY "members_admin_update" ON public.restaurant_members FOR UPDATE TO authenticated
  USING (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'))
  WITH CHECK (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));
CREATE POLICY "members_admin_delete" ON public.restaurant_members FOR DELETE TO authenticated
  USING (public.has_restaurant_role(auth.uid(), restaurant_id, 'admin'));

CREATE POLICY "restaurants_member_read" ON public.restaurants FOR SELECT TO authenticated
  USING (public.is_restaurant_member(auth.uid(), id) OR active = true);
CREATE POLICY "restaurants_admin_update" ON public.restaurants FOR UPDATE TO authenticated
  USING (public.has_restaurant_role(auth.uid(), id, 'admin'))
  WITH CHECK (public.has_restaurant_role(auth.uid(), id, 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.unaccent_safe(_input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT translate(_input,
    'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN');
$$;

CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' FROM
    regexp_replace(regexp_replace(lower(public.unaccent_safe(_input)), '[^a-z0-9]+', '-', 'g'), '-+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.create_restaurant_for_current_user(_name text)
RETURNS TABLE (restaurant_id uuid, slug text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _base text; _slug text; _n int := 0; _rid uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  _base := public.slugify(_name);
  IF _base = '' OR _base IS NULL THEN _base := 'restaurante'; END IF;
  _slug := _base;
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = _slug) LOOP
    _n := _n + 1; _slug := _base || '-' || _n;
  END LOOP;
  INSERT INTO public.restaurants (name, slug) VALUES (_name, _slug) RETURNING id INTO _rid;
  INSERT INTO public.restaurant_members (user_id, restaurant_id, role) VALUES (_uid, _rid, 'admin');
  restaurant_id := _rid; slug := _slug; RETURN NEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_restaurant_for_current_user(text) TO authenticated;

INSERT INTO public.restaurants (id, name, slug, phone)
VALUES ('11111111-1111-1111-1111-111111111111', 'Bistrô Azul', 'bistro-azul', '(11) 4000-1234');

-- Converte a coluna restaurant_id de text para uuid, apontando tudo para o Bistrô Azul
ALTER TABLE public.orders DROP COLUMN restaurant_id;
ALTER TABLE public.orders ADD COLUMN restaurant_id uuid NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.orders ADD CONSTRAINT orders_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE RESTRICT;
CREATE INDEX orders_restaurant_id_idx ON public.orders (restaurant_id);
CREATE INDEX orders_status_idx ON public.orders (status);

DROP POLICY IF EXISTS orders_public_read ON public.orders;
DROP POLICY IF EXISTS orders_public_insert ON public.orders;
DROP POLICY IF EXISTS orders_public_update ON public.orders;

CREATE POLICY "orders_anon_read"   ON public.orders FOR SELECT TO anon USING (true);
CREATE POLICY "orders_anon_insert" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "orders_anon_update" ON public.orders FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "orders_member_read" ON public.orders FOR SELECT TO authenticated
  USING (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "orders_member_insert" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (public.is_restaurant_member(auth.uid(), restaurant_id));
CREATE POLICY "orders_member_update" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_restaurant_member(auth.uid(), restaurant_id))
  WITH CHECK (public.is_restaurant_member(auth.uid(), restaurant_id));

CREATE TRIGGER restaurants_touch_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.orders_touch_updated_at();
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.orders_touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
