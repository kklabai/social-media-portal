import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyTOTP } from '@/lib/utils/totp';
import { encrypt } from '@/lib/utils/encryption';

// PUT /api/platforms/[id]/totp/verify - Store the platform's TOTP secret
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
    const body = await request.json();
    const { secret, token } = body;

    if (!secret || !secret.trim()) {
      return NextResponse.json(
        { error: 'Secret key is required' },
        { status: 400 }
      );
    }

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
    
    // If a token is provided, verify it with the secret
    if (token && token.trim()) {
      const isValid = verifyTOTP(token, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code. Please check the secret and try again.' },
          { status: 400 }
        );
      }
    }

    // Store the encrypted secret
    await prisma.socialMediaPlatform.update({
      where: { id: parseInt(id) },
      data: {
        totp_secret: encrypt(secret),
        totp_enabled: true,
        updated_at: new Date(),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify TOTP' },
      { status: 500 }
    );
  }
}