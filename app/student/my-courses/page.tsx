import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Clock, ArrowRight } from "lucide-react"

export default async function MyCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      courses(*, lessons(count))
    `)
    .eq("student_id", user!.id)
    .order("enrolled_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mening darslarim</h1>
        <p className="text-muted-foreground">Yozilgan fanlaringiz va progress</p>
      </div>

      {enrollments && enrollments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{enrollment.courses?.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {enrollment.courses?.description || "Tavsif kiritilmagan"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {enrollment.courses?.total_hours} soat
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {enrollment.courses?.lessons?.[0]?.count || 0} dars
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{enrollment.progress_percent}%</span>
                  </div>
                  <Progress value={enrollment.progress_percent} className="h-2" />
                </div>

                <div className="mt-auto">
                  <Button asChild className="w-full">
                    <Link href={`/student/my-courses/${enrollment.course_id}`}>
                      Davom etish
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Hali fanlarga yozilmagansiz</h3>
            <p className="text-muted-foreground mb-6">Mavjud fanlarni ko'ring va o'rganishni boshlang</p>
            <Button asChild>
              <Link href="/student/courses">Fanlarni ko'rish</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
