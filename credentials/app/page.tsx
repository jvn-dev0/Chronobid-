'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import s from './home.module.css';
import Logo from '../components/Logo';

export default function Home() {
  const featuredItems = [
    {
      id: 1,
      title: '19th-Century Swiss Pocket Watch',
      category: 'Horology',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
      currentBid: '$14,500',
      bidsCount: 28,
      timeLeft: '2d 11h',
      aiScore: '96% Match',
      era: 'c. 1885 Switzerland',
    },
    {
      id: 2,
      title: 'Attic Black-Figure Terracotta Amphora',
      category: 'Antiquities',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
      currentBid: '$32,200',
      bidsCount: 42,
      timeLeft: '3d 08h',
      aiScore: '94% Match',
      era: 'Attica, c. 510 BCE',
    },
    {
      id: 3,
      title: 'Imperial Roman Gold Aureus Coin',
      category: 'Numismatics',
      image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=800&auto=format&fit=crop',
      currentBid: '$9,800',
      bidsCount: 19,
      timeLeft: '1d 04h',
      aiScore: '98% Match',
      era: 'c. 161 CE Rome',
    },
    {
      id: 4,
      title: 'Brass Maritime Navigation Sextant',
      category: 'Historical Scientific',
      image: 'https://images.unsplash.com/photo-1584447141584-633ca5530188?q=80&w=800&auto=format&fit=crop',
      currentBid: '$6,400',
      bidsCount: 15,
      timeLeft: '4d 19h',
      aiScore: '92% Match',
      era: 'c. 1892 London',
    }
  ];

  return (
    <div className={s.pageWrapper}>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className={s.topBar}>
        <div className={s.topBarContent}>
          <span>✨ <strong>Met Museum AI Cross-Reference Active:</strong> All lots mathematically verified via OpenAI CLIP before auction.</span>
          <Link href="/register" className={s.topBarLink}>Apply for Seller Verification &rarr;</Link>
        </div>
      </div>

      {/* 2. NAVIGATION HEADER */}
      <header className={s.header}>
        <div className={s.headerInner}>
          <Logo size={34} fontSize={26} />

          <nav className={s.navLinks}>
            <a href="#auctions" className={s.navLink}>Live Auctions</a>
            <a href="#how-it-works" className={s.navLink}>How It Works</a>
            <a href="#ai-verification" className={s.navLink}>AI Verification</a>
            <a href="#trust" className={s.navLink}>Escrow Guarantee</a>
          </nav>

          <div className={s.headerActions}>
            <Link href="/login" className={s.loginBtn}>Sign In</Link>
            <Link href="/register" className={s.registerBtn}>Create Account</Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (LIGHT LUXURY) */}
      <section className={s.heroSection}>
        <div className={s.heroGrid}>
          {/* Left Column: Copy & CTAs */}
          <div className={s.heroLeft}>
            <div className={s.heroPill}>
              <span className={s.pillDot}></span>
              <span>The Intelligent Auction House</span>
            </div>

            <h1 className={s.heroTitle}>
              Where History Meets <span className={s.gradientText}>AI Authenticity.</span>
            </h1>

            <p className={s.heroSubtitle}>
              Discover, bid, and collect authenticated historical treasures, vintage horology, and rare untapped inventions — protected by live biometric verification and automated escrow wallets.
            </p>

            <div className={s.ctaRow}>
              <Link href="/register" className={s.primaryCta}>
                Start Bidding Now
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <Link href="/login" className={s.secondaryCta}>
                View Live Catalog
              </Link>
            </div>

            {/* Trust Badges */}
            <div className={s.metricsStrip}>
              <div className={s.metricItem}>
                <div className={s.metricNumber}>96.4%</div>
                <div className={s.metricLabel}>AI Verification Accuracy</div>
              </div>
              <div className={s.metricDivider}></div>
              <div className={s.metricItem}>
                <div className={s.metricNumber}>$100%</div>
                <div className={s.metricLabel}>Escrow Protection</div>
              </div>
              <div className={s.metricDivider}></div>
              <div className={s.metricItem}>
                <div className={s.metricNumber}>DeepFace</div>
                <div className={s.metricLabel}>Biometric Seller KYC</div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card with ChronoBid Image */}
          <div className={s.heroRight}>
            <div className={s.heroCard}>
              <div className={s.heroImageWrapper}>
                <img 
                  src="/antiques.jpg" 
                  alt="ChronoBid Vintage Artifacts" 
                  className={s.heroMainImg}
                  onError={(e) => {
                    // Fallback to high-res antique image if local antiques.jpg has issue
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop';
                  }}
                />
                <div className={s.liveBadge}>
                  <span className={s.livePulse}></span> LIVE AUCTION
                </div>
              </div>

              <div className={s.heroCardBody}>
                <div className={s.heroCardTop}>
                  <div>
                    <span className={s.heroItemCategory}>Featured Masterpiece</span>
                    <h3 className={s.heroItemTitle}>Swiss Patek Philippe 18K Gold Pocket Chronograph</h3>
                  </div>
                  <div className={s.aiBadge}>
                    <span className={s.aiIcon}>✨</span>
                    <div>
                      <div className={s.aiScoreText}>96% Confidence</div>
                      <div className={s.aiSubText}>Met Museum Validated</div>
                    </div>
                  </div>
                </div>

                <div className={s.heroBidBox}>
                  <div>
                    <div className={s.bidLabel}>Current Bid</div>
                    <div className={s.bidAmount}>$14,500 <span className={s.bidCurrency}>USD</span></div>
                  </div>
                  <div className={s.bidTimerBox}>
                    <div className={s.timerLabel}>Time Remaining</div>
                    <div className={s.timerValue}>02d : 11h : 45m</div>
                  </div>
                  <Link href="/register" className={s.cardBidBtn}>
                    Place Bid
                  </Link>
                </div>
              </div>
            </div>

            {/* Floating Trust Indicator */}
            <div className={s.floatingTag}>
              <div className={s.tagIcon}>🛡️</div>
              <div>
                <div className={s.tagTitle}>Locked Escrow Guarantee</div>
                <div className={s.tagSub}>Funds released only upon confirmed delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED LIVE AUCTIONS SECTION */}
      <section id="auctions" className={s.auctionsSection}>
        <div className={s.sectionHeader}>
          <div className={s.sectionSubtitle}>CURATED CATALOG</div>
          <h2 className={s.sectionTitle}>Featured Live Auctions</h2>
          <p className={s.sectionDesc}>Each item has been analyzed by our computer vision neural network against verified museum archives.</p>
        </div>

        <div className={s.grid}>
          {featuredItems.map((item) => (
            <div key={item.id} className={s.auctionCard}>
              <div className={s.cardImgContainer}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className={s.cardImg}
                />
                <div className={s.cardCategoryBadge}>{item.category}</div>
                <div className={s.cardAiBadge}>
                  ✨ {item.aiScore}
                </div>
              </div>

              <div className={s.cardContent}>
                <div className={s.cardEra}>{item.era}</div>
                <h3 className={s.cardTitle}>{item.title}</h3>

                <div className={s.cardPricing}>
                  <div>
                    <span className={s.priceLabel}>Current Bid</span>
                    <span className={s.priceValue}>{item.currentBid}</span>
                  </div>
                  <div className={s.timeBox}>
                    <span className={s.timeLabel}>Ends In</span>
                    <span className={s.timeValue}>⏳ {item.timeLeft}</span>
                  </div>
                </div>

                <div className={s.cardFooter}>
                  <span className={s.bidsCount}>{item.bidsCount} bids placed</span>
                  <Link href="/register" className={s.bidActionBtn}>Bid Now &rarr;</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW CHRONOBID WORKS (3 PILLARS) */}
      <section id="how-it-works" className={s.worksSection}>
        <div className={s.sectionHeader}>
          <div className={s.sectionSubtitle}>A NEW STANDARD IN TRUST</div>
          <h2 className={s.sectionTitle}>How ChronoBid Protects Every Transaction</h2>
        </div>

        <div className={s.pillarsGrid}>
          <div className={s.pillarCard}>
            <div className={s.pillarIconBox}>🏛️</div>
            <h3 className={s.pillarTitle}>1. AI Item Verification</h3>
            <p className={s.pillarText}>
              Every uploaded artifact is processed by OpenAI CLIP to extract multi-modal visual embeddings, mathematically cross-referenced with Metropolitan Museum of Art archives to calculate authenticity scores and historical eras.
            </p>
            <div className={s.pillarTag}>Port 8001 AI Engine</div>
          </div>

          <div className={s.pillarCard}>
            <div className={s.pillarIconBox}>🔒</div>
            <h3 className={s.pillarTitle}>2. Algorithmic Escrow Wallet</h3>
            <p className={s.pillarText}>
              Bid with total confidence. Bids instantly lock capital in escrow; if outbid, funds return to your wallet in milliseconds. The winning payment is only released to the seller after you inspect and confirm receipt.
            </p>
            <div className={s.pillarTag}>Zero-Risk Transactions</div>
          </div>

          <div className={s.pillarCard}>
            <div className={s.pillarIconBox}>👤</div>
            <h3 className={s.pillarTitle}>3. DeepFace Biometric KYC</h3>
            <p className={s.pillarText}>
              No anonymous scammers. Sellers must complete a live webcam facial biometric scan matched against government photo IDs using the VGG-Face neural network before a single auction can be listed.
            </p>
            <div className={s.pillarTag}>Port 8003 Identity Engine</div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className={s.bannerSection}>
        <div className={s.bannerBox}>
          <div className={s.bannerContent}>
            <h2 className={s.bannerTitle}>Ready to own a piece of history?</h2>
            <p className={s.bannerSubtitle}>Join collectors and verified dealers from across the globe in the world's most intelligent auction house.</p>
            <div className={s.bannerCtas}>
              <Link href="/register" className={s.bannerPrimaryBtn}>Create Free Account</Link>
              <Link href="/login" className={s.bannerSecondaryBtn}>Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <Logo size={28} fontSize={22} />
            <p className={s.footerMotto}>
              The intelligent auction house for vintage treasures and untapped inventions. AI-Verified, Trust-Driven, Future-Ready.
            </p>
          </div>

          <div className={s.footerLinks}>
            <div className={s.footerCol}>
              <h4>Marketplace</h4>
              <Link href="/login">Live Auctions</Link>
              <Link href="/register">Become a Seller</Link>
              <Link href="/register">Bidder Registration</Link>
            </div>
            <div className={s.footerCol}>
              <h4>Technology</h4>
              <span>Met Museum API</span>
              <span>OpenAI CLIP Model</span>
              <span>DeepFace Biometrics</span>
              <span>FastAPI Architecture</span>
            </div>
            <div className={s.footerCol}>
              <h4>Trust & Security</h4>
              <span>Escrow Protection</span>
              <span>Identity Verification</span>
              <span>Anti-Shill Monitoring</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
        <div className={s.footerBottom}>
          <div>&copy; {new Date().getFullYear()} ChronoBid Inc. All rights reserved. Developed by Jeevan Babu K B.</div>
        </div>
      </footer>
    </div>
  );
}

