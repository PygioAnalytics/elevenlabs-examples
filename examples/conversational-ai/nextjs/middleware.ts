import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Log all API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`🌐 ${request.method} ${request.nextUrl.pathname}`);
    console.log(`🔗 User-Agent: ${request.headers.get('user-agent')}`);
    console.log(`🌍 Origin: ${request.headers.get('origin')}`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}
