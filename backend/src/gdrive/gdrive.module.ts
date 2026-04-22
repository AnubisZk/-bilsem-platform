import { Module } from '@nestjs/common';
import { GdriveService } from './gdrive.service';
import { Controller, Get, Query, UseGuards, Param, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('gdrive')
@Controller('gdrive')
export class GdriveController {
  constructor(private service: GdriveService) {}

  @Get('auth-url')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getAuthUrl() {
    return { url: this.service.getAuthUrl() };
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: any) {
    if (!code) return res.send('Hata: code eksik');
    try {
      const token = await this.service.exchangeCode(code);
      return res.send(`
        <html><body style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2>✅ Google Drive Bağlandı!</h2>
          <p>Access Token (kopyalayın):</p>
          <textarea style="width:100%;height:120px;font-size:11px;">${token.access_token}</textarea>
          <p style="color:gray;font-size:12px;">Bu token ile Drive dosyalarına erişebilirsiniz.</p>
        </body></html>
      `);
    } catch (e: any) {
      return res.send(`Hata: ${e.message}`);
    }
  }

  @Get('files')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listFiles(@Query('accessToken') accessToken: string) {
    return this.service.listActivityBooks(accessToken);
  }

  @Get('folder/:folderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  listFolder(@Param('folderId') folderId: string, @Query('accessToken') accessToken: string) {
    return this.service.listFolderContents(folderId, accessToken);
  }

  @Get('file/:fileId/link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getLink(@Param('fileId') fileId: string) {
    return { viewLink: this.service.getDirectLink(fileId), embedLink: this.service.getEmbedLink(fileId) };
  }
}

@Module({
  providers: [GdriveService],
  controllers: [GdriveController],
  exports: [GdriveService],
})
export class GdriveModule {}
