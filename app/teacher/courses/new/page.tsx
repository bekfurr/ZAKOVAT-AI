"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AIProvider } from "@/lib/types"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewCoursePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    total_hours: "",
    hours_per_lesson: "",
    ai_provider_id: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      const supabase = createClient()
      const { data } = await supabase.from("ai_providers").select("*").eq("is_active", true)
      setAiProviders(data || [])
    }
    fetchProviders()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Foydalanuvchi topilmadi")
      setIsLoading(false)
      return
    }

    const totalHours = Number.parseInt(formData.total_hours)
    const hoursPerLesson = Number.parseInt(formData.hours_per_lesson)

    if (hoursPerLesson > totalHours) {
      setError("Har bir dars soati umumiy soatdan ko'p bo'lmasligi kerak")
      setIsLoading(false)
      return
    }

    // Create course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        teacher_id: user.id,
        title: formData.title,
        description: formData.description,
        total_hours: totalHours,
        hours_per_lesson: hoursPerLesson,
        ai_provider_id: formData.ai_provider_id || null,
        status: "draft",
      })
      .select()
      .single()

    if (courseError) {
      setError(courseError.message)
      setIsLoading(false)
      return
    }

    // Calculate and create lessons
    const numLessons = Math.ceil(totalHours / hoursPerLesson)
    const lessons = []

    for (let i = 0; i < numLessons; i++) {
      const remainingHours = totalHours - i * hoursPerLesson
      const lessonDuration = Math.min(hoursPerLesson, remainingHours)

      lessons.push({
        course_id: course.id,
        title: `${i + 1}-dars`,
        order_index: i + 1,
        duration_hours: lessonDuration,
        status: "pending",
      })
    }

    const { error: lessonsError } = await supabase.from("lessons").insert(lessons)

    if (lessonsError) {
      setError(lessonsError.message)
      setIsLoading(false)
      return
    }

    router.push(`/teacher/courses/${course.id}`)
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/teacher/courses"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Fanlarga qaytish
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Yangi fan yaratish</CardTitle>
          <CardDescription>Fan ma'lumotlarini kiriting. AI darslarni avtomatik generatsiya qiladi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Fan nomi *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masalan: Matematika asoslari"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Fan haqida qisqacha ma'lumot..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_hours">Umumiy soat *</Label>
                <Input
                  id="total_hours"
                  type="number"
                  min="1"
                  required
                  value={formData.total_hours}
                  onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                  placeholder="36"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours_per_lesson">Har bir dars (soat) *</Label>
                <Input
                  id="hours_per_lesson"
                  type="number"
                  min="1"
                  required
                  value={formData.hours_per_lesson}
                  onChange={(e) => setFormData({ ...formData, hours_per_lesson: e.target.value })}
                  placeholder="2"
                />
              </div>
            </div>

            {formData.total_hours && formData.hours_per_lesson && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <strong>Jami darslar:</strong>{" "}
                {Math.ceil(Number.parseInt(formData.total_hours) / Number.parseInt(formData.hours_per_lesson))} ta dars
                generatsiya qilinadi
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ai_provider">AI Provider</Label>
              <Select
                value={formData.ai_provider_id}
                onValueChange={(value) => setFormData({ ...formData, ai_provider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="AI providerni tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} ({provider.provider_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiProviders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  <Link href="/teacher/ai-providers" className="underline">
                    AI Provider qo'shing
                  </Link>{" "}
                  avtomatik generatsiya uchun
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fan yaratish
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
