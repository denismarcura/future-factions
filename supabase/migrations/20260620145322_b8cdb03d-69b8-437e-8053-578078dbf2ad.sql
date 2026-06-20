
WITH new_cat AS (
  INSERT INTO public.challenge_categories (name, sort_order)
  VALUES ('Amigos', 100)
  ON CONFLICT (name) DO UPDATE SET sort_order = EXCLUDED.sort_order
  RETURNING id
)
INSERT INTO public.challenge_subcategories (category_id, name, sort_order)
SELECT id, n.name, n.sort_order FROM new_cat,
  (VALUES ('Namoro', 1), ('Churrasco', 2), ('Casamento', 3), ('Quem vai preso primeiro?', 4)) AS n(name, sort_order)
ON CONFLICT DO NOTHING;
