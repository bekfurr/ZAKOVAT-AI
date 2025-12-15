"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lesson, Quiz } from "@/lib/types"
import { ArrowLeft, CheckCircle, FileQuestion, Loader2 } from "lucide-react"

interface LessonViewerProps {
  lesson: Lesson & { quizzes: Quiz[] }
  onBack: () => void
  onStartQuiz: () => void
  isCompleted: boolean
  enrollmentId: string
}

export function LessonViewer({ lesson, onBack, onStartQuiz, isCompleted, enrollmentId }: LessonViewerProps) {
  const router = useRouter()
  const [isMarking, setIsMarking] = useState(false)

  const handleMarkComplete = async () => {
    setIsMarking(true)
    const supabase = createClient()

    // Create or update student lesson
    const { data: existing } = await supabase
      .from("student_lessons")
      .select("id")
      .eq("enrollment_id", enrollmentId)
      .eq("lesson_id", lesson.id)
      .single()

    if (existing) {
      await supabase
        .from("student_lessons")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("id", existing.id)
    } else {
      await supabase.from("student_lessons").insert({
        enrollment_id: enrollmentId,
        lesson_id: lesson.id,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
    }

    router.refresh()
    setIsMarking(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Darslarga qaytish
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {isCompleted && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Tugatilgan</span>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dars mazmuni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {lesson.ai_generated_content ? (
              <div className="whitespace-pre-wrap">{lesson.ai_generated_content}</div>
            ) : (
              <p className="text-muted-foreground">Dars kontenti hali generatsiya qilinmagan</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {!isCompleted && (
          <Button onClick={handleMarkComplete} disabled={isMarking}>
            {isMarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Tugatilgan deb belgilash
          </Button>
        )}

        {lesson.quizzes.length > 0 && (
          <Button variant="outline" onClick={onStartQuiz}>
            <FileQuestion className="mr-2 h-4 w-4" />
            Testni boshlash
          </Button>
        )}
      </div>
    </div>
  )
}
