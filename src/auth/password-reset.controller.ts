import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { PasswordResetService } from './password-reset.service';

class RequestResetDto { @IsEmail() email: string }
class ResetPasswordDto { @IsString() token: string; @IsString() @MinLength(6) newPassword: string }

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly resetSvc: PasswordResetService) {}

  @Post('request-reset')
  async requestReset(@Body() dto: RequestResetDto) {
    await this.resetSvc.requestReset(dto.email);
    return { ok: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetSvc.resetPassword(dto.token, dto.newPassword);
    return { ok: true };
  }

  // aliases REST "bonitos"
  @Post('forgot')
  async forgot(@Body() dto: RequestResetDto) {
    await this.resetSvc.requestReset(dto.email);
    return { ok: true };
  }

  @Post('reset')
  async reset(@Body() dto: ResetPasswordDto) {
    await this.resetSvc.resetPassword(dto.token, dto.newPassword);
    return { ok: true };
  }
}




