import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateLessonContent, generateQuiz } from "@/lib/ai/providers"

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const { courseId } = await request.json()

  // Get course with AI provider
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      ai_providers(*),
      lessons(*, lesson_materials(*))
    `)
    .eq("id", courseId)
    .single()

  if (!course || !course.ai_providers) {
    return NextResponse.json({ error: "Course or AI provider not found" }, { status: 400 })
  }

  // Update course status
  await supabase.from("courses").update({ status: "generating" }).eq("id", courseId)

  const results = []

  // For each lesson, generate content and quiz
  for (const lesson of course.lessons) {
    if (lesson.lesson_materials.length === 0) {
      results.push({ lessonId: lesson.id, status: "skipped", reason: "No materials" })
      continue
    }

    try {
      // Combine all material text
      const materialText = lesson.lesson_materials
        .map((m: { extracted_text?: string; file_name: string }) => m.extracted_text || `[File: ${m.file_name}]`)
        .join("\n\n")

      // Generate lesson content
      const contentResult = await generateLessonContent(
        course.ai_providers,
        lesson.title,
        materialText,
        lesson.duration_hours,
      )

      if (!contentResult.success) {
        results.push({ lessonId: lesson.id, status: "error", error: contentResult.error })
        continue
      }

      // Update lesson with AI content
      await supabase
        .from("lessons")
        .update({
          ai_generated_content: contentResult.content,
          status: "ready",
        })
        .eq("id", lesson.id)

      // Generate quiz
      const quizResult = await generateQuiz(course.ai_providers, lesson.title, contentResult.content || "")

      if (quizResult.success && quizResult.questions) {
        await supabase.from("quizzes").insert({
          lesson_id: lesson.id,
          title: `${lesson.title} - Test`,
          questions: quizResult.questions,
        })
      }

      results.push({ lessonId: lesson.id, status: "success" })
    } catch (error) {
      console.error(`Error generating lesson ${lesson.id}:`, error)
      results.push({ lessonId: lesson.id, status: "error", error: String(error) })
    }
  }

  // Update course status back to draft (user needs to activate)
  await supabase.from("courses").update({ status: "draft" }).eq("id", courseId)

  return NextResponse.json({ success: true, results })
}
