import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

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
    const assignedByEmail = assignedByEmailIndex !== -1 ? row[assignedByEmailIndex]?.toLowerCase() : null;

    if (!userEmail || !ecosystemName) {
      errors.push(`Row ${i + 2}: Missing user_email or ecosystem_name`);
      continue;
    }

    const userId = userMap.get(userEmail);
    if (!userId) {
      errors.push(`Row ${i + 2}: User '${userEmail}' not found`);
      continue;
    }

    const ecosystemId = ecosystemMap.get(ecosystemName.toLowerCase());
    if (!ecosystemId) {
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

      if (!existing) {
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
