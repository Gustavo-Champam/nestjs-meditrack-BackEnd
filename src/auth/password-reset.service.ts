import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>, // [0] -> UserModel
    private readonly users: UsersService,                                    // [1]
  ) {}

  async requestReset(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return; // não vaza existência
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    // se UsersService não tiver helper, grava direto:
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { resetToken: token, resetTokenExpires: expires } }
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new BadRequestException('Token inválido');
    }
    user.password_hash = await bcrypt.hash(newPassword, 10);
    // zera campos como undefined (compatível com type string|Date|undefined)
    // ou use "unset" se preferir: await this.userModel.updateOne({_id:user._id}, {$unset:{resetToken:"", resetTokenExpires:""}});
    (user as any).resetToken = undefined;
    (user as any).resetTokenExpires = undefined;
    await user.save();
  }
}

