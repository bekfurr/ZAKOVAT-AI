import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeacherSidebar } from "@/components/teacher/sidebar"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "teacher") {
    redirect("/student")
  }

  return (
    <div className="flex min-h-screen">
      <TeacherSidebar profile={profile} />
      <main className="flex-1 bg-muted">{children}</main>
    </div>
  )
}
