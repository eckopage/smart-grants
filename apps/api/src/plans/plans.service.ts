import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan, PlanAudience, PlanDocument } from './schemas/plan.schema';

@Injectable()
export class PlansService {
  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  findActive(audience?: PlanAudience): Promise<PlanDocument[]> {
    return this.planModel
      .find({ isActive: true, ...(audience ? { audience } : {}) })
      .sort({ sortOrder: 1 })
      .exec();
  }

  findAll(): Promise<PlanDocument[]> {
    return this.planModel.find().sort({ sortOrder: 1 }).exec();
  }

  async findByKey(key: string): Promise<PlanDocument> {
    const plan = await this.planModel.findOne({ key }).exec();
    if (!plan) {
      throw new NotFoundException(`Nie znaleziono planu "${key}"`);
    }
    return plan;
  }

  create(dto: CreatePlanDto): Promise<PlanDocument> {
    return new this.planModel(dto).save();
  }

  async update(key: string, dto: UpdatePlanDto): Promise<PlanDocument> {
    const plan = await this.planModel
      .findOneAndUpdate({ key }, dto, { new: true })
      .exec();
    if (!plan) {
      throw new NotFoundException(`Nie znaleziono planu "${key}"`);
    }
    return plan;
  }

  async remove(key: string): Promise<void> {
    const result = await this.planModel.findOneAndDelete({ key }).exec();
    if (!result) {
      throw new NotFoundException(`Nie znaleziono planu "${key}"`);
    }
  }
}
