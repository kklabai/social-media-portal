import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { encrypt } from '../lib/utils/encryption';
import path from 'path';

// Define additional CSV record types for remaining functions
interface PlatformTemplateCSVRecord {
  template_name: string;
  platform_name?: string;
  platform_type: string;
  category: string;
  platform_category?: string;
  base_url?: string;
  name_format?: string;
  bio_format?: string;
  url_format?: string;
  requires_prefix?: string;
  note?: string;
  notes?: string;
}

interface PlatformCSVRecord {
  ecosystem_name: string;
  platform_name: string;
  platform_type: string;
  profile_id?: string;
  username?: string;
  password?: string;
  profile_url?: string;
  totp_enabled: string;
  totp_secret?: string;
  changed_by_email?: string;
  account_status?: string;
  email?: string;
  two_fa_enabled?: string;
  verification_status?: string;
  notes?: string;
}

interface EmailTemplateCSVRecord {
  template_type: string;
  subject: string;
  body: string;
  active: string;
}

interface EmailIdCSVRecord {
  email_address: string;
  ecosystem_name?: string;
  primary_use?: string;
  status?: string;
  created_by?: string;
  notes?: string;
}

const prisma = new PrismaClient();

async function importUsers(csvPath: string) {
  console.log('📥 Importing users...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  
  interface CSVRecord {
    email: string;
    name: string;
    ecitizen_id?: string;
    role: string;
  }

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CSVRecord[];

  for (const record of records) {
    await prisma.user.upsert({
      where: { email: record.email.toLowerCase() },
      update: {
        name: record.name,
        ecitizen_id: record.ecitizen_id || null,
        role: record.role,
        updated_at: new Date(),
      },
      create: {
        email: record.email.toLowerCase(),
        name: record.name,
        ecitizen_id: record.ecitizen_id || null,
        role: record.role,
      },
    });
    console.log(`✓ User: ${record.email}`);
  }
}

async function importEcosystems(csvPath: string) {
  console.log('📥 Importing ecosystems...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  
  interface EcosystemCSVRecord {
    name: string;
    theme: string;
    description?: string;
    active_status: string;
  }
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as EcosystemCSVRecord[];

  for (const record of records) {
    await prisma.ecosystem.upsert({
      where: { name: record.name },
      update: {
        theme: record.theme,
        description: record.description || null,
        active_status: record.active_status === 'true',
        updated_at: new Date(),
      },
      create: {
        name: record.name,
        theme: record.theme,
        description: record.description || null,
        active_status: record.active_status === 'true',
      },
    });
    console.log(`✓ Ecosystem: ${record.name}`);
  }
}

async function importUserEcosystems(csvPath: string) {
  console.log('📥 Importing user-ecosystem assignments...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  
  interface UserEcosystemCSVRecord {
    user_email: string;
    ecosystem_name: string;
    assigned_by_email?: string;
  }
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as UserEcosystemCSVRecord[];

  for (const record of records) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: record.user_email.toLowerCase() },
    });
    
    if (!user) {
      console.log(`⚠️  User not found: ${record.user_email}`);
      continue;
    }

    // Find ecosystem by name
    const ecosystem = await prisma.ecosystem.findUnique({
      where: { name: record.ecosystem_name },
    });
    
    if (!ecosystem) {
      console.log(`⚠️  Ecosystem not found: ${record.ecosystem_name}`);
      continue;
    }

    // Find assigned_by user if provided
    let assignedById = null;
    if (record.assigned_by_email) {
      const assignedByUser = await prisma.user.findUnique({
        where: { email: record.assigned_by_email.toLowerCase() },
      });
      if (assignedByUser) {
        assignedById = assignedByUser.id;
      }
    }

    await prisma.userEcosystem.upsert({
      where: {
        user_id_ecosystem_id: {
          user_id: user.id,
          ecosystem_id: ecosystem.id,
        },
      },
      update: {
        assigned_by: assignedById,
      },
      create: {
        user_id: user.id,
        ecosystem_id: ecosystem.id,
        assigned_by: assignedById,
      },
    });
    console.log(`✓ Assignment: ${record.user_email} -> ${record.ecosystem_name}`);
  }
}

