import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrantsService } from '../grants/grants.service';

const STATIC_ROUTES = ['/', '/grants', '/pricing', '/login', '/register'];

/**
 * Served from the API for now. In production, route the public domain's
 * /sitemap.xml to this endpoint (e.g. a Cloudflare redirect/worker) so
 * crawlers see it at the site root rather than the API subdomain.
 */
@Controller()
export class SeoController {
  constructor(
    private readonly grantsService: GrantsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async sitemap(): Promise<string> {
    const webUrl =
      this.configService.get<string>('WEB_URL') ?? 'http://localhost:5173';
    const { items } = await this.grantsService.findAll({
      page: 1,
      limit: 1000,
    });

    const urls = [
      ...STATIC_ROUTES.map((route) => `${webUrl}${route}`),
      ...items.map((grant) => `${webUrl}/grants/${grant.slug}`),
    ];

    const body = urls
      .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
