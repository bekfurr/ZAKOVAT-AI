export interface Profile {
  id: string
  email: string
  full_name: string
  role: "teacher" | "student"
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AIProvider {
  id: string
  teacher_id: string
  name: string
  provider_type: "openai" | "anthropic" | "google" | "groq" | "deepseek" | "custom"
  api_key: string
  base_url?: string
  model_name: string
  is_active: boolean
  created_at: string
}

export interface Course {
  id: string
  teacher_id: string
  ai_provider_id?: string
  title: string
  description?: string
  total_hours: number
  hours_per_lesson: number
  status: "draft" | "generating" | "active" | "archived"
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  order_index: number
  duration_hours: number
  ai_generated_content?: string
  status: "pending" | "materials_uploaded" | "generating" | "ready"
  created_at: string
  updated_at: string
}

export interface LessonMaterial {
  id: string
  lesson_id: string
  file_name: string
  file_url: string
  file_type: "pdf" | "docx" | "pptx" | "doc" | "ppt"
  file_size?: number
  extracted_text?: string
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  progress_percent: number
}

export interface Quiz {
  id: string
  lesson_id: string
  title: string
  questions: QuizQuestion[]
  created_at: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  topic: string
}

export interface QuizResult {
  id: string
  quiz_id: string
  student_id: string
  answers: Record<string, number>
  score: number
  max_score: number
  weak_topics?: string[]
  ai_feedback?: string
  completed_at: string
}

export interface AIRecommendation {
  id: string
  student_id: string
  lesson_id: string
  recommendation_type: "weak_topic" | "extra_practice" | "review"
  content: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  teacher_id: string
  student_id?: string
  type: "quiz_completed" | "student_struggling" | "course_enrolled"
  title: string
  message: string
  is_read: boolean
  created_at: string
}
