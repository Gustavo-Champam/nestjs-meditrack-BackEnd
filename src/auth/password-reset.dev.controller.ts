import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Controller('auth/password/dev')
export class PasswordResetDevController {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  @Get('peek')
  async peek(@Query('email') email: string) {
    const user: any = await this.userModel.findOne({ email }).lean();
    return { token: user?.resetToken ?? null, expires: user?.resetTokenExpires ?? null };
  }
}




