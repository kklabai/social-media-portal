import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateTOTPSecret } from '@/lib/utils/totp';
import { encrypt } from '@/lib/utils/encryption';

// POST /api/platforms/[id]/totp/setup - Generate TOTP secret
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
    const body = await request.json();
    const { userEmail } = body;

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
    
    if (platform.totp_enabled) {
      return NextResponse.json(
        { error: 'TOTP is already enabled for this platform' },
        { status: 400 }
      );
    }

    const totpData = await generateTOTPSecret(platform.platform_name, userEmail || session.user.email);
    
    // Store encrypted secret temporarily - user must verify before enabling
    await prisma.socialMediaPlatform.update({
      where: { id: parseInt(id) },
      data: {
        totp_secret: encrypt(totpData.secret),
        updated_at: new Date(),
      }
    });

    return NextResponse.json({
      secret: totpData.secret,
      qrCodeUrl: totpData.qrCodeUrl,
    });
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    return NextResponse.json(
      { error: 'Failed to setup TOTP' },
      { status: 500 }
    );
  }
}