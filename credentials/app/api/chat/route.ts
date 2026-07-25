import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Enforce seller-only questions
    const lowerMessage = message.toLowerCase();
    const buyerKeywords = ['buy', 'bidder', 'purchase', 'shopping', 'cart', 'checkout', 'pay for item'];
    const sellerKeywords = ['sell', 'auction', 'listing', 'seller', 'fee', 'payout'];
    
    const hasBuyerIntent = buyerKeywords.some(kw => lowerMessage.includes(kw));
    const hasSellerIntent = sellerKeywords.some(kw => lowerMessage.includes(kw));
    
    if (hasBuyerIntent && !hasSellerIntent) {
      return NextResponse.json({ 
        answer: "I am Jasper, your exclusive Seller Assistant. I can only answer questions related to selling, listing items, and managing your seller account. For buyer support, please contact our general help desk." 
      });
    }

    // Connect to the trained AI smart-assistant
    const res = await fetch('http://127.0.0.1:8004/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message })
    });

    if (!res.ok) {
      throw new Error('AI Server is down');
    }

    const data = await res.json();
    return NextResponse.json({ answer: data.answer });
  } catch (error) {
    console.error('Chat AI Error:', error);
    return NextResponse.json({ answer: "Sorry, my AI core is currently offline. Please try again later." }, { status: 500 });
  }
}
