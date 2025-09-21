import { NextRequest, NextResponse } from "next/server";

// This is a temporary workaround for the LinkToAnotherRecord issue
// It creates a simple record that can be manually linked in NocoDB UI
export async function POST(request: NextRequest) {
  try {
    const { userId, ecosystemId } = await request.json();
    
    const message = `
    Due to NocoDB LinkToAnotherRecord configuration, automatic assignment is not working.
    
    Please manually assign in NocoDB:
    1. Go to https://sm.unclutch.dev
    2. Navigate to the user_ecosystems table
    3. Find the record with Id that was created (check records with user_id=0 and ecosystem_id=0)
    4. Edit the record and set:
       - user_id: Select user with ID ${userId}
       - ecosystem_id: Select ecosystem with ID ${ecosystemId}
    5. Save the record
    
    Alternatively, if you have database access, run:
    UPDATE user_ecosystems 
    SET user_id = ${userId}, ecosystem_id = ${ecosystemId} 
    WHERE user_id = 0 AND ecosystem_id = 0 
    ORDER BY Id DESC 
    LIMIT 1;
    `;
    
    return NextResponse.json({ 
      success: false,
      manual_intervention_required: true,
      instructions: message
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}