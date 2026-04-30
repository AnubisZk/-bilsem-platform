import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ── MEB Matematik Müfredatı (5-12. Sınıf) ────────────────────────────────────
const MEB_CURRICULUM: Record<number, string[]> = {
  5:  ['Doğal Sayılar','Kesirler','Ondalık Gösterim','Yüzdeler','Tam Sayılar','Oran ve Orantı','Cebirsel Düşünce','Geometri: Çokgenler','Çevre ve Alan','Veri Analizi'],
  6:  ['Doğal Sayılar ve Tam Sayılar','Kümeler','Kesirler ve Ondalık Sayılar','Oran-Orantı','Cebirsel İfadeler','Denklemler','Geometrik Cisimler','Alan ve Çevre','Olasılığa Giriş','İstatistik'],
  7:  ['Tam Sayılar','Rasyonel Sayılar','Oran-Orantı ve Yüzdeler','Cebir: Denklemler','Doğrusal Denklemler','Çokgenler','Çember ve Daire','Alan Hesaplamaları','Veri Analizi','Olasılık'],
  8:  ['Çarpanlara Ayırma','Üslü İfadeler','Kareköklü İfadeler','Doğrusal Denklemler','Doğrusal Eşitsizlikler','Dönüşüm Geometrisi','Üçgenler','Pisagor Teoremi','Eşlik ve Benzerlik','İstatistik ve Olasılık'],
  9:  ['Kümeler','Mantık','Sayı Kümeleri','Üslü ve Köklü İfadeler','Polinomlar','Denklemler ve Eşitsizlikler','Mutlak Değer','Fonksiyonlar','Trigonometri Temelleri','Analitik Geometri: Nokta ve Doğru'],
  10: ['İkinci Dereceden Denklemler','Karmaşık Sayılar','Fonksiyonlar','Polinomlar','Trigonometri','Logaritma','Diziler','Analitik Geometri: Çember','Olasılık','İstatistik'],
  11: ['Trigonometri: Sinüs-Kosinüs','Üstel ve Logaritmik Fonksiyonlar','Diziler: Aritmetik-Geometrik','Limit ve Süreklilik','Türev','Türevin Uygulamaları','İntegral Temelleri','Olasılık ve Binom','Analitik Geometri: Konik Kesitler','Kombinatorik'],
  12: ['İntegral ve Uygulamaları','Türevin İleri Uygulamaları','Diziler ve Seriler','Olasılık','İstatistik','Analitik Geometri','Karmaşık Sayılar','Sayı Teorisi','Kombinatorik','TYT-AYT Hazırlık'],
};

const BILSEM_LEVELS: Record<string, string> = {
  'Özel Yetenekli 1': '4-5. sınıf düzeyinde özel yetenekli, üst düzey problem çözme, olimpiyat temelleri',
  'Özel Yetenekli 2': '6-7. sınıf düzeyinde özel yetenekli, ileri düzey akıl yürütme, yarışma problemleri',
  'Özel Yetenekli 3': '8. sınıf ve üzeri özel yetenekli, olimpiyat hazırlık, AMC/IMO seviyesi düşünme',
  'Lise': 'Lise düzeyinde özel yetenekli, ileri matematik, üniversite hazırlık',
};

