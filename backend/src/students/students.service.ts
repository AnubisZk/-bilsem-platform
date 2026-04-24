import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Level } from '@prisma/client';

export class CreateStudentDto {
  @IsString() name: string;
  @IsString() surname: string;
  @IsString() school: string;
  @IsNumber() grade: number;
  @IsEnum(Level) level: Level;
  @IsString() bilsemLevel: string;
  @IsString() mathLevel: string;
  @IsArray() @IsOptional() strengths?: string[];
  @IsArray() @IsOptional() weaknesses?: string[];
  @IsArray() @IsOptional() interests?: string[];
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() parentId?: string;
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId?: string, groupId?: string) {
    const where: any = {};
    if (groupId) where.groupStudents = { some: { groupId } };

    return this.prisma.student.findMany({
      where,
      include: {
        groupStudents: { include: { group: true } },
        parent: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        groupStudents: { include: { group: true } },
        parent: true,
      },
    });

    if (!student) throw new NotFoundException('Öğrenci bulunamadı');
    return student;
  }

  async create(data: CreateStudentDto) {
    const code = `STU-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.student.create({
      data: {
        ...data,
        studentCode: code,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        interests: data.interests || [],
      },
    });
  }

  async update(id: string, data: Partial<CreateStudentDto>) {
    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.student.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createPortalAccount(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        student: { id: studentId },
      },
      include: {
        student: true,
      },
    });

    if (existingUser) {
      return {
        message: 'Portal hesabı zaten mevcut',
        email: existingUser.email,
        alreadyExists: true,
      };
    }

    const bcrypt = require('bcryptjs');

    const initials =
      (student.name?.charAt(0) || '') +
      (student.surname?.charAt(0) || '');

    const plainPassword = initials.toUpperCase() + '2026';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const email = 'stu-' + studentId.slice(0, 8) + '@bilsem.edu.tr';

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: student.name + ' ' + student.surname,
        role: 'STUDENT',
        isActive: true,
        student: {
          connect: { id: studentId },
        },
      },
    });

    return {
      message: 'Portal hesabı oluşturuldu',
      email: user.email,
      password: plainPassword,
      alreadyExists: false,
    };
  }

  async getPortalData(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        studentLogs: true,
        feedbacks: true,
        groupStudents: {
          include: {
            group: {
              include: {
                plans: {
                  include: {
                    planItems: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    return student;
  }
}
