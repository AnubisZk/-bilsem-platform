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
      },
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

  async generateQuestions(params: any): Promise<any[]> {
    const sys = 'Sen BILSEM matematik ogretmenlerine yardim eden uzman bir matematik egitimcisisin. JSON formatinda Turkce sorular uretirsin.';
    const prompt = params.count + ' adet ' + params.topic + ' konusunda ' + params.difficulty + ' seviyede soru uret. SADECE JSON dizisi ver: [{"title":"","body":"","options":null,"correctAnswer":"","solution":"","topic":"' + params.topic + '","gradeLevel":"' + params.gradeLevel + '","difficulty":"' + params.difficulty + '","type":"' + params.type + '","tags":[],"duration":180}]';
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  async generateFeedback(params: any): Promise<any> {
    const sys = 'Sen BILSEM matematik ogrencilerinin gelisimini destekleyen deneyimli bir matematik ogretmenisin. JSON formatinda yanit verirsin.';
    const prompt = 'Ogrenci: ' + params.studentName + ', Donem: ' + params.period + ', Performans: ' + params.performance + '/5. JSON: {"strengths":"","improvements":"","nextGoals":"","motivation":""}';
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return { strengths: 'Iyi calisiyor.', improvements: 'Gelistirilmeli.', nextGoals: 'Hedefler.', motivation: 'Basarili olacaksiniz!' };
  }

  async generateTopicPlan(params: any): Promise<any[]> {
    const sys = 'Sen BILSEM matematik mufredatini bilen bir egitim planlamacisisin. JSON formatinda haftalik planlar uretirsin.';
    const prompt = params.totalWeeks + ' haftalik ' + params.level + ' matematik plani uret. SADECE JSON dizisi: [{"week":1,"topic":"","subTopics":[],"objectives":[],"suggestedActivities":[],"duration":' + (params.weeklyHours * 60) + ',"notes":""}]';
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  async generateStudentReport(params: any): Promise<string> {
    const sys = 'Sen BILSEM ogrencileri icin gelisim raporlari yazan uzman bir matematikci ve egitimcisin. Turkce akademik raporlar yazarsin.';
    const prompt = 'Ogrenci: ' + params.studentName + ', Donem: ' + params.period + ', Etkinlik: ' + params.activityCount + ', Performans: ' + params.avgPerformance + '/5, Konular: ' + params.topicsStudied.join(', ') + '. Kapsamli gelisim raporu yaz.';
    return this.callClaude(prompt, sys);
  }

  async extractActivitiesFromText(text: string, level: string): Promise<any[]> {
    const sys = 'Sen BILSEM matematik etkinlik kitaplarini analiz eden uzmansın. Verilen metinden etkinlikleri cikarir ve JSON formatina cevirirsin.';
    const prompt = 'Su metinden etkinlikleri cikar: ' + text.slice(0, 8000) + '. JSON formatinda ver: [{"title":"","description":"","topic":"","objectives":[],"materials":[],"duration":45,"difficulty":"ORTA","skills":[],"instructions":"","gradeRange":"5-8"}]';
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }

  async generateResourcePlan(text: string, student: { studentName: string; mathLevel: string; level: any }): Promise<any> {
    const sys = 'Sen BİLSEM matematik kaynakları analiz eden ve öğrenciye özel çalışma planı oluşturan uzmansın. Türkçe JSON formatında yanıt verirsin.';
    const prompt = 'Su kaynak metnini analiz et ve ' + student.studentName + ' icin (Seviye: ' + student.mathLevel + ') calisma plani olustur.\n\n' + text.slice(0, 6000) + '\n\nSADECE JSON: {"title":"Plan","summary":"ozet","totalQuestions":50,"items":[{"topic":"konu","subtopic":"alt","description":"aciklama","questionCount":10,"duration":30,"teacherNote":"not","goal":"hedef"}]}';
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return { title: 'Calisma Plani', summary: '', totalQuestions: 0, items: [] };
  }

  async analyzeStudentProgress(data: { topics: any[]; studentName: string }): Promise<string> {
    const sys = 'Sen BILSEM ogrenci performans analisti olarak kisa Turkce yorumlar yazarsin.';
    const weakTopics = data.topics.filter((t: any) => t.successRate < 60).map((t: any) => t.topic).join(', ');
    const strongTopics = data.topics.filter((t: any) => t.successRate >= 80).map((t: any) => t.topic).join(', ');
    const prompt = data.studentName + ' icin analiz yaz. Guclu: ' + (strongTopics || 'yok') + '. Zayif: ' + (weakTopics || 'yok') + '. 3-4 cumle yorum yaz.';
    return this.callClaude(prompt, sys);
  }

  async analyzeAndStructureQuestions(text: string): Promise<any[]> {
    const sys = 'Sen matematik sorularini analiz eden ve yapilandiran bir uzmansın.';
    const prompt = 'Su metinden matematik sorularini ayikla: ' + text + '. JSON: [{"title":"","body":"","correctAnswer":"","solution":"","topic":"","difficulty":"ORTA","type":"ACIK_UCLU"}]';
    const raw = await this.callClaude(prompt, sys);
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    return [];
  }


  

}
