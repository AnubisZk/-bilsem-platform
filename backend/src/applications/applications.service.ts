import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

function parseGrade(raw?: string | null): number {
  if (!raw) return 5;
  const match = String(raw).match(/\d+/);
  const n = match ? Number(match[0]) : 5;
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : 5;
}

function splitFullName(fullName: string): { name: string; surname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { name: parts[0], surname: 'Öğrenci' };
  const surname = parts.pop() || 'Öğrenci';
  return { name: parts.join(' '), surname };
}

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    email: string;
    grade?: string;
    goal?: string;
    program?: string;
    note?: string;
  }) {
    return this.prisma.studentApplication.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        grade: data.grade,
        goal: data.goal,
        program: data.program,
        note: data.note,
        status: 'PENDING',
      },
    });
  }

  async findAll() {
    return this.prisma.studentApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const app = await this.prisma.studentApplication.findUnique({
      where: { id },
    });

    if (!app) throw new NotFoundException('Başvuru bulunamadı');

    if (app.status === 'APPROVED' && app.studentId) {
      return {
        message: 'Bu başvuru zaten onaylanmış',
        application: app,
      };
    }

    const email = app.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { student: true },
    });

    if (existingUser?.student) {
      const updated = await this.prisma.studentApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          studentId: existingUser.student.id,
        },
      });

      return {
        message: 'Bu e-posta ile öğrenci zaten vardı; başvuru mevcut öğrenciye bağlandı',
        application: updated,
        student: existingUser.student,
      };
    }

    if (existingUser && !existingUser.student) {
      throw new BadRequestException('Bu e-posta başka bir kullanıcı hesabında kayıtlı');
    }

    const grade = parseGrade(app.grade);
    const level = grade <= 8 ? 'ILKOGRETIM' : 'LISE';
    const { name, surname } = splitFullName(app.name);
    const studentCode = `STU-${Date.now().toString(36).toUpperCase()}`;
    const plainPassword = `Bilsem-${studentCode.replace('STU-', '')}`;
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          studentCode,
          name,
          surname,
          school: app.program || 'Başvuru ile kayıt',
          grade,
          level,
          bilsemLevel: app.program || 'Genel Program',
          mathLevel: 'Gelişen',
          strengths: [],
          weaknesses: [],
          interests: [],
          notes: [
            app.goal ? `Hedef: ${app.goal}` : null,
            app.program ? `Program: ${app.program}` : null,
            app.note ? `Not: ${app.note}` : null,
            `Başvuru e-postası: ${email}`,
          ]
            .filter(Boolean)
            .join('\n'),
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: `${name} ${surname}`,
          role: 'STUDENT',
          isActive: true,
          student: {
            connect: { id: student.id },
          },
        },
      });

      const application = await tx.studentApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          studentId: student.id,
        },
      });

      return { application, student, user };
    });

    return {
      message: 'Başvuru onaylandı ve öğrenci hesabı oluşturuldu',
      application: result.application,
      student: result.student,
      portal: {
        email: result.user.email,
        password: plainPassword,
      },
    };
  }

  async reject(id: string) {
    const app = await this.prisma.studentApplication.findUnique({
      where: { id },
    });

    if (!app) throw new NotFoundException('Başvuru bulunamadı');

    return this.prisma.studentApplication.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}
