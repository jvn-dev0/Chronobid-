import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  fontSize?: number;
  linkToHome?: boolean;
  light?: boolean;
}

export default function Logo({ size = 42, fontSize = 32, linkToHome = true, light = false }: LogoProps) {
  const goldColor = '#D9A928';
  const navyColor = light ? '#FFFFFF' : '#0F172A';
  const taglineColor = light ? '#A7B1C2' : '#475569';

  const gavelIcon = (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={goldColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 13l-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/>
      <path d="M16 11l3-3-2-2-3 3"/>
      <path d="M18 9l2-2-2-2-2 2"/>
    </svg>
  );

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: linkToHome ? 'pointer' : 'default' }}>
      {gavelIcon}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: `${fontSize}px`, fontWeight: 950, color: navyColor, margin: 0, lineHeight: 1.05, fontFamily: 'sans-serif', letterSpacing: '-0.03em' }}>
          Chrono<span style={{ color: goldColor }}>Bid</span>
        </h1>
        <p style={{ fontSize: `${Math.max(13, Math.round(fontSize * 0.38))}px`, color: taglineColor, margin: '3px 0 0 0', lineHeight: 1, fontFamily: 'sans-serif', fontWeight: 750, letterSpacing: '0.04em' }}>
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
