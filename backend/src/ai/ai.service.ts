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
    const systemPrompt = 'Sen BILSEM matematik ogretmenlerine yardim eden uzman bir matematik egitimcisisin. Her zaman JSON formatinda, Turkce sorular uretirsin.';
    const prompt = params.count + ' adet ' + params.topic + ' konusunda ' + params.difficulty + ' seviyede soru uret. Yaniti SADECE JSON dizisi olarak ver: [{"title":"","body":"","options":null,"correctAnswer":"","solution":"","topic":"' + params.topic + '","gradeLevel":"' + params.gradeLevel + '","difficulty":"' + params.difficulty + '","type":"' + params.type + '","tags":[],"duration":180}]';
    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }

  async generateFeedback(params: any): Promise<any> {
    const systemPrompt = 'Sen BILSEM matematik ogrencilerinin gelisimini destekleyen deneyimli bir matematik ogretmenisin. Yapici, motive edici geri bildirimler yazarsin. Yaniti JSON formatinda verirsin.';
    const prompt = 'Ogrenci: ' + params.studentName + ', Donem: ' + params.period + ', Performans: ' + params.performance + '/5. JSON formatinda yanit ver: {"strengths":"","improvements":"","nextGoals":"","motivation":""}';
    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return { strengths: 'Iyi calisiyor.', improvements: 'Gelistirilmeli.', nextGoals: 'Hedefler belirlendi.', motivation: 'Basarili olacaksiniz!' };
  }

  async generateTopicPlan(params: any): Promise<any[]> {
    const systemPrompt = 'Sen BILSEM matematik mufredatini bilen bir egitim planlamacisisin. JSON formatinda haftalik planlar uretirsin.';
    const prompt = params.totalWeeks + ' haftalik ' + params.level + ' matematik plani uret. Yaniti SADECE JSON dizisi olarak ver: [{"week":1,"topic":"","subTopics":[],"objectives":[],"suggestedActivities":[],"duration":' + (params.weeklyHours * 60) + ',"notes":""}]';
    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }

  async analyzeAndStructureQuestions(rawText: string): Promise<any[]> {
    const systemPrompt = 'Sen matematik sorularini analiz eden ve yapilandiran bir uzmansın.';
    const prompt = 'Su metinden matematik sorularini ayikla: ' + rawText + '. JSON formatinda ver: [{"title":"","body":"","correctAnswer":"","solution":"","topic":"","difficulty":"ORTA","type":"ACIK_UCLU"}]';
    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }

  async generateStudentReport(params: any): Promise<string> {
    const systemPrompt = 'Sen BILSEM ogrencileri icin gelisim raporlari yazan uzman bir matematikci ve egitimcisin. Turkce, akademik ama anlasilir raporlar yazarsin.';
    const prompt = 'Ogrenci: ' + params.studentName + ', Donem: ' + params.period + ', Etkinlik: ' + params.activityCount + ', Performans: ' + params.avgPerformance + '/5, Konular: ' + params.topicsStudied.join(', ') + '. Kapsamli bir gelisim raporu yaz.';
    return this.callClaude(prompt, systemPrompt);
  }

  async extractActivitiesFromText(text: string, level: string): Promise<any[]> {
    const systemPrompt = 'Sen BILSEM matematik etkinlik kitaplarini analiz eden uzmansın. Verilen metinden etkinlikleri cikarir ve JSON formatina cevirirsin.';
    const prompt = 'Su metinden etkinlikleri cikar: ' + text.slice(0, 8000) + '. JSON formatinda ver: [{"title":"","description":"","topic":"","objectives":[],"materials":[],"duration":45,"difficulty":"ORTA","skills":[],"instructions":"","gradeRange":"5-8"}]';
    const raw = await this.callClaude(prompt, systemPrompt);
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return [];
  }
}
