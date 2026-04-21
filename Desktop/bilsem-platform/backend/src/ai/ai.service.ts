import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('ANTHROPIC_API_KEY') || '';
  }

  private async callClaude(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
     async extractActivitiesFromText(text: string, level: string): 
Promise<any[]> {
  const systemPrompt = `Sen BİLSEM matematik etkinlik kitaplarını analiz 
eden uzmansın.
Verilen metinden etkinlikleri çıkarır, yapılandırır ve JSON formatına 
çevirirsin.
Her zaman Türkçe yanıt verirsin.`;

  const prompt = `Aşağıdaki BİLSEM matematik kitabı metninden etkinlikleri 
çıkar:

${text.slice(0, 8000)}

Her etkinlik için JSON formatında yanıt ver:
[
  {
    "title": "Etkinlik adı",
    "description": "Kısa açıklama",
    "topic": "Matematik konusu",
    "objectives": ["Kazanım 1", "Kazanım 2"],
    "materials": ["Materyal 1"],
    "duration": 45,
    "difficulty": "KOLAY|ORTA|ZOR",
    "skills": ["Beceri 1"],
    "instructions": "Uygulama adımları",
    "gradeRange": "5-7"
  }
]`;

  const raw = await this.callClaude(prompt, systemPrompt);
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return [];
} },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data: any = await response.json();
    return data.content?.[0]?.text || '';
  }

  // ─── SORU ÜRETİCİ ────────────────────────────────────────────────────

  async generateQuestions(params: {
    topic: string;
    subTopic?: string;
    gradeLevel: string;
    difficulty: string;
    type: string;
    count: number;
    additionalContext?: string;
  }): Promise<any[]> {
    const systemPrompt = `Sen BİLSEM (Bilim ve Sanat Merkezi) matematik öğretmenlerine yardım eden uzman bir matematik eğitimcisisin.
Türkiye BİLSEM müfredatını, üst düzey matematik eğitimini ve olimpiyat matematik sorularını çok iyi biliyorsun.
Her zaman JSON formatında, Türkçe sorular üretirsin.
Soruların pedagojik değeri yüksek, düşündürücü ve BİLSEM öğrencileri için uygun olmasını sağlarsın.`;

    const prompt = `Aşağıdaki özelliklerde ${params.count} adet matematik sorusu üret:

Konu: ${params.topic}
${params.subTopic ? `Alt Konu: ${params.subTopic}` : ''}
Sınıf Seviyesi: ${params.gradeLevel}
Zorluk: ${params.difficulty}
Soru Tipi: ${params.type}
${params.additionalContext ? `Ek Bağlam: ${params.additionalContext}` : ''}

Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
[
  {
    "title": "Soru başlığı",
    "body": "Soru metni (tam ve net)",
    "options": null veya {"A": "...", "B": "...", "C": "...", "D": "..."} (çoktan seçmeli ise),
    "correctAnswer": "Doğru cevap veya D harfi",
    "solution": "Adım adım çözüm açıklaması",
    "topic": "${params.topic}",
    "gradeLevel": "${params.gradeLevel}",
    "difficulty": "${params.difficulty}",
    "type": "${params.type}",
    "tags": ["etiket1", "etiket2"],
    "duration": 180
  }
]`;

    const raw = await this.callClaude(prompt, systemPrompt);

    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch {
      return [];
    }
  }

  // ─── GERİ BİLDİRİM ÜRETİCİ ─────────────────────────────────────────

  async generateFeedback(params: {
    studentName: string;
    period: string;
    activities: string[];
    performance: number;
    strengths: string[];
    weaknesses: string[];
  }): Promise<{
    strengths: string;
    improvements: string;
    nextGoals: string;
    motivation: string;
  }> {
    const systemPrompt = `Sen BİLSEM matematik öğrencilerinin gelişimini destekleyen deneyimli bir matematik öğretmenisin.
Öğrencilere yapıcı, motive edici ve somut geri bildirimler yazarsın.
Her zaman Türkçe, sıcak ve profesyonel bir dil kullanırsın.
Yanıtını JSON formatında verirsin.`;

    const prompt = `Aşağıdaki öğrenci için dönemlik geri bildirim yaz:

Öğrenci: ${params.studentName}
Dönem: ${params.period}
Ortalama Performans: ${params.performance}/5
İşlenen Konular: ${params.activities.join(', ')}
Güçlü Yönler: ${params.strengths.join(', ')}
Gelişim Alanları: ${params.weaknesses.join(', ')}

JSON formatında yanıt ver:
{
  "strengths": "Güçlü yönler paragrafı (2-3 cümle)",
  "improvements": "Gelişim alanları paragrafı (2-3 cümle, yapıcı dil)",
  "nextGoals": "Sonraki hedefler paragrafı (2-3 madde)",
  "motivation": "Motivasyon mesajı (1-2 cümle, içten ve motive edici)"
}`;

    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return {
      strengths: 'Öğrenci etkinliklere aktif katılım sağlamıştır.',
      improvements: 'Problem çözme becerilerini geliştirmeye devam etmesi önerilmektedir.',
      nextGoals: 'Önümüzdeki dönemde analitik düşünme becerilerini geliştirmek hedeflenmektedir.',
      motivation: 'Harika ilerleme kaydediyorsunuz, bu başarı eğiliminizi sürdürün!',
    };
  }

  // ─── KONU PLANLAYICI ─────────────────────────────────────────────────

  async generateTopicPlan(params: {
    level: string;
    gradeLevel: string;
    weeklyHours: number;
    totalWeeks: number;
    groupDescription?: string;
    focusAreas?: string[];
  }): Promise<any[]> {
    const systemPrompt = `Sen BİLSEM matematik müfredatını ve kazanımlarını çok iyi bilen bir eğitim planlamacısısın.
Türkiye Milli Eğitim Bakanlığı matematik kazanımlarını ve BİLSEM üst düzey matematik etkinliklerini biliyorsun.
Her zaman JSON formatında, uygulanabilir haftalık planlar üretirsin.`;

    const prompt = `Aşağıdaki gruba uygun ${params.totalWeeks} haftalık matematik konu planı oluştur:

Kademe: ${params.level}
Sınıf Seviyesi: ${params.gradeLevel}
Haftalık Ders Saati: ${params.weeklyHours}
${params.groupDescription ? `Grup Profili: ${params.groupDescription}` : ''}
${params.focusAreas?.length ? `Öncelikli Alanlar: ${params.focusAreas.join(', ')}` : ''}

JSON formatında plan ver:
[
  {
    "week": 1,
    "topic": "Ana konu",
    "subTopics": ["Alt konu 1", "Alt konu 2"],
    "objectives": ["Kazanım 1", "Kazanım 2"],
    "suggestedActivities": ["Etkinlik önerisi 1", "Etkinlik önerisi 2"],
    "duration": ${params.weeklyHours * 60},
    "notes": "Öğretmen notu"
  }
]`;

    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }

  // ─── SORU ANALİZİ (OCR SONRASI) ──────────────────────────────────────

  async analyzeAndStructureQuestions(rawText: string): Promise<any[]> {
    const systemPrompt = `Sen matematik sorularını analiz eden ve yapılandıran bir uzmansın.
Verilen metinden soruları ayıklar, yapılandırır ve JSON formatına çevirirsin.`;

    const prompt = `Aşağıdaki metinden matematik sorularını ayıkla ve yapılandır:

${rawText}

Her soru için JSON formatında çıktı ver:
[
  {
    "title": "Soru özeti",
    "body": "Soru metni",
    "correctAnswer": "Cevap (varsa)",
    "solution": "Çözüm (varsa)",
    "topic": "Tahmini konu",
    "difficulty": "KOLAY|ORTA|ZOR",
    "type": "COGUL_SECMELI|ACIK_UCLU|PROBLEM_COZME"
  }
]`;

    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }

  // ─── ÖĞRENCI RAPORU ─────────────────────────────────────────────────

  async generateStudentReport(params: {
    studentName: string;
    period: string;
    activityCount: number;
    avgPerformance: number;
    topicsStudied: string[];
    examScores: number[];
    observations: string[];
  }): Promise<string> {
    const systemPrompt = `Sen BİLSEM öğrencileri için gelişim raporları yazan uzman bir matematikçi ve eğitimcisin.
Türkçe, akademik ama anlaşılır, kapsamlı raporlar yazarsın.`;

    const prompt = `Aşağıdaki öğrenci için dönemlik gelişim raporu yaz:

Öğrenci: ${params.studentName}
Dönem: ${params.period}
İşlenen Etkinlik Sayısı: ${params.activityCount}
Ortalama Performans: ${params.avgPerformance}/5
Çalışılan Konular: ${params.topicsStudied.join(', ')}
Sınav Puanları: ${params.examScores.join(', ')}
Gözlemler: ${params.observations.join('. ')}

Kapsamlı bir gelişim raporu yaz. Raporun şu bölümleri içermeli:
1. Genel Değerlendirme
2. Akademik Gelişim
3. Beceri Gelişimi  
4. Öneriler ve Hedefler

Profesyonel, yapıcı ve motive edici bir dil kullan.`;

    return this.callClaude(prompt, systemPrompt);
  }

  async extractActivitiesFromText(text: string, level: string): Promise<any[]> {
    const systemPrompt = "Sen BİLSEM matematik etkinlik kitaplarini analiz eden uzmansın. Verilen metinden etkinlikleri cikarir, yapılandırır ve JSON formatına cevirirsin. Her zaman Türkce yanıt verirsin.";
    const prompt = "Asagidaki BİLSEM matematik kitabi metninden etkinlikleri cikar:\n\n" + text.slice(0, 8000) + "\n\nHer etkinlik icin JSON formatinda yanit ver:[{title,description,topic,objectives,materials,duration,difficulty,skills,instructions,gradeRange}]";
    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }

}
