import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlanAudience } from './schemas/plan.schema';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  findActive(@Query('audience') audience?: PlanAudience) {
    return this.plansService.findActive(audience);
  }
}
