import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
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
        { error: 'Only admin users can access user details' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        userEcosystems: {
          include: {
            ecosystem: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { error: 'Only admin users can update users' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
        email: body.email,
        ecitizen_id: body.ecitizen_id,
        role: body.role,
        updated_at: new Date()
      },
      include: {
        userEcosystems: {
          include: {
            ecosystem: true
          }
        }
      }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

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
        { error: 'Only admin users can delete users' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Use transaction to delete user and their assignments
    await prisma.$transaction(async (tx) => {
      // Delete user-ecosystem assignments
      await tx.userEcosystem.deleteMany({
        where: { user_id: parseInt(id) }
      });
      
      // Delete the user
      await tx.user.delete({
        where: { id: parseInt(id) }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}