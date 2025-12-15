"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"

export function EnrollButton({ courseId, isEnrolled }: { courseId: string; isEnrolled: boolean }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnroll = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { error } = await supabase.from("enrollments").insert({
      student_id: user.id,
      course_id: courseId,
      progress_percent: 0,
    })

    if (!error) {
      router.refresh()
      router.push(`/student/my-courses/${courseId}`)
    }

    setIsLoading(false)
  }

  if (isEnrolled) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        <Check className="mr-2 h-4 w-4" />
        Yozilgan
      </Button>
    )
  }

  return (
    <Button onClick={handleEnroll} disabled={isLoading} className="w-full">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Yozilish
    </Button>
  )
}
