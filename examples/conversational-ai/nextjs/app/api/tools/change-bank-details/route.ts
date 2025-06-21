import { NextRequest, NextResponse } from "next/server";

// This is the server-side tool for changing bank details
// The ElevenLabs agent will call this when users request to update banking information
export async function POST(request: NextRequest) {
  try {
    // Parse the request from ElevenLabs
    const body = await request.json();
    console.log('🔧 Server tool called: change-bank-details', body);

    // Extract parameters that the LLM identified from the conversation
    const { bank_name, account_number } = body;

    // Validation
    if (!bank_name || !account_number) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        data: 'Error: Both bank name and account number are required to update banking details.'
      }, { status: 400 });
    }

    // In a real application, you would:
    // 1. Update the customer's bank details in your database
    // 2. Log the change for audit purposes
    // 3. Possibly send notifications
    
    // For demo purposes, simulate the update
    const previousBankName = "Standard Bank";
    const previousAccountNumber = "155555555";

    // Format the response for the LLM
    const responseText = `Bank Details Successfully Updated:

Previous Details:
- Bank: ${previousBankName}
- Account: ${previousAccountNumber}

New Details:
- Bank: ${bank_name}
- Account: ${account_number}

The customer's banking details have been successfully updated in the system. The new bank details are now ${bank_name} with account number ${account_number}. This change has been recorded and will be effective immediately for future transactions.`;

    console.log('✅ Server tool returning:', responseText);

    // Return the response that the LLM will receive
    return NextResponse.json({
      success: true,
      data: responseText,
      updated_details: {
        bank_name,
        account_number,
        previous_bank_name: previousBankName,
        previous_account_number: previousAccountNumber,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Server tool error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update bank details',
        data: 'Error: Unable to update banking information. Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}
