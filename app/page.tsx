import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, GraduationCap, Sparkles, Users } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Zakovat AI</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Kirish</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Ro'yxatdan o'tish</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Sparkles className="h-4 w-4" />
            AI bilan ta'lim inqilobi
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
            Sun'iy intellekt bilan <br />
            <span className="text-primary">ta'limni avtomatlashtiring</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            Zakovat AI - o'qituvchilar uchun dars yaratish va o'quvchilar uchun shaxsiylashtirilgan ta'lim tajribasini
            taqdim etuvchi platforma. Inson qatnashuvini kamaytiring, sifatni oshiring.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Hisob yaratish</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Mavjud akkauntga kirish</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">O'qituvchilar uchun</h3>
            <p className="text-sm text-muted-foreground">
              Fan yarating, materiallarni yuklang va AI avtomatik ravishda darslarni tuzib beradi. O'quvchilar
              natijalarini real vaqtda kuzating.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">O'quvchilar uchun</h3>
            <p className="text-sm text-muted-foreground">
              Shaxsiylashtirilgan darslar, testlar va AI tomonidan tavsiyalar. Qiynalgan mavzularingiz bo'yicha
              qo'shimcha yordam oling.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Integratsiya</h3>
            <p className="text-sm text-muted-foreground">
              OpenAI, Anthropic, Google, Groq va boshqa AI provayderlarini ulang. O'zingizning API kalitingiz bilan
              ishlang.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center border-t border-border">
          <h2 className="text-2xl font-bold mb-4">Bugun boshlang</h2>
          <p className="text-muted-foreground mb-6">Ro'yxatdan o'ting va AI bilan ta'lim inqilobiga qo'shiling</p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Ro'yxatdan o'tish</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          © 2025 Zakovat AI. Barcha huquqlar himoyalangan.
        </div>
      </footer>
    </div>
  )
}
