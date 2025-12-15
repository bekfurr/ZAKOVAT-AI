import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, BookOpen, Target } from "lucide-react"

export default async function RecommendationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: recommendations } = await supabase
    .from("ai_recommendations")
    .select("*, lessons(title, courses(title))")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false })

  const iconMap = {
    weak_topic: Target,
    extra_practice: BookOpen,
    review: Lightbulb,
  }

  const colorMap = {
    weak_topic: "bg-yellow-100 text-yellow-600",
    extra_practice: "bg-blue-100 text-blue-600",
    review: "bg-green-100 text-green-600",
  }

  const labelMap = {
    weak_topic: "Yaxshilash kerak",
    extra_practice: "Qo'shimcha mashq",
    review: "Takrorlash",
  }

  // Mark as read
  if (recommendations && recommendations.length > 0) {
    const unreadIds = recommendations.filter((r) => !r.is_read).map((r) => r.id)
    if (unreadIds.length > 0) {
      await supabase.from("ai_recommendations").update({ is_read: true }).in("id", unreadIds)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">AI Tavsiyalari</h1>
        <p className="text-muted-foreground">
          Sun'iy intellekt sizning o'quv faoliyatingizni tahlil qilib, shaxsiy tavsiyalar beradi
        </p>
      </div>

      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const Icon = iconMap[rec.recommendation_type as keyof typeof iconMap] || Lightbulb
            const colorClass = colorMap[rec.recommendation_type as keyof typeof colorMap] || "bg-gray-100 text-gray-600"
            const label = labelMap[rec.recommendation_type as keyof typeof labelMap] || "Tavsiya"

            return (
              <Card key={rec.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{rec.lessons?.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.lessons?.courses?.title}</p>
                      <p className="text-sm">{rec.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(rec.created_at).toLocaleString("uz-UZ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Hozircha tavsiyalar yo'q</h3>
            <p className="text-muted-foreground">
              Darslarni o'qib, testlarni yeching - AI sizga shaxsiy tavsiyalar beradi
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
