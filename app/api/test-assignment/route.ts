import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const NOCODB_URL = process.env.NEXT_PUBLIC_NOCODB_API_URL;
const TOKEN = process.env.NOCODB_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_NOCODB_PROJECT_ID;

export async function POST(request: NextRequest) {
  try {
    const { userId, ecosystemId } = await request.json();
    
    // First, let's try different approaches to create the assignment
    const approaches = [
      // Approach 1: Direct IDs as numbers
      {
        name: "Direct numbers",
        data: {
          user_id: Number(userId),
          ecosystem_id: Number(ecosystemId),
          assigned_at: new Date().toISOString()
        }
      },
      // Approach 2: IDs as strings
      {
        name: "Strings",
        data: {
          user_id: String(userId),
          ecosystem_id: String(ecosystemId),
          assigned_at: new Date().toISOString()
        }
      },
      // Approach 3: Linked record format (array)
      {
        name: "Array format",
        data: {
          user_id: [Number(userId)],
          ecosystem_id: [Number(ecosystemId)],
          assigned_at: new Date().toISOString()
        }
      },
      // Approach 4: Object format
      {
        name: "Object format",
        data: {
          user_id: { Id: Number(userId) },
          ecosystem_id: { Id: Number(ecosystemId) },
          assigned_at: new Date().toISOString()
        }
      }
    ];

    const results = [];
    
    for (const approach of approaches) {
      try {
        console.log(`Trying ${approach.name}:`, approach.data);
        
        const response = await axios.post(
          `${NOCODB_URL}/db/data/v1/${PROJECT_ID}/user_ecosystems`,
          approach.data,
          {
            headers: {
              "xc-token": TOKEN!,
              "Content-Type": "application/json"
            }
          }
        );
        
        results.push({
          approach: approach.name,
          success: true,
          data: response.data
        });
        
        // If successful, delete it to try next approach
        if (response.data.Id) {
          await axios.delete(
            `${NOCODB_URL}/db/data/v1/${PROJECT_ID}/user_ecosystems/${response.data.Id}`,
            {
              headers: {
                "xc-token": TOKEN!
              }
            }
          );
        }
      } catch (error) {
        let errorMessage = "Unknown error";
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { data: unknown }; message: string };
          errorMessage = (typeof axiosError.response?.data === 'string' ? axiosError.response.data : JSON.stringify(axiosError.response?.data)) || axiosError.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        results.push({
          approach: approach.name,
          success: false,
          error: errorMessage
        });
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Test assignment error:", error);
    
    let errorDetails = "Unknown error";
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data: unknown }; message: string };
      errorDetails = (typeof axiosError.response?.data === 'string' ? axiosError.response.data : JSON.stringify(axiosError.response?.data)) || axiosError.message;
    } else if (error instanceof Error) {
      errorDetails = error.message;
    }
    
    return NextResponse.json(
      { error: "Test failed", details: errorDetails },
      { status: 500 }
    );
  }
}