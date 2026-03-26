-- Create departments table and seed the 9 Sunday School departments.
-- Also adds foreign key from profiles.department_id → departments.id.

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id         serial PRIMARY KEY,
  name_en    text NOT NULL,
  name_am    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 2. RLS policies
-- SELECT: all authenticated users can read departments
CREATE POLICY "Authenticated users can read departments"
  ON public.departments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE: super_admin only
CREATE POLICY "Super admin can manage departments"
  ON public.departments
  FOR ALL
  USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

-- 3. Seed all 9 departments
INSERT INTO public.departments (id, name_am, name_en) VALUES
  (1, 'እቅድ ትግበራ እና ክትትል ክፍል', 'Planning, Implementation & Monitoring'),
  (2, 'ትምህርት እና ስልጠና ክፍል', 'Education & Training'),
  (3, 'መርሐ ግብር እና ጉባኤያት ክፍል', 'Programs & Events'),
  (4, 'የሰው ሀብት አስተዳደር ክፍል', 'Human Resources / People Operations'),
  (5, 'የመረጃ እና ውስጥ ግንኙነት ክፍል', 'Information & Internal Communications'),
  (6, 'የመዝሙር እና በዓላት ክፍል', 'Songs & Celebrations'),
  (7, 'የኪነጥበብ እና ሥነጥበብ ክፍል', 'Arts & Culture'),
  (8, 'የልማት እና በጎ አድራጎት ክፍል', 'Development & Charity'),
  (9, 'የበጀት እና ንብረት አስተዳደር ክፍል', 'Budget & Asset Management')
ON CONFLICT (id) DO NOTHING;

-- 4. Add foreign key from profiles to departments (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_department_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES public.departments(id);
  END IF;
END $$;
