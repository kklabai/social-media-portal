import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/utils/encryption';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!sessionRes.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const session = await sessionRes.json();
    
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin users can import data' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!['users', 'ecosystems', 'user-assignments'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid import type' },
        { status: 400 }
      );
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'CSV file is empty or contains only headers'
      });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = lines.slice(1).map(line => {
      // Handle quoted values
      const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
      return matches ? matches.map(m => m.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim()) : [];
    });

    let imported = 0;
    const errors: string[] = [];

    switch (type) {
      case 'users':
        const result = await importUsers(headers, rows, errors);
        imported = result;
        break;
      
      case 'ecosystems':
        imported = await importEcosystems(headers, rows, errors);
        break;
      
      case 'user-assignments':
        imported = await importUserAssignments(headers, rows, errors, session.user.dbId);
        break;
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Import completed with errors. ${imported} records imported successfully.`,
        imported,
        errors: errors.slice(0, 10) // Limit errors to first 10
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${imported} ${type}`,
      imported
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      message: 'Import failed: ' + (error as Error).message
    });
  }
}

async function importUsers(headers: string[], rows: string[][], errors: string[]): Promise<number> {
  const emailIndex = headers.indexOf('email');
  const nameIndex = headers.indexOf('name');
  const ecitizenIdIndex = headers.indexOf('ecitizen_id');
  const roleIndex = headers.indexOf('role');

  if (emailIndex === -1 || nameIndex === -1) {
    throw new Error('CSV must contain email and name columns');
  }

  let imported = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row[emailIndex]?.toLowerCase();
    const name = row[nameIndex];
    const ecitizenId = ecitizenIdIndex !== -1 ? row[ecitizenIdIndex] : undefined;
    const role = roleIndex !== -1 ? row[roleIndex] : 'user';

    if (!email || !name) {
      errors.push(`Row ${i + 2}: Missing email or name`);
      continue;
    }

    if (!['admin', 'user'].includes(role)) {
      errors.push(`Row ${i + 2}: Invalid role '${role}'. Must be 'admin' or 'user'`);
      continue;
    }

    try {
      await prisma.user.upsert({
        where: { email },
        update: {
          name,
          ecitizen_id: ecitizenId,
          role,
          updated_at: new Date()
        },
        create: {
          email,
          name,
          ecitizen_id: ecitizenId,
          role
        }
      });
      imported++;
    } catch (error) {
      errors.push(`Row ${i + 2}: ${(error as Error).message}`);
    }
  }

  return imported;
}

async function importEcosystems(headers: string[], rows: string[][], errors: string[]): Promise<number> {
  const nameIndex = headers.indexOf('name');
  const themeIndex = headers.indexOf('theme');
  const descriptionIndex = headers.indexOf('description');
  const activeStatusIndex = headers.indexOf('active_status');

  if (nameIndex === -1 || themeIndex === -1) {
    throw new Error('CSV must contain name and theme columns');
  }

  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIndex];
    const theme = row[themeIndex];
    const description = descriptionIndex !== -1 ? row[descriptionIndex] : null;
    const activeStatusStr = activeStatusIndex !== -1 ? row[activeStatusIndex]?.toLowerCase() : 'true';
    const activeStatus = activeStatusStr === 'true' || activeStatusStr === '1' || activeStatusStr === 'yes';

    if (!name || !theme) {
      errors.push(`Row ${i + 2}: Missing name or theme`);
      continue;
    }

    try {
      await prisma.ecosystem.upsert({
        where: { name },
        update: {
          theme,
          description,
          active_status: activeStatus,
          updated_at: new Date()
        },
        create: {
          name,
          theme,
          description,
          active_status: activeStatus
        }
      });
      imported++;
    } catch (error) {
      errors.push(`Row ${i + 2}: ${(error as Error).message}`);
    }
  }

  return imported;
}

