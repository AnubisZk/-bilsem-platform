import { PrismaClient, Level, Difficulty, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STUDENTS = [
  { name: 'Emir', surname: 'Yıldız', school: 'Cumhuriyet İlkokulu', grade: 5, level: 'ILKOGRETIM', mathLevel: 'İleri' },
  { name: 'Defne', surname: 'Arslan', school: 'Atatürk Ortaokulu', grade: 7, level: 'ILKOGRETIM', mathLevel: 'Üstün' },
  { name: 'Bora', surname: 'Kaya', school: 'Fatih İlkokulu', grade: 6, level: 'ILKOGRETIM', mathLevel: 'Gelişen' },
  { name: 'Zeynep', surname: 'Demir', school: 'Beşiktaş Ortaokulu', grade: 8, level: 'ILKOGRETIM', mathLevel: 'Üstün' },
  { name: 'Can', surname: 'Şahin', school: 'Çeşme İlkokulu', grade: 4, level: 'ILKOGRETIM', mathLevel: 'İleri' },
  { name: 'İrem', surname: 'Çelik', school: 'Altıeylül Ortaokulu', grade: 7, level: 'ILKOGRETIM', mathLevel: 'Gelişen' },
  { name: 'Arda', surname: 'Koç', school: 'İnönü Lisesi', grade: 9, level: 'LISE', mathLevel: 'İleri' },
  { name: 'Selin', surname: 'Yılmaz', school: 'Balıkesir Anadolu Lisesi', grade: 10, level: 'LISE', mathLevel: 'Üstün' },
  { name: 'Mert', surname: 'Öztürk', school: 'Fen Lisesi', grade: 11, level: 'LISE', mathLevel: 'Üstün' },
  { name: 'Elif', surname: 'Aydın', school: 'Süleyman Demirel Lisesi', grade: 9, level: 'LISE', mathLevel: 'Gelişen' },
  { name: 'Kaan', surname: 'Doğan', school: 'Cumhuriyet İlkokulu', grade: 5, level: 'ILKOGRETIM', mathLevel: 'İleri' },
  { name: 'Naz', surname: 'Polat', school: 'Fatih İlkokulu', grade: 6, level: 'ILKOGRETIM', mathLevel: 'Üstün' },
  { name: 'Deniz', surname: 'Acar', school: 'Atatürk Ortaokulu', grade: 8, level: 'ILKOGRETIM', mathLevel: 'Gelişen' },
  { name: 'Burak', surname: 'Tekin', school: 'Balıkesir Fen Lisesi', grade: 10, level: 'LISE', mathLevel: 'İleri' },
  { name: 'Ayşe', surname: 'Güneş', school: 'Altıeylül Ortaokulu', grade: 7, level: 'ILKOGRETIM', mathLevel: 'İleri' },
  { name: 'Oğuz', surname: 'Çetin', school: 'İnönü Lisesi', grade: 11, level: 'LISE', mathLevel: 'Üstün' },
  { name: 'Leyla', surname: 'Kurt', school: 'Atatürk İlkokulu', grade: 4, level: 'ILKOGRETIM', mathLevel: 'Gelişen' },
  { name: 'Tuna', surname: 'Başaran', school: 'Beşiktaş Ortaokulu', grade: 8, level: 'ILKOGRETIM', mathLevel: 'Üstün' },
  { name: 'Yağmur', surname: 'Erdoğan', school: 'Anadolu Lisesi', grade: 12, level: 'LISE', mathLevel: 'Üstün' },
  { name: 'Ali', surname: 'Sözer', school: 'Çeşme İlkokulu', grade: 6, level: 'ILKOGRETIM', mathLevel: 'İleri' },
];

async function main() {
  console.log('🌱 BİLSEM veritabanı seed başlıyor...');

  // Admin kullanıcı
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@bilsem.edu.tr' },
    update: {},
    create: {
      email: 'admin@bilsem.edu.tr',
      passwordHash: adminHash,
      name: 'Sistem Yöneticisi',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin kullanıcı oluşturuldu');

  // Öğretmen kullanıcı
  const teacherHash = await bcrypt.hash('bilsem2024', 12);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'ogretmen@bilsem.edu.tr' },
    update: {},
    create: {
      email: 'ogretmen@bilsem.edu.tr',
      passwordHash: teacherHash,
      name: 'Zafer Savaş Kıvılcım',
      role: 'TEACHER',
      teacher: {
        create: {
          institution: 'Altıeylül BİLSEM',
          title: 'Matematik Öğretmeni',
          expertise: ['Olimpiyat Matematiği', 'Üstün Zekalı Eğitimi', 'Sayı Teorisi'],
        },
      },
    },
    include: { teacher: true },
  });
  console.log('✅ Öğretmen kullanıcı oluşturuldu');

  // Öğrenciler
  const createdStudents: any[] = [];
  for (const s of STUDENTS) {
    const student = await prisma.student.upsert({
      where: { studentCode: `BILSEM-${s.name.toUpperCase()}-${s.grade}` },
      update: {},
      create: {
        studentCode: `BILSEM-${s.name.toUpperCase()}-${s.grade}`,
        name: s.name,
        surname: s.surname,
        school: s.school,
        grade: s.grade,
        level: s.level as Level,
        bilsemLevel: s.grade <= 4 ? 'Özel Yetenekli 1' : s.grade <= 6 ? 'Özel Yetenekli 2' : s.grade <= 8 ? 'Özel Yetenekli 3' : 'Lise',
        mathLevel: s.mathLevel,
        strengths: ['Analitik düşünme', 'Örüntü tanıma'],
        weaknesses: ['Sözel problem kurma'],
        interests: ['Matematik olimpiyatları', 'Bulmacalar'],
      },
    });
    createdStudents.push(student);
  }
  console.log(`✅ ${createdStudents.length} öğrenci oluşturuldu`);

  // Gruplar
  const groups = [
    { name: 'İlköğretim A Grubu', level: 'ILKOGRETIM' as Level, color: '#6366f1' },
    { name: 'Lise Analiz Grubu', level: 'LISE' as Level, color: '#f59e0b' },
    { name: 'Olimpiyat Hazırlık', level: 'LISE' as Level, color: '#ef4444' },
    { name: 'Destek Eğitim Grubu', level: 'ILKOGRETIM' as Level, color: '#10b981' },
  ];

  const createdGroups: any[] = [];
  for (const g of groups) {
    const group = await prisma.group.upsert({
      where: { id: `seed-group-${g.name}` },
      update: {},
      create: { id: `seed-group-${g.name}`, ...g, teacherId: teacherUser.teacher!.id },
    });
    createdGroups.push(group);
  }

  const ilkStudents = createdStudents.filter((s) => s.level === 'ILKOGRETIM');
  const liseStudents = createdStudents.filter((s) => s.level === 'LISE');

  for (const student of ilkStudents.slice(0, 8)) {
    await prisma.groupStudent.upsert({
      where: { groupId_studentId: { groupId: createdGroups[0].id, studentId: student.id } },
      update: {},
      create: { groupId: createdGroups[0].id, studentId: student.id },
    });
  }
  for (const student of liseStudents.slice(0, 5)) {
    await prisma.groupStudent.upsert({
      where: { groupId_studentId: { groupId: createdGroups[1].id, studentId: student.id } },
      update: {},
      create: { groupId: createdGroups[1].id, studentId: student.id },
    });
  }
  console.log('✅ Gruplar oluşturuldu');

  // Modüller
  const ilkModule = await prisma.module.upsert({
    where: { id: 'seed-module-ilkogretim' },
    update: {},
    create: {
      id: 'seed-module-ilkogretim',
      name: 'İlköğretim Matematik Etkinlikleri',
      description: 'BİLSEM İlköğretim matematik etkinlik kitabı modülü',
      level: 'ILKOGRETIM',
      order: 1,
    },
  });

  const liseModule = await prisma.module.upsert({
    where: { id: 'seed-module-lise' },
    update: {},
    create: {
      id: 'seed-module-lise',
      name: 'Lise Matematik Etkinlikleri',
      description: 'BİLSEM Lise matematik etkinlik kitabı modülü',
      level: 'LISE',
      order: 2,
    },
  });

  // Etkinlikler - ilköğretim
  const ilkActs = [
    { title: 'Sayı Örüntüleri Keşfi', topic: 'Sayı Örüntüleri', difficulty: 'ORTA' as Difficulty, duration: 45, skills: ['Örüntü Tanıma'], objectives: ['Sayı örüntülerini tanımlar'] },
    { title: 'Kesirlerle Pasta Oyunu', topic: 'Kesirler', difficulty: 'KOLAY' as Difficulty, duration: 40, skills: ['Görsel Düşünme'], objectives: ['Kesir kavramını somutlaştırır'] },
    { title: 'Alan ve Çevre Dedektifi', topic: 'Alan ve Çevre', difficulty: 'ORTA' as Difficulty, duration: 50, skills: ['Problem Çözme'], objectives: ['Alan ve çevre hesaplar'] },
    { title: 'Koordinat Sistemi Hazine Avı', topic: 'Koordinat Sistemi', difficulty: 'ORTA' as Difficulty, duration: 55, skills: ['Uzamsal Düşünme'], objectives: ['Koordinat sistemini kullanır'] },
    { title: 'Oran-Orantı Tarifleri', topic: 'Oran Orantı', difficulty: 'ORTA' as Difficulty, duration: 45, skills: ['Orantısal Düşünme'], objectives: ['Doğru orantı kurar'] },
    { title: 'Olasılık Zar Deneyleri', topic: 'Olasılık', difficulty: 'ZOR' as Difficulty, duration: 60, skills: ['İstatistiksel Düşünme'], objectives: ['Olasılık hesaplar'] },
    { title: 'Geometrik Şekiller Origami', topic: 'Geometri', difficulty: 'KOLAY' as Difficulty, duration: 40, skills: ['Uzamsal Düşünme'], objectives: ['Geometrik şekilleri tanır'] },
    { title: 'Çarpanlara Ayırma', topic: 'Çarpanlara Ayırma', difficulty: 'ZOR' as Difficulty, duration: 55, skills: ['Analitik Düşünme'], objectives: ['Asal çarpanlara ayırır'] },
    { title: 'Denklem Dengesi', topic: 'Denklemler', difficulty: 'ORTA' as Difficulty, duration: 45, skills: ['Sembolik Düşünme'], objectives: ['Denklemleri çözer'] },
    { title: 'Veri ve Grafik', topic: 'İstatistik', difficulty: 'KOLAY' as Difficulty, duration: 50, skills: ['Veri Okuryazarlığı'], objectives: ['Grafik çizer'] },
    { title: 'Mantık Zincirleri', topic: 'Mantık', difficulty: 'ZOR' as Difficulty, duration: 60, skills: ['Mantıksal Düşünme'], objectives: ['Çıkarım yapar'] },
    { title: 'Kesir İşlemleri', topic: 'Kesirler', difficulty: 'ZOR' as Difficulty, duration: 50, skills: ['Kesir İşlemleri'], objectives: ['Kesir çarpar ve böler'] },
    { title: 'Şekil Dönüşümleri', topic: 'Dönüşüm Geometrisi', difficulty: 'ORTA' as Difficulty, duration: 45, skills: ['Uzamsal Düşünme'], objectives: ['Yansıma yapar'] },
    { title: 'Tam Sayılar', topic: 'Tam Sayılar', difficulty: 'KOLAY' as Difficulty, duration: 40, skills: ['Soyut Düşünme'], objectives: ['Negatif sayıları anlar'] },
    { title: 'Çokgenlerin Sırrı', topic: 'Çokgenler', difficulty: 'ORTA' as Difficulty, duration: 55, skills: ['Geometri'], objectives: ['İç açılar toplamını hesaplar'] },
  ];

  for (const a of ilkActs) {
    await prisma.activity.create({
      data: {
        module: { connect: { id: ilkModule.id } },
        title: a.title,
        topic: a.topic,
        difficulty: a.difficulty,
        duration: a.duration,
        skills: a.skills,
        objectives: a.objectives,
        description: `${a.title} etkinliği - ${a.topic} konusunu keşfeder`,
        materials: ['Kağıt', 'Kalem', 'Cetvel'],
        gradeRange: '4-8',
        level: 'ILKOGRETIM',
        instructions: `1. Öğrencilere ${a.title} etkinliğini tanıtın.\n2. Materyalleri dağıtın.\n3. Grup çalışması yapın.\n4. Sonuçları paylaşın.`,
        teacherNotes: 'Öğrencilerin kendi çözüm yollarını keşfetmelerine izin verin.',
        isOfficial: true,
        sourceBook: 'İlköğretim Matematik Etkinlik Kitabı',
      },
    });
  }

  const liseActs = [
    { title: 'Türev Geometrik Yorum', topic: 'Türev', difficulty: 'ORTA' as Difficulty, duration: 60 },
    { title: 'İntegral Alan Hesabı', topic: 'İntegral', difficulty: 'ZOR' as Difficulty, duration: 75 },
    { title: 'Trigonometri Birim Çember', topic: 'Trigonometri', difficulty: 'ORTA' as Difficulty, duration: 55 },
    { title: 'Kompleks Sayılar', topic: 'Kompleks Sayılar', difficulty: 'ZOR' as Difficulty, duration: 65 },
    { title: 'Logaritma Uygulamaları', topic: 'Logaritma', difficulty: 'ORTA' as Difficulty, duration: 50 },
    { title: 'Vektörler ve Uzay', topic: 'Vektörler', difficulty: 'ZOR' as Difficulty, duration: 70 },
    { title: 'Olasılık ve Kombinatorik', topic: 'Kombinatorik', difficulty: 'ZOR' as Difficulty, duration: 65 },
    { title: 'Matris ve Determinant', topic: 'Matrisler', difficulty: 'ORTA' as Difficulty, duration: 60 },
    { title: 'Limit ve Süreklilik', topic: 'Limit', difficulty: 'ORTA' as Difficulty, duration: 60 },
    { title: 'Sayı Teorisi Olimpiyat', topic: 'Sayı Teorisi', difficulty: 'OLIMPIYAT' as Difficulty, duration: 90 },
    { title: 'Fonksiyon Dönüşümleri', topic: 'Fonksiyonlar', difficulty: 'ORTA' as Difficulty, duration: 55 },
    { title: 'Diziler ve Seriler', topic: 'Diziler', difficulty: 'ZOR' as Difficulty, duration: 65 },
    { title: 'Analitik Geometri', topic: 'Analitik Geometri', difficulty: 'ORTA' as Difficulty, duration: 60 },
    { title: 'Normal Dağılım', topic: 'İstatistik', difficulty: 'ORTA' as Difficulty, duration: 60 },
    { title: 'Eşitsizlikler', topic: 'Eşitsizlikler', difficulty: 'ZOR' as Difficulty, duration: 70 },
  ];

  for (const a of liseActs) {
    await prisma.activity.create({
      data: {
        module: { connect: { id: liseModule.id } },
        title: a.title,
        topic: a.topic,
        difficulty: a.difficulty,
        duration: a.duration,
        skills: ['Analitik Düşünme', 'Problem Çözme'],
        objectives: [`${a.topic} kavramını derinlemesine anlar`],
        description: `${a.title} etkinliği - ${a.topic} konusunu keşfeder`,
        materials: ['Defter', 'Kalem', 'Hesap Makinesi'],
        gradeRange: '9-12',
        level: 'LISE',
        instructions: `1. ${a.title} etkinliğini tanıtın.\n2. Ön bilgileri yoklayın.\n3. Keşif sürecini yönetin.`,
        teacherNotes: 'Soyutlamayı destekleyin.',
        isOfficial: true,
        sourceBook: 'Lise Matematik Etkinlik Kitabı',
      },
    });
  }
  console.log('✅ 30 etkinlik oluşturuldu');

  // Sorular
  const questions = [
    { title: 'Oran-Orantı', body: 'Bir pastacı 3 saatte 12 pasta yapıyor. 5 saatte kaç pasta yapar?', correctAnswer: '20', solution: '12/3=4, 4×5=20', topic: 'Oran Orantı', gradeLevel: '6-7', difficulty: 'KOLAY' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
    { title: 'Örüntü', body: '2, 5, 10, 17, 26, ... serisinin bir sonraki terimi?', correctAnswer: '37', solution: 'Farklar: 3,5,7,9,11 → 26+11=37', topic: 'Sayı Örüntüleri', gradeLevel: '5-6', difficulty: 'ORTA' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
    { title: 'Alan Problemi', body: '8m×6m bahçenin etrafına 1m yol yapılıyor. Yolun alanı?', correctAnswer: '32', solution: '(10×8)-(8×6)=80-48=32', topic: 'Alan ve Çevre', gradeLevel: '6-7', difficulty: 'ORTA' as Difficulty, type: 'PROBLEM_COZME' as QuestionType },
    { title: 'Olasılık', body: 'Torbada 3 kırmızı, 4 mavi, 5 yeşil top var. Kırmızı çekme olasılığı?', correctAnswer: '1/4', solution: 'P=3/12=1/4', topic: 'Olasılık', gradeLevel: '7-8', difficulty: 'KOLAY' as Difficulty, type: 'COGUL_SECMELI' as QuestionType },
    { title: 'Koordinat', body: 'A(2,3) ve B(6,7) orta noktası?', correctAnswer: '(4,5)', solution: '((2+6)/2,(3+7)/2)=(4,5)', topic: 'Koordinat Sistemi', gradeLevel: '6-7', difficulty: 'ORTA' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
    { title: 'Türev', body: 'f(x)=x³-3x²+2x fonksiyonunun x=1 türevi?', correctAnswer: '-1', solution: "f'(x)=3x²-6x+2 → f'(1)=-1", topic: 'Türev', gradeLevel: '11-12', difficulty: 'ORTA' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
    { title: 'İntegral', body: '∫(2x+3)dx = ?', correctAnswer: 'x²+3x+C', solution: 'x²+3x+C', topic: 'İntegral', gradeLevel: '11-12', difficulty: 'KOLAY' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
    { title: 'Trigonometri', body: 'sin²x + cos²x = ?', correctAnswer: '1', solution: 'Pisagor özdeşliği: 1', topic: 'Trigonometri', gradeLevel: '10-11', difficulty: 'KOLAY' as Difficulty, type: 'COGUL_SECMELI' as QuestionType },
    { title: 'Logaritma', body: 'log₂(x)+log₂(x-2)=3 çözümü?', correctAnswer: '4', solution: 'x(x-2)=8 → x=4', topic: 'Logaritma', gradeLevel: '11-12', difficulty: 'ZOR' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
    { title: 'Kombinatorik', body: '7 kişiden 3 kişilik komite kaç şekilde?', correctAnswer: '35', solution: 'C(7,3)=35', topic: 'Kombinatorik', gradeLevel: '11-12', difficulty: 'ORTA' as Difficulty, type: 'ACIK_UCLU' as QuestionType },
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await prisma.customQuestion.create({
      data: {
        ...q,
        teacherId: teacherUser.teacher!.id,
        tags: [q.topic, q.gradeLevel],
        isPublic: i % 2 === 0,
      },
    });
  }

  // 40 daha fazla soru
  for (let i = 0; i < 40; i++) {
    await prisma.customQuestion.create({
      data: {
        title: `Matematik Sorusu ${i + 11}`,
        body: `Bu, ${['Sayı teorisi', 'Geometri', 'Cebir', 'Analiz', 'Olasılık'][i % 5]} ile ilgili soru.`,
        correctAnswer: `${(i + 1) * 3}`,
        solution: `Çözüm: ${(i + 1) * 3}`,
        topic: ['Sayı Teorisi', 'Geometri', 'Cebir', 'Analiz', 'Olasılık'][i % 5],
        gradeLevel: ['4-5', '5-6', '6-7', '7-8', '9-10', '10-11', '11-12'][i % 7],
        difficulty: ['KOLAY', 'ORTA', 'ZOR', 'OLIMPIYAT'][i % 4] as Difficulty,
        type: ['ACIK_UCLU', 'COGUL_SECMELI', 'PROBLEM_COZME'][i % 3] as QuestionType,
        teacherId: teacherUser.teacher!.id,
        tags: ['matematik'],
        isPublic: i % 3 === 0,
      },
    });
  }
  console.log('✅ 50 soru oluşturuldu');

  console.log('\n🎉 Seed tamamlandı!');
  console.log('📧 Öğretmen: ogretmen@bilsem.edu.tr / bilsem2024');
  console.log('📧 Admin: admin@bilsem.edu.tr / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
