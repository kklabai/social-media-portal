import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { buildSearchConditions } from '@/lib/utils/search';

// GET /api/platforms - List platforms for an ecosystem
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ecosystemId = searchParams.get('ecosystemId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12'); // 12 for grid layout
    const search = searchParams.get('search') || '';
    const platformType = searchParams.get('type') || '';
    const totpFilter = searchParams.get('totp');

    // If no ecosystemId, return all platforms (for admin dashboard)
    let parsedEcosystemId: number | undefined;
    if (ecosystemId && ecosystemId !== 'undefined') {
      parsedEcosystemId = parseInt(ecosystemId);
      if (isNaN(parsedEcosystemId)) {
        return NextResponse.json(
          { error: 'Invalid ecosystemId format' },
          { status: 400 }
        );
      }
    }

    const skip = (page - 1) * limit;

    // Build where clause
    interface WhereClause {
      ecosystem_id?: number;
      OR?: Array<{ [key: string]: { contains: string } }>;
      platform_type?: { contains: string };
      totp_enabled?: boolean;
    }
    
    const where: WhereClause = {};
    
    if (parsedEcosystemId !== undefined) {
      where.ecosystem_id = parsedEcosystemId;
    }

    if (search) {
      const searchConditions = buildSearchConditions(search, ['platform_name', 'platform_type', 'profile_url']);
      if (searchConditions) {
        where.OR = searchConditions;
      }
    }

    if (platformType) {
      where.platform_type = { contains: platformType };
    }

    if (totpFilter !== null && totpFilter !== undefined) {
      where.totp_enabled = totpFilter === 'true';
    }

    // Get total count for pagination
    const total = await prisma.socialMediaPlatform.count({ where });

    // Get paginated platforms
    const platforms = await prisma.socialMediaPlatform.findMany({
      where,
      include: {
        ecosystem: true
      },
      orderBy: {
        platform_name: 'asc'
      },
      skip,
      take: limit
    });

    // Decrypt sensitive fields
    const decryptedPlatforms = platforms.map((platform) => ({
      ...platform,
      username: platform.username ? decrypt(platform.username) : '',
      password: platform.password ? decrypt(platform.password) : '',
    }));

    return NextResponse.json({ 
      list: decryptedPlatforms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}

// POST /api/platforms - Create a new platform
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ecosystem_id, platform_name, platform_type, username, password, profile_id, profile_url, totp_enabled } = body;

    if (!ecosystem_id || !platform_name || !platform_type) {
      return NextResponse.json(
        { error: 'ecosystem_id, platform_name, and platform_type are required' },
        { status: 400 }
      );
    }

    // Check if user has access to this ecosystem
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
    
    if (!session.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // For non-admin users, check if they have access to this ecosystem
    if (session.user.role !== 'admin') {
      const userEcosystems = await prisma.userEcosystem.findMany({
        where: { 
          user_id: session.user.dbId,
          ecosystem_id: ecosystem_id
        }
      });
      
      if (userEcosystems.length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this ecosystem' },
          { status: 403 }
        );
      }
    }

    // Check if platform with same name and type already exists in this ecosystem
    const existing = await prisma.socialMediaPlatform.findFirst({
      where: {
        ecosystem_id,
        platform_name,
        platform_type
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A platform with this name and type already exists in this ecosystem' },
        { status: 400 }
      );
    }

    // Create the platform
    const platform = await prisma.socialMediaPlatform.create({
      data: {
        ecosystem_id,
        platform_name,
        platform_type,
        profile_id,
        profile_url,
        username: username ? encrypt(username) : null,
        password: password ? encrypt(password) : null,
        totp_enabled: totp_enabled || false
      }
    });

    // Return created platform with decrypted fields
    return NextResponse.json({
      ...platform,
      username: platform.username ? decrypt(platform.username) : '',
      password: platform.password ? decrypt(platform.password) : '',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating platform:', error);
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    );
  }
}

// PUT /api/platforms - Update a platform
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password, changed_by, ...otherFields } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Platform ID is required' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get current platform data for history tracking
      const currentPlatform = await tx.socialMediaPlatform.findUnique({
        where: { id: parseInt(id) }
      });

      if (!currentPlatform) {
        throw new Error('Platform not found');
      }

      interface UpdateData {
        updated_at: Date;
        username?: string;
        password?: string;
        [key: string]: unknown;
      }
      
      const updateData: UpdateData = {
        ...otherFields,
        updated_at: new Date(),
      };

      // Track credential changes
      const historyRecords = [];

      if (username !== undefined && username !== decrypt(currentPlatform.username || '')) {
        updateData.username = encrypt(username);
        historyRecords.push({
          platform_id: parseInt(id),
          field_name: 'username',
          old_value: currentPlatform.username,
          new_value: updateData.username,
          changed_by: changed_by || null,
          changed_at: new Date(),
        });
      }

      if (password !== undefined && password !== decrypt(currentPlatform.password || '')) {
        updateData.password = encrypt(password);
        historyRecords.push({
          platform_id: parseInt(id),
          field_name: 'password',
          old_value: currentPlatform.password,
          new_value: updateData.password,
          changed_by: changed_by || null,
          changed_at: new Date(),
        });
      }

      if (otherFields.profile_id !== undefined && otherFields.profile_id !== currentPlatform.profile_id) {
        historyRecords.push({
          platform_id: parseInt(id),
          field_name: 'profile_id',
          old_value: currentPlatform.profile_id,
          new_value: otherFields.profile_id,
          changed_by: changed_by || null,
          changed_at: new Date(),
        });
      }

      // Update platform
      const updated = await tx.socialMediaPlatform.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      // Save history records
      if (historyRecords.length > 0) {
        await tx.credentialHistory.createMany({
          data: historyRecords
        });
      }

      return updated;
    });

    // Return decrypted data
    return NextResponse.json({
      ...result,
      username: result.username ? decrypt(result.username) : '',
      password: result.password ? decrypt(result.password) : '',
    });
  } catch (error) {
    console.error('Error updating platform:', error);
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    );
  }
}