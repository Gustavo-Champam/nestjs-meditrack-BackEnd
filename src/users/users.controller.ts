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

    const u: any = user; // createdAt/updatedAt podem existir mas não estão tipados
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: profile?.phone,
      address: profile?.address,
      birthDate: profile?.birthDate,
      createdAt: u.createdAt ?? undefined,
      updatedAt: u.updatedAt ?? undefined,
    };
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: any) {
    const userId = new Types.ObjectId(req.user.sub);

    const base: any = {};
    if (typeof dto.name === 'string') base.name = dto.name;

    const profileSet: any = {};
    if (typeof dto.phone !== 'undefined') profileSet.phone = dto.phone;
    if (typeof dto.address !== 'undefined') profileSet.address = dto.address;
    if (typeof dto.birthDate !== 'undefined') profileSet.birthDate = dto.birthDate;

    let updatedUser: any;
    if (Object.keys(base).length) {
      updatedUser = await this.userModel
        .findByIdAndUpdate(userId, { $set: base }, { new: true })
        .lean();
    } else {
      updatedUser = await this.userModel.findById(userId).lean();
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
      createdAt: updatedUser?.createdAt ?? undefined,
      updatedAt: updatedUser?.updatedAt ?? undefined,
    };
  }
}
