import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/utils/encryption";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platformId = searchParams.get('platformId');

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

    const whereClause: { platform_id?: number | { in: number[] } } = {};
    
    // If platformId is provided, fetch credential history for that platform
    if (platformId) {
      whereClause.platform_id = parseInt(platformId);
      
      // Verify user has access to this platform's ecosystem
      const platform = await prisma.socialMediaPlatform.findUnique({
        where: { id: parseInt(platformId) },
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
    } else if (session.user.role !== 'admin') {
      // Non-admin users can only see their assigned ecosystems' platforms
      const userEcosystems = await prisma.userEcosystem.findMany({
        where: { user_id: session.user.dbId },
        select: { ecosystem_id: true }
      });
      
      const ecosystemIds = userEcosystems.map(ue => ue.ecosystem_id);
      
      const platforms = await prisma.socialMediaPlatform.findMany({
        where: {
          ecosystem_id: { in: ecosystemIds }
        },
        select: { id: true }
      });
      
      const platformIds = platforms.map(p => p.id);
      whereClause.platform_id = { in: platformIds };
    }
    
    const credentialHistory = await prisma.credentialHistory.findMany({
      where: whereClause,
      include: {
        platform: {
          select: {
            platform_name: true,
            ecosystem: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        changed_at: 'desc'
      }
    });

    // Decrypt old and new values for display
    const decryptedHistory = credentialHistory.map((record) => ({
      ...record,
      old_value: record.field_name !== 'profile_id' && record.old_value ? 
        decrypt(record.old_value) : record.old_value,
      new_value: record.field_name !== 'profile_id' && record.new_value ? 
        decrypt(record.new_value) : record.new_value,
    }));

    return NextResponse.json({ list: decryptedHistory });
  } catch (error) {
    console.error("Error fetching credential history:", error);
    return NextResponse.json(
      { error: "Failed to fetch credential history" },
      { status: 500 }
    );
  }
}