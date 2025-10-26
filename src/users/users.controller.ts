import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserProfile, UserProfileDocument } from './schemas/user-profile.schema';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserProfile.name) private readonly profileModel: Model<UserProfileDocument>,
  ) {}

  @Get('me')
  async me(@Req() req: any) {
    const userId = new Types.ObjectId(req.user.sub);
    const user = await this.userModel.findById(userId).lean();
    const profile = await this.profileModel.findOne({ userId }).lean();

    if (!user) return null;

    // monta resposta combinada
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      // extras do profile
      phone: profile?.phone,
      address: profile?.address,
      birthDate: profile?.birthDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: any) {
    const userId = new Types.ObjectId(req.user.sub);

    const base: any = {};
    if (typeof dto.name === 'string') base.name = dto.name;
    // nunca aceitar email aqui (evita troca acidental)

    const profileSet: any = {};
    if (typeof dto.phone !== 'undefined') profileSet.phone = dto.phone;
    if (typeof dto.address !== 'undefined') profileSet.address = dto.address;
    if (typeof dto.birthDate !== 'undefined') profileSet.birthDate = dto.birthDate;

    let updatedUser = null;
    if (Object.keys(base).length) {
      updatedUser = await this.userModel.findByIdAndUpdate(userId, { $set: base }, { new: true });
    } else {
      updatedUser = await this.userModel.findById(userId);
    }

    if (Object.keys(profileSet).length) {
      await this.profileModel.findOneAndUpdate(
        { userId },
        { $set: profileSet },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    const profile = await this.profileModel.findOne({ userId }).lean();
    return {
      _id: updatedUser?._id,
      name: updatedUser?.name,
      email: updatedUser?.email,
      phone: profile?.phone,
      address: profile?.address,
      birthDate: profile?.birthDate,
      createdAt: updatedUser?.createdAt,
      updatedAt: updatedUser?.updatedAt,
    };
  }
}
