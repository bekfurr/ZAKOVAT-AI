"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LessonCard } from "./lesson-card"
import type { Course, Lesson, AIProvider } from "@/lib/types"
import { ArrowLeft, Clock, BookOpen, Users, Cpu, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

interface CourseWithRelations extends Course {
  ai_providers?: AIProvider | null
  lessons: (Lesson & {
    lesson_materials: { id: string; file_name: string; file_url: string; file_type: string }[]
    quizzes: { id: string; title: string }[]
  })[]
}

export function CourseDetails({ course }: { course: CourseWithRelations }) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("lessons")

  const handleGenerateContent = async () => {
    if (!course.ai_providers) {
      alert("Iltimos, avval AI Provider tanlang")
      return
    }

    // Check if all lessons have materials
    const lessonsWithoutMaterials = course.lessons.filter((l) => l.lesson_materials.length === 0)

    if (lessonsWithoutMaterials.length > 0) {
      alert("Barcha darslarga materiallar yuklang")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      })

      if (!response.ok) throw new Error("Generation failed")

      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Generatsiya xatosi")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleActivateCourse = async () => {
    const supabase = createClient()

    await supabase.from("courses").update({ status: "active" }).eq("id", course.id)

    router.refresh()
  }

  const statusColor = {
    draft: "bg-gray-100 text-gray-700",
    generating: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    archived: "bg-red-100 text-red-700",
  }

  const statusText = {
    draft: "Qoralama",
    generating: "Generatsiya",
    active: "Faol",
    archived: "Arxiv",
  }

  const readyLessons = course.lessons.filter((l) => l.status === "ready").length
  const allReady = readyLessons === course.lessons.length && course.lessons.length > 0

  return (
    <div className="p-8">
      <Link
        href="/teacher/courses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Fanlarga qaytish
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <Badge className={statusColor[course.status as keyof typeof statusColor]}>
              {statusText[course.status as keyof typeof statusText]}
            </Badge>
          </div>
          <p className="text-muted-foreground">{course.description || "Tavsif kiritilmagan"}</p>
        </div>
        <div className="flex gap-2">
          {course.status === "draft" && allReady && (
            <Button onClick={handleActivateCourse}>Fanni faollashtirish</Button>
          )}
          {course.status === "draft" && course.ai_providers && (
            <Button onClick={handleGenerateContent} disabled={isGenerating} variant="outline">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI bilan generatsiya
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{course.total_hours}</p>
                <p className="text-sm text-muted-foreground">Umumiy soat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{course.lessons.length}</p>
                <p className="text-sm text-muted-foreground">Darslar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{course.hours_per_lesson}</p>
                <p className="text-sm text-muted-foreground">Soat/dars</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold truncate">{course.ai_providers?.name || "—"}</p>
                <p className="text-sm text-muted-foreground">AI Provider</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lessons">Darslar ({course.lessons.length})</TabsTrigger>
          <TabsTrigger value="students">O'quvchilar</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-6">
          <div className="space-y-4">
            {course.lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} courseId={course.id} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ro'yxatdan o'tgan o'quvchilar</CardTitle>
              <CardDescription>Bu fanga yozilgan o'quvchilar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Hali o'quvchilar yo'q</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fan sozlamalari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fan nomi</Label>
                <Input defaultValue={course.title} />
              </div>
              <Button>Saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
