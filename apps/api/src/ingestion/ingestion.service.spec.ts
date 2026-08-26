import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantsService } from '../grants/grants.service';
import { GRANT_SOURCES, GrantSource } from './grant-source.interface';
import { IngestionService } from './ingestion.service';
import { IngestionRun } from './schemas/ingestion-run.schema';

describe('IngestionService', () => {
  let service: IngestionService;
  let grantsService: { upsertFromExternalSource: jest.Mock };
  let sources: GrantSource[];
  let saveMock: jest.Mock;

  beforeEach(async () => {
    saveMock = jest.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    });
    const modelConstructor = jest.fn().mockImplementation((dto: unknown) => ({
      ...(dto as Record<string, unknown>),
      save: saveMock,
    }));
    Object.assign(modelConstructor, {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    grantsService = { upsertFromExternalSource: jest.fn() };

    sources = [
      {
        name: 'source-a',
        fetchGrants: jest
          .fn()
          .mockResolvedValue([{ externalId: '1' }, { externalId: '2' }]),
      },
      {
        name: 'source-b',
        fetchGrants: jest.fn().mockRejectedValue(new Error('source-b is down')),
      },
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: GRANT_SOURCES, useValue: sources },
        { provide: GrantsService, useValue: grantsService },
        {
          provide: getModelToken(IngestionRun.name),
          useValue: modelConstructor,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('aggregates results across sources and isolates a failing source', async () => {
    grantsService.upsertFromExternalSource
      .mockResolvedValueOnce({ wasCreated: true, wasUpdated: false })
      .mockResolvedValueOnce({ wasCreated: false, wasUpdated: true });

    const run = await service.syncAll();

    expect(run.results).toHaveLength(2);
    expect(run.results[0]).toMatchObject({
      source: 'source-a',
      found: 2,
      created: 1,
      updated: 1,
    });
    expect(run.results[1]).toMatchObject({ source: 'source-b', found: 0 });
    expect(run.results[1].error).toContain('source-b is down');
    expect(saveMock).toHaveBeenCalled();
  });
});
