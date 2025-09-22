import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const NOCODB_URL = process.env.NEXT_PUBLIC_NOCODB_API_URL;
const TOKEN = process.env.NOCODB_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tableName = searchParams.get("table") || "user_ecosystems";

    // Get table metadata
    const metaResponse = await axios.get(
      `${NOCODB_URL}/api/v1/db/meta/projects/${PROJECT_ID}/bases`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
      }
    );

    // Get table columns
    const tableResponse = await axios.get(
      `${NOCODB_URL}/api/v1/db/meta/tables`,
      {
        headers: {
          "xc-token": TOKEN!,
        },
        params: {
          project_id: PROJECT_ID
        }
      }
    );

    // Try to get columns for the specific table
    const tables = tableResponse.data?.list || [];
    const targetTable = tables.find((t: { title: string; table_name: string; id: string }) => t.title === tableName || t.table_name === tableName);

    if (targetTable) {
      const columnsResponse = await axios.get(
        `${NOCODB_URL}/api/v1/db/meta/columns/${targetTable.id}`,
        {
          headers: {
            "xc-token": TOKEN!,
          },
        }
      );

      return NextResponse.json({
        tableName,
        tableId: targetTable.id,
        tableData: targetTable,
        columns: columnsResponse.data,
        bases: metaResponse.data
      });
    }

    return NextResponse.json({
      tableName,
      tables: tables.map((t: { id: string; title: string; table_name: string }) => ({ id: t.id, title: t.title, table_name: t.table_name })),
      bases: metaResponse.data
    });
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data: unknown }; message: string };
      console.error("Error getting table info:", axiosError.response?.data || error);
      return NextResponse.json(
        { error: "Failed to get table info", details: axiosError.response?.data || axiosError.message },
        { status: 500 }
      );
    }
    console.error("Error getting table info:", error);
    return NextResponse.json(
      { error: "Failed to get table info", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}