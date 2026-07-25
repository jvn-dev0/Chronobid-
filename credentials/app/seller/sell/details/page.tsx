'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../../../../components/Logo';
import styles from '../sell.module.css';
import { createAuction, getToken } from '../../../../lib/api';

const COUNTRIES = [
  'India','United States','United Kingdom','France','Germany',
  'Japan','UAE','Singapore','Australia','Canada','Italy','Switzerland',
];

export default function SellDetails() {
  const router = useRouter();
  const [p1, setP1] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [signature, setSignature] = useState<'yes'|'no'|''>('');
  const [country, setCountry] = useState('');
  const [startBid, setStartBid] = useState('');
  const [duration, setDuration] = useState('');
  const [acquired, setAcquired] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('sell_p1');
    if (saved) setP1(JSON.parse(saved));
    else router.push('/seller/sell');
  }, []);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotos(p => [...p, ...Array.from(files)].slice(0, 6));
  };

  const canSubmit = photos.length >= 1 && country && startBid && duration;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const token = getToken();
    if (!token) {
      alert('Please log in first.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate end time based on selected duration (e.g., '7 days')
      const days = parseInt(duration.split(' ')[0]) || 7;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + days * 24 * 60 * 60 * 1000);

      const formData = new FormData();
      formData.append('title', p1?.title || 'Untitled');
      formData.append('category_id', '1');
      formData.append('start_time', startTime.toISOString());
      formData.append('end_time', endTime.toISOString());
      formData.append('reserve_price', startBid);
      formData.append('description', p1?.description || 'No description');
      if (p1?.condition) formData.append('condition', p1.condition);
      
      // Append the first photo for AI verification
      formData.append('file', photos[0]);

      const res = await createAuction(formData, token);
      if (res.ai_data) {
        setAiResponse(res.ai_data);
      }

      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit auction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <nav className={styles.nav}>
          <Logo size={32} fontSize={24} />
        </nav>
        <div className={styles.successPage}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.successTitle}>Submission Received!</h1>
          <p className={styles.successSub}>
            Our specialists will review <strong>{p1?.title}</strong> and get back to you within 3–5 business days.
          </p>
          
          {aiResponse && (
            <div style={{background: '#fefce8', border: '1px solid #fde68a', padding: '20px', borderRadius: '12px', marginTop: '16px', textAlign: 'left', width: '100%'}}>
              <h3 style={{margin: 0, color: '#ca8a04', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span>✨</span> AI Verification Successful
              </h3>
              <p style={{margin: '12px 0 0', color: '#854d0e', fontSize: '15px', lineHeight: '1.6'}}>
                Our AI identified this item as a <strong>{aiResponse.predicted_category}</strong> with {Math.round(aiResponse.category_confidence * 100)}% confidence, dating to around the <strong>{aiResponse.estimated_period}</strong>.
              </p>
            </div>
          )}

          <div className={styles.successMeta}>
            <div className={styles.successItem}>
              <span>Category</span><strong>{p1?.category}</strong>
            </div>
            <div className={styles.successItem}>
              <span>Condition</span><strong>{p1?.condition}</strong>
            </div>
            <div className={styles.successItem}>
              <span>Starting Bid</span><strong>${startBid}</strong>
            </div>
            <div className={styles.successItem}>
              <span>Photos</span><strong>{photos.length} uploaded</strong>
            </div>
          </div>
          <a href="/seller/dashboard" className={`${styles.continueBtn} ${styles.continueBtnOn}`} style={{display:'inline-block', textAlign:'center', textDecoration:'none'}}>
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* ══ NAVBAR ══ */}
      <nav className={styles.nav}>
        <Logo size={32} fontSize={24} />
        <div className={styles.navRight}>
          <span className={styles.stepIndicator}>Step 2 of 2</span>
          <a href="/seller/dashboard" className={styles.exitBtn}>✕ Exit</a>
        </div>
      </nav>

      {/* ══ PAGE 2 HERO ══ */}
      <section className={styles.hero2}>
        <div className={styles.hero2Inner}>
          <div className={styles.hero2Left}>
            <span className={styles.sectionTag}>Step 2 — Photos & Pricing</span>
            <h1 className={styles.hero2Title}>Almost there —<br/><span className={styles.gold}>Make it shine.</span></h1>
            <p className={styles.hero2Sub}>Great photos and a fair starting price are the #1 factors in auction success. Our AI can help suggest the best price.</p>
          </div>
          <div className={styles.hero2Right}>
            <div className={styles.p1Summary}>
              <div className={styles.p1Tag}>✓ Step 1 Complete</div>
              <div className={styles.p1Cat}>{p1?.category}</div>
              <div className={styles.p1Title}>{p1?.title}</div>
              <div className={styles.p1Cond}>{p1?.condition}</div>
              <button className={styles.p1Edit} onClick={() => router.push('/seller/sell')}>Edit ↗</button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FORM SECTION ══ */}
      <section className={styles.formSection}>
        <div className={styles.formInner}>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Upload Photos</h2>
            <p className={styles.sectionSub}>Upload up to 6 photos. Include front, back, and close-up details.</p>
          </div>

          {/* Drop zone */}
          <div className={styles.fieldBlock}>
            <div
              className={styles.bigDropZone}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handlePhotos(e.dataTransfer.files); }}
            >
              <div className={styles.dropIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h3 className={styles.dropTitle}>Drag & drop your photos here</h3>
              <p className={styles.dropSub}>or click to browse — JPG, PNG, WEBP up to 10MB each</p>
              <span className={styles.dropCount}>{photos.length}/6 photos uploaded</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}}
              onChange={e => handlePhotos(e.target.files)} />
          </div>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className={styles.bigPhotoGrid}>
              {photos.map((f, i) => (
                <div key={i} className={styles.bigPhotoSlot}>
                  <img src={URL.createObjectURL(f)} alt="" className={styles.bigPhotoImg} />
                  <button className={styles.removePhoto} onClick={() => setPhotos(p => p.filter((_,j)=>j!==i))}>✕</button>
                  {i === 0 && <span className={styles.mainPhotoTag}>Main</span>}
                </div>
              ))}
              {photos.length < 6 && (
                <button className={styles.addMoreSlot} onClick={() => fileRef.current?.click()}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Add more</span>
                </button>
              )}
            </div>
          )}

          {/* Signature */}
          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Is the item signed / authenticated?</label>
            <div className={styles.conditionRow}>
              {(['yes','no'] as const).map(v => (
                <button key={v}
                  className={`${styles.condBtn} ${signature===v ? styles.condBtnActive : ''}`}
                  onClick={() => setSignature(v)}>
                  {v === 'yes' ? '✓ Yes, signed' : '✗ No signature'}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Row */}
          <div className={styles.sectionHead} style={{marginTop:'16px'}}>
            <h2 className={styles.sectionTitle}>Auction Settings</h2>
            <p className={styles.sectionSub}>Set your starting bid and duration. Our AI will suggest an optimal price.</p>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>Starting Bid (USD) <span className={styles.req}>*</span></label>
              <div className={styles.priceWrap}>
                <span className={styles.pricePrefix}>$</span>
                <input
                  className={`${styles.textInput} ${styles.priceInput}`}
                  type="number"
                  placeholder="500"
                  value={startBid}
                  onChange={e => setStartBid(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>Auction Duration <span className={styles.req}>*</span></label>
              <div className={styles.conditionRow}>
                {['3 days','7 days','14 days','30 days'].map(d => (
                  <button key={d}
                    className={`${styles.condBtn} ${duration===d ? styles.condBtnActive : ''}`}
                    onClick={() => setDuration(d)}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>Item Location <span className={styles.req}>*</span></label>
              <select className={styles.selectEl} value={country} onChange={e => setCountry(e.target.value)}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>Where acquired <span className={styles.optTag}>(Optional)</span></label>
              <input
                className={styles.textInput}
                placeholder="e.g. Christie's auction, 2019"
                value={acquired}
                onChange={e => setAcquired(e.target.value)}
              />
            </div>
          </div>

          {/* CTA */}
          <div className={styles.ctaRow}>
            <button className={styles.backLink} onClick={() => router.back()}>← Back</button>
            <button
              className={`${styles.continueBtn} ${canSubmit ? styles.continueBtnOn : ''}`}
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Verifying with AI...' : 'Submit for Expert Review ✓'}
            </button>
          </div>
          <p className={styles.saveHint}>By submitting, you agree to our <a href="#">Terms of Service</a></p>
        </div>

        {/* Right panel */}
        <div className={styles.summaryPanel}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Estimated Payout</h3>
            {startBid ? (
              <>
                <div className={styles.payoutRow}>
                  <span>Starting bid</span>
                  <span>${Number(startBid).toLocaleString()}</span>
                </div>
                <div className={styles.payoutRow}>
                  <span>Platform fee (12%)</span>
                  <span className={styles.feeRed}>−${(Number(startBid)*0.12).toFixed(2)}</span>
                </div>
                <div className={styles.payoutDivider}/>
                <div className={styles.payoutRow} style={{fontWeight:800,fontSize:'18px'}}>
                  <span>You receive</span>
                  <span className={styles.feeGreen}>${(Number(startBid)*0.88).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <p style={{color:'#94a3b8',fontSize:'14px'}}>Enter a starting bid to see your estimated payout.</p>
            )}
          </div>

          <div className={styles.tipCard}>
            <h4 className={styles.tipTitle}>📸 Photo Tips</h4>
            <ul className={styles.tipList}>
              <li>Use natural light — avoid flash</li>
              <li>Shoot against a plain background</li>
              <li>Include front, back & all angles</li>
              <li>Capture any marks, signatures, or flaws</li>
              <li>Higher resolution = better results</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
