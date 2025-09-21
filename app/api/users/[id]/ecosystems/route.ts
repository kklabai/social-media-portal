import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    // Get user's ecosystem assignments
    const userEcosystems = await prisma.userEcosystem.findMany({
      where: {
        user_id: userId
      },
      include: {
        ecosystem: true
      }
    });
    
    const ecosystemIds = userEcosystems.map(ue => ue.ecosystem_id);
    
    return NextResponse.json({ ecosystemIds });
  } catch (error) {
    console.error("Error fetching user ecosystems:", error);
    return NextResponse.json(
      { error: "Failed to fetch user ecosystems" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const { ecosystemIds } = await request.json();
    
    console.log(`Updating ecosystems for user ${userId} with`, ecosystemIds);
    
    // Get session to find who is making the assignment
    const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    let assignedBy = null;
    if (sessionRes.ok) {
      const session = await sessionRes.json();
      assignedBy = session.user?.dbId || null;
    }
    
    // Delete existing assignments in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all existing assignments for this user
      await tx.userEcosystem.deleteMany({
        where: {
          user_id: userId
        }
      });
      
      // Create new assignments
      if (ecosystemIds && ecosystemIds.length > 0) {
        await tx.userEcosystem.createMany({
          data: ecosystemIds.map((ecosystemId: string) => ({
            user_id: userId,
            ecosystem_id: parseInt(ecosystemId),
            assigned_by: assignedBy
          }))
        });
      }
    });
    
    console.log(`Successfully updated ecosystem assignments for user ${userId}`);
    
    return NextResponse.json({ 
      success: true,
      message: "Ecosystem assignments updated successfully"
    });
  } catch (error) {
    console.error("Error updating user ecosystems:", error);
    return NextResponse.json(
      { error: "Failed to update user ecosystems" },
      { status: 500 }
    );
  }
}