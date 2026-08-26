import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connectivity check' })
  checkDb() {
    const readyState: number = this.connection.readyState;
    if (readyState !== 1) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        readyState,
      });
    }
    return { status: 'ok', database: 'connected' };
  }
}
