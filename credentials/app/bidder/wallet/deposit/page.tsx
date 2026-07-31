'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from './deposit.module.css';
import { getToken } from '../../../../lib/api';

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('500');
  const [method, setMethod] = useState<'card' | 'upi'>('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card details state for visual feedback
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) return;

    setLoading(true);

    try {
      const token = getToken();
      
      // Simulate network delay for realistic "processing" feel
      await new Promise(r => setTimeout(r, 1500));

      const res = await fetch('http://localhost:8000/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: depositAmount,
          payment_method: method === 'card' ? 'Credit Card' : 'UPI'
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/bidder/wallet');
        }, 2500); // Redirect back to wallet after showing success animation
      } else {
        alert('Payment failed to process.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
      setLoading(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      
      {/* Success Overlay */}
      {success && (
        <div className={s.overlay}>
          <div className={s.successBox}>
            <div className={s.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className={s.successTitle}>Payment Successful!</h2>
            <p className={s.successDesc}>${parseFloat(amount).toLocaleString()} has been added to your ChronoBid wallet.</p>
          </div>
        </div>
      )}

      <div className={s.paymentCard}>
        <div className={s.header}>
          <h1 className={s.title}>Add Funds</h1>
          <p className={s.subtitle}>Securely deposit money to your bidding wallet</p>
        </div>

        <form onSubmit={handleDeposit}>
          {/* Amount Selection */}
          <div className={s.amountSection}>
            <span className={s.label}>Select Amount</span>
            <div className={s.amountGrid}>
              {['100', '500', '1000'].map(val => (
                <button 
                  type="button" 
                  key={val}
                  className={`${s.amountBtn} ${amount === val ? s.amountBtnActive : ''}`}
                  onClick={() => setAmount(val)}
                >
                  ${val}
                </button>
              ))}
            </div>
            <div className={s.customAmountWrapper}>
              <span className={s.currencySymbol}>$</span>
              <input 
                type="number" 
                className={s.customAmountInput}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Custom Amount"
                min="10"
                required
              />
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className={s.methodTabs}>
            <button 
              type="button" 
              className={`${s.methodTab} ${method === 'card' ? s.methodTabActive : ''}`}
              onClick={() => setMethod('card')}
            >
              Credit / Debit Card
            </button>
            <button 
              type="button" 
              className={`${s.methodTab} ${method === 'upi' ? s.methodTabActive : ''}`}
              onClick={() => setMethod('upi')}
            >
              UPI / PhonePe
            </button>
          </div>

          {/* Card Form */}
          {method === 'card' && (
            <div className={s.cardForm}>
              {/* Visual Card Representation */}
              <div className={s.cardVisual}>
                <div className={s.cardChip}></div>
                <div className={s.cardNumberDisplay}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className={s.cardDetails}>
                  <div>
                    <div>Card Holder</div>
                    <div className={s.cardValue}>{cardName || 'JOHN DOE'}</div>
                  </div>
                  <div>
                    <div>Expires</div>
                    <div className={s.cardValue}>{cardExpiry || 'MM/YY'}</div>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className={s.inputGroup}>
                <input 
                  type="text" 
                  className={s.input} 
                  placeholder="Card Number" 
                  maxLength={19}
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  required
                />
              </div>
              <div className={s.inputGroup}>
                <input 
                  type="text" 
                  className={s.input} 
                  placeholder="Cardholder Name"
                  value={cardName}
                  onChange={e => setCardName(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className={s.rowInputs}>
                <input 
                  type="text" 
                  className={s.input} 
                  placeholder="MM/YY" 
                  maxLength={5}
                  value={cardExpiry}
                  onChange={e => setCardExpiry(e.target.value)}
                  required
                />
                <input type="password" className={s.input} placeholder="CVC" maxLength={4} required />
              </div>
            </div>
          )}

          {/* UPI Form */}
          {method === 'upi' && (
            <div className={s.upiBox}>
              <svg className={s.upiLogo} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
              <h3 style={{marginBottom: '1rem'}}>Pay via UPI</h3>
              <div className={s.inputGroup}>
                <input type="text" className={s.input} placeholder="Enter your UPI ID (e.g. name@okhdfc)" required />
              </div>
              <p style={{fontSize: '0.85rem', color: '#6b7280'}}>You will receive a payment request on your UPI app.</p>
            </div>
          )}

          <button type="submit" className={s.submitBtn} disabled={loading || parseFloat(amount) <= 0}>
            {loading ? 'Processing Securely...' : `Pay $${amount || '0'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
