import 'dotenv/config';
import mongoose from 'mongoose';
import { GrantSchema } from '../src/grants/schemas/grant.schema';
import { GrantSource, GrantTimelineStatus, GrantType } from '../src/grants/constants';
import { slugifyTitle } from '../src/grants/slug.util';

const SAMPLE_GRANTS = [
  {
    title: 'Kredyt ekologiczny BGK',
    description:
      'Preferencyjny kredyt na inwestycje zwiększające efektywność energetyczną przedsiębiorstwa, z dotacją na spłatę kapitału.',
    shortSummary: 'Kredyt na inwestycje proekologiczne z dotacją do spłaty.',
    type: GrantType.LOAN,
    source: GrantSource.NATIONAL,
    programme: 'FENG',
    institution: 'Bank Gospodarstwa Krajowego',
    voivodeships: [],
    category: ['oze', 'termomodernizacja'],
    tags: ['efektywność energetyczna', 'kredyt ekologiczny'],
    fundingRange: { min: 100000, max: 10000000 },
    eligibleCosts: ['zakup maszyn', 'termomodernizacja budynków'],
    supportForm: 'kredyt z dotacją',
    cofinancingRate: 'do 70%',
    timeline: {
      announcedAt: new Date('2026-01-15'),
      submissionOpensAt: new Date('2026-02-01'),
      submissionClosesAt: new Date('2026-06-30'),
      status: GrantTimelineStatus.OPEN,
    },
    eligibility: 'Mikro, małe i średnie przedsiębiorstwa',
    requiredDocuments: ['wniosek o kredyt', 'audyt energetyczny'],
    sourceUrl: 'https://www.bgk.pl',
    sourceSystem: 'manual-seed',
  },
  {
    title: 'Dotacja na cyfryzację MŚP - Mazowieckie',
    description:
      'Wsparcie na wdrożenie rozwiązań cyfrowych (oprogramowanie, automatyzacja procesów) w mikro, małych i średnich firmach z województwa mazowieckiego.',
    shortSummary: 'Dotacje na wdrożenia cyfrowe dla firm z Mazowsza.',
    type: GrantType.GRANT,
    source: GrantSource.REGIONAL,
    programme: 'RPO Mazowsze',
    institution: 'Mazowiecka Jednostka Wdrażania Programów Unijnych',
    voivodeships: ['mazowieckie'],
    category: ['cyfryzacja'],
    tags: ['AI', 'automatyzacja', 'oprogramowanie'],
    fundingRange: { min: 50000, max: 500000 },
    eligibleCosts: ['wdrożenie oprogramowania', 'szkolenia pracowników'],
    supportForm: 'dotacja',
    cofinancingRate: 'do 50%',
    timeline: {
      announcedAt: new Date('2026-03-01'),
      submissionOpensAt: new Date('2026-04-01'),
      submissionClosesAt: new Date('2026-05-31'),
      status: GrantTimelineStatus.UPCOMING,
    },
    eligibility: 'MŚP z siedzibą w województwie mazowieckim',
    requiredDocuments: ['biznesplan', 'zaświadczenie o niezaleganiu z ZUS'],
    sourceUrl: 'https://www.funduszedlamazowsza.eu',
    sourceSystem: 'manual-seed',
    location: { lat: 52.2297, lng: 21.0122 },
  },
  {
    title: 'Horizon Europe - Klaster 4: Cyfryzacja, przemysł, kosmos',
    description:
      'Program ramowy Komisji Europejskiej finansujący badania i innowacje w obszarze technologii cyfrowych, przemysłowych i kosmicznych.',
    shortSummary: 'Unijne finansowanie badań i innowacji (B+R).',
    type: GrantType.GRANT,
    source: GrantSource.EU_CENTRAL,
    programme: 'Horizon Europe',
    institution: 'Komisja Europejska',
    voivodeships: [],
    category: ['badania-i-rozwoj', 'innowacje'],
    tags: ['B+R', 'konsorcjum międzynarodowe'],
    fundingRange: { min: 500000, max: 5000000 },
    eligibleCosts: ['prace badawcze', 'wynagrodzenia zespołu B+R'],
    supportForm: 'dotacja',
    cofinancingRate: 'do 100%',
    timeline: {
      announcedAt: new Date('2025-11-01'),
      submissionOpensAt: new Date('2025-12-01'),
      submissionClosesAt: new Date('2026-03-15'),
      status: GrantTimelineStatus.OPEN,
    },
    eligibility: 'Konsorcja z udziałem podmiotów z min. 3 krajów UE',
    requiredDocuments: ['wniosek projektowy', 'umowa konsorcjum'],
    sourceUrl: 'https://ec.europa.eu/info/funding-tenders',
    sourceSystem: 'manual-seed',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/smart-grants';
  await mongoose.connect(uri);

  const GrantModel = mongoose.model('Grant', GrantSchema);
  await GrantModel.deleteMany({ sourceSystem: 'manual-seed' });

  for (const grant of SAMPLE_GRANTS) {
    const slug = slugifyTitle(grant.title);
    await GrantModel.create({ ...grant, slug });
    console.log(`Seeded: ${grant.title}`);
  }

  await mongoose.disconnect();
  console.log(`Done. Seeded ${SAMPLE_GRANTS.length} grants.`);
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
