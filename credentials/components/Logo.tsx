import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  fontSize?: number;
  linkToHome?: boolean;
}

export default function Logo({ size = 28, fontSize = 24, linkToHome = true }: LogoProps) {
  const gavelIcon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 13l-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/>
      <path d="M16 11l3-3-2-2-3 3"/>
      <path d="M18 9l2-2-2-2-2 2"/>
    </svg>
  );

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: linkToHome ? 'pointer' : 'default' }}>
      {gavelIcon}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: `${fontSize}px`, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.1, fontFamily: 'sans-serif' }}>
          Chrono<span style={{ color: '#06b6d4' }}>Bid</span>
        </h1>
        <p style={{ fontSize: `${Math.max(10, fontSize * 0.45)}px`, color: '#64748b', margin: '2px 0 0 0', lineHeight: 1, fontFamily: 'sans-serif' }}>
          Bid. Win. Own History.
        </p>
      </div>
    </div>
  );

  if (linkToHome) {
    return <Link href="/" style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  return content;
}
