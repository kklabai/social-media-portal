import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import axios from 'axios';

// POST /api/platforms/[id]/check-link - Check if platform link is active
export async function POST(
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
    
    // Verify user has access to this platform
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

    if (!platform.profile_url) {
      return NextResponse.json({
        status: 'error',
        message: 'No profile URL configured',
      });
    }

    try {
      const response = await axios.head(platform.profile_url, {
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      return NextResponse.json({
        status: response.status < 400 ? 'active' : 'error',
        statusCode: response.status,
        url: platform.profile_url,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to check link',
        url: platform.profile_url,
        checkedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error checking platform link:', error);
    return NextResponse.json(
      { error: 'Failed to check platform link' },
      { status: 500 }
    );
  }
}