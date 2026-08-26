import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { IngestionService } from './ingestion.service';
import { INGESTION_QUEUE, SYNC_ALL_JOB } from './ingestion.processor';

@ApiTags('admin/ingestion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/ingestion')
export class AdminIngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    @InjectQueue(INGESTION_QUEUE) private readonly queue: Queue,
  ) {}

  @Get('runs')
  findRecentRuns() {
    return this.ingestionService.findRecentRuns();
  }

  @Post('run')
  async triggerRun() {
    const job = await this.queue.add(SYNC_ALL_JOB, {});
    return { jobId: job.id };
  }
}
