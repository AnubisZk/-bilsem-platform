import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ── Admin / Öğretmen Girişi ──────────────────────────────────────────────
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { teacher: true, student: true, parent: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        teacher: user.teacher,
        student: user.student,
      },
    };
  }

  // ── Öğrenci Self-Signup ──────────────────────────────────────────────────
  async studentSignup(data: {
    name: string;
    surname: string;
    email: string;
    password: string;
    school: string;
    grade: number;
    level: 'ILKOGRETIM' | 'LISE';
    bilsemLevel?: string;
    context?: string;
    parentEmail?: string;
    notes?: string;
  }) {
    const email = data.email.toLowerCase().trim();

    // E-posta zaten kayıtlı mı?
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Bu e-posta adresi zaten kayıtlı');
    }

    if (data.password.length < 8) {
      throw new BadRequestException('Şifre en az 8 karakter olmalı');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const studentCode  = `STU-${Date.now().toString(36).toUpperCase()}`;

    // Transaction: Student + User birlikte oluştur
    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          studentCode,
          name:           data.name.trim(),
          surname:        data.surname.trim(),
          school:         data.school.trim(),
          grade:          data.grade,
          level:          data.level,
          bilsemLevel:    data.bilsemLevel || 'Özel Yetenekli 1',
          mathLevel:      'Gelişen',
          strengths:      [],
          weaknesses:     [],
          interests:      [],
          selfRegistered: true,
          registeredAt:   new Date(),
          parentEmail:    data.parentEmail || null,
          registerNotes:  data.notes       || null,
          isActive:       false, // Admin onaylayana kadar pasif
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name:     `${data.name.trim()} ${data.surname.trim()}`,
          role:     'STUDENT',
          isActive: false, // Admin onaylayana kadar pasif
          student:  { connect: { id: student.id } },
        },
      });

      return { student, user };
    });

    return {
      message:   'Kaydınız alındı! Öğretmeniniz onayladıktan sonra giriş yapabilirsiniz.',
      studentId: result.student.id,
      email:     result.user.email,
    };
  }

  // ── Bekleyen Kayıtları Listele ───────────────────────────────────────────
  async getPendingStudents() {
    return this.prisma.student.findMany({
      where:   { selfRegistered: true, isActive: false },
      include: { user: true },
      orderBy: { registeredAt: 'desc' },
    });
  }

  // ── Öğrenci Kaydını Onayla ───────────────────────────────────────────────
  async approveStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where:   { id: studentId },
      include: { user: true },
    });

    if (!student) throw new NotFoundException('Öğrenci bulunamadı');

    const ops: any[] = [
      this.prisma.student.update({
        where: { id: studentId },
        data:  { isActive: true },
      }),
    ];

    if (student.user) {
      ops.push(
        this.prisma.user.update({
          where: { id: student.user.id },
          data:  { isActive: true },
        }),
      );
    }

    await this.prisma.$transaction(ops);
    return { message: 'Öğrenci hesabı onaylandı', studentId };
  }

  // ── Öğrenci Portal Girişi ────────────────────────────────────────────────
  async studentLogin(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { student: { id: identifier } },
        ],
        isActive: true,
      },
      include: { student: true },
    });

    if (!user || !user.student) {
      throw new NotFoundException('Öğrenci bulunamadı veya hesap henüz onaylanmadı');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Şifre bilgisi bulunamadı');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Şifre hatalı');

    const payload = {
      sub:       user.id,
      studentId: user.student.id,
      role:      'STUDENT',
      name:      user.student.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      student: {
        id:      user.student.id,
        name:    user.student.name,
        surname: user.student.surname,
        email:   user.email,
      },
    };
  }

  // ── Şifre Değiştir ───────────────────────────────────────────────────────
  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where:   { id: userId },
      include: { teacher: true, student: true },
    });
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const valid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Mevcut şifre hatalı');

    const hash = await bcrypt.hash(newPass, 12);
    return this.prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: hash },
    });
  }
}
