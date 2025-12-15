import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateStudentFeedback } from "@/lib/ai/providers"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { quizResultId } = await request.json()

  // Get quiz result with related data
  const { data: quizResult } = await supabase
    .from("quiz_results")
    .select(`
      *,
      quizzes(
        title,
        lessons(
          title,
          courses(
            ai_providers(*)
          )
        )
      )
    `)
    .eq("id", quizResultId)
    .single()

  if (!quizResult) {
    return NextResponse.json({ error: "Quiz result not found" }, { status: 404 })
  }

  const aiProvider = quizResult.quizzes?.lessons?.courses?.ai_providers

  if (!aiProvider) {
    // Return default feedback if no AI provider
    return NextResponse.json({
      feedback:
        quizResult.weak_topics?.length > 0
          ? `Sizga quyidagi mavzularda qo'shimcha o'rganish tavsiya etiladi: ${quizResult.weak_topics.join(", ")}`
          : "Ajoyib natija! Davom eting!",
    })
  }

  const result = await generateStudentFeedback(
    aiProvider,
    quizResult.quizzes?.lessons?.title || "Dars",
    quizResult.weak_topics || [],
    quizResult.score,
    quizResult.max_score,
  )

  if (result.success) {
    // Update quiz result with AI feedback
    await supabase.from("quiz_results").update({ ai_feedback: result.feedback }).eq("id", quizResultId)

    return NextResponse.json({ feedback: result.feedback })
  }

  return NextResponse.json({ error: result.error }, { status: 500 })
}
