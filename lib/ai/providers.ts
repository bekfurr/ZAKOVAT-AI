import { generateText, generateObject } from "ai"
import { z } from "zod"
import type { AIProvider } from "@/lib/types"

// Provider configuration for custom API keys
export async function createAIClient(provider: AIProvider) {
  // Map provider types to model strings
  const modelMap: Record<string, string> = {
    openai: `openai/${provider.model_name}`,
    anthropic: `anthropic/${provider.model_name}`,
    google: `google/${provider.model_name}`,
    groq: `groq/${provider.model_name}`,
    deepseek: `deepseek/${provider.model_name}`,
    custom: provider.model_name,
  }

  return {
    model: modelMap[provider.provider_type] || provider.model_name,
    apiKey: provider.api_key,
    baseURL: provider.base_url,
  }
}

// Schema for lesson generation
const lessonContentSchema = z.object({
  title: z.string(),
  introduction: z.string().describe("Darsga kirish, mavzu haqida qisqacha ma'lumot"),
  mainContent: z
    .array(
      z.object({
        heading: z.string(),
        content: z.string(),
        examples: z.array(z.string()).optional(),
      }),
    )
    .describe("Asosiy dars mazmuni bo'limlarga bo'lingan"),
  summary: z.string().describe("Dars yakunlari va xulosalar"),
  keyPoints: z.array(z.string()).describe("Eslab qolish kerak bo'lgan asosiy fikrlar"),
})

// Schema for quiz generation
const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(z.string()).length(4),
        correct_answer: z.number().min(0).max(3),
        topic: z.string(),
        explanation: z.string().optional(),
      }),
    )
    .min(5)
    .max(10),
})

// Generate lesson content from materials
export async function generateLessonContent(
  provider: AIProvider,
  lessonTitle: string,
  materialText: string,
  duration: number,
) {
  const config = await createAIClient(provider)

  const prompt = `Sen ta'lim platformasi uchun professional dars kontentini yaratuvchi AI yordamchisizan.

Quyidagi material asosida "${lessonTitle}" mavzusi bo'yicha ${duration} soatlik dars kontentini yarat.

Material:
${materialText}

Talablar:
- O'zbek tilida yoz
- O'quvchilar uchun tushunarli va qiziqarli bo'lsin
- Amaliy misollar qo'sh
- Dars davomiyligi ${duration} soatga mos kelsin
- Murakkab tushunchalarni oddiy tilda tushuntir`

  try {
    const { object } = await generateObject({
      model: config.model,
      schema: lessonContentSchema,
      prompt,
      maxOutputTokens: 4000,
    })

    // Format content as readable text
    let formattedContent = `# ${object.title}\n\n`
    formattedContent += `## Kirish\n${object.introduction}\n\n`

    for (const section of object.mainContent) {
      formattedContent += `## ${section.heading}\n${section.content}\n`
      if (section.examples && section.examples.length > 0) {
        formattedContent += `\n**Misollar:**\n`
        section.examples.forEach((ex, i) => {
          formattedContent += `${i + 1}. ${ex}\n`
        })
      }
      formattedContent += "\n"
    }

    formattedContent += `## Xulosa\n${object.summary}\n\n`
    formattedContent += `## Asosiy fikrlar:\n`
    object.keyPoints.forEach((point, i) => {
      formattedContent += `- ${point}\n`
    })

    return { success: true, content: formattedContent }
  } catch (error) {
    console.error("Lesson generation error:", error)
    return { success: false, error: String(error) }
  }
}

// Generate quiz from lesson content
export async function generateQuiz(provider: AIProvider, lessonTitle: string, lessonContent: string) {
  const config = await createAIClient(provider)

  const prompt = `Sen ta'lim platformasi uchun test savollarini yaratuvchi AI yordamchisizan.

"${lessonTitle}" mavzusi bo'yicha quyidagi dars kontenti asosida test yaratishingni so'rayman.

Dars kontenti:
${lessonContent}

Talablar:
- O'zbek tilida yoz
- 5-10 ta savol yaratilsin
- Har bir savolda 4 ta javob varianti bo'lsin
- Savollar dars mavzusini qamrab olsin
- Murakkablik darajasi o'rtacha bo'lsin
- Har bir savol uchun qaysi mavzuga tegishli ekanligini ko'rsat`

  try {
    const { object } = await generateObject({
      model: config.model,
      schema: quizSchema,
      prompt,
      maxOutputTokens: 3000,
    })

    return { success: true, questions: object.questions }
  } catch (error) {
    console.error("Quiz generation error:", error)
    return { success: false, error: String(error) }
  }
}

// Generate AI feedback for student's weak topics
export async function generateStudentFeedback(
  provider: AIProvider,
  lessonTitle: string,
  weakTopics: string[],
  score: number,
  maxScore: number,
) {
  const config = await createAIClient(provider)

  const percentage = Math.round((score / maxScore) * 100)

  const prompt = `Sen ta'lim platformasida o'quvchilarga yordam beruvchi AI yordamchisizan.

O'quvchi "${lessonTitle}" mavzusi bo'yicha testdan ${score}/${maxScore} (${percentage}%) natija oldi.

Qiyin mavzular: ${weakTopics.join(", ")}

O'quvchiga quyidagi jihatlar bo'yicha yordam ber:
1. Natija haqida qisqacha fikr bildir
2. Qiyin mavzularni tushuntir
3. Qanday yaxshilash mumkinligi haqida maslahat ber
4. Motivatsiya ber

O'zbek tilida, do'stona ohangda yoz.`

  try {
    const { text } = await generateText({
      model: config.model,
      prompt,
      maxOutputTokens: 1000,
    })

    return { success: true, feedback: text }
  } catch (error) {
    console.error("Feedback generation error:", error)
    return { success: false, error: String(error) }
  }
}

// Generate student-friendly lesson explanation
export async function generateStudentLesson(provider: AIProvider, lessonTitle: string, originalContent: string) {
  const config = await createAIClient(provider)

  const prompt = `Sen ta'lim platformasida o'quvchilar uchun darslarni soddalashtirib tushuntiruvchi AI yordamchisizan.

Quyidagi "${lessonTitle}" darsini o'quvchilar uchun yanada tushunarli qilib qayta yoz:

${originalContent}

Talablar:
- O'zbek tilida yoz
- Oddiy va tushunarli til ishlatilsin
- Ko'proq misollar qo'shilsin
- Qiziqarli faktlar qo'shilsin
- Savol-javob formatida ham bo'lsin
- Vizual tasvirlar uchun tavsiflar qo'shilsin`

  try {
    const { text } = await generateText({
      model: config.model,
      prompt,
      maxOutputTokens: 3000,
    })

    return { success: true, content: text }
  } catch (error) {
    console.error("Student lesson generation error:", error)
    return { success: false, error: String(error) }
  }
}
