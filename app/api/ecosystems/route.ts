import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/ecosystems - List all ecosystems (filtered for non-admin users)
export async function GET(request: NextRequest) {
  try {
    // Get user session
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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const theme = searchParams.get('theme') || '';
    const activeStatus = searchParams.get('activeStatus');
    
    const skip = (page - 1) * limit;

    interface WhereClause {
      OR?: Array<{ name?: { contains: string } | undefined; description?: { contains: string } | undefined }>;
      theme?: string;
      active_status?: boolean;
      id?: { in: number[] };
    }
    
    const where: WhereClause = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }
    
    if (theme && theme !== 'all') {
      where.theme = theme;
    }
    
    if (activeStatus !== null && activeStatus !== '') {
      where.active_status = activeStatus === 'true';
    }

    // For non-admin users, filter by assigned ecosystems
    if (session.user.role !== 'admin') {
      const userEcosystems = await prisma.userEcosystem.findMany({
        where: { user_id: session.user.dbId },
        select: { ecosystem_id: true }
      });
      
      const ecosystemIds = userEcosystems.map(ue => ue.ecosystem_id);
      where.id = { in: ecosystemIds };
    }

    // Get total count for pagination
    const total = await prisma.ecosystem.count({ where });

    // Get paginated ecosystems
    const ecosystems = await prisma.ecosystem.findMany({
      where,
      include: {
        platforms: true,
        userEcosystems: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit
    });

    // Format the response with additional counts
    const formattedEcosystems = ecosystems.map(ecosystem => ({
      ...ecosystem,
      platform_count: ecosystem.platforms.length,
      user_count: ecosystem.userEcosystems.length
    }));

    return NextResponse.json({ 
      list: formattedEcosystems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching ecosystems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ecosystems' },
      { status: 500 }
    );
  }
}

// POST /api/ecosystems - Create a new ecosystem (admin only)
export async function POST(request: NextRequest) {
  try {
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
        { error: 'Only admin users can create ecosystems' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const ecosystem = await prisma.ecosystem.create({
      data: {
        name: body.name,
        theme: body.theme,
        description: body.description,
        active_status: body.active_status !== undefined ? body.active_status : true,
      }
    });

    return NextResponse.json(ecosystem, { status: 201 });
  } catch (error) {
    console.error('Error creating ecosystem:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ecosystem with this name already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create ecosystem' },
      { status: 500 }
    );
  }
}

// PUT /api/ecosystems - Update an ecosystem
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ecosystem ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.ecosystem.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating ecosystem:', error);
    return NextResponse.json(
      { error: 'Failed to update ecosystem' },
      { status: 500 }
    );
  }
}