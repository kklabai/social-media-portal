import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/utils/encryption';

// GET /api/platforms/[id] - Get a specific platform
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session to check permissions
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
    
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid platform ID' },
        { status: 400 }
      );
    }
    
    const platformId = parseInt(id);
    if (isNaN(platformId)) {
      return NextResponse.json(
        { error: 'Invalid platform ID format' },
        { status: 400 }
      );
    }
    
    // Get platform with ecosystem info
    const platform = await prisma.socialMediaPlatform.findUnique({
      where: { id: platformId },
      include: {
        ecosystem: true
      }
    });
    
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (admin or assigned to ecosystem)
    if (session.user.role !== 'admin') {
      const userEcosystem = await prisma.userEcosystem.findFirst({
        where: {
          user_id: session.user.dbId,
          ecosystem_id: platform.ecosystem_id
        }
      });
      
      if (!userEcosystem) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }
    
    // Decrypt sensitive fields
    const decryptedPlatform = {
      ...platform,
      username: platform.username ? decrypt(platform.username) : '',
      password: platform.password ? decrypt(platform.password) : '',
      totp_secret: platform.totp_secret ? decrypt(platform.totp_secret) : '',
    };
    
    return NextResponse.json(decryptedPlatform);
  } catch (error) {
    console.error('Error fetching platform:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform' },
      { status: 500 }
    );
  }
}

// PUT /api/platforms/[id] - Update a platform
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session to check permissions
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
    
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid platform ID' },
        { status: 400 }
      );
    }
    
    const platformId = parseInt(id);
    if (isNaN(platformId)) {
      return NextResponse.json(
        { error: 'Invalid platform ID format' },
        { status: 400 }
      );
    }
    
    // Check if platform exists and user has access
    const platform = await prisma.socialMediaPlatform.findUnique({
      where: { id: platformId }
    });
    
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (admin or assigned to ecosystem)
    if (session.user.role !== 'admin') {
      const userEcosystem = await prisma.userEcosystem.findFirst({
        where: {
          user_id: session.user.dbId,
          ecosystem_id: platform.ecosystem_id
        }
      });
      
      if (!userEcosystem) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }
    
    const body = await request.json();
    const { username, password, changed_by, ...otherFields } = body;
    
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        ...otherFields,
        updated_at: new Date(),
      };
      
      // Track credential changes
      const historyRecords = [];
      
      if (username !== undefined && username !== decrypt(platform.username || '')) {
        updateData.username = encrypt(username);
        historyRecords.push({
          platform_id: platformId,
          field_name: 'username',
          old_value: platform.username,
          new_value: updateData.username,
          changed_by: changed_by || session.user.dbId || null,
          changed_at: new Date(),
        });
      }
      
      if (password !== undefined && password !== decrypt(platform.password || '')) {
        updateData.password = encrypt(password);
        historyRecords.push({
          platform_id: platformId,
          field_name: 'password',
          old_value: platform.password,
          new_value: updateData.password,
          changed_by: changed_by || session.user.dbId || null,
          changed_at: new Date(),
        });
      }
      
      if (otherFields.profile_id !== undefined && otherFields.profile_id !== platform.profile_id) {
        historyRecords.push({
          platform_id: platformId,
          field_name: 'profile_id',
          old_value: platform.profile_id,
          new_value: otherFields.profile_id,
          changed_by: changed_by || session.user.dbId || null,
          changed_at: new Date(),
        });
      }
      
      // Update platform
      const updated = await tx.socialMediaPlatform.update({
        where: { id: platformId },
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

// DELETE /api/platforms/[id] - Delete a platform
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session to check permissions
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
        { error: 'Only admin users can delete platforms' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid platform ID' },
        { status: 400 }
      );
    }
    
    const platformId = parseInt(id);
    if (isNaN(platformId)) {
      return NextResponse.json(
        { error: 'Invalid platform ID format' },
        { status: 400 }
      );
    }
    
    // Use transaction to delete platform and related data
    await prisma.$transaction(async (tx) => {
      // Delete credential history
      await tx.credentialHistory.deleteMany({
        where: { platform_id: platformId }
      });
      
      // Delete the platform
      await tx.socialMediaPlatform.delete({
        where: { id: platformId }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting platform:', error);
    return NextResponse.json(
      { error: 'Failed to delete platform' },
      { status: 500 }
    );
  }
}