@Injectable()
export class AiService {
  private apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('ANTHROPIC_API_KEY') || '';
  }

  // ── Temel Claude çağrısı ───────────────────────────────────────────────────
  private async callClaude(
    prompt: string,
    systemPrompt: string,
    maxTokens = 4096,
  ): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data: any = await response.json();
    return data.content?.[0]?.text || '';
  }

  // ── Müfredat bilgisi döndür ────────────────────────────────────────────────
  private getCurriculumContext(grade: number, bilsemLevel?: string): string {
    const gradeTopics = MEB_CURRICULUM[grade] || MEB_CURRICULUM[5];
    const bilsemDesc = bilsemLevel ? BILSEM_LEVELS[bilsemLevel] || '' : '';

    return `
MEB ${grade}. Sınıf Matematik Müfredatı Konuları: ${gradeTopics.join(', ')}.
${bilsemDesc ? `Öğrenci Profili (BİLSEM): ${bilsemDesc}` : ''}
Türk Milli Eğitim Bakanlığı 2024-2025 öğretim programına göre değerlendirme yap.
    `.trim();
  }

  // ── 1. Kaynaktan Çalışma Planı Oluştur ────────────────────────────────────
  async generateResourcePlan(
    text: string,
    student: {
      studentName: string;
      mathLevel: string;
      level: string;
      grade?: number;
      bilsemLevel?: string;
      context?: string;
    },
  ): Promise<any> {
    const grade = student.grade || 5;
    const curriculumCtx = this.getCurriculumContext(grade, student.bilsemLevel);

    const contextLabel =
      student.context === 'BILSEM'
        ? 'BİLSEM etkinliği / özel yetenekli öğrenci programı'
        : student.context === 'OKUL'
        ? 'Okul dersi / MEB sınıf kazanımı'
        : student.context === 'OZEL_DERS'
        ? 'Özel ders / bireysel eksik tamamlama'
        : 'Matematik çalışma programı';

    const safeText = (text || '').slice(0, 9000);

    const sys = `Sen Türkiye'de çalışan deneyimli bir matematik öğretmeni, BİLSEM danışmanı ve ölçme-değerlendirme uzmanısın.

${curriculumCtx}

Görevin:
- Yüklenen kaynağı gerçek bir öğretmen gibi incelemek,
- Kaynağın hangi konuları içerdiğini belirlemek,
- Öğrencinin sınıfına ve seviyesine göre uygulanabilir çalışma planı oluşturmak,
- Gereksiz genel ifadeler yerine somut konu, alt konu, süre, soru sayısı ve öğretmen notu üretmek.

Çok önemli kurallar:
1. Yanıt yalnızca geçerli JSON object olmalı.
2. Markdown, açıklama, kod bloğu, yorum veya ek metin yazma.
3. Kaynak yetersizse bunu summary içinde açıkça belirt ama yine de uygulanabilir plan üret.
4. Konuları MEB müfredatıyla ilişkilendir.
5. BİLSEM bağlamında üst düzey düşünme, problem çözme ve akıl yürütme etkinlikleri ekle.
6. Zorluk değeri yalnızca KOLAY, ORTA veya ZOR olabilir.`;

    const prompt = `Aşağıdaki matematik kaynağını analiz et ve öğrenciye özel çalışma planı oluştur.

ÖĞRENCİ BİLGİLERİ:
- Öğrenci: ${student.studentName}
- Sınıf: ${grade}. sınıf
- Matematik seviyesi: ${student.mathLevel}
- Öğrenci düzeyi/programı: ${student.level}
- Bağlam: ${contextLabel}

KAYNAK METNİ:
${safeText}

Planı oluştururken özellikle şunları yap:
- Kaynaktaki ana matematik konularını tespit et.
- Konuları ${grade}. sınıf MEB matematik müfredatıyla eşleştir.
- Kaynakta sınıf düzeyinin üstünde veya altında kalan içerik varsa belirt.
- Öğrencinin eksiklerini tamamlayacak sıraya göre plan maddeleri oluştur.
- Her madde için net süre, soru sayısı, hedef, ön koşul ve öğretmen notu yaz.
- Eğer kaynak olimpiyat/BİLSEM tarzıysa rutin işlem yerine akıl yürütme hedefi ekle.
- Plan toplamda gerçekçi olsun; aynı başlığı gereksiz tekrar etme.

SADECE ŞU JSON ŞEMASINA UYGUN CEVAP VER:
{
  "title": "Kısa ve profesyonel plan başlığı",
  "summary": "Kaynağın içeriği, öğrenci düzeyiyle ilişkisi ve genel çalışma önerisi",
  "sourceType": "PDF|DOCX|DERS_NOTU|SORU_BANKASI|DENEME|ETKINLIK|DIGER",
  "gradeLevel": ${grade},
  "context": "${contextLabel}",
  "detectedTopics": ["Kaynakta tespit edilen konu 1", "Konu 2"],
  "curriculumMatch": "MEB müfredatıyla uyum değerlendirmesi",
  "levelWarning": "Düzeye göre kolay/zor/uygun içerik uyarısı",
  "totalQuestions": 40,
  "estimatedWeeks": 4,
  "teacherOverview": "Öğretmen için kısa genel değerlendirme",
  "items": [
    {
      "topic": "Ana konu",
      "subtopic": "Alt konu",
      "curriculumCode": "Varsa kazanım/kod, yoksa kısa müfredat ilişkisi",
      "description": "Bu bölümde öğrencinin ne çalışacağı",
      "questionCount": 10,
      "duration": 45,
      "difficulty": "KOLAY|ORTA|ZOR",
      "teacherNote": "Öğretmenin uygulamada dikkat edeceği nokta",
      "goal": "Öğrencinin bu bölüm sonunda kazanacağı beceri",
      "prerequisites": "Ön koşul bilgi veya önce tekrar edilmesi gereken konu",
      "aiSuggestion": "Ek etkinlik, mini görev veya BİLSEM tipi zenginleştirme önerisi"
    }
  ]
}`;

    const raw = await this.callClaude(prompt, sys, 4096);

    try {
      const cleaned = raw
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start !== -1 && end !== -1 && end > start) {
        const jsonText = cleaned.slice(start, end + 1);
        return JSON.parse(jsonText);
      }
    } catch (e) {
      console.error('AI plan JSON parse hatası:', e);
      console.error('Claude raw response:', raw);
    }

    return {
      title: 'Çalışma Planı',
      summary: 'Kaynak analiz edildi ancak AI çıktısı JSON formatına tam dönüştürülemedi.',
      sourceType: 'DIGER',
      gradeLevel: grade,
      context: contextLabel,
      detectedTopics: [],
      curriculumMatch: '',
      levelWarning: '',
      totalQuestions: 0,
      estimatedWeeks: 0,
      teacherOverview: '',
      items: [],
    };
  }

  // ── 2. Kaynaktan Soru Üret ────────────────────────────────────────────────
  async generateQuestionsFromResource(params: {
    resourceText: string;
    topic: string;
    grade: number;
    count: number;
    difficulty: 'KOLAY' | 'ORTA' | 'ZOR' | 'KARISIK';
    questionType: 'COKTAN_SECMELI' | 'ACIK_UCLU' | 'KARMA';
    bilsemLevel?: string;
    context?: string;
  }): Promise<any[]> {
    const curriculumCtx = this.getCurriculumContext(params.grade, params.bilsemLevel);

    const sys = `Sen ${params.grade}. sınıf matematik sorularını MEB müfredatına uygun hazırlayan uzman bir matematik öğretmenisin.
${curriculumCtx}
Soruları öğrencinin sınıf düzeyine uygun, anlaşılır Türkçe ile yaz.
SADECE JSON dizisi formatında yanıt ver.`;

    const typeDesc = params.questionType === 'COKTAN_SECMELI'
      ? '4 şıklı çoktan seçmeli (A, B, C, D)'
      : params.questionType === 'ACIK_UCLU'
      ? 'açık uçlu, çözüm adımları gerektiren'
      : 'karışık tip (hem çoktan seçmeli hem açık uçlu)';

    const prompt = `Aşağıdaki kaynak metninden "${params.topic}" konusunda ${params.count} adet ${params.difficulty} zorlukta ${typeDesc} soru üret.

KAYNAK:
${params.resourceText.slice(0, 4000)}

${params.grade}. sınıf düzeyine uygun, MEB müfredatıyla örtüşen sorular üret.
${params.bilsemLevel ? `BİLSEM ${params.bilsemLevel} seviyesine göre ayarla.` : ''}

SADECE JSON dizisi:
[
  {
    "title": "Soru başlığı",
    "body": "Soru metni (varsa şıklar dahil)",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."} veya null,
    "correctAnswer": "A veya tam cevap",
    "solution": "Adım adım çözüm",
    "topic": "${params.topic}",
    "subtopic": "Alt konu",
    "gradeLevel": "${params.grade}",
    "difficulty": "${params.difficulty}",
    "type": "${params.questionType}",
    "curriculumLink": "MEB kazanım",
    "tags": ["etiket1"],
    "duration": 120,
    "hints": ["ipucu1", "ipucu2"]
  }
]`;

    const raw = await this.callClaude(prompt, sys, 4096);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  // ── 3. Haftalık Çalışma Planı ─────────────────────────────────────────────
  async generateWeeklyStudyPlan(params: {
    studentName: string;
    grade: number;
    mathLevel: string;
    bilsemLevel?: string;
    weakTopics: string[];
    strongTopics: string[];
    weeklyHours: number;
    context: string;
    weeks: number;
  }): Promise<any> {
    const curriculumCtx = this.getCurriculumContext(params.grade, params.bilsemLevel);

    const sys = `Sen ${params.grade}. sınıf MEB matematik müfredatına hakim, kişiselleştirilmiş çalışma planları hazırlayan deneyimli bir matematik öğretmenisin.
${curriculumCtx}
SADECE JSON formatında yanıt verirsin.`;

    const prompt = `${params.studentName} için ${params.weeks} haftalık çalışma planı hazırla.

ÖĞRENCİ PROFİLİ:
- Sınıf: ${params.grade}. Sınıf
- Matematik Seviyesi: ${params.mathLevel}
- Program: ${params.context}
${params.bilsemLevel ? `- BİLSEM Kademesi: ${params.bilsemLevel}` : ''}
- Haftalık Çalışma Süresi: ${params.weeklyHours} saat
- Zayıf Konular: ${params.weakTopics.join(', ') || 'Belirtilmemiş'}
- Güçlü Konular: ${params.strongTopics.join(', ') || 'Belirtilmemiş'}

MEB ${params.grade}. Sınıf müfredatına göre öncelikli konuları belirle.
Zayıf konulara daha fazla ağırlık ver.

SADECE JSON:
{
  "title": "Plan başlığı",
  "studentName": "${params.studentName}",
  "grade": ${params.grade},
  "totalWeeks": ${params.weeks},
  "weeklyHours": ${params.weeklyHours},
  "overview": "Planın genel açıklaması",
  "weeks": [
    {
      "week": 1,
      "theme": "Haftanın ana teması",
      "topics": ["Konu 1", "Konu 2"],
      "dailyPlan": {
        "Pazartesi": {"topic": "Konu", "duration": 60, "activity": "Ne yapılacak", "resources": "Kaynak"},
        "Salı":      {"topic": "Konu", "duration": 60, "activity": "Ne yapılacak", "resources": "Kaynak"},
        "Çarşamba":  {"topic": "Konu", "duration": 60, "activity": "Ne yapılacak", "resources": "Kaynak"},
        "Perşembe":  {"topic": "Konu", "duration": 60, "activity": "Ne yapılacak", "resources": "Kaynak"},
        "Cuma":      {"topic": "Konu", "duration": 60, "activity": "Ne yapılacak", "resources": "Kaynak"},
        "Cumartesi": {"topic": "Tekrar", "duration": 90, "activity": "Haftanın tekrarı", "resources": ""},
        "Pazar":     {"topic": "Dinlenme", "duration": 0, "activity": "Dinlenme günü", "resources": ""}
      },
      "weeklyGoal": "Bu hafta hedefi",
      "questionTarget": 30,
      "curriculumTopics": ["MEB kazanım 1"]
    }
  ],
  "motivationalMessage": "Öğrenciye motivasyon mesajı"
}`;

    const raw = await this.callClaude(prompt, sys, 4096);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return { title: 'Çalışma Planı', weeks: [] };
  }

  // ── 4. Soru Üret (Genel) ──────────────────────────────────────────────────
  async generateQuestions(params: any): Promise<any[]> {
    const grade = parseInt(params.gradeLevel) || 5;
    const curriculumCtx = this.getCurriculumContext(grade);

    const sys = `Sen ${grade}. sınıf MEB matematik müfredatına göre soru hazırlayan uzman öğretmenisin.
${curriculumCtx}
JSON formatında Türkçe sorular üretirsin. SADECE JSON dizisi ver.`;

    const prompt = `${params.count} adet "${params.topic}" konusunda ${params.difficulty} seviyede soru üret.
${grade}. sınıf MEB müfredatına uygun olsun.

SADECE JSON:
[{"title":"","body":"","options":null,"correctAnswer":"","solution":"","topic":"${params.topic}","gradeLevel":"${params.gradeLevel}","difficulty":"${params.difficulty}","type":"${params.type}","curriculumLink":"","tags":[],"duration":180,"hints":[]}]`;

    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  // ── 5. Geri Bildirim Üret ─────────────────────────────────────────────────
  async generateFeedback(params: any): Promise<any> {
    const sys = 'Sen BİLSEM matematik öğrencilerinin gelişimini destekleyen deneyimli bir matematik öğretmenisin. JSON formatında yanıt verirsin.';
    const prompt = `Öğrenci: ${params.studentName}, Dönem: ${params.period}, Performans: ${params.performance}/5.
JSON: {"strengths":"","improvements":"","nextGoals":"","motivation":""}`;
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return { strengths: 'İyi çalışıyor.', improvements: 'Geliştirilmeli.', nextGoals: 'Hedefler.', motivation: 'Başarılı olacaksın!' };
  }

  // ── 6. Konu Planı Üret ────────────────────────────────────────────────────
  async generateTopicPlan(params: any): Promise<any[]> {
    const sys = 'Sen BİLSEM matematik müfredatını bilen bir eğitim planlamacısısın. JSON formatında haftalık planlar üretirsin.';
    const prompt = `${params.totalWeeks} haftalık ${params.level} matematik planı üret.
SADECE JSON dizisi: [{"week":1,"topic":"","subTopics":[],"objectives":[],"suggestedActivities":[],"duration":${params.weeklyHours * 60},"notes":""}]`;
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  // ── 7. Öğrenci Raporu ─────────────────────────────────────────────────────
  async generateStudentReport(params: any): Promise<string> {
    const sys = 'Sen BİLSEM öğrencileri için gelişim raporları yazan uzman bir matematikçi ve eğitimcisin. Türkçe akademik raporlar yazarsın.';
    const prompt = `Öğrenci: ${params.studentName}, Dönem: ${params.period}, Etkinlik: ${params.activityCount}, Performans: ${params.avgPerformance}/5, Konular: ${params.topicsStudied.join(', ')}. Kapsamlı gelişim raporu yaz.`;
    return this.callClaude(prompt, sys);
  }

  // ── 8. Etkinlik Çıkar ────────────────────────────────────────────────────
  async extractActivitiesFromText(text: string, level: string): Promise<any[]> {
    const sys = 'Sen BİLSEM matematik etkinlik kitaplarını analiz eden uzmansın. Verilen metinden etkinlikleri çıkarır ve JSON formatına çevirirsin.';
    const prompt = `Şu metinden etkinlikleri çıkar: ${text.slice(0, 8000)}.
JSON: [{"title":"","description":"","topic":"","objectives":[],"materials":[],"duration":45,"difficulty":"ORTA","skills":[],"instructions":"","gradeRange":"5-8"}]`;
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  // ── 9. İlerleme Analizi ───────────────────────────────────────────────────
  async analyzeStudentProgress(data: { topics: any[]; studentName: string }): Promise<string> {
    const sys = 'Sen BİLSEM öğrenci performans analisti olarak kısa Türkçe yorumlar yazarsın.';
    const weakTopics   = data.topics.filter((t: any) => t.successRate < 60).map((t: any) => t.topic).join(', ');
    const strongTopics = data.topics.filter((t: any) => t.successRate >= 80).map((t: any) => t.topic).join(', ');
    const prompt = `${data.studentName} için analiz yaz. Güçlü: ${strongTopics || 'yok'}. Zayıf: ${weakTopics || 'yok'}. 3-4 cümle yorum yaz.`;
    return this.callClaude(prompt, sys);
  }

  // ── 10. Soru Yapılandır ───────────────────────────────────────────────────
  async analyzeAndStructureQuestions(text: string): Promise<any[]> {
    const sys = 'Sen matematik sorularını analiz eden ve yapılandıran bir uzmansın.';
    const prompt = `Şu metinden matematik sorularını ayıkla: ${text}.
JSON: [{"title":"","body":"","correctAnswer":"","solution":"","topic":"","difficulty":"ORTA","type":"ACIK_UCLU"}]`;
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  // ── Müfredat Bilgisi (API endpoint için) ─────────────────────────────────
  getCurriculumTopics(grade: number): string[] {
    return MEB_CURRICULUM[grade] || [];
  }

  getAllGrades(): number[] {
    return Object.keys(MEB_CURRICULUM).map(Number);
  }
}
