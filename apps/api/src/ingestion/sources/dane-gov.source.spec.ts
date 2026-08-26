import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DaneGovSource } from './dane-gov.source';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DaneGovSource', () => {
  function buildSource(resourceId: string | undefined) {
    const configService = { get: () => resourceId } as unknown as ConfigService;
    return new DaneGovSource(configService);
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a no-op when no resource id is configured', async () => {
    const source = buildSource(undefined);
    const grants = await source.fetchGrants();
    expect(grants).toEqual([]);
    expect(mockedAxios.get.mock.calls).toHaveLength(0);
  });

  it('maps resource rows into RawGrant', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        data: [
          {
            id: '123',
            nazwa: 'Dotacja na eksport',
            opis: 'Wsparcie eksportu dla MŚP',
            program: 'FENG',
            instytucja: 'PARP',
          },
        ],
      },
    });

    const source = buildSource('resource-1');
    const grants = await source.fetchGrants();

    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      sourceSystem: 'dane_gov_pl',
      externalId: '123',
      title: 'Dotacja na eksport',
      programme: 'FENG',
      institution: 'PARP',
    });
  });

  it('returns an empty array when the request fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network error'));
    const source = buildSource('resource-1');
    const grants = await source.fetchGrants();
    expect(grants).toEqual([]);
  });
});
