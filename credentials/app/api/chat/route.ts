import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, user_role = 'guest', user_id = null } = await request.json();
    
    // Connect to the unified JasperBot
    const res = await fetch('http://127.0.0.1:8004/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_role, user_id, message })
    });
    
    if (!res.ok) {
      throw new Error('AI Server is down');
    }

    const data = await res.json();
    return NextResponse.json({ answer: data.jasper_reply });
  } catch (error) {
    console.error('Chat AI Error:', error);
    return NextResponse.json({ answer: "Sorry, my AI core is currently offline. Please try again later." }, { status: 500 });
  }
}
