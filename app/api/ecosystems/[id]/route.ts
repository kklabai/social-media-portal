import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/ecosystems/[id] - Get a specific ecosystem
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
        { error: 'Invalid ecosystem ID' },
        { status: 400 }
      );
    }
    
    const ecosystemId = parseInt(id);
    if (isNaN(ecosystemId)) {
      return NextResponse.json(
        { error: 'Invalid ecosystem ID format' },
        { status: 400 }
      );
    }
    
    const ecosystem = await prisma.ecosystem.findUnique({
      where: { id: ecosystemId },
      include: {
        platforms: true,
        userEcosystems: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!ecosystem) {
      return NextResponse.json(
        { error: 'Ecosystem not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access (admin or assigned to ecosystem)
    if (session.user.role !== 'admin') {
      const hasAccess = ecosystem.userEcosystems.some(
        ue => ue.user_id === session.user.dbId
      );
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(ecosystem);
  } catch (error) {
    console.error('Error fetching ecosystem:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ecosystem' },
      { status: 500 }
    );
  }
}

// DELETE /api/ecosystems/[id] - Delete an ecosystem
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only admin users can delete ecosystems' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Use transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete all credential history for platforms in this ecosystem
      await tx.credentialHistory.deleteMany({
        where: {
          platform: {
            ecosystem_id: parseInt(id)
          }
        }
      });
      
      // Delete all platforms in this ecosystem
      await tx.socialMediaPlatform.deleteMany({
        where: {
          ecosystem_id: parseInt(id)
        }
      });
      
      // Delete all user-ecosystem assignments
      await tx.userEcosystem.deleteMany({
        where: {
          ecosystem_id: parseInt(id)
        }
      });
      
      // Finally delete the ecosystem
      await tx.ecosystem.delete({
        where: {
          id: parseInt(id)
        }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ecosystem:', error);
    return NextResponse.json(
      { error: 'Failed to delete ecosystem' },
      { status: 500 }
    );
  }
}