'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../../../components/Logo';
import styles from './dashboard.module.css';
import { clearSession } from '../../../lib/api';

const FAQS = [
  { icon: '➕', text: 'How do I add my first item?' },
  { icon: '%',  text: 'What are the selling fees?' },
  { icon: '🛡', text: 'How does escrow work?' },
  { icon: '📈', text: 'Tips to sell items faster' },
  { icon: '🔑', text: 'What items are accepted?' },
];

export default function SellerDashboard() {
  const [messages, setMessages] = useState<{role:'user'|'ai'; text:string}[]>([]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearSession();
    window.location.href = '/';
  };

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);
    try {
      const res  = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      setMessages(p => [...p, { role:'ai', text: data.answer }]);
    } catch {
      setMessages(p => [...p, { role:'ai', text:'Network error. Please try again.' }]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className={styles.page}>

      {/* ══════════ NAVBAR ══════════ */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Logo size={36} fontSize={28} />

          <nav className={styles.navLinks}>
            <a href="#" className={styles.navLink}>Home</a>
            <a href="/seller/sell" className={`${styles.navLink} ${styles.navActive}`}>Sell</a>
            <a href="#" className={styles.navLink}>Private Sell</a>
            <a href="#" className={styles.navLink}>About</a>
          </nav>

          <div className={styles.navRight}>
            <div className={styles.searchWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search items…" className={styles.searchInput} />
            </div>

            <div className={styles.profileWrap}>
              <button className={styles.profileBtn} onClick={() => setIsProfileOpen(o => !o)}>
                <div className={styles.avatarCircle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {isProfileOpen && (
                <div className={styles.dropdown}>
                  <a href="/seller/profile" className={styles.dropItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </a>
                  <a href="#" onClick={handleLogout} className={`${styles.dropItem} ${styles.dropLogout}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════ HERO ══════════ */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>✦ Trusted by 12,000+ Collectors Worldwide</span>
            <h1 className={styles.heroHeading}>
              Sell Your
              <span className={styles.heroAccent}>Rare Treasures</span>
              With Confidence
            </h1>
            <p className={styles.heroSub}>
              ChronoBid connects expert sellers with passionate collectors.<br/>
              List your extraordinary items and reach the world's most serious buyers.
            </p>
            <div className={styles.heroActions}>
              <Link href="/seller/sell"><button className={styles.heroCta}>Start Selling Today</button></Link>
              <a href="#how" className={styles.heroGhost}>See How It Works ↓</a>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}><strong>12K+</strong><span>Active Buyers</span></div>
              <div className={styles.statDiv}/>
              <div className={styles.stat}><strong>98%</strong><span>Seller Satisfaction</span></div>
              <div className={styles.statDiv}/>
              <div className={styles.stat}><strong>$4.2M</strong><span>Sold Last Month</span></div>
            </div>
          </div>
          <div className={styles.heroImgWrap}>
            <div className={styles.heroImgCard}>
              <img src="/antiques.jpg" alt="Rare antiques" className={styles.heroImg} />
              <div className={styles.heroImgBadge}>
                <span className={styles.liveDot}/>
                Live Auctions Now
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TRUST STRIP ══════════ */}
      <div className={styles.trustStrip}>
        {['AI-Verified Items','Secure Escrow','Global Reach','Expert Support','Free Listings'].map(t => (
          <div key={t} className={styles.trustItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            {t}
          </div>
        ))}
      </div>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className={styles.howSection}>
        <div className={styles.sectionLabel}>Simple Process</div>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSub}>3 steps. Less than 10 minutes. Zero hassle.</p>

        <div className={styles.steps}>
          {[
            { num:'01', img:'/step1.jpg', title:'Describe the Item',  desc:'Tell us about your item — its history, condition, and key details.' },
            { num:'02', img:'/step2.jpg', title:'Upload Photos',      desc:'Upload 3–5 clear photos from multiple angles for our experts.' },
            { num:'03', img:'/step3.jpg', title:'Review & Submit',    desc:'Review everything and submit. Our team evaluates and responds fast.' },
          ].map((s, i) => (
            <div key={i} className={styles.stepCard}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepImg}><img src={s.img} alt={s.title} /></div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.howFooter}>
          <div className={styles.howNote}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            Our specialists review every submission to ensure authenticity and quality. You'll receive an estimate and selling options.
          </div>
          <a href="#" className={styles.howLink}>Get the checklist →</a>
        </div>

        <div className={styles.howCta}>
          <Link href="/seller/sell">
            <button className={styles.heroCta}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
              Start Your Submission
            </button>
          </Link>
        </div>
      </section>

      {/* ══════════ FLOATING JASPER ══════════ */}
      <div className={styles.floatWrap}>
        {isChatOpen && (
          <div className={styles.chatBox}>
            {/* Header */}
            <div className={styles.chatHead}>
              <img src="/jasper.jpg" alt="Jasper" className={styles.chatAvatar} />
              <div>
                <div className={styles.chatLabel}>Your AI Assistant</div>
                <div className={styles.chatName}>Jasper <span>✦</span></div>
              </div>
              <button className={styles.chatClose} onClick={() => setIsChatOpen(false)}>✕</button>
            </div>

            {/* Messages or FAQs */}
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
                  <div key={i} className={m.role==='ai' ? styles.msgAi : styles.msgUser}>{m.text}</div>
                ))}
                {isLoading && <div className={styles.msgAi}>Jasper is typing…</div>}
              </div>
            )}

            {/* Input */}
            <form className={styles.chatForm} onSubmit={e => { e.preventDefault(); send(input); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Jasper anything…" className={styles.chatIn} />
              <button type="submit" disabled={isLoading} className={styles.chatSend}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        )}

        <button className={styles.jasperBubble} onClick={() => setIsChatOpen(o => !o)}>
          {isChatOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Ask Jasper</span>
              </>
          }
        </button>
      </div>
    </div>
  );
}
