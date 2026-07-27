
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.is_slug_available(_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN _slug IS NULL OR public.slugify(_slug) = '' THEN false
      ELSE NOT EXISTS (SELECT 1 FROM public.restaurants WHERE slug = public.slugify(_slug))
    END;
$$;

GRANT EXECUTE ON FUNCTION public.is_slug_available(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_restaurant_with_slug(
  _name text,
  _slug text,
  _category text DEFAULT NULL,
  _phone text DEFAULT NULL
)
RETURNS TABLE(restaurant_id uuid, slug text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _clean text;
  _rid uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _name IS NULL OR btrim(_name) = '' THEN RAISE EXCEPTION 'invalid_name'; END IF;
  _clean := public.slugify(coalesce(_slug, ''));
  IF _clean IS NULL OR _clean = '' THEN RAISE EXCEPTION 'invalid_slug'; END IF;
  IF EXISTS (SELECT 1 FROM public.restaurants WHERE slug = _clean) THEN
    RAISE EXCEPTION 'slug_taken';
  END IF;
  INSERT INTO public.restaurants (name, slug, category, phone)
    VALUES (btrim(_name), _clean, NULLIF(btrim(coalesce(_category,'')), ''), NULLIF(btrim(coalesce(_phone,'')), ''))
    RETURNING id INTO _rid;
  INSERT INTO public.restaurant_members (user_id, restaurant_id, role)
    VALUES (_uid, _rid, 'admin');
  restaurant_id := _rid;
  slug := _clean;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_restaurant_with_slug(text, text, text, text) TO authenticated;
