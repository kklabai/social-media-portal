import { NextResponse } from "next/server";
import { nocodb, TABLES } from "@/lib/api/nocodb";

export async function GET() {
  try {
    // Get all user_ecosystems records
    const allRecords = await nocodb.list(TABLES.USER_ECOSYSTEMS);
    
    // Get first 5 users
    const users = await nocodb.list(TABLES.USERS, { limit: 5 });
    
    // Get first 5 ecosystems  
    const ecosystems = await nocodb.list(TABLES.ECOSYSTEMS, { limit: 5 });
    
    return NextResponse.json({
      userEcosystems: {
        count: allRecords.pageInfo?.totalRows || 0,
        records: allRecords.list || [],
        firstRecord: allRecords.list?.[0] || null,
        fieldNames: allRecords.list?.[0] ? Object.keys(allRecords.list[0]) : []
      },
      users: {
        count: users.list?.length || 0,
        sample: users.list?.[0] || null
      },
      ecosystems: {
        count: ecosystems.list?.length || 0,
        sample: ecosystems.list?.[0] || null
      }
    });
  } catch (error) {
    console.error("Error checking records:", error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "Failed to check records") },
      { status: 500 }
    );
  }
}