async function importPlatformTemplates(csvPath: string) {
  console.log('📥 Importing platform templates...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as PlatformTemplateCSVRecord[];

  for (const record of records) {
    await prisma.platformTemplate.upsert({
      where: { platform_name: record.template_name },
      update: {
        platform_category: record.platform_category,
        base_url: record.base_url || null,
        name_format: record.name_format || null,
        bio_format: record.bio_format || null,
        url_format: record.url_format || null,
        notes: record.notes || record.note || null,
        updated_at: new Date(),
      },
      create: {
        platform_name: record.platform_name || record.template_name,
        platform_category: record.platform_category || record.category,
        base_url: record.base_url || null,
        name_format: record.name_format || null,
        bio_format: record.bio_format || null,
        url_format: record.url_format || null,
        notes: (record as any).notes || null,
      },
    });
    console.log(`✓ Platform template: ${record.platform_name || record.template_name}`);
  }
}

async function importSocialMediaPlatforms(csvPath: string) {
  console.log('📥 Importing social media platforms...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as PlatformCSVRecord[];

  for (const record of records) {
    // Find ecosystem by name
    const ecosystem = await prisma.ecosystem.findUnique({
      where: { name: record.ecosystem_name },
    });
    
    if (!ecosystem) {
      console.log(`⚠️  Ecosystem not found: ${record.ecosystem_name}`);
      continue;
    }

    await prisma.socialMediaPlatform.upsert({
      where: {
        ecosystem_id_platform_name: {
          ecosystem_id: ecosystem.id,
          platform_name: record.platform_name,
        },
      },
      update: {
        platform_type: record.platform_type || undefined,
        account_status: record.account_status || 'active',
        profile_url: record.profile_url || undefined,
        username: record.username ? encrypt(record.username) : undefined,
        password: record.password ? encrypt(record.password) : undefined,
        email: record.email || undefined,
        profile_id: record.profile_id || undefined,
        two_fa_enabled: record.two_fa_enabled === 'true',
        totp_enabled: record.totp_enabled === 'true',
        totp_secret: record.totp_secret ? encrypt(record.totp_secret) : undefined,
        verification_status: record.verification_status || undefined,
        notes: record.notes || undefined,
        updated_at: new Date(),
      },
      create: {
        ecosystem_id: ecosystem.id,
        platform_name: record.platform_name,
        platform_type: record.platform_type || 'Unknown',
        account_status: record.account_status || 'active',
        profile_url: record.profile_url || undefined,
        username: record.username ? encrypt(record.username) : undefined,
        password: record.password ? encrypt(record.password) : undefined,
        email: record.email || undefined,
        profile_id: record.profile_id || undefined,
        two_fa_enabled: record.two_fa_enabled === 'true',
        totp_enabled: record.totp_enabled === 'true',
        totp_secret: record.totp_secret ? encrypt(record.totp_secret) : undefined,
        verification_status: record.verification_status || undefined,
        notes: record.notes || undefined,
      },
    });
    console.log(`✓ Platform: ${record.platform_name} for ${record.ecosystem_name}`);
  }
}

async function importEmailIds(csvPath: string) {
  console.log('📥 Importing email IDs...');
  const fileContent = readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as EmailIdCSVRecord[];

  for (const record of records) {
    await prisma.emailId.upsert({
      where: { email_address: record.email_address.toLowerCase() },
      update: {
        ecosystem_name: record.ecosystem_name || null,
        primary_use: record.primary_use || null,
        status: record.status || 'active',
        created_by: record.created_by || null,
        notes: record.notes || null,
        updated_at: new Date(),
      },
      create: {
        email_address: record.email_address.toLowerCase(),
        ecosystem_name: record.ecosystem_name || null,
        primary_use: record.primary_use || null,
        status: record.status || 'active',
        created_by: record.created_by || null,
        notes: record.notes || null,
      },
    });
    console.log(`✓ Email ID: ${record.email_address}`);
  }
}

async function main() {
  const csvDir = process.argv[2] || 'csv-data';
  const basePath = path.join(process.cwd(), csvDir);

  console.log(`📁 Looking for CSV files in: ${basePath}`);
  console.log('🌱 Starting import process...\n');

  try {
    // Import in order of dependencies
    const usersPath = path.join(basePath, 'users.csv');
    if (existsSync(usersPath)) {
      await importUsers(usersPath);
    } else {
      console.log('⚠️  users.csv not found');
    }

    const ecosystemsPath = path.join(basePath, 'ecosystems.csv');
    if (existsSync(ecosystemsPath)) {
      await importEcosystems(ecosystemsPath);
    } else {
      console.log('⚠️  ecosystems.csv not found');
    }

    const userEcosystemsPath = path.join(basePath, 'user_ecosystems.csv');
    if (existsSync(userEcosystemsPath)) {
      await importUserEcosystems(userEcosystemsPath);
    } else {
      console.log('⚠️  user_ecosystems.csv not found');
    }

    const platformTemplatesPath = path.join(basePath, 'platform_templates.csv');
    if (existsSync(platformTemplatesPath)) {
      await importPlatformTemplates(platformTemplatesPath);
    } else {
      console.log('⚠️  platform_templates.csv not found');
    }

    const platformsPath = path.join(basePath, 'social_media_platforms.csv');
    if (existsSync(platformsPath)) {
      await importSocialMediaPlatforms(platformsPath);
    } else {
      console.log('⚠️  social_media_platforms.csv not found');
    }

    const emailsPath = path.join(basePath, 'email_ids.csv');
    if (existsSync(emailsPath)) {
      await importEmailIds(emailsPath);
    } else {
      console.log('⚠️  email_ids.csv not found');
    }

    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to check if file exists
function existsSync(filePath: string): boolean {
  try {
    readFileSync(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});