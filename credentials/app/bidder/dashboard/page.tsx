'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import s from './dashboard.module.css';
import Logo from '../../../components/Logo';
import { getToken, clearSession } from '../../../lib/api';

interface Auction {
  id: number;
  title: string;
  description?: string;
  reserve_price: number;
  starting_bid?: number;
  min_bid_increment?: number;
  current_highest_bid?: number;
  end_time: string;
  image_url?: string;
  status: string;
  category?: string;
  bids_count?: number;
}

const CATEGORIES_6 = [
  { id: 'watches', label: 'Timepieces & Watches', iconSrc: '/category-assets/watches.png' },
  { id: 'jewellery', label: 'Jewellery', iconSrc: '/category-assets/jewellery.png' },
  { id: 'art', label: 'Paintings & Art', iconSrc: '/category-assets/art.png' },
  { id: 'books', label: 'Books & Manuscripts', iconSrc: '/category-assets/books.png' },
  { id: 'ceramics', label: 'Ceramics & Glass', iconSrc: '/category-assets/ceramics.png' },
  { id: 'automobiles', label: 'Automobiles', iconSrc: '/category-assets/automobiles.png' },
];

const CATEGORIES_ALL = [
  ...CATEGORIES_6,
  { id: 'music', label: 'Musical Instruments', iconSrc: '/category-assets/music.png' },
  { id: 'coins', label: 'Coins & Currency', iconSrc: '/category-assets/coins.png' },
  { id: 'fashion', label: 'Fashion & Accessories', iconSrc: '/category-assets/fashion.png' },
  { id: 'furniture', label: 'Furniture', iconSrc: '/category-assets/furniture.png' },
  { id: 'photo', label: 'Photography', iconSrc: '/category-assets/photo.png' },
  { id: 'sports', label: 'Sports Memorabilia', iconSrc: '/category-assets/sports.png' },
];

