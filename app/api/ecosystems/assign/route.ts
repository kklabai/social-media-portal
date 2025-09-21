import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST /api/ecosystems/assign - Assign an ecosystem to a user
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
        { error: 'Only admin users can assign ecosystems' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { user_id, ecosystem_id, assigned_by } = body;

    if (!user_id || !ecosystem_id) {
      return NextResponse.json(
        { error: 'user_id and ecosystem_id are required' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.userEcosystem.findUnique({
      where: {
        user_id_ecosystem_id: {
          user_id: parseInt(user_id),
          ecosystem_id: parseInt(ecosystem_id)
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This ecosystem is already assigned to the user' },
        { status: 409 }
      );
    }

    const assignment = await prisma.userEcosystem.create({
      data: {
        user_id: parseInt(user_id),
        ecosystem_id: parseInt(ecosystem_id),
        assigned_by: assigned_by || session.user.dbId,
        assigned_at: new Date()
      },
      include: {
        user: true,
        ecosystem: true
      }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning ecosystem:', error);
    return NextResponse.json(
      { error: 'Failed to assign ecosystem' },
      { status: 500 }
    );
  }
}

// DELETE /api/ecosystems/assign - Remove ecosystem assignment
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ecosystem_id } = body;

    if (!user_id || !ecosystem_id) {
      return NextResponse.json(
        { error: 'user_id and ecosystem_id are required' },
        { status: 400 }
      );
    }

    const assignments = await nocodb.list(TABLES.USER_ECOSYSTEMS, {
      where: `(user_id,eq,${user_id})~and(ecosystem_id,eq,${ecosystem_id})`,
    });

    if (assignments.list && assignments.list.length > 0) {
      await nocodb.delete(TABLES.USER_ECOSYSTEMS, assignments.list[0].id);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error removing ecosystem assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove ecosystem assignment' },
      { status: 500 }
    );
  }
}