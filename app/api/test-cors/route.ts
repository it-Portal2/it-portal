// app/api/test-cors/route.ts
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export async function OPTIONS() {
  console.log('CORS test OPTIONS called');
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

export async function GET() {
  console.log('CORS test GET called');
  return NextResponse.json({ message: 'CORS test successful' }, {
    headers: corsHeaders
  });
}

export async function POST() {
  console.log('CORS test POST called');
  return NextResponse.json({ message: 'CORS POST test successful' }, {
    headers: corsHeaders
  });
}