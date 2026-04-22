import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
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

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        teacher: true,
        student: true,
        parent: true,
      },
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

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
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

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, student: true },
    });
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const valid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Mevcut şifre hatalı');
    }

    const hash = await bcrypt.hash(newPass, 12);

    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });
  }

  async studentLogin(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { student: { id: identifier } },
        ],
      },
      include: {
        student: true,
      },
    });

    if (!user || !user.student) {
      throw new NotFoundException('Öğrenci bulunamadı');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Şifre bilgisi bulunamadı');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Şifre hatalı');
    }

    const payload = {
      sub: user.id,
      studentId: user.student.id,
      role: 'STUDENT',
      name: user.student.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      student: {
        id: user.student.id,
        name: user.student.name,
        surname: user.student.surname,
        email: user.email,
      },
    };
  }
}
