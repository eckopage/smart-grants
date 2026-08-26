import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GrantsService } from '../grants/grants.service';
import { SeoController } from './seo.controller';

describe('SeoController', () => {
  let controller: SeoController;
  let grantsService: { findAll: jest.Mock };

  beforeEach(async () => {
    grantsService = {
      findAll: jest.fn().mockResolvedValue({
        items: [{ slug: 'dotacja-testowa' }],
        total: 1,
        page: 1,
        limit: 1000,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeoController],
      providers: [
        { provide: GrantsService, useValue: grantsService },
        {
          provide: ConfigService,
          useValue: { get: () => 'https://smartgrants.pl' },
        },
      ],
    }).compile();

    controller = module.get<SeoController>(SeoController);
  });

  it('includes static routes and grant detail pages', async () => {
    const xml = await controller.sitemap();
    expect(xml).toContain('<loc>https://smartgrants.pl/</loc>');
    expect(xml).toContain('<loc>https://smartgrants.pl/grants</loc>');
    expect(xml).toContain(
      '<loc>https://smartgrants.pl/grants/dotacja-testowa</loc>',
    );
  });
});
