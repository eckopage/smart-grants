import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-passwordHash -hashedRefreshToken')
      .sort({ createdAt: -1 })
      .exec();
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

  async getFavorites(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .populate('favoriteGrants')
      .exec();
    if (!user) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }
    return user;
  }

  async addFavorite(
    userId: string,
    grantId: string,
    maxFavorites: number | null,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }
    const alreadySaved = user.favoriteGrants.some(
      (id) => id.toString() === grantId,
    );
    if (alreadySaved) {
      return user;
    }
    if (maxFavorites !== null && user.favoriteGrants.length >= maxFavorites) {
      throw new ConflictException(
        `Limit zapisanych dotacji dla Twojego planu (${maxFavorites}) został osiągnięty`,
      );
    }
    user.favoriteGrants.push(new Types.ObjectId(grantId));
    return user.save();
  }

  async removeFavorite(userId: string, grantId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }
    user.favoriteGrants = user.favoriteGrants.filter(
      (id) => id.toString() !== grantId,
    );
    return user.save();
  }
}