export default function BidderDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{first_name?: string, last_name?: string, id?: number, bids_count?: number, username?: string}>({});
  const [wallet, setWallet] = useState<{balance: number, locked_balance: number}>({balance: 0, locked_balance: 0});
  const [watchlist, setWatchlist] = useState<number[]>([]);
  
  // Floating Jasper State
  const [isJasperOpen, setIsJasperOpen] = useState(false);
  const [jasperInput, setJasperInput] = useState('');
  const [jasperReply, setJasperReply] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [isJasperLoading, setIsJasperLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Dynamic Currency Preference State
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('chronobid_currency');
    if (savedCurrency === 'INR' || savedCurrency === 'USD') {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleCurrencyChange = (newCurrency: 'USD' | 'INR') => {
    setCurrency(newCurrency);
    localStorage.setItem('chronobid_currency', newCurrency);
  };

  const formatPrice = (usdAmount: number) => {
    if (currency === 'INR') {
      const inrVal = Math.round(usdAmount * 83.5);
      return `₹${inrVal.toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  const isNewUser = (profile.bids_count || 0) === 0 && wallet.balance === 0;

  const askJasper = async (customPrompt?: string) => {
    const textToAsk = customPrompt || jasperInput;
    if (!textToAsk.trim()) return;
    setIsJasperLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToAsk, user_role: 'bidder', user_id: profile.id || 1 })
      });
      const data = await res.json();
      setJasperReply(data.jasper_reply || data.answer || "");
      if (data.recommendations && data.recommendations.length > 0) {
        setAiRecommendations(data.recommendations);
      }
      if (!customPrompt) setJasperInput('');
    } catch {
      setJasperReply("Good day, sir/madam. Jasper is currently offline. Please try asking again shortly.");
    }
    setIsJasperLoading(false);
  };


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Profile
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/auth/me', { headers })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(() => {});

      // Fetch Wallet
      fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/wallet/balance', { headers })
        .then(res => res.json())
        .then(data => setWallet(data))
        .catch(() => {});

      // Fetch Live Auctions
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/auctions/live', { headers });
      if (!res.ok) throw new Error('Failed to fetch live auctions');
      const data = await res.json();
      setAuctions(data);

      // Fetch JasperBot Two-Source AI Recommendations
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "What items should I bid on today?", user_role: 'bidder', user_id: 1 })
      })
      .then(r => r.json())
      .then(aiData => {
        if (aiData.recommendations && aiData.recommendations.length > 0) {
          setAiRecommendations(aiData.recommendations);
        }
      })
      .catch(() => {});
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching auctions.');
    } finally {
      setLoading(false);
    }

  };

  const toggleWatchlist = (auctionId: number) => {
    setWatchlist(prev => 
      prev.includes(auctionId) ? prev.filter(id => id !== auctionId) : [...prev, auctionId]
    );
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  return (
    <div className={s.pageContainer}>
      
      {/* ════ 1. COMPACT LUXURY HEADER ════ */}
      <header className={s.headerBar}>
        <div className={s.headerLeft}>
          <Logo size={34} fontSize={22} light={true} />
        </div>

        <nav className={s.headerNavLinks}>
          <Link href="/bidder/dashboard" className={`${s.headerNavLink} ${s.headerNavLinkActive}`}>Home</Link>
          <Link href="/bidder/live" className={s.headerNavLink}>Live Auctions</Link>
          <a href="#categories" className={s.headerNavLink}>Categories</a>
          <Link href="/bidder/my-bids" className={s.headerNavLink}>My Bids</Link>
          <Link href="/bidder/watchlist" className={s.headerNavLink}>Watchlist ({watchlist.length})</Link>
          <Link href="/bidder/wallet" className={s.headerNavLink}>Escrow Wallet</Link>
        </nav>

        <div className={s.headerRightControls}>
          <div className={s.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className={s.searchInput} placeholder="Search lots, era, category..." />
          </div>

          <Link href="/bidder/notifications" className={s.iconBtn} title="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>

          {/* Currency Preference Selector */}
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as 'USD' | 'INR')}
            style={{
              backgroundColor: '#0B1A36',
              border: '1px solid rgba(217, 169, 40, 0.4)',
              color: '#D9A928',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="USD">🇺🇸 USD ($)</option>
            <option value="INR">🇮🇳 INR (₹)</option>
          </select>

          <Link href="/bidder/wallet/deposit" className={s.escrowPill}>
            <span>💳 Escrow</span>
            <span style={{ color: '#ffffff' }}>{formatPrice(wallet.balance)}</span>
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileOpen(o => !o)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#D9A928', color: '#050E1E', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {profile.first_name ? profile.first_name[0].toUpperCase() : 'B'}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isProfileOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#0B1A36', border: '1px solid rgba(217,169,40,0.3)', borderRadius: '12px', padding: '8px', minWidth: '160px', zIndex: 300, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <Link href="/seller/profile" style={{ display: 'block', padding: '8px 12px', color: '#F7F3E8', textDecoration: 'none', fontSize: '13px', borderRadius: '6px' }}>Profile Settings</Link>
                <Link href="/bidder/wallet" style={{ display: 'block', padding: '8px 12px', color: '#F7F3E8', textDecoration: 'none', fontSize: '13px', borderRadius: '6px' }}>Wallet &amp; Escrow</Link>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ════ 2. NEW BIDDER ONBOARDING BANNER ════ */}
      {isNewUser ? (
        <div className={s.onboardingBanner}>
          <div className={s.onboardingTextGroup}>
            <h4 className={s.onboardingTitle}>👋 New to collecting on ChronoBid?</h4>
            <p className={s.onboardingSub}>Start with beginner-friendly auctions and learn how bidding works.</p>
          </div>

          <div className={s.progressPillsGroup}>
            <div className={`${s.progressStepPill} ${s.progressStepPillActive}`}>
              <span>01 Explore</span>
            </div>
            <span style={{ color: '#475569' }}>›</span>
            <div className={s.progressStepPill}>
              <span>02 Watch</span>
            </div>
            <span style={{ color: '#475569' }}>›</span>
            <div className={s.progressStepPill}>
              <span>03 Bid</span>
            </div>
            <span style={{ color: '#475569' }}>›</span>
            <div className={s.progressStepPill}>
              <span>04 Win</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="#live-auctions" className={s.btnPrimaryGold} style={{ padding: '8px 16px', fontSize: '12.5px' }}>
              Start Exploring ➔
            </a>
            <a href="#how-bidding-works" className={s.btnSecondaryOutline} style={{ padding: '8px 16px', fontSize: '12.5px' }}>
              How Bidding Works
            </a>
          </div>
        </div>
      ) : (
        <div style={{ background: '#0B1A36', border: '1px solid rgba(217,169,40,0.25)', borderRadius: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#D9A928', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back</span>
            <h3 style={{ margin: '2px 0 0', fontSize: '18px', color: '#ffffff', fontWeight: 800 }}>
              {profile.first_name || 'Collector'} {profile.last_name || ''}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
            <div><span style={{ color: '#9AA6B8' }}>Active Bids:</span> <strong style={{ color: '#F2C14E' }}>{profile.bids_count || 0}</strong></div>
            <div><span style={{ color: '#9AA6B8' }}>Escrow Balance:</span> <strong style={{ color: '#4ade80' }}>{formatPrice(wallet.balance)}</strong></div>
          </div>
        </div>
      )}

      {/* ════ 3. LUXURY EDITORIAL HERO ════ */}
      <section className={s.heroSection}>
        <div className={s.heroLeftContent}>
          <div className={s.heroEyebrow}>✦ WELCOME TO CHRONOBID</div>
          <h1 className={s.heroTitle}>
            Discover Objects<br />
            <span className={s.goldText}>Worth Remembering.</span>
          </h1>
          <p className={s.heroSubtitle}>
            Explore rare watches, art, jewellery, manuscripts, collectibles, and extraordinary pieces from collectors around the world.
          </p>

          <div className={s.heroCtaGroup}>
            <Link href="/bidder/live" className={s.btnPrimaryGold}>
              Explore Live Auctions ➔
            </Link>
            <a href="#categories" className={s.btnSecondaryOutline}>
              Browse Categories
            </a>
          </div>

          <div className={s.heroTrustGrid}>
            <div className={s.heroTrustItem}>
              <span style={{ color: '#D9A928', fontWeight: 900 }}>✓</span> AI-Assisted Item Screening
            </div>
            <div className={s.heroTrustItem}>
              <span style={{ color: '#D9A928', fontWeight: 900 }}>✓</span> Secure Escrow
            </div>
            <div className={s.heroTrustItem}>
              <span style={{ color: '#D9A928', fontWeight: 900 }}>✓</span> Verified Sellers
            </div>
            <div className={s.heroTrustItem}>
              <span style={{ color: '#D9A928', fontWeight: 900 }}>✓</span> Global Collectors
            </div>
          </div>
        </div>

        <div className={s.heroRightImage} />
      </section>

      {/* ════ 4. START YOUR COLLECTION (FOR NEW USERS) ════ */}
      {isNewUser && (
        <section className={s.sectionBlock} id="start-collection">
          <div className={s.sectionHeaderRow}>
            <div className={s.sectionHeadingGroup}>
              <h2 className={s.sectionTitle}>Start Your Collection</h2>
              <p className={s.sectionSubtitle}>Not sure where to begin? Explore popular categories chosen by collectors.</p>
            </div>
            <a href="#categories" style={{ color: '#D9A928', textDecoration: 'none', fontSize: '13.5px', fontWeight: 700 }}>
              View All Categories ➔
            </a>
          </div>

          <div className={s.categoryGrid6}>
            {CATEGORIES_6.map(c => (
              <a key={c.id} href="#live-auctions" className={s.categoryCardCompact}>
                <div className={s.categoryImgBox}>
                  <img src={c.iconSrc} alt={c.label} className={s.categoryImg} />
                </div>
                <span className={s.categoryCardLabel}>{c.label}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ════ 5. LIVE AUCTIONS (PRIMARY MARKETPLACE GRID) ════ */}
      <section className={s.sectionBlock} id="live-auctions">
        <div className={s.sectionHeaderRow}>
          <div className={s.sectionHeadingGroup}>
            <h2 className={s.sectionTitle}>Live Auctions</h2>
            <p className={s.sectionSubtitle}>Exceptional pieces available to bid on now.</p>
          </div>
          <Link href="/bidder/live" style={{ color: '#D9A928', textDecoration: 'none', fontSize: '13.5px', fontWeight: 700 }}>
            View All Live Auctions ➔
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px', color: '#9AA6B8', background: '#0B1A36', borderRadius: '16px', textAlign: 'center' }}>
            Loading active auctions...
          </div>
        ) : auctions.length === 0 ? (
          <div style={{ background: '#0B1A36', border: '1px solid rgba(217,169,40,0.3)', borderRadius: '20px', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '40px' }}>🕰️</div>
            <h3 style={{ margin: 0, color: '#ffffff', fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px' }}>New pieces are arriving soon.</h3>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '14.5px', maxWidth: '480px' }}>
              Explore categories while our specialists prepare the next curated collection for auction.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <a href="#categories" className={s.btnPrimaryGold}>Explore Categories</a>
              <a href="#how-bidding-works" className={s.btnSecondaryOutline}>View Auction Guide</a>
            </div>
          </div>
        ) : (
          <div className={s.auctionsGrid4}>
            {auctions.slice(0, 4).map(auction => {
              const currentBidVal = auction.current_highest_bid || auction.starting_bid || auction.reserve_price || 0;
              const isWatched = watchlist.includes(auction.id);
              const cardImgUrl = auction.image_url
                ? (auction.image_url.startsWith('/') && !auction.image_url.startsWith('http') ? `${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + ''}${auction.image_url}` : auction.image_url)
                : '/category-assets/watches.png';

              return (
                <div key={auction.id} className={s.auctionCardLuxury}>
                    <img 
                      src={cardImgUrl} 
                      alt={auction.title} 
                      className={s.cardImg} 
                      onError={(e) => {
                        const target = e.currentTarget;
                        const text = (auction.title || auction.category || '').toLowerCase();
                        if (text.includes('jewel') || text.includes('gold') || text.includes('ring') || text.includes('islamic') || text.includes('diamond')) {
                          target.src = '/category-assets/jewellery.png';
                        } else if (text.includes('art') || text.includes('paint') || text.includes('canvas')) {
                          target.src = '/category-assets/art.png';
                        } else if (text.includes('coin') || text.includes('currency')) {
                          target.src = '/category-assets/coins.png';
                        } else if (text.includes('car') || text.includes('auto')) {
                          target.src = '/category-assets/automobiles.png';
                        } else {
                          target.src = '/category-assets/watches.png';
                        }
                      }}
                    />
                    <span className={s.liveTagBadge}>LIVE</span>
                    <button type="button" className={s.watchlistBtnRound} onClick={() => toggleWatchlist(auction.id)} title="Watchlist">
                      {isWatched ? '♥' : '♡'}
                    </button>
                  </div>

                  <div className={s.cardBody}>
                    <span className={s.cardCategoryText}>{auction.category || 'Timepieces & Watches'}</span>
                    <h4 className={s.cardLotTitle}>{auction.title}</h4>

                    <div className={s.cardMetricsRow}>
                      <div>
                        <span className={s.bidSubText}>Current Bid</span>
                        <div className={s.bidValText}>{formatPrice(Number(currentBidVal))}</div>
                      </div>
                      <Link href={`/bidder/auction/${auction.id}`} className={s.bidCtaBtn}>
                        Place Bid ➔
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ════ 6. EXPLORE BY CATEGORY ════ */}
      <section className={s.sectionBlock} id="categories">
        <div className={s.sectionHeaderRow}>
          <div className={s.sectionHeadingGroup}>
            <h2 className={s.sectionTitle}>Explore by Category</h2>
            <p className={s.sectionSubtitle}>Browse authentic items from 12 specialized departments.</p>
          </div>
        </div>

        <div className={s.categoryGrid6}>
          {CATEGORIES_ALL.map(c => (
            <Link key={c.id} href="/bidder/live" className={s.categoryCardCompact}>
              <div className={s.categoryImgBox}>
                <img src={c.iconSrc} alt={c.label} className={s.categoryImg} />
              </div>
              <span className={s.categoryCardLabel}>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ════ 7. CURATED FOR COLLECTORS (EDITORIAL 3-CARD SHOWCASE) ════ */}
      <section className={s.sectionBlock}>
        <div className={s.sectionHeaderRow}>
          <div className={s.sectionHeadingGroup}>
            <h2 className={s.sectionTitle}>Curated for Collectors</h2>
            <p className={s.sectionSubtitle}>Exceptional pieces worth a closer look.</p>
          </div>
        </div>

        <div className={s.curatedGrid3}>
          {/* Card 1: Main Editorial Feature */}
          <div className={s.curatedCardLarge}>
            <img src="/category-assets/watches.png" alt="Curated Watch" className={s.curatedCardLargeImg} />
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span className={s.cardCategoryText}>FEATURED LOT • HOROLOGY</span>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#ffffff', fontFamily: 'Playfair Display, Georgia, serif' }}>
                Victorian Gold Chronometer Pocket Watch (c. 1885)
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#9AA6B8', lineHeight: '1.5' }}>
                Extremely rare solid gold double-cased pocket chronometer with enamel dial and original movement.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#9AA6B8', display: 'block' }}>Current Bid</span>
                  <span style={{ fontSize: '20px', color: '#F2C14E', fontWeight: 800 }}>₹2,45,000</span>
                </div>
                <Link href="/bidder/live" className={s.btnPrimaryGold} style={{ padding: '10px 20px', fontSize: '13px' }}>
                  View Auction ➔
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Fine Art */}
          <div className={s.curatedCardLarge}>
            <img src="/category-assets/art.png" alt="Curated Art" className={s.curatedCardLargeImg} />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className={s.cardCategoryText}>PAINTINGS &amp; ART</span>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>19th Century Oil Landscape Painting</h4>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', color: '#F2C14E', fontWeight: 800 }}>₹1,15,000</span>
                <Link href="/bidder/live" className={s.btnSecondaryOutline} style={{ padding: '6px 14px', fontSize: '12px' }}>View ➔</Link>
              </div>
            </div>
          </div>

          {/* Card 3: Jewellery */}
          <div className={s.curatedCardLarge}>
            <img src="/category-assets/jewellery.png" alt="Curated Jewellery" className={s.curatedCardLargeImg} />
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className={s.cardCategoryText}>JEWELLERY</span>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>Antique Sapphire &amp; Diamond Ring</h4>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', color: '#F2C14E', fontWeight: 800 }}>₹88,000</span>
                <Link href="/bidder/live" className={s.btnSecondaryOutline} style={{ padding: '6px 14px', fontSize: '12px' }}>View ➔</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ 8. YOUR FIRST BID, MADE SIMPLE (HOW BIDDING WORKS) ════ */}
      <section className={s.sectionBlock} id="how-bidding-works">
        <div className={s.sectionHeaderRow}>
          <div className={s.sectionHeadingGroup}>
            <h2 className={s.sectionTitle}>Your First Bid, Made Simple</h2>
            <p className={s.sectionSubtitle}>Four straightforward steps from discovery to winning your item.</p>
          </div>
        </div>

        <div className={s.timelineGrid4}>
          <div className={s.timelineCard}>
            <div className={s.timelineNum}>01</div>
            <h4 className={s.timelineTitle}>Discover</h4>
            <p className={s.timelineDesc}>Explore curated rare items screened via Met Museum AI reference comparison.</p>
          </div>

          <div className={s.timelineCard}>
            <div className={s.timelineNum}>02</div>
            <h4 className={s.timelineTitle}>Watch</h4>
            <p className={s.timelineDesc}>Save interesting lots to your watchlist and track live bid activity in real-time.</p>
          </div>

          <div className={s.timelineCard}>
            <div className={s.timelineNum}>03</div>
            <h4 className={s.timelineTitle}>Bid</h4>
            <p className={s.timelineDesc}>Place your verified bid securely. Snipe protection extends time if a late bid occurs.</p>
          </div>

          <div className={s.timelineCard}>
            <div className={s.timelineNum}>04</div>
            <h4 className={s.timelineTitle}>Win</h4>
            <p className={s.timelineDesc}>Complete your payment safely through escrow and receive your item via insured shipping.</p>
          </div>
        </div>
      </section>

      {/* ════ 9. BID WITH CONFIDENCE ════ */}
      <section className={s.confidenceBanner}>
        <div className={s.sectionHeadingGroup}>
          <h2 className={s.sectionTitle}>Bid With Confidence</h2>
          <p className={s.sectionSubtitle} style={{ maxWidth: '640px' }}>
            ChronoBid combines seller verification, AI-assisted item screening, secure escrow, and a transparent auction process to make digital collecting easier to navigate.
          </p>
        </div>

        <div className={s.confidenceGrid4}>
          <div className={s.confidenceBox}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h4 style={{ margin: '4px 0 0', color: '#ffffff', fontSize: '15px', fontWeight: 700 }}>Secure Escrow</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '12.5px', lineHeight: '1.4' }}>Payments are protected in escrow until you receive and verify your item.</p>
          </div>

          <div className={s.confidenceBox}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <h4 style={{ margin: '4px 0 0', color: '#ffffff', fontSize: '15px', fontWeight: 700 }}>Seller Verification</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '12.5px', lineHeight: '1.4' }}>Every seller passes identity and reputation verification before listing.</p>
          </div>

          <div className={s.confidenceBox}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <h4 style={{ margin: '4px 0 0', color: '#ffffff', fontSize: '15px', fontWeight: 700 }}>AI-Assisted Item Screening</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '12.5px', lineHeight: '1.4' }}>Visual comparison against public domain museum reference collections.</p>
          </div>

          <div className={s.confidenceBox}>
            <span style={{ fontSize: '24px' }}>⚖️</span>
            <h4 style={{ margin: '4px 0 0', color: '#ffffff', fontSize: '15px', fontWeight: 700 }}>Transparent Auctions</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '12.5px', lineHeight: '1.4' }}>Clear bid history, minimum increments, and automated anti-snipe extensions.</p>
          </div>
        </div>
      </section>

      {/* ════ 10. RECOMMENDED FOR YOU (POWERED BY JASPERBOT AI) ════ */}
      <section className={s.sectionBlock}>
        <div className={s.sectionHeaderRow}>
          <div className={s.sectionHeadingGroup}>
            <h2 className={s.sectionTitle}>✨ Recommended by Jasper AI</h2>
            <p className={s.sectionSubtitle}>Smart recommendations merged from your personal Vault activity and live Market Trending activity.</p>
          </div>
        </div>

        {aiRecommendations.length > 0 ? (
          <div className={s.auctionsGrid4}>
            {aiRecommendations.map(item => (
              <div key={item.item_id} className={s.auctionCardLuxury} style={{ position: 'relative' }}>
                <div className={s.cardImgWrap} style={{ height: '160px' }}>
                  <img src={`/category-assets/${item.category || 'watches'}.png`} alt={item.title} className={s.cardImg} onError={(e: any) => { e.target.src = '/category-assets/watches.png'; }} />
                  <span className={s.liveTagBadge} style={{ background: item.source === 'vault' ? '#d97706' : '#2563eb' }}>
                    {item.source === 'vault' ? 'VAULT MATCH' : 'MARKET TRENDING'}
                  </span>
                </div>
                <div className={s.cardBody}>
                  <span className={s.cardCategoryText}>{item.category?.toUpperCase()} • {item.affordable ? 'IN BUDGET' : 'ESCROW REQ'}</span>
                  <h4 className={s.cardLotTitle}>{item.title}</h4>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 10px 0', lineHeight: '1.4', height: '32px', overflow: 'hidden' }}>
                    {item.reason}
                  </p>
                  <div className={s.cardMetricsRow}>
                    <span className={s.bidValText}>${item.price?.toLocaleString()}</span>
                    <Link href={`/bidder/live`} className={s.bidCtaBtn}>Bid ➔</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length > 0 ? (
          <div className={s.auctionsGrid4}>
            {auctions.slice(0, 4).map(auction => (
              <div key={auction.id} className={s.auctionCardLuxury}>
                <div className={s.cardImgWrap}>
                  <img src={auction.image_url || '/category-assets/art.png'} alt={auction.title} className={s.cardImg} />
                </div>
                <div className={s.cardBody}>
                  <span className={s.cardCategoryText}>{auction.category || 'Art'}</span>
                  <h4 className={s.cardLotTitle}>{auction.title}</h4>
                  <div className={s.cardMetricsRow}>
                    <span className={s.bidValText}>₹{(auction.starting_bid || 10000).toLocaleString()}</span>
                    <Link href={`/bidder/auction/${auction.id}`} className={s.bidCtaBtn}>Bid ➔</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#0B1A36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>Your collection journey starts here.</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '13.5px', maxWidth: '440px' }}>
              Explore a few live auctions and Jasper AI will personalize recommendations based on your favorite categories.
            </p>
            <Link href="/bidder/live" className={s.btnPrimaryGold} style={{ marginTop: '8px' }}>
              Explore Auctions ➔
            </Link>
          </div>
        )}
      </section>


      {/* ════ 11. COMPACT LUXURY FOOTER ════ */}
      <footer className={s.footerSection}>
        <div className={s.footerGrid4}>
          <div>
            <Logo size={32} fontSize={22} light={true} />
            <p style={{ color: '#9AA6B8', fontSize: '13px', margin: '12px 0 0', lineHeight: '1.5' }}>
              ChronoBid is a global luxury auction house powered by AI-assisted item screening and secure escrow payouts.
            </p>
          </div>

          <div>
            <div className={s.footerColTitle}>Marketplace</div>
            <div className={s.footerLinkList}>
              <Link href="/bidder/live" className={s.footerLink}>Live Auctions</Link>
              <a href="#categories" className={s.footerLink}>Categories</a>
              <Link href="/bidder/my-bids" className={s.footerLink}>My Bids</Link>
              <Link href="/bidder/watchlist" className={s.footerLink}>Watchlist</Link>
            </div>
          </div>

          <div>
            <div className={s.footerColTitle}>Support &amp; Guide</div>
            <div className={s.footerLinkList}>
              <a href="#how-bidding-works" className={s.footerLink}>Auction Guide</a>
              <Link href="/bidder/wallet" className={s.footerLink}>Escrow &amp; Payments</Link>
              <Link href="/seller/sell" className={s.footerLink}>Seller Application</Link>
              <a href="#" className={s.footerLink}>Contact Support</a>
            </div>
          </div>

          <div>
            <div className={s.footerColTitle}>Legal &amp; Rules</div>
            <div className={s.footerLinkList}>
              <a href="#" className={s.footerLink}>Terms of Service</a>
              <a href="#" className={s.footerLink}>Privacy Policy</a>
              <a href="#" className={s.footerLink}>Auction Rules</a>
              <a href="#" className={s.footerLink}>AI Disclaimer</a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#9AA6B8' }}>
          <div>© {new Date().getFullYear()} ChronoBid Global Auctions Inc. All rights reserved.</div>
          <div>Encrypted &amp; Verified Escrow Operations</div>
        </div>
      </footer>

      {/* ════ 12. FLOATING JASPER AI ASSISTANT ════ */}
      <button type="button" className={s.floatingJasperFab} onClick={() => setIsJasperOpen(o => !o)}>
        <span>✨ Ask Jasper</span>
      </button>

      {isJasperOpen && (
        <div className={s.jasperDrawer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: 800 }}>🤖 Jasper AI Assistant</h4>
            <button type="button" onClick={() => setIsJasperOpen(false)} style={{ background: 'transparent', border: 'none', color: '#9AA6B8', fontSize: '16px', cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#9AA6B8', lineHeight: '1.4' }}>
            Hi, I'm Jasper. I can help you discover auctions, understand bidding, explore categories, and learn how escrow works.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#D9A928', fontWeight: 700, textTransform: 'uppercase' }}>Suggested Questions</span>
            {[
              "Show me beginner-friendly auctions",
              "How does bidding work?",
              "What should I collect?",
              "Explain escrow"
            ].map(promptText => (
              <button
                key={promptText}
                type="button"
                onClick={() => askJasper(promptText)}
                style={{ background: 'rgba(5,14,30,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#F7F3E8', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', textAlign: 'left', cursor: 'pointer' }}
              >
                {promptText}
              </button>
            ))}
          </div>

          {jasperReply && (
            <div style={{ background: 'rgba(5,14,30,0.8)', border: '1px solid rgba(217,169,40,0.3)', borderRadius: '10px', padding: '10px', fontSize: '12.5px', color: '#ffffff', whiteSpace: 'pre-wrap' }}>
              {jasperReply}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input
              className={s.searchInput}
              placeholder="Ask Jasper..."
              value={jasperInput}
              onChange={e => setJasperInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askJasper()}
              style={{ flex: 1, background: 'rgba(5,14,30,0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button type="button" onClick={() => askJasper()} className={s.btnPrimaryGold} style={{ padding: '8px 14px', fontSize: '12px' }}>
              {isJasperLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
