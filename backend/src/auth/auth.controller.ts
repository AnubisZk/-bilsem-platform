import {
  Controller, Post, Put, Get, Body,
  Request, UseGuards, Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Öğretmen / Admin girişi
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // Öğrenci self-signup
  @Post('student-signup')
  studentSignup(@Body() body: any) {
    return this.authService.studentSignup(body);
  }

  // Öğrenci portal girişi
  @Post('student-login')
  studentLogin(@Body() body: { studentId: string; password: string }) {
    return this.authService.studentLogin(body.studentId, body.password);
  }

  // Bekleyen kayıtları listele (sadece giriş yapmış kullanıcı)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('pending-students')
  getPending() {
    return this.authService.getPendingStudents();
  }

  // Öğrenci kaydını onayla
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('approve-student/:studentId')
  approveStudent(@Param('studentId') studentId: string) {
    return this.authService.approveStudent(studentId);
  }

  // Şifre değiştir
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  changePassword(
    @Request() req: any,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.sub, body.oldPassword, body.newPassword);
  }

  // Me
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.validateUser(req.user.sub);
  }
}
