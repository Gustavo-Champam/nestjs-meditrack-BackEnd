import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateMeDto } from './dto/update-me.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.userModel.findOneAndUpdate({ _id: req.user.sub }, { $set: dto }, { new: true });
  }
}




