import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, user_role = 'bidder', user_id = 1 } = await request.json();
    
    // Connect to the unified JasperBot on port 8004
    const res = await fetch('http://127.0.0.1:8004/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_role, user_id, message })
    });
    
    if (!res.ok) {
      throw new Error('AI Server is down');
    }

    const data = await res.json();
    return NextResponse.json({ 
      answer: data.jasper_reply,
      jasper_reply: data.jasper_reply,
      recommendations: data.recommendations || []
    });
  } catch (error) {
    console.error('Chat AI Error:', error);
    return NextResponse.json({ 
      answer: "Good day, sir/madam. My AI core is currently offline. Please try again later.",
      jasper_reply: "Good day, sir/madam. My AI core is currently offline. Please try again later.",
      recommendations: []
    }, { status: 500 });
  }
}

