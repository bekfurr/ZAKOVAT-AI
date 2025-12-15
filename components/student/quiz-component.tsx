"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import type { Quiz, QuizQuestion } from "@/lib/types"
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react"

interface QuizComponentProps {
  quiz: Quiz
  lessonTitle: string
  onBack: () => void
  enrollmentId: string
  lessonId: string
}

export function QuizComponent({ quiz, lessonTitle, onBack, enrollmentId, lessonId }: QuizComponentProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)
  const [result, setResult] = useState<{
    score: number
    maxScore: number
    feedback: string
    weakTopics: string[]
  } | null>(null)

  const questions = quiz.questions as QuizQuestion[]
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [question.id]: Number.parseInt(value) })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Calculate score
    let score = 0
    const weakTopics: string[] = []

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        score++
      } else {
        if (!weakTopics.includes(q.topic)) {
          weakTopics.push(q.topic)
        }
      }
    })

    const maxScore = questions.length

    // Save result
    const { data: resultData } = await supabase
      .from("quiz_results")
      .insert({
        quiz_id: quiz.id,
        student_id: user!.id,
        answers,
        score,
        max_score: maxScore,
        weak_topics: weakTopics,
      })
      .select()
      .single()

    // Create recommendations for weak topics
    if (weakTopics.length > 0 && resultData) {
      await supabase.from("ai_recommendations").insert({
        student_id: user!.id,
        lesson_id: lessonId,
        recommendation_type: "weak_topic",
        content: `${lessonTitle} darsida quyidagi mavzular yaxshiroq o'rganilishi kerak: ${weakTopics.join(", ")}`,
      })

      // Notify teacher
      const { data: course } = await supabase.from("lessons").select("courses(teacher_id)").eq("id", lessonId).single()

      if (course?.courses) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single()

        await supabase.from("notifications").insert({
          teacher_id: (course.courses as { teacher_id: string }).teacher_id,
          student_id: user!.id,
          type: score < maxScore / 2 ? "student_struggling" : "quiz_completed",
          title: `${profile?.full_name} testni yakunladi`,
          message: `Natija: ${score}/${maxScore}. ${weakTopics.length > 0 ? `Qiyin mavzular: ${weakTopics.join(", ")}` : "Ajoyib natija!"}`,
        })
      }
    }

    setIsSubmitting(false)

    let feedback =
      weakTopics.length > 0
        ? `Sizga quyidagi mavzularda qo'shimcha o'rganish tavsiya etiladi: ${weakTopics.join(", ")}`
        : "Ajoyib! Barcha savollarga to'g'ri javob berdingiz."

    if (resultData) {
      setIsLoadingFeedback(true)
      try {
        const response = await fetch("/api/ai/generate-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizResultId: resultData.id }),
        })
        const data = await response.json()
        if (data.feedback) {
          feedback = data.feedback
        }
      } catch (error) {
        console.error("Feedback error:", error)
      }
      setIsLoadingFeedback(false)
    }

    setResult({
      score,
      maxScore,
      feedback,
      weakTopics,
    })

    router.refresh()
  }

  if (result) {
    const percentage = Math.round((result.score / result.maxScore) * 100)

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div
              className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                percentage >= 70 ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              {percentage >= 70 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-yellow-600" />
              )}
            </div>
            <CardTitle className="text-2xl">Test yakunlandi!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">
                {result.score}/{result.maxScore}
              </p>
              <p className="text-muted-foreground">{percentage}% to'g'ri javoblar</p>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              {isLoadingFeedback ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI tavsiya tayyorlamoqda...
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm whitespace-pre-wrap">{result.feedback}</p>
                </div>
              )}
            </div>

            {result.weakTopics.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Yaxshilash kerak bo'lgan mavzular:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {result.weakTopics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={onBack} className="w-full">
              Darsga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Darsga qaytish
      </Button>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>{quiz.title}</span>
          <span>
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion + 1}. {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers[question.id]?.toString()} onValueChange={handleAnswer} className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent"
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handlePrev} disabled={currentQuestion === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Oldingi
        </Button>

        {currentQuestion === questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={Object.keys(answers).length !== questions.length || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yakunlash
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={answers[question.id] === undefined}>
            Keyingi
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
