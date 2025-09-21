import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { decrypt } from '@/lib/utils/encryption';

// GET /api/platforms/[id]/history - Get credential history for a platform
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
    
    // Verify user has access to this platform's ecosystem
    const platform = await prisma.socialMediaPlatform.findUnique({
      where: { id: parseInt(id) },
      include: {
        ecosystem: {
          include: {
            userEcosystems: {
              where: {
                user_id: session.user.dbId
              }
            }
          }
        }
      }
    });
    
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (admin or assigned to ecosystem)
    if (session.user.role !== 'admin' && platform.ecosystem.userEcosystems.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const history = await prisma.credentialHistory.findMany({
      where: {
        platform_id: parseInt(id)
      },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        changed_at: 'desc'
      }
    });

    // Decrypt old and new values for display
    const decryptedHistory = history.map((record) => ({
      ...record,
      old_value: record.field_name !== 'profile_id' && record.old_value ? 
        decrypt(record.old_value) : record.old_value,
      new_value: record.field_name !== 'profile_id' && record.new_value ? 
        decrypt(record.new_value) : record.new_value,
      changed_by_user: record.changedByUser
    }));

    return NextResponse.json({ list: decryptedHistory });
  } catch (error) {
    console.error('Error fetching credential history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credential history' },
      { status: 500 }
    );
  }
}