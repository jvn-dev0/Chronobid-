'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, saveSession } from '../../lib/api';
import Logo from '../../components/Logo';
import s from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({ email: form.email, password: form.password });
      saveSession(data);
      
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/role-select');
      }, 1200);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.pageWrapper}>
      {/* ── Top Header Bar ── */}
      <header className={s.topBar}>
        <div className={s.topBarLeft}>
          <Logo size={46} fontSize={32} light={false} />
        </div>
        <div className={s.topBarRight}>
          <span className={s.topGoldLine} />
          <span className={s.topTaglineText}>The Intelligent Auction House</span>
        </div>
      </header>

      {/* ── Main Viewport Content: Single Unified Luxury Card ── */}
      <main className={s.mainContainer}>
        <div className={s.unifiedAuthCard}>
          
          {/* ── Left Column: Editorial Hero & Stats ── */}
          <div className={s.unifiedLeftHero}>
            
            <div>
              {/* Category Tagline */}
              <div className={s.categoryTagWrapper}>
                <span className={s.categoryDash} />
                <span className={s.categoryTagText}>GLOBAL AUCTION PLATFORM</span>
              </div>

              {/* Editorial Headline */}
              <h1 className={s.editorialHeadline}>
                Experience<br />
                <span className={s.goldSerifText}>Premium Auctions</span><br />
                Like Never Before
              </h1>

              {/* Editorial Description */}
              <p className={s.editorialDescription}>
                Access rare, unique and authenticated items from around the world. Sign in to continue your auction journey with ChronoBid.
              </p>
            </div>

            {/* 3 Circular Feature Badges */}
            <div className={s.featureBadgesRow}>
              
              {/* Feature 1: Secure Transactions */}
              <div className={s.featureBadgeItem}>
                <div className={s.featureCircleIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <span className={s.featureLabel}>Secure<br />Transactions</span>
              </div>

              {/* Feature 2: Verified Sellers */}
              <div className={s.featureBadgeItem}>
                <div className={s.featureCircleIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 0 0-16 0"/>
                  </svg>
                </div>
                <span className={s.featureLabel}>Verified<br />Sellers</span>
              </div>

              {/* Feature 3: Rare & Unique Items */}
              <div className={s.featureBadgeItem}>
                <div className={s.featureCircleIcon}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12l4 6-10 13L2 9Z"/>
                    <path d="M11 3 8 9l4 13 4-13-3-6"/>
                    <path d="M2 9h20"/>
                  </svg>
                </div>
                <span className={s.featureLabel}>Rare & Unique<br />Items</span>
              </div>

            </div>

            {/* Bottom Statistics Strip */}
            <div className={s.bottomStatsStrip}>
              <div className={s.bottomStatItem}>
                <span className={s.bottomStatNumber}>10K+</span>
                <span className={s.bottomStatLabel}>Live Auctions</span>
              </div>
              
              <div className={s.bottomStatDivider} />

              <div className={s.bottomStatItem}>
                <span className={s.bottomStatNumber}>5K+</span>
                <span className={s.bottomStatLabel}>Verified Sellers</span>
              </div>

              <div className={s.bottomStatDivider} />

              <div className={s.bottomStatItem}>
                <span className={s.bottomStatNumber}>25K+</span>
                <span className={s.bottomStatLabel}>Happy Collectors</span>
              </div>
            </div>

          </div>

          {/* ── Right Column: Authentication Form ── */}
          <div className={s.unifiedRightForm}>
            
            {/* Card Brand Header */}
            <div className={s.cardLogoHeader}>
              <Logo size={40} fontSize={28} linkToHome={false} />
            </div>

            <div className={s.cardTitleGroup}>
              <h2 className={s.cardWelcomeTitle}>Welcome Back!</h2>
              <p className={s.cardSubtitle}>Login to access your ChronoBid account</p>
            </div>

            {/* Banners */}
            {error && <div className={s.errorBanner}>{error}</div>}
            {success && <div className={s.successBanner}>{success}</div>}

            {/* Login Form */}
            <form className={s.cardForm} onSubmit={handleSubmit}>
              
              {/* Email Address */}
              <div className={s.cardField}>
                <label htmlFor="email">Email Address</label>
                <div className={s.cardInputBox}>
                  <span className={s.cardInputIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className={s.cardField}>
                <label htmlFor="password">Password</label>
                <div className={s.cardInputBox}>
                  <span className={s.cardInputIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className={s.cardEyeBtn}
                    onClick={() => setShowPass(!showPass)}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className={s.rememberForgotRow}>
                <label className={s.cardCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                  />
                  <span>Remember me</span>
                </label>
                <Link href="/forgot-password" className={s.forgotPasswordLink}>
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button type="submit" className={s.cardSubmitBtn} disabled={loading}>
                {loading ? <span className={s.spinner} /> : (
                  <>
                    <span>Login</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

              {/* Social Divider */}
              <div className={s.socialDivider}>
                <span>or continue with</span>
              </div>

              {/* Social Buttons */}
              <div className={s.socialGrid}>
                <button type="button" className={s.socialPillBtn}>
                  <svg width="19" height="19" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button type="button" className={s.socialPillBtn}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#070d1e">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter</span>
                </button>

                <button type="button" className={s.socialPillBtn}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>

                <button type="button" className={s.socialPillBtn}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="#070d1e">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Card Footer */}
              <div className={s.cardFooterText}>
                <span>Don&apos;t have an account? </span>
                <Link href="/register" className={s.signUpLink}>
                  Sign up
                </Link>
              </div>

            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
