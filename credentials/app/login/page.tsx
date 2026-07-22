'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, saveSession } from '../../lib/api';
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
      // Call POST /api/auth/login on the FastAPI backend
      const data = await loginUser({ email: form.email, password: form.password });

      // Save the JWT token + role to localStorage
      saveSession(data);
      
      // ✅ Login successful — go to role selection
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        router.push('/role-select');
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.authWrapper}>
      <div className={s.authCard}>

        {/* ── Left Panel ── */}
        <div className={s.leftPanel}>
          <div className={s.leftContent}>
            {/* Logo */}
            <div className={s.logo}>
              <span className={s.logoIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-3 3 2 2-3 3-2-2-1 1-1-1 1-1-2-2 3-3 2 2 3-3-2-2 1-1z"/><path d="m16 11 3-3-2-2-3 3"/><path d="m18 9 2-2-2-2-2 2"/></svg>
              </span>
              <div className={s.logoText}>
                <h1>ChronoBid</h1>
                <p>Bid. Win. Own History.</p>
              </div>
            </div>

            {/* Headline */}
            <div className={s.headline}>
              <h2>Experience<br /><span>Premium Auctions</span><br />Like Never Before</h2>
              <p>Access rare, unique and authenticated items from around the world. Sign in to continue your auction journey with ChronoBid.</p>
              
              {/* Trust Icons */}
              <div className={s.trustIcons}>
                <div className={s.trustItem}>
                  <span className={s.trustIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  </span>
                  <span>Secure<br/>Transactions</span>
                </div>
                <div className={s.trustItem}>
                  <span className={s.trustIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                  </span>
                  <span>Verified<br/>Sellers</span>
                </div>
                <div className={s.trustItem}>
                  <span className={s.trustIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
                  </span>
                  <span>Rare & Unique<br/>Items</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className={s.rightPanel}>
          <div className={s.formHeader}>
            <h2>Welcome Back!</h2>
            <p>Login to access your ChronoBid account</p>
          </div>

          {/* Global Error/Success Banner */}
          {error && <div className={s.errorBanner}>{error}</div>}
          {success && <div className={s.successBanner}>{success}</div>}

          <form className={s.form} onSubmit={handleSubmit}>

            {/* Email */}
            <div className={s.fieldGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
                <input id="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            {/* Password */}
            <div className={s.fieldGroup}>
              <label htmlFor="password">Password</label>
              <div className={s.inputWrapper}>
                <span className={s.inputIcon}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input id="password" type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={handleChange} required />
                <button type="button" className={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className={s.forgotLink}>
              <Link href="/forgot-password">Forgot Password?</Link>
            </div>

            {/* Remember me */}
            <label className={s.rememberMe}>
              <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
              <span>Remember me</span>
            </label>

            {/* Submit */}
            <button type="submit" className={s.btnPrimary} disabled={loading}>
              {loading ? <span className={s.spinner} /> : 'Login'}
            </button>

            <div className={s.divider}>or continue with</div>

            {/* Social Buttons */}
            <div className={s.socialBtns}>
              <button type="button" className={s.socialBtn}><svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google</button>
              <button type="button" className={s.socialBtn}><svg viewBox="0 0 24 24"><path fill="#1DA1F2" d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>Twitter</button>
              <button type="button" className={s.socialBtn}><svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</button>
              <button type="button" className={s.socialBtn}><svg viewBox="0 0 24 24"><path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>Apple</button>
            </div>

            <p className={s.noAccount}>
              Don&apos;t have an account? <Link href="/register">Sign up</Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
