-- Nutrition tracking tables

-- Daily nutrition log (one per user per day)
CREATE TABLE public.nutrition_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  calorie_target INTEGER DEFAULT 2500,
  protein_target INTEGER DEFAULT 150,
  carb_target INTEGER DEFAULT 250,
  fat_target INTEGER DEFAULT 85,
  water_ml INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Individual meal entries
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nutrition_day_id UUID NOT NULL REFERENCES public.nutrition_days(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'snack', 'lunch', 'dinner')),
  name TEXT NOT NULL,
  foods TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fat INTEGER NOT NULL DEFAULT 0,
  fiber INTEGER DEFAULT 0,
  sugar INTEGER DEFAULT 0,
  sodium INTEGER DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_scan', 'barcode')),
  confidence INTEGER,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nutrition_days_user ON public.nutrition_days(user_id);
CREATE INDEX idx_nutrition_days_date ON public.nutrition_days(user_id, date);
CREATE INDEX idx_meals_day ON public.meals(nutrition_day_id);
CREATE INDEX idx_meals_user ON public.meals(user_id);

-- RLS
ALTER TABLE public.nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nutrition days"
  ON public.nutrition_days FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own meals"
  ON public.meals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Helper: get or create today's nutrition day
CREATE OR REPLACE FUNCTION get_or_create_nutrition_day(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM public.nutrition_days WHERE user_id = p_user_id AND date = p_date;
  IF v_id IS NULL THEN
    INSERT INTO public.nutrition_days (user_id, date) VALUES (p_user_id, p_date) RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$;
