'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../../components/Logo';
import styles from './sell.module.css';
import { getToken, clearSession } from '../../../lib/api';

interface CategoryItem {
  id: string;
  label: string;
  iconSrc: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'watches',
    label: 'Timepieces & Watches',
    iconSrc: '/category-assets/watches.png',
  },
  {
    id: 'jewellery',
    label: 'Jewellery',
    iconSrc: '/category-assets/jewellery.png',
  },
  {
    id: 'art',
    label: 'Paintings & Art',
    iconSrc: '/category-assets/art.png',
  },
  {
    id: 'ceramics',
    label: 'Ceramics & Glass',
    iconSrc: '/category-assets/ceramics.png',
  },
  {
    id: 'books',
    label: 'Books & Manuscripts',
    iconSrc: '/category-assets/books.png',
  },
  {
    id: 'automobiles',
    label: 'Automobiles',
    iconSrc: '/category-assets/automobiles.png',
  },
  {
    id: 'music',
    label: 'Musical Instruments',
    iconSrc: '/category-assets/music.png',
  },
  {
    id: 'coins',
    label: 'Coins & Currency',
    iconSrc: '/category-assets/coins.png',
  },
  {
    id: 'fashion',
    label: 'Fashion & Accessories',
    iconSrc: '/category-assets/fashion.png',
  },
  {
    id: 'furniture',
    label: 'Furniture',
    iconSrc: '/category-assets/furniture.png',
  },
  {
    id: 'photography',
    label: 'Photography',
    iconSrc: '/category-assets/photo.png',
  },
  {
    id: 'sports',
    label: 'Sports Memorabilia',
    iconSrc: '/category-assets/sports.png',
  },
];

const CONDITIONS = ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair'];

