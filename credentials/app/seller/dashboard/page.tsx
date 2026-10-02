'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../../../components/Logo';
import styles from './dashboard.module.css';
import { clearSession, getToken } from '../../../lib/api';

const FAQS = [
  { icon: '➕', text: 'How do I add my first item?' },
  { icon: '%',  text: 'What are the selling fees?' },
  { icon: '🛡', text: 'How does escrow work?' },
  { icon: '📈', text: 'Tips to sell items faster' },
  { icon: '🔑', text: 'What items are accepted?' },
];

export default function SellerDashboard() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const [sellerData, setSellerData] = useState<any>(null);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearSession();
    window.location.href = '/';
  };

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch('http://localhost:8000/api/seller/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSellerData(data);
        }
      } catch (err) {
        console.error('Failed to load seller information:', err);
      }
    };
    fetchSellerData();
  }, []);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'ai', text: data.answer }]);
    } catch {
      setMessages(p => [...p, { role: 'ai', text: 'Network error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* ══════════ REFINED TOP NAVIGATION BAR ══════════ */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          {/* Logo + Tagline */}
          <div className={styles.brandGroup}>
            <Logo size={36} fontSize={26} light={true} />
            <span className={styles.tagline}>Bid. Win. Own History.</span>
          </div>

          {/* Navigation Links */}
          <nav className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/seller/sell" className={`${styles.navLink} ${styles.navActive}`}>Sell</Link>
            <Link href="/seller/profile" className={styles.navLink}>My Listings</Link>
            <Link href="/bidder/dashboard" className={styles.navLink}>Bidder View</Link>
            <Link href="/seller/dashboard" className={styles.navLink}>Messages</Link>
            <Link href="/about" className={styles.navLink}>About</Link>
          </nav>

          {/* Right Controls */}
          <div className={styles.navRight}>
            <div className={styles.searchWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search auctions..." className={styles.searchInput} />
            </div>

            <button className={styles.iconBtn} title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifBadge} />
            </button>

            <div className={styles.profileWrap}>
              <button className={styles.profileBtn} onClick={() => setIsProfileOpen(o => !o)}>
                <div className={styles.avatarCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {isProfileOpen && (
                <div className={styles.dropdown}>
                  <Link href="/bidder/dashboard" className={styles.dropItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Bidder View &amp; Live Auctions
                  </Link>
                  <Link href="/seller/profile" className={styles.dropItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile &amp; Account
                  </Link>
                  <Link href="/seller/escrow" className={styles.dropItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    Payout Escrow
                  </Link>
                  <a href="#" onClick={handleLogout} className={`${styles.dropItem} ${styles.dropLogout}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Log Out
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ HERO SECTION WITH PROVIDED BACKGROUND ══════════ */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroMainContent}>
            <div className={styles.sellerBadge}>
              ✦ SELLER HUB
            </div>
            
            <h1 className={styles.heroHeadline}>
              Turn Your <span className={styles.goldText}>Treasures</span><br />
              Into Opportunities
            </h1>

            <p className={styles.heroSubtitle}>
              List vintage treasures, collectibles, artwork, and unique inventions and let collectors discover their value.
            </p>

            <div className={styles.heroCtaGroup}>
              <Link href="/seller/sell" className={styles.primaryCta}>
                <span>+ Create New Listing</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/seller/profile" className={styles.secondaryCta}>
                <span>View My Listings</span>
              </Link>
            </div>
          </div>

          {/* Overlay phrase badge on image */}
          <div className={styles.heroOverlayBadge}>
            <span className={styles.quoteIcon}>✨</span>
            <p className={styles.quoteText}>"Every Object Has a Story"</p>
          </div>
        </div>
      </section>

      {/* ══════════ SELLER ACTIONS & MAIN CONTENT ══════════ */}
      <main className={styles.sectionContainer}>
        
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>PORTAL ACTIONS</div>
          <h2 className={styles.sectionTitle}>Seller Hub Services</h2>
        </div>

        {/* 4 Premium Seller Action Cards */}
        <div className={styles.actionsGrid}>
          
          {/* Card 1: LIST AN ITEM */}
          <Link href="/seller/sell" className={styles.actionCard}>
            <div className={styles.cardTop || ''}>
              <div className={styles.cardIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={styles.actionCardTitle}>LIST AN ITEM</h3>
              <p className={styles.actionCardDesc}>Create a new auction listing</p>
            </div>
            <div className={styles.cardActionLink}>
              Start Listing →
            </div>
          </Link>

          {/* Card 2: MY LISTINGS */}
          <Link href="/seller/profile" className={styles.actionCard}>
            <div className={styles.cardTop || ''}>
              <div className={styles.cardIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={styles.actionCardTitle}>MY LISTINGS</h3>
              <p className={styles.actionCardDesc}>Manage your active and submitted items</p>
            </div>
            <div className={styles.cardActionLink}>
              View Listings →
            </div>
          </Link>

          {/* Card 3: EARNINGS & PAYOUTS */}
          <Link href="/seller/escrow" className={styles.actionCard}>
            <div className={styles.cardTop || ''}>
              <div className={styles.cardIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={styles.actionCardTitle}>EARNINGS &amp; PAYOUTS</h3>
              <p className={styles.actionCardDesc}>View completed sales and payouts</p>
            </div>
            <div className={styles.cardActionLink}>
              View Escrow →
            </div>
          </Link>

          {/* Card 4: SELLER GUIDE */}
          <a href="#guidance" className={styles.actionCard}>
            <div className={styles.cardTop || ''}>
              <div className={styles.cardIconBox}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={styles.actionCardTitle}>SELLER GUIDE</h3>
              <p className={styles.actionCardDesc}>Learn auction rules, fees and best practices</p>
            </div>
            <div className={styles.cardActionLink}>
              Read Guide →
            </div>
          </a>

        </div>

        {/* ── SELLER BENEFITS STRIP ── */}
        <div style={{ marginTop: '54px' }}>
          <div className={styles.benefitsStrip}>
            
            {/* Benefit 1 */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <polyline points="17 11 19 13 23 9" />
                </svg>
              </div>
              <div>
                <h4 className={styles.benefitTitle}>Verified Buyers</h4>
                <p className={styles.benefitDesc}>Connect with trusted collectors worldwide</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <h4 className={styles.benefitTitle}>Secure Payments</h4>
                <p className={styles.benefitDesc}>Protected auction escrow transactions</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <h4 className={styles.benefitTitle}>Global Reach</h4>
                <p className={styles.benefitDesc}>Reach serious collectors across 80+ countries</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── BEFORE YOU LIST (IMPORTANT SELLER INFORMATION) ── */}
        <div id="guidance" className={styles.guidanceBox}>
          <div className={styles.guidanceHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <h3 className={styles.guidanceTitle}>Before You List</h3>
          </div>

          <ul className={styles.guidanceList}>
            <li className={styles.guidanceItem}>
              <span className={styles.guidanceBullet}>✦</span>
              <span>Provide accurate item details, history, and authenticity information.</span>
            </li>
            <li className={styles.guidanceItem}>
              <span className={styles.guidanceBullet}>✦</span>
              <span>Upload clear, high-resolution photographs from multiple angles.</span>
            </li>
            <li className={styles.guidanceItem}>
              <span className={styles.guidanceBullet}>✦</span>
              <span>Set a realistic starting bid and optional reserve price.</span>
            </li>
            <li className={styles.guidanceItem}>
              <span className={styles.guidanceBullet}>✦</span>
              <span>Review applicable seller rules and commission rates before publishing.</span>
            </li>
            <li className={styles.guidanceItem}>
              <span className={styles.guidanceBullet}>✦</span>
              <span>Items are reviewed according to ChronoBid's verification and auction policies.</span>
            </li>
          </ul>

          <div className={styles.feeNotice}>
            <span>ℹ️</span>
            <span>Fees are calculated based on the applicable auction and final sale amount.</span>
          </div>
        </div>

      </main>

      {/* ══════════ FLOATING JASPER ASSISTANT ══════════ */}
      <div className={styles.floatWrap}>
        {isChatOpen && (
          <div className={styles.chatBox}>
            <div className={styles.chatHead}>
              <img src="/jasper.jpg" alt="Jasper AI" className={styles.chatAvatar} />
              <div>
                <div className={styles.chatLabel}>Your AI Assistant</div>
                <div className={styles.chatName}>Jasper ✦</div>
              </div>
              <button className={styles.chatClose} onClick={() => setIsChatOpen(false)}>✕</button>
            </div>

            {messages.length === 0 ? (
              <div className={styles.faqWrap}>
                <p className={styles.faqIntro}>Hi! I'm here to help you sell smarter. Try asking:</p>
                {FAQS.map((f, i) => (
                  <button key={i} className={styles.faqBtn} onClick={() => send(f.text)}>
                    <span>{f.icon}</span>{f.text}<span className={styles.faqArr}>›</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.chatMsgs} ref={historyRef}>
                {messages.map((m, i) => (
                  <div key={i} className={m.role === 'ai' ? styles.msgAi : styles.msgUser}>{m.text}</div>
                ))}
                {isLoading && <div className={styles.msgAi}>Jasper is typing...</div>}
              </div>
            )}

            <form className={styles.chatForm} onSubmit={e => { e.preventDefault(); send(input); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Jasper anything..." className={styles.chatIn} />
              <button type="submit" disabled={isLoading} className={styles.chatSend}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
        )}

        <button className={styles.jasperBubble} onClick={() => setIsChatOpen(o => !o)}>
          {isChatOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Ask Jasper</span>
            </>
          )}
        </button>
      </div>

      {/* ══════════ LUXURY FOOTER ══════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.brandGroup}>
            <Logo size={32} fontSize={22} light={true} />
            <span className={styles.tagline}>Bid. Win. Own History.</span>
          </div>

          <div className={styles.footerText}>
            © {new Date().getFullYear()} ChronoBid Global Auctions Inc. All rights reserved. Encrypted &amp; Verified.
          </div>
        </div>
      </footer>

    </div>
  );
}
