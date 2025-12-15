import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnrollButton } from "@/components/student/enroll-button"
import { Clock, BookOpen, Users } from "lucide-react"

export default async function AvailableCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all active courses
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      profiles!courses_teacher_id_fkey(full_name),
      lessons(count),
      enrollments(count)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  // Get user's enrollments
  const { data: myEnrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user!.id)

  const enrolledCourseIds = myEnrollments?.map((e) => e.course_id) || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mavjud fanlar</h1>
        <p className="text-muted-foreground">Qiziqarli fanlarga yoziling va o'rganishni boshlang</p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id)

            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Tavsif kiritilmagan"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
                  <p className="text-xs text-muted-foreground mb-4">O'qituvchi: {course.profiles?.full_name}</p>
                  <div className="mt-auto">
                    <EnrollButton courseId={course.id} isEnrolled={isEnrolled} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Hozircha faol fanlar yo'q</h3>
            <p className="text-muted-foreground">O'qituvchilar fanlarni faollashtirganidan so'ng bu yerda ko'rinadi</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
