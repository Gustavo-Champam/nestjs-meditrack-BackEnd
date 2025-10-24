import { Controller, Post, Body, HttpCode, BadRequestException } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserDocument } from '../users/schemas/user.schema';

class RegisterDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}
class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) throw new BadRequestException('E-mail já cadastrado');
    const password_hash = await bcrypt.hash(dto.password, 10);
    await this.userModel.create({ name: dto.name, email: dto.email, password_hash });
    return { ok: true };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const token = await this.auth.login(dto.email, dto.password);
    return { token };
  }
}


