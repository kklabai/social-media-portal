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
    
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin users can access user list' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause for search
    interface WhereClause {
      OR?: Array<{ email?: { contains: string }; name?: { contains: string }; ecitizen_id?: { contains: string } }>;
      role?: string;
    }
    const where: WhereClause = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { ecitizen_id: { contains: search } }
      ];
    }
    
    if (role) {
      where.role = role;
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      include: {
        userEcosystems: {
          include: {
            ecosystem: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit
    });

    // Format users with ecosystem count
    const formattedUsers = users.map(user => ({
      ...user,
      ecosystem_count: user.userEcosystems.length
    }));

    return NextResponse.json({ 
      list: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Only admin users can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        ecitizen_id: body.ecitizen_id,
        role: body.role || 'user',
      }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}