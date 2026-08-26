import axios from 'axios';
import { EuFundingSource } from './eu-funding.source';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EuFundingSource', () => {
  let source: EuFundingSource;

  beforeEach(() => {
    source = new EuFundingSource();
    jest.clearAllMocks();
  });

  it('maps well-formed results into RawGrant', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        results: [
          {
            reference: 'HORIZON-2026-001',
            title: 'Digital transformation call',
            description: 'Funding for SME digitalisation projects',
            url: 'https://example.eu/call/1',
            deadlineDate: '2026-06-30',
          },
        ],
      },
    });

    const grants = await source.fetchGrants();

    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      sourceSystem: 'eu_funding_tenders_portal',
      externalId: 'HORIZON-2026-001',
      title: 'Digital transformation call',
    });
  });

  it('skips malformed entries missing an id or title', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { results: [{ description: 'no id or title here' }] },
    });

    const grants = await source.fetchGrants();
    expect(grants).toHaveLength(0);
  });

  it('returns an empty array and does not throw when the request fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network error'));

    const grants = await source.fetchGrants();
    expect(grants).toEqual([]);
  });

  it('returns an empty array when the response shape is unexpected', async () => {
    mockedAxios.post.mockResolvedValue({ data: { unexpected: true } });

    const grants = await source.fetchGrants();
    expect(grants).toEqual([]);
  });
});
