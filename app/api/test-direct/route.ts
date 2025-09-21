import { NextRequest, NextResponse } from "next/server";

const NOCODB_URL = process.env.NEXT_PUBLIC_NOCODB_API_URL;
const TOKEN = process.env.NOCODB_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID;

export async function GET(request: NextRequest) {
  try {
    // First, let's get a sample user ecosystem record to see the structure
    const response = await fetch(
      `${NOCODB_URL}/db/data/v1/${PROJECT_ID}/user_ecosystems?limit=10`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
      }
    );

    const data = await response.json();
    
    // Also get the table metadata
    const metaResponse = await fetch(
      `${NOCODB_URL}/api/v2/meta/bases/${PROJECT_ID}/tables`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
      }
    );
    
    const metaData = await metaResponse.json();
    const userEcosystemsTable = metaData.list?.find((t: any) => 
      t.title === 'user_ecosystems' || t.table_name === 'user_ecosystems'
    );

    return NextResponse.json({
      records: data.list || [],
      pageInfo: data.pageInfo,
      tableInfo: userEcosystemsTable,
      message: "Check the structure of existing records and table metadata"
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, ecosystemId } = await request.json();
    
    // Try creating with just the basic fields first
    const basicData = {
      assigned_at: new Date().toISOString()
    };
    
    console.log("Creating with basic data:", basicData);
    
    const response = await fetch(
      `${NOCODB_URL}/db/data/v1/${PROJECT_ID}/user_ecosystems`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xc-token": TOKEN!,
        },
        body: JSON.stringify(basicData),
      }
    );

    const result = await response.json();
    console.log("Basic creation result:", result);
    
    if (!response.ok) {
      return NextResponse.json({ error: result }, { status: response.status });
    }
    
    // Now try to update it with the linked records
    if (result.Id) {
      const updateData = {
        nc_a7ke_user_ecosystems_user_id: userId,
        nc_a7ke_user_ecosystems_ecosystem_id: ecosystemId
      };
      
      console.log("Updating with:", updateData);
      
      const updateResponse = await fetch(
        `${NOCODB_URL}/db/data/v1/${PROJECT_ID}/user_ecosystems/${result.Id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "xc-token": TOKEN!,
          },
          body: JSON.stringify(updateData),
        }
      );
      
      const updateResult = await updateResponse.json();
      console.log("Update result:", updateResult);
      
      return NextResponse.json({
        createResult: result,
        updateResult: updateResult
      });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create" },
      { status: 500 }
    );
  }
}