export default function SellPage1() {
  const router = useRouter();
  const [category, setCategory] = useState('Timepieces & Watches');
  const [title, setTitle] = useState('');
  const [condition, setCondition] = useState('Excellent');
  const [description, setDescription] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const canContinue = category && title;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    clearSession();
    window.location.href = '/';
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('sell_p1');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.category) setCategory(data.category);
        if (data.title) setTitle(data.title);
        if (data.condition) setCondition(data.condition);
        if (data.description) setDescription(data.description);
      }
    } catch {}
  }, []);

  const handleContinue = () => {
    if (!canContinue) return;
    sessionStorage.setItem('sell_p1', JSON.stringify({ category, title, condition, description }));
    router.push('/seller/sell/details');
  };

  return (
    <div className={styles.page}>
      
      {/* ══ TOP NAVIGATION BAR ══ */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.brandGroup}>
            <Logo size={36} fontSize={24} light={true} />
            <span className={styles.tagline}>Bid. Win. Own History.</span>
          </div>

          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/seller/sell" className={`${styles.navLink} ${styles.navActive}`}>Sell</Link>
            <Link href="/seller/profile" className={styles.navLink}>My Listings</Link>
            <Link href="/seller/dashboard" className={styles.navLink}>Messages</Link>
            <Link href="/about" className={styles.navLink}>About</Link>
          </div>

          <div className={styles.navRight}>
            <div className={styles.searchWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search items, categories, or help..." className={styles.searchInput} />
            </div>

            <button className={styles.iconBtn} title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifBadge}>4</span>
            </button>

            <div className={styles.profileWrap}>
              <button className={styles.profileBtn} onClick={() => setIsProfileOpen(o => !o)}>
                <div className={styles.avatarCircle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>Jeevan</span>
                  <span className={styles.profileRole}>Seller</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {isProfileOpen && (
                <div className={styles.dropdown}>
                  <Link href="/seller/profile" className={styles.dropItem}>Profile &amp; Account</Link>
                  <Link href="/seller/escrow" className={styles.dropItem}>Payout Escrow</Link>
                  <a href="#" onClick={handleLogout} className={`${styles.dropItem} ${styles.dropLogout}`}>Log Out</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ══ LUXURY HERO BANNER ══ */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <span>✦ SELL AN ITEM</span>
            </div>
            <h1 className={styles.heroTitle}>
              Turn Your <span className={styles.gold}>Rare Items</span><br />
              Into Real Value
            </h1>
            <p className={styles.heroSub}>
              List your vintage items, collectibles, art, or unique inventions and let passionate collectors bid for their true value.
            </p>
            <div className={styles.heroTrustPills}>
              <div className={styles.trustPillItem}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div>
                  <strong>Verified Buyers</strong>
                  <span>Trusted global community</span>
                </div>
              </div>
              <div className={styles.trustPillItem}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div>
                  <strong>Secure Escrow</strong>
                  <span>Safe &amp; transparent payments</span>
                </div>
              </div>
              <div className={styles.trustPillItem}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <div>
                  <strong>Expert Evaluation</strong>
                  <span>AI-assisted verification</span>
                </div>
              </div>
              <div className={styles.trustPillItem}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                <div>
                  <strong>Global Reach</strong>
                  <span>12,000+ collectors worldwide</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.heroCardBadge}>
              <p className={styles.heroCardText}>Every Object Has a Story</p>
              <div className={styles.badgeLine} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ STEP NAVIGATION BAR ══ */}
      <section className={styles.stepperBarSection}>
        <div className={styles.stepperBarInner}>
          <div className={styles.stepperPillsGroup}>
            <div className={`${styles.stepPill} ${styles.stepPillActive}`}>
              <span className={styles.stepNumActive}>1</span>
              <span className={styles.stepLabel}>Item Info</span>
            </div>
            <span className={styles.stepArrow}>›</span>
            <div className={styles.stepPill}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepLabel}>Photos &amp; Details</span>
            </div>
            <span className={styles.stepArrow}>›</span>
            <div className={styles.stepPill}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepLabel}>Auction Settings</span>
            </div>
            <span className={styles.stepArrow}>›</span>
            <div className={styles.stepPill}>
              <span className={styles.stepNum}>4</span>
              <span className={styles.stepLabel}>Review &amp; Submit</span>
            </div>
          </div>

          <div className={styles.stepperActions}>
            <button className={styles.draftBtn}>Save as Draft</button>
            <button
              className={styles.nextStepBtn}
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Next Step ➔
            </button>
          </div>
        </div>
      </section>

      {/* ══ UNIFIED 3-COLUMN MAIN LAYOUT ══ */}
      <section className={styles.mainLayoutSection}>
        <div className={styles.mainContainer3Col}>

          {/* ── COLUMN 1: LEFT DARK SIDEBAR (260px) ── */}
          <aside className={styles.sidebarLeft}>
            
            {/* Card 1: Create Listing Navigation */}
            <div className={styles.darkCard}>
              <div className={styles.darkCardHeader}>
                <div className={styles.gavelIconBox}>⚖️</div>
                <div>
                  <h3 className={styles.darkCardTitle}>Create Listing</h3>
                  <p className={styles.darkCardSub}>List your item for auction</p>
                </div>
              </div>

              <div className={styles.sideMenuList}>
                <div className={`${styles.sideMenuItem} ${styles.sideMenuItemActive}`}>
                  <span className={styles.sideMenuIcon}>📋</span>
                  <span>Item Information</span>
                </div>
                <div className={styles.sideMenuItem}>
                  <span className={styles.sideMenuIcon}>📷</span>
                  <span>Photos &amp; Details</span>
                </div>
                <div className={styles.sideMenuItem}>
                  <span className={styles.sideMenuIcon}>⚙️</span>
                  <span>Auction Settings</span>
                </div>
                <div className={styles.sideMenuItem}>
                  <span className={styles.sideMenuIcon}>☑️</span>
                  <span>Review &amp; Submit</span>
                </div>
              </div>
            </div>

            {/* Card 2: Need Help Box */}
            <div className={styles.darkCard}>
              <div className={styles.needHelpBox}>
                <div className={styles.helpHead}>
                  <span style={{ fontSize: '20px' }}>🎧</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#F7F3E8', fontWeight: 700 }}>Need Help?</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9AA6B8', lineHeight: '1.35' }}>
                      Our specialists are available Mon – Fri, 9am – 6pm (IST)
                    </p>
                  </div>
                </div>
                <button className={styles.supportBtn}>💬 Chat with Support</button>
              </div>
            </div>

            {/* Card 3: Seller Guidelines Menu */}
            <div className={styles.darkCard}>
              <div className={styles.guidelinesHeader}>
                <span style={{ fontSize: '16px' }}>📖</span>
                <h4 style={{ margin: 0, fontSize: '13.5px', color: '#F7F3E8', fontWeight: 700 }}>Seller Guidelines</h4>
              </div>
              <div className={styles.guidelineLinkList}>
                <a href="#" className={styles.guidelineLink}>What can I sell? <span>›</span></a>
                <a href="#" className={styles.guidelineLink}>Prohibited items <span>›</span></a>
                <a href="#" className={styles.guidelineLink}>Fees &amp; commissions <span>›</span></a>
                <a href="#" className={styles.guidelineLink}>Shipping guidelines <span>›</span></a>
                <a href="#" className={styles.guidelineLink}>Verification process <span>›</span></a>
              </div>
            </div>

          </aside>

          {/* ── COLUMN 2: CENTER MAIN CONTENT CARD (WHITE SURFACE) ── */}
          <main className={styles.contentCenter}>
            <div className={styles.stepBadge}>✦ STEP 1 OF 4</div>
            <h2 className={styles.mainCardHeading}>Tell us about your item</h2>
            <p className={styles.mainCardSub}>Choose a category and describe what you're selling.</p>

            {/* Select Category Block */}
            <div className={styles.fieldBlock} style={{ marginTop: '28px' }}>
              <label className={styles.fieldLabelLight}>
                Select Category <span className={styles.reqStar}>*</span>
              </label>
              
              <div className={styles.categoryGrid4Col}>
                {CATEGORIES.map(c => {
                  const isSelected = category === c.label;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.catCardLight} ${isSelected ? styles.catCardLightActive : ''}`}
                      onClick={() => setCategory(c.label)}
                    >
                      {isSelected && <span className={styles.catCheckBadgeLight}>✓</span>}
                      <div className={styles.catImgBoxLight}>
                        <img src={c.iconSrc} alt={c.label} className={styles.catImgLight} />
                      </div>
                      <span className={styles.catLabelLight}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item Title Block */}
            <div className={styles.fieldBlock} style={{ marginTop: '32px' }}>
              <div className={styles.labelRowLight}>
                <label className={styles.fieldLabelLight}>
                  Item Title <span className={styles.reqStar}>*</span>
                </label>
                <span className={styles.charCountLight}>{title.length}/150</span>
              </div>
              <input
                className={styles.inputLight}
                placeholder="Enter a clear and descriptive title for your item"
                value={title}
                maxLength={150}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Condition Block */}
            <div className={styles.fieldBlock} style={{ marginTop: '24px' }}>
              <label className={styles.fieldLabelLight}>
                Condition Grade <span className={styles.reqStar}>*</span>
              </label>
              <div className={styles.condGroupLight}>
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.condBtnLight} ${condition === c ? styles.condBtnLightActive : ''}`}
                    onClick={() => setCondition(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Block */}
            <div className={styles.fieldBlock} style={{ marginTop: '24px' }}>
              <div className={styles.labelRowLight}>
                <label className={styles.fieldLabelLight}>
                  Description <span style={{ color: '#6b7280', fontWeight: 400 }}>(Optional but recommended)</span>
                </label>
                <span className={styles.charCountLight}>{description.length}/2000</span>
              </div>
              <textarea
                className={styles.textareaLight}
                rows={5}
                maxLength={2000}
                placeholder="Describe your item — history, provenance, unique features, included accessories or paperwork..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

          </main>

          {/* ── COLUMN 3: RIGHT SIDEBAR (320px) ── */}
          <aside className={styles.sidebarRight}>
            
            {/* Card 1: Your Listing Preview */}
            <div className={styles.whiteCard}>
              <h3 className={styles.whiteCardTitle}>Your Listing Preview</h3>
              
              <div className={styles.previewBoxLight}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p style={{ margin: '8px 0 0 0', color: '#9ca3af', fontSize: '12.5px' }}>
                  Photos will appear here
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span className={styles.previewSubTitle}>Item Title</span>
                <h4 className={styles.previewTitleText}>{title || '—'}</h4>
                
                <span className={styles.previewSubTitle} style={{ marginTop: '12px' }}>Category</span>
                <p className={styles.previewCategoryText}>{category || '—'}</p>
              </div>

              <div className={styles.previewDivider} />

              <div className={styles.feeRowLight}>
                <span>Platform Commission</span>
                <span className={styles.feeValDark}>5% of final winning bid</span>
              </div>
              <div className={styles.feeRowLight}>
                <span>Listing Fee</span>
                <span className={styles.feeGreenLight}>Free</span>
              </div>
            </div>

            {/* Card 2: Seller Guidelines (Light Gold Box) */}
            <div className={styles.yellowCard}>
              <div className={styles.yellowCardHead}>
                <span style={{ fontSize: '18px' }}>📙</span>
                <h4 className={styles.yellowCardTitle}>Seller Guidelines</h4>
              </div>

              <ul className={styles.guidelineCheckList}>
                <li><span className={styles.checkIcon}>✓</span> List only genuine and legal items</li>
                <li><span className={styles.checkIcon}>✓</span> Upload clear and high-quality photos</li>
                <li><span className={styles.checkIcon}>✓</span> Provide accurate item details</li>
                <li><span className={styles.checkIcon}>✓</span> Set a realistic starting bid</li>
                <li><span className={styles.checkIcon}>✓</span> Items are reviewed before going live</li>
              </ul>

              <button className={styles.yellowReadBtn}>Read Full Guidelines ➔</button>
            </div>

          </aside>

        </div>
      </section>

      {/* ══ LUXURY FOOTER ══ */}
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
