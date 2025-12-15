"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Lesson } from "@/lib/types"
import { ChevronDown, Clock, Upload, FileText, Trash2, Loader2, CheckCircle } from "lucide-react"

interface LessonCardProps {
  lesson: Lesson & {
    lesson_materials: { id: string; file_name: string; file_url: string; file_type: string }[]
    quizzes: { id: string; title: string }[]
  }
  courseId: string
}

export function LessonCard({ lesson, courseId }: LessonCardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const statusColor = {
    pending: "bg-gray-100 text-gray-700",
    materials_uploaded: "bg-blue-100 text-blue-700",
    generating: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
  }

  const statusText = {
    pending: "Kutilmoqda",
    materials_uploaded: "Materiallar yuklangan",
    generating: "Generatsiya",
    ready: "Tayyor",
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const supabase = createClient()

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop()?.toLowerCase()
        const allowedTypes = ["pdf", "docx", "pptx", "doc", "ppt"]

        if (!fileExt || !allowedTypes.includes(fileExt)) {
          alert(`${file.name}: faqat PDF, DOCX, PPTX formatlar qo'llab-quvvatlanadi`)
          continue
        }

        const fileName = `${courseId}/${lesson.id}/${Date.now()}_${file.name}`

        const { error: uploadError } = await supabase.storage.from("lesson-materials").upload(fileName, file)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("lesson-materials").getPublicUrl(fileName)

        await supabase.from("lesson_materials").insert({
          lesson_id: lesson.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: fileExt,
          file_size: file.size,
        })
      }

      // Update lesson status
      await supabase.from("lessons").update({ status: "materials_uploaded" }).eq("id", lesson.id)

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteMaterial = async (materialId: string, fileUrl: string) => {
    const supabase = createClient()

    // Extract file path from URL
    const urlParts = fileUrl.split("/")
    const filePath = urlParts.slice(-3).join("/")

    await supabase.storage.from("lesson-materials").remove([filePath])
    await supabase.from("lesson_materials").delete().eq("id", materialId)

    // Check if any materials left
    const { data: remaining } = await supabase.from("lesson_materials").select("id").eq("lesson_id", lesson.id)

    if (!remaining || remaining.length === 0) {
      await supabase.from("lessons").update({ status: "pending" }).eq("id", lesson.id)
    }

    router.refresh()
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {lesson.order_index}
                </div>
                <div>
                  <CardTitle className="text-base">{lesson.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{lesson.duration_hours} soat</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor[lesson.status as keyof typeof statusColor]}>
                  {statusText[lesson.status as keyof typeof statusText]}
                </Badge>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Materials */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Materiallar</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Yuklash
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.pptx,.doc,.ppt"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {lesson.lesson_materials.length > 0 ? (
                  <div className="space-y-2">
                    {lesson.lesson_materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{material.file_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {material.file_type.toUpperCase()}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDeleteMaterial(material.id, material.file_url)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Hali materiallar yuklanmagan. PDF, DOCX yoki PPTX fayllarni yuklang.
                  </p>
                )}
              </div>

              {/* AI Generated Content */}
              {lesson.ai_generated_content && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    AI tomonidan yaratilgan kontent
                  </h4>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm">
                    <p className="line-clamp-3">{lesson.ai_generated_content}</p>
                  </div>
                </div>
              )}

              {/* Quizzes */}
              {lesson.quizzes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Testlar</h4>
                  <div className="space-y-2">
                    {lesson.quizzes.map((quiz) => (
                      <div key={quiz.id} className="p-2 rounded-lg bg-muted text-sm">
                        {quiz.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
