import { NextRequest, NextResponse } from "next/server";

const NOCODB_URL = process.env.NEXT_PUBLIC_NOCODB_API_URL;
const TOKEN = process.env.NOCODB_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID;

export async function GET(request: NextRequest) {
  try {
    // Get table list first
    const tablesResponse = await fetch(
      `${NOCODB_URL}/api/v1/db/meta/projects/${PROJECT_ID}/tables`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
      }
    );
    
    const tables = await tablesResponse.json();
    const userEcosystemsTable = tables.list?.find((t: any) => 
      t.title === 'user_ecosystems' || t.table_name === 'user_ecosystems'
    );
    
    if (!userEcosystemsTable) {
      return NextResponse.json({ error: "user_ecosystems table not found", tables: tables.list?.map((t: any) => ({ id: t.id, title: t.title, table_name: t.table_name })) });
    }
    
    // Get columns for the table
    const columnsResponse = await fetch(
      `${NOCODB_URL}/api/v1/db/meta/tables/${userEcosystemsTable.id}/columns`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
      }
    );
    
    const columns = await columnsResponse.json();
    
    // Also try to get a sample record with nested data
    const sampleResponse = await fetch(
      `${NOCODB_URL}/db/data/v1/${PROJECT_ID}/user_ecosystems?limit=1&nested[user_id][fields]=Id,name&nested[ecosystem_id][fields]=Id,name`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
      }
    );
    
    const sampleData = await sampleResponse.json();
    
    return NextResponse.json({
      table: userEcosystemsTable,
      columns: columns.list || columns,
      columnSummary: (columns.list || columns || []).map((c: any) => ({
        column_name: c.column_name,
        title: c.title,
        uidt: c.uidt, // UI data type - this tells us if it's LinkToAnotherRecord
        fk_relation_column_id: c.fk_relation_column_id,
        fk_related_model_id: c.fk_related_model_id
      })),
      sampleRecord: sampleData.list?.[0] || null,
      instructions: "Look for columns with uidt='LinkToAnotherRecord' - these need special handling"
    });
  } catch (error: any) {
    console.error("Schema check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check schema" },
      { status: 500 }
    );
  }
}