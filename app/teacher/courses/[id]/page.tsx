import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CourseDetails } from "@/components/teacher/course-details"

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      ai_providers(*),
      lessons(
        *,
        lesson_materials(*),
        quizzes(*)
      )
    `)
    .eq("id", id)
    .eq("teacher_id", user!.id)
    .single()

  if (!course) {
    notFound()
  }

  // Sort lessons by order_index
  course.lessons =
    course.lessons?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) ||
    []

  return <CourseDetails course={course} />
}
