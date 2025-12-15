import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, BookOpen, Clock, Users } from "lucide-react"

export default async function CoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      lessons:lessons(count),
      enrollments:enrollments(count)
    `)
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Fanlar</h1>
          <p className="text-muted-foreground">Barcha fanlaringizni boshqaring</p>
        </div>
        <Button asChild>
          <Link href="/teacher/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            Yangi fan
          </Link>
        </Button>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/teacher/courses/${course.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        course.status === "active"
                          ? "bg-green-100 text-green-700"
                          : course.status === "generating"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {course.status === "active"
                        ? "Faol"
                        : course.status === "generating"
                          ? "Generatsiya"
                          : "Qoralama"}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Tavsif kiritilmagan"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.total_hours} soat
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.lessons?.[0]?.count || 0} dars
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrollments?.[0]?.count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Hali fanlar yaratilmagan</h3>
            <p className="text-muted-foreground mb-6">
              Birinchi faningizni yarating va AI yordamida darslar generatsiya qiling
            </p>
            <Button asChild>
              <Link href="/teacher/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Yangi fan yaratish
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
