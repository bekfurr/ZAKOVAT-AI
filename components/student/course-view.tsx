"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LessonViewer } from "./lesson-viewer"
import { QuizComponent } from "./quiz-component"
import type { Course, Lesson, Enrollment, Quiz } from "@/lib/types"
import { ArrowLeft, BookOpen, Clock, CheckCircle, Play } from "lucide-react"
import Link from "next/link"

interface StudentLesson {
  id: string
  lesson_id: string
  is_completed: boolean
}

interface CourseViewProps {
  course: Course & {
    lessons: (Lesson & { quizzes: Quiz[] })[]
  }
  enrollment: Enrollment
  studentLessons: StudentLesson[]
}

export function StudentCourseView({ course, enrollment, studentLessons }: CourseViewProps) {
  const [activeLesson, setActiveLesson] = useState<(Lesson & { quizzes: Quiz[] }) | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [activeTab, setActiveTab] = useState("lessons")

  const completedLessons = studentLessons.filter((sl) => sl.is_completed).length
  const progress = course.lessons.length > 0 ? Math.round((completedLessons / course.lessons.length) * 100) : 0

  const isLessonCompleted = (lessonId: string) => {
    return studentLessons.some((sl) => sl.lesson_id === lessonId && sl.is_completed)
  }

  if (activeLesson) {
    if (showQuiz && activeLesson.quizzes.length > 0) {
      return (
        <QuizComponent
          quiz={activeLesson.quizzes[0]}
          lessonTitle={activeLesson.title}
          onBack={() => setShowQuiz(false)}
          enrollmentId={enrollment.id}
          lessonId={activeLesson.id}
        />
      )
    }

    return (
      <LessonViewer
        lesson={activeLesson}
        onBack={() => setActiveLesson(null)}
        onStartQuiz={() => setShowQuiz(true)}
        isCompleted={isLessonCompleted(activeLesson.id)}
        enrollmentId={enrollment.id}
      />
    )
  }

  return (
    <div className="p-8">
      <Link
        href="/student/my-courses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Darslarimga qaytish
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
      </div>

      {/* Progress */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                {completedLessons}/{course.lessons.length} dars
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {course.total_hours} soat
              </div>
            </div>
            <span className="text-lg font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lessons">Darslar ({course.lessons.length})</TabsTrigger>
          <TabsTrigger value="about">Fan haqida</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-6">
          <div className="space-y-3">
            {course.lessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id)
              const hasContent = lesson.ai_generated_content

              return (
                <Card
                  key={lesson.id}
                  className={`cursor-pointer transition-colors hover:border-primary/50 ${
                    !hasContent ? "opacity-60" : ""
                  }`}
                  onClick={() => hasContent && setActiveLesson(lesson)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{lesson.title}</h3>
                          {completed && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Tugatilgan
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{lesson.duration_hours} soat</span>
                          {lesson.quizzes.length > 0 && <span>{lesson.quizzes.length} test</span>}
                        </div>
                      </div>
                      {hasContent && (
                        <Button variant="ghost" size="icon">
                          <Play className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fan haqida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Tavsif</h4>
                <p className="text-muted-foreground">{course.description || "Tavsif kiritilmagan"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Umumiy soat</h4>
                  <p className="text-muted-foreground">{course.total_hours} soat</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Har bir dars</h4>
                  <p className="text-muted-foreground">{course.hours_per_lesson} soat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
