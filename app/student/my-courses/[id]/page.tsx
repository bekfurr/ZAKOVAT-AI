import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { StudentCourseView } from "@/components/student/course-view"

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", user!.id)
    .eq("course_id", id)
    .single()

  if (!enrollment) {
    redirect("/student/courses")
  }

  // Get course with lessons
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      lessons(*, quizzes(*))
    `)
    .eq("id", id)
    .single()

  if (!course) {
    notFound()
  }

  // Get student lessons
  const { data: studentLessons } = await supabase.from("student_lessons").select("*").eq("enrollment_id", enrollment.id)

  // Sort lessons
  course.lessons =
    course.lessons?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) ||
    []

  return <StudentCourseView course={course} enrollment={enrollment} studentLessons={studentLessons || []} />
}
