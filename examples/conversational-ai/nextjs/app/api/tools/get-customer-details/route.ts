import { NextRequest, NextResponse } from "next/server";

// This is the server-side tool that the ElevenLabs agent will call
// It returns customer data to the LLM for use in conversations
export async function POST(request: NextRequest) {
  try {
    // Parse the request from ElevenLabs
    const body = await request.json();
    console.log('🔧 Server tool called: get-customer-details', body);

    // In a real application, you would:
    // 1. Extract customer ID from the request parameters
    // 2. Query your database or CRM system
    // 3. Return real customer data
    
    // For demo purposes, return the same dummy data
    const customerData = {
      id: 12345,
      name: "Nicolas",
      loan_type: "Mobile Handset Loan",
      device_type: "Samsung Galaxy S24",
      device_value: 24000.00,
      monthly_instalment: 2000.00,
      outstanding_payments: 6,
      payment_status: "30_days",
      bank_name: "Standard Bank",
      account_number: "155555555",
    };

    // Format the response for the LLM
    const responseText = `Customer Details Retrieved:
Customer ID: ${customerData.id}
Name: ${customerData.name}
Loan Type: ${customerData.loan_type}
Device: ${customerData.device_type}
Device Value: R${customerData.device_value.toLocaleString()}
Monthly Instalment: R${customerData.monthly_instalment}
Outstanding Payments: ${customerData.outstanding_payments}
Payment Status: ${customerData.payment_status} overdue
Bank: ${customerData.bank_name}
Account Number: ${customerData.account_number}

This customer has ${customerData.outstanding_payments} outstanding payments and is ${customerData.payment_status} overdue.`;

    console.log('✅ Server tool returning:', responseText);

    // Return the response that the LLM will receive
    return NextResponse.json({
      success: true,
      data: responseText
    });

  } catch (error) {
    console.error('❌ Server tool error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve customer details',
        data: 'Error: Unable to retrieve customer information. Please try again or contact support.'
      },
      { status: 500 }
    );
  }
}
