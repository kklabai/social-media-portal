import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
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
    
    // Allow users to see their own assignments, but only admins can see all
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (session.user.role !== 'admin' && userId && parseInt(userId) !== session.user.dbId) {
      return NextResponse.json(
        { error: 'You can only view your own ecosystem assignments' },
        { status: 403 }
      );
    }
    
    interface WhereClause {
      user_id?: number;
    }
    const whereClause: WhereClause = {};
    if (userId) {
      whereClause.user_id = parseInt(userId);
    } else if (session.user.role !== 'admin') {
      // Non-admin users can only see their own assignments
      whereClause.user_id = session.user.dbId;
    }
    
    const userEcosystems = await prisma.userEcosystem.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ecosystem: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      }
    });
    
    return NextResponse.json({ list: userEcosystems });
  } catch (error) {
    console.error("Error fetching user-ecosystems:", error);
    return NextResponse.json(
      { error: "Failed to fetch user-ecosystems" },
      { status: 500 }
    );
  }
}