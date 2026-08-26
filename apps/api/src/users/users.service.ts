import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  create(
    dto: Omit<CreateUserDto, 'password'> & { passwordHash: string },
  ): Promise<UserDocument> {
    const user = new this.userModel(dto);
    return user.save();
  }

  async setHashedRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { hashedRefreshToken })
      .exec();
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() })
      .exec();
  }
}
