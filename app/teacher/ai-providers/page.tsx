import { createClient } from "@/lib/supabase/server"
import { AIProvidersClient } from "@/components/teacher/ai-providers-client"

export default async function AIProvidersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: providers } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })

  return <AIProvidersClient initialProviders={providers || []} />
}
