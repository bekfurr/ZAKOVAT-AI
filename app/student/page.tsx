import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { BookOpen, Trophy, Clock, Lightbulb, ArrowRight } from "lucide-react"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get enrollments with course info
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      courses(*)
    `)
    .eq("student_id", user!.id)

  // Get recommendations
  const { data: recommendations } = await supabase
    .from("ai_recommendations")
    .select("*, lessons(title)")
    .eq("student_id", user!.id)
    .eq("is_read", false)
    .limit(3)

  // Get recent quiz results
  const { data: recentResults } = await supabase
    .from("quiz_results")
    .select("*, quizzes(title, lessons(title))")
    .eq("student_id", user!.id)
    .order("completed_at", { ascending: false })
    .limit(5)

  const totalCourses = enrollments?.length || 0
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percent, 0) / enrollments.length)
    : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">O'quv faoliyatingizni kuzating</p>
        </div>
        <Button asChild>
          <Link href="/student/courses">
            Yangi fanga yozilish
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faol fanlar</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha progress</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tugatilgan testlar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentResults?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Yangi tavsiyalar</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Faol fanlar</CardTitle>
            <CardDescription>Davom etayotgan o'quv faoliyatingiz</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.slice(0, 4).map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/student/my-courses/${enrollment.course_id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{enrollment.courses?.title}</p>
                      <span className="text-sm text-muted-foreground">{enrollment.progress_percent}%</span>
                    </div>
                    <Progress value={enrollment.progress_percent} className="h-2" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hali fanlarga yozilmagansiz</p>
                <Button asChild variant="outline" className="mt-4 bg-transparent">
                  <Link href="/student/courses">Fanlarni ko'rish</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI Tavsiyalari</CardTitle>
            <CardDescription>Sizning o'quv ehtiyojlaringiz asosida</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          rec.recommendation_type === "weak_topic"
                            ? "bg-yellow-100 text-yellow-600"
                            : rec.recommendation_type === "extra_practice"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{rec.lessons?.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/student/recommendations">Barcha tavsiyalar</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha tavsiyalar yo'q</p>
                <p className="text-xs mt-1">Darslarni o'qib, testlarni yeching</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
