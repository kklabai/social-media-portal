import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { v4 as uuidv4 } from 'uuid';

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

    if (!ecosystemId || ecosystemId === 'undefined') {
      return NextResponse.json(
        { error: 'ecosystemId is required' },
        { status: 400 }
      );
    }

    const parsedEcosystemId = parseInt(ecosystemId);
    if (isNaN(parsedEcosystemId)) {
      return NextResponse.json(
        { error: 'Invalid ecosystemId format' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    let where: any = {
      ecosystem_id: parsedEcosystemId
    };

    if (search) {
      where.OR = [
        { platform_name: { contains: search, mode: 'insensitive' } },
        { platform_type: { contains: search, mode: 'insensitive' } },
        { profile_url: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (platformType) {
      where.platform_type = { contains: platformType, mode: 'insensitive' };
    }

    if (totpFilter !== null && totpFilter !== undefined) {
      where.totp_enabled = totpFilter === 'true';
    }

    // Get total count for pagination
    const total = await prisma.socialMediaPlatform.count({ where });

    // Get paginated platforms
    const platforms = await prisma.socialMediaPlatform.findMany({
      where,
      orderBy: {
        platform_name: 'asc'
      },
      skip,
      take: limit
    });

    // Decrypt sensitive fields
    const decryptedPlatforms = platforms.map((platform: any) => ({
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

      const updateData: any = {
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