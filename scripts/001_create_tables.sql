-- Zakovat AI Database Schema

-- 1. Users Profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. AI Providers table (for teacher to configure AI APIs)
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google', 'groq', 'deepseek', 'custom')),
  api_key TEXT NOT NULL,
  base_url TEXT,
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_providers_select_own" ON public.ai_providers FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "ai_providers_insert_own" ON public.ai_providers FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "ai_providers_update_own" ON public.ai_providers FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "ai_providers_delete_own" ON public.ai_providers FOR DELETE USING (auth.uid() = teacher_id);

-- 3. Courses (Fanlar) table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_provider_id UUID REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_hours INTEGER NOT NULL,
  hours_per_lesson INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_select_teacher" ON public.courses FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "courses_insert_teacher" ON public.courses FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "courses_update_teacher" ON public.courses FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "courses_delete_teacher" ON public.courses FOR DELETE USING (auth.uid() = teacher_id);

-- 4. Lessons (Darslar) table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  duration_hours INTEGER NOT NULL,
  ai_generated_content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'materials_uploaded', 'generating', 'ready')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_select_via_course" ON public.lessons FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "lessons_insert_via_course" ON public.lessons FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "lessons_update_via_course" ON public.lessons FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "lessons_delete_via_course" ON public.lessons FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND courses.teacher_id = auth.uid()));

-- 5. Lesson Materials (Dars materiallari - docx, pdf, ppt)
CREATE TABLE IF NOT EXISTS public.lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'doc', 'ppt')),
  file_size INTEGER,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_select_via_lesson" ON public.lesson_materials FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.courses c ON c.id = l.course_id 
    WHERE l.id = lesson_materials.lesson_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "materials_insert_via_lesson" ON public.lesson_materials FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.courses c ON c.id = l.course_id 
    WHERE l.id = lesson_materials.lesson_id AND c.teacher_id = auth.uid()
  ));
CREATE POLICY "materials_delete_via_lesson" ON public.lesson_materials FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.courses c ON c.id = l.course_id 
    WHERE l.id = lesson_materials.lesson_id AND c.teacher_id = auth.uid()
  ));

-- 6. Course Enrollments (O'quvchi kurs ro'yxatga olish)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress_percent INTEGER DEFAULT 0,
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_student" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "enrollments_insert_student" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Allow teachers to see enrollments for their courses
CREATE POLICY "enrollments_select_teacher" ON public.enrollments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()));

-- 7. Student Lesson Content (AI tomonidan generatsiya qilingan dars)
CREATE TABLE IF NOT EXISTS public.student_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  ai_content TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_lessons_select" ON public.student_lessons FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.id = student_lessons.enrollment_id AND enrollments.student_id = auth.uid()));
CREATE POLICY "student_lessons_update" ON public.student_lessons FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.id = student_lessons.enrollment_id AND enrollments.student_id = auth.uid()));

-- 8. Quizzes/Tests
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select_all" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_insert_teacher" ON public.quizzes FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.courses c ON c.id = l.course_id 
    WHERE l.id = quizzes.lesson_id AND c.teacher_id = auth.uid()
  ));

-- 9. Quiz Results (Test natijalari)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  weak_topics TEXT[],
  ai_feedback TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_results_select_student" ON public.quiz_results FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "quiz_results_insert_student" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Teachers can see results for their course quizzes
CREATE POLICY "quiz_results_select_teacher" ON public.quiz_results FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.quizzes q 
    JOIN public.lessons l ON l.id = q.lesson_id 
    JOIN public.courses c ON c.id = l.course_id 
    WHERE q.id = quiz_results.quiz_id AND c.teacher_id = auth.uid()
  ));

-- 10. AI Recommendations (AI tavsiyalari)
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('weak_topic', 'extra_practice', 'review')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_select_student" ON public.ai_recommendations FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "recommendations_update_student" ON public.ai_recommendations FOR UPDATE USING (auth.uid() = student_id);

-- Teachers can see recommendations for their students
CREATE POLICY "recommendations_select_teacher" ON public.ai_recommendations FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.courses c ON c.id = l.course_id 
    WHERE l.id = ai_recommendations.lesson_id AND c.teacher_id = auth.uid()
  ));

-- 11. Teacher Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quiz_completed', 'student_struggling', 'course_enrolled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "notifications_insert_any" ON public.notifications FOR INSERT WITH CHECK (true);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Students can view active courses for enrollment
CREATE POLICY "courses_select_student" ON public.courses FOR SELECT 
  USING (status = 'active');

-- Students can view lessons of enrolled courses
CREATE POLICY "lessons_select_student" ON public.lessons FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.enrollments e 
    JOIN public.courses c ON c.id = e.course_id 
    WHERE c.id = lessons.course_id AND e.student_id = auth.uid()
  ));
