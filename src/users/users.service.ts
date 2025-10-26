import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }
  findById(id: any) {
    return this.userModel.findById(id).exec();
  }
  create(data: Partial<User>) {
    return new this.userModel(data).save();
  }
  updateById(id: any, set: any) {
    return this.userModel.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
  }
}