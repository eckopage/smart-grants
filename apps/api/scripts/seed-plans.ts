import 'dotenv/config';
import mongoose from 'mongoose';
import { PlanAudience, PlanSchema } from '../src/plans/schemas/plan.schema';

const ENTREPRENEUR_PLANS = [
  {
    key: 'starter',
    audience: PlanAudience.ENTREPRENEUR,
    name: 'Starter',
    priceMonthly: 39,
    priceYearly: 390,
    limits: {
      maxFavorites: 10,
      leadContactsPerMonth: 2,
      maxTeamAccounts: 1,
      exportData: false,
      apiAccess: false,
    },
    sortOrder: 1,
  },
  {
    key: 'pro',
    audience: PlanAudience.ENTREPRENEUR,
    name: 'Pro',
    priceMonthly: 99,
    priceYearly: 990,
    limits: {
      maxFavorites: null,
      leadContactsPerMonth: 10,
      maxTeamAccounts: 1,
      exportData: true,
      apiAccess: false,
    },
    sortOrder: 2,
  },
  {
    key: 'business',
    audience: PlanAudience.ENTREPRENEUR,
    name: 'Business',
    priceMonthly: 249,
    priceYearly: 2490,
    limits: {
      maxFavorites: null,
      leadContactsPerMonth: null,
      maxTeamAccounts: 5,
      exportData: true,
      apiAccess: true,
    },
    sortOrder: 3,
  },
];

const COMPANY_PLANS = [
  {
    key: 'basic_listing',
    audience: PlanAudience.COMPANY,
    name: 'Basic Listing',
    priceMonthly: 99,
    priceYearly: 990,
    limits: { maxFavorites: null, leadContactsPerMonth: null, maxTeamAccounts: 1 },
    sortOrder: 1,
  },
  {
    key: 'featured',
    audience: PlanAudience.COMPANY,
    name: 'Featured',
    priceMonthly: 299,
    priceYearly: 2990,
    limits: { maxFavorites: null, leadContactsPerMonth: null, maxTeamAccounts: 1 },
    sortOrder: 2,
  },
  {
    key: 'premium_leads',
    audience: PlanAudience.COMPANY,
    name: 'Premium Leads',
    priceMonthly: 799,
    priceYearly: 7990,
    limits: { maxFavorites: null, leadContactsPerMonth: null, maxTeamAccounts: 1 },
    sortOrder: 3,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/smart-grants';
  await mongoose.connect(uri);

  const PlanModel = mongoose.model('Plan', PlanSchema);

  for (const plan of [...ENTREPRENEUR_PLANS, ...COMPANY_PLANS]) {
    await PlanModel.findOneAndUpdate({ key: plan.key }, plan, {
      upsert: true,
      new: true,
    });
    console.log(`Seeded plan: ${plan.key}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
