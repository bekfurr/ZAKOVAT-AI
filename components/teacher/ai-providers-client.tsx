"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AIProvider } from "@/lib/types"
import { Plus, Cpu, Trash2, Loader2, CheckCircle, XCircle, Zap } from "lucide-react"

const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  {
    value: "anthropic",
    label: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  },
  { value: "google", label: "Google AI", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"] },
  { value: "groq", label: "Groq", models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"] },
  { value: "deepseek", label: "DeepSeek", models: ["deepseek-chat", "deepseek-coder"] },
  { value: "custom", label: "Custom (OpenAI Compatible)", models: [] },
]

export function AIProvidersClient({ initialProviders }: { initialProviders: AIProvider[] }) {
  const router = useRouter()
  const [providers, setProviders] = useState(initialProviders)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    provider_type: "",
    api_key: "",
    base_url: "",
    model_name: "",
  })

  const selectedProviderType = PROVIDER_TYPES.find((p) => p.value === formData.provider_type)

  const handleTestProvider = async () => {
    if (!formData.api_key || !formData.provider_type || !formData.model_name) {
      setTestResult({ success: false, message: "Barcha maydonlarni to'ldiring" })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/ai/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_type: formData.provider_type,
          api_key: formData.api_key,
          base_url: formData.base_url,
          model_name: formData.model_name,
        }),
      })

      const data = await response.json()
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error,
      })
    } catch (error) {
      setTestResult({ success: false, message: String(error) })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("ai_providers")
      .insert({
        teacher_id: user!.id,
        name: formData.name,
        provider_type: formData.provider_type,
        api_key: formData.api_key,
        base_url: formData.base_url || null,
        model_name: formData.model_name,
        is_active: true,
      })
      .select()
      .single()

    if (!error && data) {
      setProviders([data, ...providers])
      setFormData({ name: "", provider_type: "", api_key: "", base_url: "", model_name: "" })
      setTestResult(null)
      setIsOpen(false)
    }

    setIsLoading(false)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase.from("ai_providers").update({ is_active: isActive }).eq("id", id)

    setProviders(providers.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return

    const supabase = createClient()
    await supabase.from("ai_providers").delete().eq("id", id)
    setProviders(providers.filter((p) => p.id !== id))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">AI Sozlamalari</h1>
          <p className="text-muted-foreground">
            AI provayderlarni boshqaring - OpenAI, Anthropic, Google, Groq, DeepSeek yoki Custom API
          </p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) setTestResult(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>AI Provider qo'shish</DialogTitle>
              <DialogDescription>
                O'z API kalitingiz bilan AI provayderini ulang. 6 ta turli provider qo'llab-quvvatlanadi.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Provider nomi</Label>
                <Input
                  required
                  placeholder="Masalan: Mening OpenAI"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Provider turi</Label>
                <Select
                  value={formData.provider_type}
                  onValueChange={(value) => setFormData({ ...formData, provider_type: value, model_name: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  required
                  type="password"
                  placeholder="sk-..."
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
              </div>

              {formData.provider_type === "custom" && (
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={formData.base_url}
                    onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">OpenAI-compatible API endpoint</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Model</Label>
                {selectedProviderType && selectedProviderType.models.length > 0 ? (
                  <Select
                    value={formData.model_name}
                    onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Model tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProviderType.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    required
                    placeholder="Model nomi"
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  />
                )}
              </div>

              {/* Test result */}
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  <AlertDescription className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestProvider}
                  disabled={isTesting || !formData.api_key || !formData.model_name}
                  className="flex-1 bg-transparent"
                >
                  {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Test qilish
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Qo'shish
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider Info Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{providers.length}</p>
              <p className="text-sm text-muted-foreground">Ulangan provayderlar</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{providers.filter((p) => p.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Faol provayderlar</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">6</p>
              <p className="text-sm text-muted-foreground">Qo'llab-quvvatlanadigan turlar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {providers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        provider.is_active ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <Cpu className={`h-5 w-5 ${provider.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <CardDescription className="capitalize">{provider.provider_type}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={provider.is_active}
                    onCheckedChange={(checked) => handleToggle(provider.id, checked)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Model:</p>
                    <p className="text-sm font-medium">{provider.model_name}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(provider.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <Cpu className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">AI Provider yo'q</h3>
            <p className="text-muted-foreground mb-2">
              Darslarni avtomatik generatsiya qilish uchun AI providerni ulang
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              OpenAI, Anthropic, Google, Groq, DeepSeek yoki Custom API
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Provider qo'shish
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
