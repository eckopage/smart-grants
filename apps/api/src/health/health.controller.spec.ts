import { ServiceUnavailableException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let connection: { readyState: number };

  beforeEach(async () => {
    connection = { readyState: 1 };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: connection,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('returns ok status', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('checkDb', () => {
    it('returns ok when database is connected', () => {
      connection.readyState = 1;
      expect(controller.checkDb()).toEqual({
        status: 'ok',
        database: 'connected',
      });
    });

    it('throws ServiceUnavailableException when database is disconnected', () => {
      connection.readyState = 0;
      expect(() => controller.checkDb()).toThrow(ServiceUnavailableException);
    });
  });
});
