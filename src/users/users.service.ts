import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<any>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    const _id = new Types.ObjectId(id);
    return this.userModel.findById(_id).exec();
  }

  // << NOVO
  async createUser(data: any) {
    return this.userModel.create(data);
  }
}




