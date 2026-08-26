import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum UserRole {
  ENTREPRENEUR = 'entrepreneur',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.ENTREPRENEUR })
  role: UserRole;

  @Prop()
  companyName?: string;

  @Prop()
  nip?: string;

  @Prop()
  phone?: string;

  @Prop()
  hashedRefreshToken?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Grant', default: [] })
  favoriteGrants: Types.ObjectId[];

  @Prop({ type: Date })
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
