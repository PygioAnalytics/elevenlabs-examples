import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("🎯 WEBHOOK-TEST POST request received");
  console.log("Headers:", Object.fromEntries(req.headers.entries()));
  const body = await req.text();
  console.log("Body:", body);
  return NextResponse.json({ received: true });
}

export async function GET(req: NextRequest) {
  console.log("🎯 WEBHOOK-TEST GET request received");
  return NextResponse.json({ status: "webhook-test endpoint is working" });
}

export async function PUT(req: NextRequest) {
  console.log("🎯 WEBHOOK-TEST PUT request received");
  const body = await req.text();
  console.log("Body:", body);
  return NextResponse.json({ received: true });
}

export async function PATCH(req: NextRequest) {
  console.log("🎯 WEBHOOK-TEST PATCH request received");
  const body = await req.text();
  console.log("Body:", body);
  return NextResponse.json({ received: true });
}