async function importPlatforms(headers: string[], rows: string[][], errors: string[], importedBy: number): Promise<number> {
  const ecosystemNameIndex = headers.indexOf('ecosystem_name');
  const platformNameIndex = headers.indexOf('platform_name');
  const platformTypeIndex = headers.indexOf('platform_type');
  const usernameIndex = headers.indexOf('username');
  const passwordIndex = headers.indexOf('password');
  const profileUrlIndex = headers.indexOf('profile_url');
  const profileIdIndex = headers.indexOf('profile_id');
  const totpEnabledIndex = headers.indexOf('totp_enabled');

  if (ecosystemNameIndex === -1 || platformNameIndex === -1 || platformTypeIndex === -1) {
    throw new Error('CSV must contain ecosystem_name, platform_name, and platform_type columns');
  }

  let imported = 0;

  // Get all ecosystems for lookup
  const ecosystems = await prisma.ecosystem.findMany({
    select: { id: true, name: true }
  });
  const ecosystemMap = new Map(ecosystems.map(e => [e.name.toLowerCase(), e.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ecosystemName = row[ecosystemNameIndex];
    const platformName = row[platformNameIndex];
    const platformType = row[platformTypeIndex];
    const username = usernameIndex !== -1 ? row[usernameIndex] : null;
    const password = passwordIndex !== -1 ? row[passwordIndex] : null;
    const profileUrl = profileUrlIndex !== -1 ? row[profileUrlIndex] : null;
    const profileId = profileIdIndex !== -1 ? row[profileIdIndex] : null;
    const totpEnabledStr = totpEnabledIndex !== -1 ? row[totpEnabledIndex]?.toLowerCase() : 'false';
    const totpEnabled = totpEnabledStr === 'true' || totpEnabledStr === '1' || totpEnabledStr === 'yes';

    if (!ecosystemName || !platformName || !platformType) {
      errors.push(`Row ${i + 2}: Missing required fields`);
      continue;
    }

    const ecosystemId = ecosystemMap.get(ecosystemName.toLowerCase());
    if (!ecosystemId) {
      errors.push(`Row ${i + 2}: Ecosystem '${ecosystemName}' not found`);
      continue;
    }

    try {
      // Check if platform already exists
      const existing = await prisma.socialMediaPlatform.findFirst({
        where: {
          ecosystem_id: ecosystemId,
          platform_name: platformName,
          platform_type: platformType
        }
      });

      if (existing) {
        // Update existing
        const updateData: any = {
          updated_at: new Date()
        };

        if (profileUrl) updateData.profile_url = profileUrl;
        if (profileId) updateData.profile_id = profileId;
        updateData.totp_enabled = totpEnabled;

        // Track credential changes
        const historyRecords = [];

        if (username && username !== (existing.username ? decrypt(existing.username) : '')) {
          updateData.username = encrypt(username);
          historyRecords.push({
            platform_id: existing.id,
            field_name: 'username',
            old_value: existing.username,
            new_value: updateData.username,
            changed_by: importedBy,
            changed_at: new Date()
          });
        }

        if (password && password !== (existing.password ? decrypt(existing.password) : '')) {
          updateData.password = encrypt(password);
          historyRecords.push({
            platform_id: existing.id,
            field_name: 'password',
            old_value: existing.password,
            new_value: updateData.password,
            changed_by: importedBy,
            changed_at: new Date()
          });
        }

        await prisma.$transaction([
          prisma.socialMediaPlatform.update({
            where: { id: existing.id },
            data: updateData
          }),
          ...historyRecords.map(record =>
            prisma.credentialHistory.create({ data: record })
          )
        ]);
      } else {
        // Create new
        await prisma.socialMediaPlatform.create({
          data: {
            ecosystem_id: ecosystemId,
            platform_name: platformName,
            platform_type: platformType,
            username: username ? encrypt(username) : null,
            password: password ? encrypt(password) : null,
            profile_url: profileUrl,
            profile_id: profileId,
            totp_enabled: totpEnabled
          }
        });
      }
      imported++;
    } catch (error) {
      errors.push(`Row ${i + 2}: ${(error as Error).message}`);
    }
  }

  return imported;
}


async function importUserAssignments(headers: string[], rows: string[][], errors: string[], assignedById: number): Promise<number> {
  const userEmailIndex = headers.indexOf("user_email");
  const ecosystemNameIndex = headers.indexOf("ecosystem_name");
  const assignedByEmailIndex = headers.indexOf("assigned_by_email");

  if (userEmailIndex === -1 || ecosystemNameIndex === -1) {
    throw new Error("CSV must contain user_email and ecosystem_name columns");
  }

  let imported = 0;

  // Get all users and ecosystems for lookup
  const [users, ecosystems] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true }
    }),
    prisma.ecosystem.findMany({
      select: { id: true, name: true }
    })
  ]);

  const userMap = new Map(users.map(u => [u.email.toLowerCase(), u.id]));
  const ecosystemMap = new Map(ecosystems.map(e => [e.name.toLowerCase(), e.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const userEmail = row[userEmailIndex]?.toLowerCase();
    const ecosystemName = row[ecosystemNameIndex];
    const assignedByEmail = assignedByEmailIndex \!== -1 ? row[assignedByEmailIndex]?.toLowerCase() : null;

    if (\!userEmail || \!ecosystemName) {
      errors.push(`Row ${i + 2}: Missing user_email or ecosystem_name`);
      continue;
    }

    const userId = userMap.get(userEmail);
    if (\!userId) {
      errors.push(`Row ${i + 2}: User '${userEmail}' not found`);
      continue;
    }

    const ecosystemId = ecosystemMap.get(ecosystemName.toLowerCase());
    if (\!ecosystemId) {
      errors.push(`Row ${i + 2}: Ecosystem '${ecosystemName}' not found`);
      continue;
    }

    let actualAssignedBy = assignedById;
    if (assignedByEmail) {
      const assignedByUser = userMap.get(assignedByEmail);
      if (assignedByUser) {
        actualAssignedBy = assignedByUser;
      }
    }

    try {
      // Check if assignment already exists
      const existing = await prisma.userEcosystem.findFirst({
        where: {
          user_id: userId,
          ecosystem_id: ecosystemId
        }
      });

      if (\!existing) {
        await prisma.userEcosystem.create({
          data: {
            user_id: userId,
            ecosystem_id: ecosystemId,
            assigned_by: actualAssignedBy,
            assigned_at: new Date()
          }
        });
        imported++;
      } else {
        // Assignment already exists, skip
        errors.push(`Row ${i + 2}: User '${userEmail}' is already assigned to ecosystem '${ecosystemName}'`);
      }
    } catch (error) {
      errors.push(`Row ${i + 2}: ${(error as Error).message}`);
    }
  }

  return imported;
}
