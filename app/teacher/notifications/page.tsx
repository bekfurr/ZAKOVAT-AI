import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, CheckCircle, AlertTriangle, UserPlus } from "lucide-react"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, profiles!notifications_student_id_fkey(full_name)")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })

  const iconMap = {
    quiz_completed: CheckCircle,
    student_struggling: AlertTriangle,
    course_enrolled: UserPlus,
  }

  const colorMap = {
    quiz_completed: "text-green-600 bg-green-100",
    student_struggling: "text-yellow-600 bg-yellow-100",
    course_enrolled: "text-blue-600 bg-blue-100",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bildirishnomalar</h1>
        <p className="text-muted-foreground">O'quvchilar faoliyati va yangiliklar</p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type as keyof typeof iconMap] || Bell
            const colorClass = colorMap[notification.type as keyof typeof colorMap] || "text-gray-600 bg-gray-100"

            return (
              <Card key={notification.id} className={!notification.is_read ? "border-primary/50" : ""}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString("uz-UZ")}
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
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Bildirishnomalar yo'q</h3>
            <p className="text-muted-foreground">O'quvchilar faoliyati haqida xabarlar bu yerda ko'rinadi</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
