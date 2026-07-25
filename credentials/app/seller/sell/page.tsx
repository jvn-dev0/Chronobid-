'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../../components/Logo';
import styles from './sell.module.css';

const CATEGORIES = [
  { icon: '⌚', label: 'Timepieces & Watches' },
  { icon: '💎', label: 'Jewellery' },
  { icon: '🖼️', label: 'Paintings & Art' },
  { icon: '🏺', label: 'Ceramics & Glass' },
  { icon: '📚', label: 'Books & Manuscripts' },
  { icon: '🚗', label: 'Automobiles' },
  { icon: '🎵', label: 'Musical Instruments' },
  { icon: '🪙', label: 'Coins & Currency' },
  { icon: '👗', label: 'Fashion & Accessories' },
  { icon: '🪑', label: 'Furniture' },
  { icon: '📷', label: 'Photography' },
  { icon: '🏆', label: 'Sports Memorabilia' },
];

const CONDITIONS = ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair'];

export default function SellPage1() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [title, setTitle]       = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');

  const canContinue = category && title && condition;

  const handleContinue = () => {
    if (!canContinue) return;
    // Store to sessionStorage and go to page 2
    sessionStorage.setItem('sell_p1', JSON.stringify({ category, title, condition, description }));
    router.push('/seller/sell/details');
  };

  return (
    <div className={styles.page}>

      {/* ══ NAVBAR ══ */}
      <nav className={styles.nav}>
        <Logo size={32} fontSize={24} />
        <div className={styles.navRight}>
          <span className={styles.stepIndicator}>Step 1 of 2</span>
          <a href="/seller/dashboard" className={styles.exitBtn}>✕ Exit</a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroPill}>✦ Sell with the World's Most Trusted Platform</div>
          <h1 className={styles.heroTitle}>
            Turn Your <span className={styles.gold}>Rare Items</span><br/>
            Into Real Value
          </h1>
          <p className={styles.heroDesc}>
            Connect with 12,000+ passionate collectors worldwide.<br/>
            Free listings. Expert evaluation. Maximum exposure.
          </p>
          <div className={styles.heroTrust}>
            <div className={styles.trustPill}>🛡 AI Verified</div>
            <div className={styles.trustPill}>🔒 Secure Escrow</div>
            <div className={styles.trustPill}>⚡ 48hr Response</div>
            <div className={styles.trustPill}>🌍 Global Reach</div>
          </div>
        </div>
      </section>

      {/* ══ FORM SECTION ══ */}
      <section className={styles.formSection}>
        <div className={styles.formInner}>

          {/* Title */}
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>Step 1 — Item Info</span>
            <h2 className={styles.sectionTitle}>Tell us about your item</h2>
            <p className={styles.sectionSub}>Choose a category and describe what you're selling.</p>
          </div>

          {/* Category Grid */}
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Select Category <span className={styles.req}>*</span></label>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map(c => (
                <button
                  key={c.label}
                  className={`${styles.catCard} ${category === c.label ? styles.catCardActive : ''}`}
                  onClick={() => setCategory(c.label)}
                >
                  <span className={styles.catIcon}>{c.icon}</span>
                  <span className={styles.catLabel}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Two columns */}
          <div className={styles.twoCol}>
            {/* Title */}
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>Item Title <span className={styles.req}>*</span></label>
              <input
                className={styles.textInput}
                placeholder="e.g. Vintage 1965 Omega Speedmaster"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <span className={styles.charCount}>{title.length}/120</span>
            </div>

            {/* Condition */}
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>Condition <span className={styles.req}>*</span></label>
              <div className={styles.conditionRow}>
                {CONDITIONS.map(c => (
                  <button
                    key={c}
                    className={`${styles.condBtn} ${condition === c ? styles.condBtnActive : ''}`}
                    onClick={() => setCondition(c)}
                  >{c}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>
              Description
              <span className={styles.optTag}> — Optional but recommended</span>
            </label>
            <textarea
              className={styles.textArea}
              rows={5}
              placeholder="Describe your item — history, provenance, unique features, included accessories or paperwork…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <span className={styles.charCount}>{description.length}/2000</span>
          </div>

          {/* CTA */}
          <div className={styles.ctaRow}>
            <a href="/seller/dashboard" className={styles.backLink}>← Back to Dashboard</a>
            <button
              className={`${styles.continueBtn} ${canContinue ? styles.continueBtnOn : ''}`}
              disabled={!canContinue}
              onClick={handleContinue}
            >
              Continue to Photos & Pricing →
            </button>
          </div>

          <p className={styles.saveHint}>Your progress is saved automatically</p>
        </div>

        {/* Right sticky summary */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Your Listing Preview</h3>
            <div className={styles.summaryImgBox}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p>Photo preview</p>
            </div>
            <div className={styles.summaryMeta}>
              <span className={styles.summaryCategory}>{category || 'No category selected'}</span>
              <h4 className={styles.summaryItemTitle}>{title || 'Your item title will appear here'}</h4>
              {condition && <span className={styles.summaryCondBadge}>{condition}</span>}
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryFee}>
              <span>Platform fee</span>
              <span className={styles.feeVal}>12%</span>
            </div>
            <div className={styles.summaryFee}>
              <span>Listing fee</span>
              <span className={styles.feeGreen}>Free</span>
            </div>
          </div>

          <div className={styles.helpCard}>
            <div className={styles.helpIcon}>💬</div>
            <div>
              <p className={styles.helpTitle}>Need help?</p>
              <p className={styles.helpText}>Our specialists are available Mon–Fri, 9am–6pm</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
