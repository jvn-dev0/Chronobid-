'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import s from './wallet.module.css';
import Logo from '../../../components/Logo';
import { getToken, clearSession } from '../../../lib/api';

interface WalletData {
  balance: number;
  locked_balance: number;
}

interface Escrow {
  id: number;
  auction_id: number;
  locked_amount: number;
  status: string;
  auction_title: string;
  seller_name: string;
  buyer_name?: string;
}

interface Transaction {
  id: number;
  wallet_id: number;
  amount: number;
  transaction_type: string;
  timestamp: string;
}

interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  isDefault: boolean;
}

interface CurrencyInfo {
  code: string;
  symbol: string;
  rateToUSD: number;
  label: string;
}

const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', rateToUSD: 1.0, label: 'USD' },
  { code: 'EUR', symbol: '€', rateToUSD: 0.92, label: 'EUR' },
  { code: 'GBP', symbol: '£', rateToUSD: 0.79, label: 'GBP' },
  { code: 'INR', symbol: '₹', rateToUSD: 83.5, label: 'INR' },
  { code: 'AED', symbol: 'AED ', rateToUSD: 3.67, label: 'AED' },
  { code: 'SGD', symbol: 'S$', rateToUSD: 1.35, label: 'SGD' },
  { code: 'MYR', symbol: 'RM ', rateToUSD: 4.72, label: 'MYR' },
];

export default function BidderWallet() {
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, locked_balance: 0 });
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; id?: number; username?: string }>({});
  const [loading, setLoading] = useState(true);

  // Escrow Release State
  const [processingEscrowId, setProcessingEscrowId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Redesigned Add Funds Modal State Flow (Ditto Reference Layout)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'SELECT' | 'CHECKOUT_SANDBOX' | 'SUCCESS' | 'FAILED'>('SELECT');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo>(SUPPORTED_CURRENCIES[0]);
  const [enteredAmountStr, setEnteredAmountStr] = useState('500');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(500);
  const [validationError, setValidationError] = useState('');
  const [isDepositProcessing, setIsDepositProcessing] = useState(false);
  const [completedTxnId, setCompletedTxnId] = useState('');
  const [rzpSdkLoaded, setRzpSdkLoaded] = useState(false);

  // Active Selected Payment Method in Checkout Sandbox Flow
  const [activePaymentMethod, setActivePaymentMethod] = useState<'CARDS' | 'UPI' | 'NET_BANKING' | 'WALLETS' | 'EMI' | 'INTL_CARDS'>('CARDS');

  // Interactive Test Payment Form Inputs
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState('Jeevan Babu');
  const [upiId, setUpiId] = useState('success@razorpay');
  const [upiTabMode, setUpiTabMode] = useState<'VPA' | 'QR'>('VPA');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('Amazon Pay');
  const [selectedEmiTenure, setSelectedEmiTenure] = useState('3 Months');
  const [intlCountry, setIntlCountry] = useState('United States');

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([
    { id: 'card_1', brand: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
    { id: 'card_2', brand: 'Mastercard', last4: '1234', exp: '09/27', isDefault: false },
  ]);

  // Transaction History Filter State
  const [transFilter, setTransFilter] = useState<'all' | 'deposits' | 'holds' | 'payments' | 'refunds' | 'withdrawals'>('all');

  // Jasper AI State
  const [isJasperOpen, setIsJasperOpen] = useState(false);
  const [jasperInput, setJasperInput] = useState('');
  const [jasperReply, setJasperReply] = useState('');
  const [isJasperLoading, setIsJasperLoading] = useState(false);

  // Profile Dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load Razorpay JS SDK Dynamically (matching razorpay-react-checkout)
  useEffect(() => {
    fetchData();

    if (typeof window !== 'undefined') {
      if ((window as any).Razorpay) {
        setRzpSdkLoaded(true);
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRzpSdkLoaded(true);
        document.body.appendChild(script);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Profile
      fetch('http://localhost:8000/api/auth/me', { headers })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(() => {});

      // Fetch Wallet Balance
      const wRes = await fetch('http://localhost:8000/api/wallet/balance', { headers });
      if (wRes.ok) {
        setWallet(await wRes.json());
      }

      // Fetch Escrows
      const eRes = await fetch('http://localhost:8000/api/escrow/bidder', { headers });
      if (eRes.ok) {
        setEscrows(await eRes.json());
      }

      // Fetch Transactions
      const tRes = await fetch('http://localhost:8000/api/wallet/transactions', { headers });
      if (tRes.ok) {
        const txData = await tRes.json();
        setTransactions(txData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Escrow Release Handler
  const handleRelease = async (escrowId: number) => {
    if (!confirm("Are you sure you have received the item? This will release funds to the seller.")) {
      return;
    }
    
    setProcessingEscrowId(escrowId);
    setToastMessage('');
    
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8000/api/escrow/release/${escrowId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to release funds');
      }
      
      setToastType('success');
      setToastMessage('Funds successfully released to the seller!');
      await fetchData(); // Refresh state
    } catch (err: any) {
      setToastType('error');
      setToastMessage(err.message || 'Error releasing funds.');
    } finally {
      setProcessingEscrowId(null);
      setTimeout(() => setToastMessage(''), 5000);
    }
  };

  // Preset Click Handler
  const handlePresetSelect = (presetVal: number) => {
    setSelectedPreset(presetVal);
    const convertedAmount = Math.round(presetVal * selectedCurrency.rateToUSD);
    setEnteredAmountStr(convertedAmount.toString());
    setValidationError('');
  };

  // Currency Selection Handler
  const handleCurrencyChange = (newCode: string) => {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === newCode) || SUPPORTED_CURRENCIES[0];
    setSelectedCurrency(found);
    if (selectedPreset) {
      const converted = Math.round(selectedPreset * found.rateToUSD);
      setEnteredAmountStr(converted.toString());
    }
  };

  // Custom Amount Input Handler
  const handleAmountInputChange = (valStr: string) => {
    setEnteredAmountStr(valStr);
    setSelectedPreset(null);

    const valNum = parseFloat(valStr);
    if (isNaN(valNum) || valNum <= 0) {
      setValidationError('Please enter a valid amount.');
    } else if (valNum < 10 * selectedCurrency.rateToUSD) {
      setValidationError(`Minimum amount is ${selectedCurrency.symbol}${Math.round(10 * selectedCurrency.rateToUSD)}`);
    } else if (valNum > 50000 * selectedCurrency.rateToUSD) {
      setValidationError(`Maximum amount is ${selectedCurrency.symbol}${Math.round(50000 * selectedCurrency.rateToUSD).toLocaleString()}`);
    } else {
      setValidationError('');
    }
  };

  // Click Payment Method or Continue to Payment
  const handleSelectMethodAndProceed = (method?: 'CARDS' | 'UPI' | 'NET_BANKING' | 'WALLETS' | 'EMI' | 'INTL_CARDS') => {
    const valNum = parseFloat(enteredAmountStr);
    if (isNaN(valNum) || valNum <= 0 || validationError) return;
    if (method) setActivePaymentMethod(method);
    setModalStep('CHECKOUT_SANDBOX');
  };

  // Continue to Payment Button Click
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    handleSelectMethodAndProceed();
  };

  // Confirm Payment (Deposit API Integration)
  const handleConfirmSandboxPayment = async () => {
    const valNum = parseFloat(enteredAmountStr);
    if (isNaN(valNum) || valNum <= 0) return;

    // Calculate USD equivalent for backend deposit
    const usdAmount = valNum / selectedCurrency.rateToUSD;

    setIsDepositProcessing(true);

    try {
      const token = getToken();
      const res = await fetch('http://localhost:8000/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.round(usdAmount * 100) / 100,
          payment_method: 'Razorpay Sandbox'
        })
      });

      if (res.ok) {
        const txnId = `TXN_RZP_${Math.floor(100000 + Math.random() * 900000)}`;
        setCompletedTxnId(txnId);
        setModalStep('SUCCESS');
        await fetchData(); // Refresh wallet balance & transactions
      } else {
        setModalStep('FAILED');
      }
    } catch (err) {
      console.error(err);
      setModalStep('FAILED');
    } finally {
      setIsDepositProcessing(false);
    }
  };

  // Ask Jasper
  const askJasper = async (customPrompt?: string) => {
    const textToAsk = customPrompt || jasperInput;
    if (!textToAsk.trim()) return;
    setIsJasperLoading(true);
    setJasperReply('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToAsk, user_role: 'bidder', user_id: profile.id || 1 })
      });
      const data = await res.json();
      setJasperReply(data.answer);
      if (!customPrompt) setJasperInput('');
    } catch {
      setJasperReply("Jasper assistance: Reserved funds are temporarily held in escrow when you win or confirm a bid, and are either settled upon receipt or released if the bid loses.");
    }
    setIsJasperLoading(false);
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  // Derived Values
  const availableBalance = Math.max(0, wallet.balance - wallet.locked_balance);
  const isNewUser = wallet.balance === 0 && escrows.length === 0 && transactions.length === 0;

  const currentEnteredNum = parseFloat(enteredAmountStr) || 0;
  const processingFee = 0.0;
  const totalCharged = currentEnteredNum + processingFee;

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    if (transFilter === 'all') return true;
    if (transFilter === 'deposits') return t.transaction_type.toLowerCase().includes('deposit');
    if (transFilter === 'holds') return t.transaction_type.toLowerCase().includes('hold') || t.transaction_type.toLowerCase().includes('escrow');
    if (transFilter === 'payments') return t.transaction_type.toLowerCase().includes('release') || t.transaction_type.toLowerCase().includes('payment');
    if (transFilter === 'refunds') return t.transaction_type.toLowerCase().includes('refund');
    if (transFilter === 'withdrawals') return t.transaction_type.toLowerCase().includes('withdraw');
    return true;
  });

  return (
    <div className={s.pageContainer}>
      
      {/* ════ 1. COMPACT LUXURY MARKETPLACE HEADER ════ */}
      <header className={s.headerBar}>
        <div className={s.headerLeft}>
          <Logo size={34} fontSize={22} light={true} />
        </div>

        <nav className={s.headerNavLinks}>
          <Link href="/bidder/dashboard" className={s.headerNavLink}>Home</Link>
          <Link href="/bidder/live" className={s.headerNavLink}>Live Auctions</Link>
          <Link href="/bidder/my-bids" className={s.headerNavLink}>My Bids</Link>
          <Link href="/bidder/watchlist" className={s.headerNavLink}>Watchlist</Link>
          <Link href="/bidder/wallet" className={`${s.headerNavLink} ${s.headerNavLinkActive}`}>Wallet &amp; Escrow</Link>
          <Link href="/bidder/notifications" className={s.headerNavLink}>Notifications</Link>
        </nav>

        <div className={s.headerRightControls}>
          <div className={s.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className={s.searchInput} placeholder="Search lots, auctions..." />
          </div>

          <Link href="/bidder/notifications" className={s.iconBtn} title="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>

          <button onClick={() => { setIsAddFundsOpen(true); setModalStep('SELECT'); }} className={s.escrowPill}>
            <span>💳 Wallet</span>
            <span style={{ color: '#ffffff' }}>${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileOpen(o => !o)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#D9A928', color: '#050E1E', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                {profile.first_name ? profile.first_name[0].toUpperCase() : 'J'}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9A928" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isProfileOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#0B1A36', border: '1px solid rgba(217,169,40,0.3)', borderRadius: '12px', padding: '8px', minWidth: '160px', zIndex: 300, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '6px 12px', color: '#D9A928', fontSize: '12px', fontWeight: 700 }}>{profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Jeevan Babu Bidder'}</div>
                <Link href="/seller/profile" style={{ display: 'block', padding: '8px 12px', color: '#F7F3E8', textDecoration: 'none', fontSize: '13px', borderRadius: '6px' }}>Profile Settings</Link>
                <Link href="/bidder/wallet" style={{ display: 'block', padding: '8px 12px', color: '#F7F3E8', textDecoration: 'none', fontSize: '13px', borderRadius: '6px' }}>Wallet &amp; Escrow</Link>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={s.innerContainer}>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div style={{ margin: '20px 0', padding: '14px 20px', borderRadius: '12px', background: toastType === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toastType === 'success' ? '#34D399' : '#F87171'}`, color: toastType === 'success' ? '#34D399' : '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}

        {/* ════ 2. PAGE INTRO ════ */}
        <div className={s.pageIntroRow}>
          <div>
            <h1 className={s.pageIntroTitle}>Wallet &amp; Escrow</h1>
            <p className={s.pageIntroSub}>Manage your funds, secure your bids, and track payments throughout your collecting journey.</p>
          </div>

          <div>
            {paymentMethods.length > 0 || wallet.balance > 0 ? (
              <div className={s.statusIndicatorActive}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399' }}></span>
                Payment account active
              </div>
            ) : (
              <div className={s.statusIndicatorRequired}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D9A928' }}></span>
                <span>Payment setup required</span>
                <button onClick={() => { setIsAddFundsOpen(true); setModalStep('SELECT'); }} className={s.setupBtn}>Complete Setup →</button>
              </div>
            )}
          </div>
        </div>

        {/* ════ 3. MAIN WALLET HERO PANEL ════ */}
        <div className={s.walletHeroCard}>
          <div>
            <div className={s.heroEyebrow}>YOUR AUCTION WALLET</div>
            <h2 className={s.heroTitle}>
              {isNewUser ? 'Ready for Your First Auction?' : 'Available Balance'}
            </h2>
            <div className={s.heroBalanceBig}>
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={s.heroSub}>
              {isNewUser 
                ? 'Add funds to your wallet and start bidding on rare and extraordinary items from around the world.'
                : 'Available for placing eligible bids or completing auction payments.'}
            </p>

            <div className={s.heroActions}>
              <button onClick={() => { setIsAddFundsOpen(true); setModalStep('SELECT'); }} className={s.btnPrimaryGold}>
                + Add Funds
              </button>
              <a href="#payment-methods" className={s.btnSecondaryOutline}>
                Payment Methods
              </a>
              <a href="#how-funds-move" className={s.btnSecondaryOutline}>
                How It Works
              </a>
            </div>

            <p className={s.heroNote}>
              🔒 Funds are only used when you place eligible bids or complete auction payments.
            </p>
          </div>

          <div className={s.heroImageWrap}>
            <Image 
              src="/luxury-wallet-vault.jpg" 
              alt="Luxury Auction Vault & Payment Concept" 
              fill
              className={s.heroImage} 
              priority
            />
          </div>
        </div>

        {/* ════ 4. BALANCE SUMMARY (3 CARDS) ════ */}
        <div className={s.balanceSummaryGrid}>
          {/* Card 1: Available */}
          <div className={s.summaryCard}>
            <div className={s.summaryHeader}>
              <span className={s.summaryLabel}>Available to Bid</span>
              <div className={s.summaryIconWrap} style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                💳
              </div>
            </div>
            <div className={s.summaryValue}>
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={s.summarySub}>Money currently available for eligible bids.</p>
          </div>

          {/* Card 2: Locked in Escrow */}
          <div className={s.summaryCard}>
            <div className={s.summaryHeader}>
              <span className={s.summaryLabel}>Locked in Escrow</span>
              <div className={s.summaryIconWrap} style={{ background: 'rgba(217,169,40,0.15)', color: '#D9A928' }}>
                🔒
              </div>
            </div>
            <div className={s.summaryValue} style={{ color: '#D9A928' }}>
              ${wallet.locked_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={s.summarySub}>Funds currently reserved for active bidding/payment processes.</p>
          </div>

          {/* Card 3: Pending / Refunds */}
          <div className={s.summaryCard}>
            <div className={s.summaryHeader}>
              <span className={s.summaryLabel}>Pending / Refunds</span>
              <div className={s.summaryIconWrap} style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                ⏳
              </div>
            </div>
            <div className={s.summaryValue}>
              $0.00
            </div>
            <p className={s.summarySub}>Money currently being returned or awaiting settlement.</p>
          </div>
        </div>

        {/* ════ 5. NEW BIDDER ONBOARDING STATE ════ */}
        {isNewUser && (
          <div className={s.newBidderCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', color: '#ffffff' }}>
                  Your wallet is ready for your first auction.
                </h3>
                <p style={{ margin: 0, color: '#9AA6B8', fontSize: '14px', maxWidth: '640px' }}>
                  Add funds when you're ready to place your first bid. ChronoBid will show you exactly what amount is being reserved before you confirm.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setIsAddFundsOpen(true); setModalStep('SELECT'); }} className={s.btnPrimaryGold}>Add Funds →</button>
                <a href="#how-funds-move" className={s.btnSecondaryOutline}>Learn How It Works</a>
              </div>
            </div>

            <div className={s.newBidderGrid}>
              <div className={s.newBidderStepBox}>
                <span className={s.stepNumberPill}>01</span>
                <h4 className={s.stepTitle}>Add Funds</h4>
                <p className={s.stepDesc}>Deposit funds to your bidding balance using debit card, credit card, or bank transfer.</p>
              </div>
              <div className={s.newBidderStepBox}>
                <span className={s.stepNumberPill}>02</span>
                <h4 className={s.stepTitle}>Place a Bid</h4>
                <p className={s.stepDesc}>Browse curated vintage watch, art, and antique lots and submit your bid according to auction rules.</p>
              </div>
              <div className={s.newBidderStepBox}>
                <span className={s.stepNumberPill}>03</span>
                <h4 className={s.stepTitle}>Funds Reserved When Required</h4>
                <p className={s.stepDesc}>Funds are temporarily reserved only when an active hold is required. Unused funds remain in your balance.</p>
              </div>
            </div>
          </div>
        )}

        {/* ════ 6. HOW YOUR AUCTION FUNDS MOVE ════ */}
        <div id="how-funds-move" className={s.fundsMoveSection}>
          <div className={s.sectionHeaderRow}>
            <h2 className={s.sectionTitleSerif}>
              <span>🔄</span> How Your Auction Funds Move
            </h2>
            <a href="#security" style={{ color: '#D9A928', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
              Learn More About Escrow →
            </a>
          </div>

          <div className={s.timelineGrid}>
            {/* Step 1 */}
            <div className={s.timelineStep}>
              <div className={s.timelineBadge}>1</div>
              <h4 className={s.timelineStepTitle}>Place Bid</h4>
              <p className={s.timelineStepText}>You submit a bid according to the auction rules.</p>
            </div>

            {/* Step 2 */}
            <div className={s.timelineStep}>
              <div className={s.timelineBadge}>2</div>
              <h4 className={s.timelineStepTitle}>Funds Reserved</h4>
              <p className={s.timelineStepText}>If the auction/payment flow requires funds to be reserved, the relevant amount is placed on hold.</p>
            </div>

            {/* Step 3 */}
            <div className={s.timelineStep}>
              <div className={s.timelineBadge}>3</div>
              <h4 className={s.timelineStepTitle}>Auction Ends</h4>
              <p className={s.timelineStepText}>If you win, the payment proceeds according to the auction's payment terms.</p>
            </div>

            {/* Step 4 */}
            <div className={s.timelineStep}>
              <div className={s.timelineBadge}>4</div>
              <h4 className={s.timelineStepTitle}>Complete &amp; Settle</h4>
              <p className={s.timelineStepText}>Payment is released/settled according to the platform's configured payment process.</p>
            </div>
          </div>

          <p style={{ margin: '20px 0 0 0', color: '#64748B', fontSize: '12.5px', fontStyle: 'italic' }}>
            * AI-assisted screening &amp; secure escrow processing. All fund holds strictly adhere to ChronoBid platform rules.
          </p>
        </div>

        {/* ════ 7. ACTIVE ESCROW HOLDS ════ */}
        <div className={s.escrowHoldsCard}>
          <div className={s.sectionHeaderRow}>
            <h2 className={s.sectionTitleSerif}>
              <span>🛡️</span> Active Escrow Holds
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#9AA6B8' }}>Loading escrow holds...</div>
          ) : escrows.length === 0 ? (
            <div className={s.emptyStateWrap}>
              <div style={{ fontSize: '36px' }}>📦</div>
              <h3 className={s.emptyStateTitle}>No funds are currently reserved.</h3>
              <p className={s.emptyStateSub}>Your available balance remains ready for your next eligible bid.</p>
              <Link href="/bidder/live" className={s.btnPrimaryGold} style={{ marginTop: '8px' }}>
                Explore Live Auctions →
              </Link>
            </div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Auction Item</th>
                  <th>Seller</th>
                  <th>Reserved Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {escrows.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700, color: '#ffffff' }}>{e.auction_title}</td>
                    <td style={{ color: '#9AA6B8' }}>{e.seller_name}</td>
                    <td style={{ fontWeight: 800, color: '#D9A928' }}>${e.locked_amount.toLocaleString()}</td>
                    <td>
                      <span className={e.status === 'Locked' ? s.badgeLocked : s.badgeReleased}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      {e.status === 'Locked' ? (
                        <button 
                          onClick={() => handleRelease(e.id)} 
                          className={s.actionBtnRelease}
                          disabled={processingEscrowId === e.id}
                        >
                          {processingEscrowId === e.id ? 'Processing...' : 'Confirm Receipt & Release'}
                        </button>
                      ) : (
                        <span style={{ color: '#34D399', fontSize: '13px', fontWeight: 600 }}>Released to Seller</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ════ 8. TRANSACTION HISTORY ════ */}
        <div className={s.transHistoryCard}>
          <div className={s.sectionHeaderRow}>
            <h2 className={s.sectionTitleSerif}>
              <span>📜</span> Transaction History
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className={s.filterTabsRow}>
            {(['all', 'deposits', 'holds', 'payments', 'refunds', 'withdrawals'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTransFilter(tab)}
                className={`${s.filterTab} ${transFilter === tab ? s.filterTabActive : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9AA6B8' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#ffffff' }}>No transactions found.</p>
              <p style={{ margin: 0, fontSize: '13px' }}>Your wallet activity will appear here after your first payment.</p>
            </div>
          ) : (
            <div>
              {filteredTransactions.map(t => {
                const isCredit = t.amount > 0 || t.transaction_type.toLowerCase().includes('deposit') || t.transaction_type.toLowerCase().includes('refund');
                const isHold = t.transaction_type.toLowerCase().includes('hold') || t.transaction_type.toLowerCase().includes('escrow');
                return (
                  <div key={t.id} className={s.transItemRow}>
                    <div className={s.transLeft}>
                      <div className={s.transIconBox}>
                        {isCredit ? '💚' : isHold ? '🔒' : '💸'}
                      </div>
                      <div>
                        <div className={s.transDesc}>{t.transaction_type}</div>
                        <div className={s.transDate}>{new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div className={s.transRight}>
                      <div className={isCredit ? s.transAmountCredit : isHold ? s.transAmountHold : s.transAmountDebit}>
                        {isCredit ? `+$${t.amount.toLocaleString()}` : `-$${Math.abs(t.amount).toLocaleString()}`}
                      </div>
                      <span className={s.badgeReleased} style={{ fontSize: '11px', padding: '2px 8px' }}>
                        COMPLETED
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════ 9. PAYMENT METHODS ════ */}
        <div id="payment-methods" className={s.paymentMethodsCard}>
          <div className={s.sectionHeaderRow}>
            <h2 className={s.sectionTitleSerif}>
              <span>💳</span> Payment Methods
            </h2>
            <button onClick={() => { setIsAddFundsOpen(true); setModalStep('SELECT'); }} className={s.btnSecondaryOutline} style={{ padding: '6px 14px', fontSize: '12.5px' }}>
              + Add Payment Method
            </button>
          </div>

          <div className={s.cardsGrid}>
            {paymentMethods.map(card => (
              <div key={card.id} className={s.paymentCardItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '28px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: '#ffffff' }}>
                    {card.brand.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                      {card.brand} •••• {card.last4}
                    </div>
                    <div style={{ color: '#64748B', fontSize: '12px' }}>Expires {card.exp}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {card.isDefault ? (
                    <span className={s.badgeLocked} style={{ fontSize: '11px' }}>Default</span>
                  ) : (
                    <button 
                      onClick={() => setPaymentMethods(methods => methods.map(m => ({ ...m, isDefault: m.id === card.id })))}
                      style={{ background: 'none', border: 'none', color: '#9AA6B8', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Make Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ 10. SECURITY & TRUST SECTION ════ */}
        <div id="security" className={s.securityGrid}>
          <div className={s.securityCard}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛡️</div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>Secure Payment Processing</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '13px', lineHeight: 1.45 }}>
              Every payment is processed through configured tier-1 payment infrastructure.
            </p>
          </div>

          <div className={s.securityCard}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>Clear Fund Status</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '13px', lineHeight: 1.45 }}>
              Always see exactly what funds are available to bid, reserved for active auctions, or being refunded.
            </p>
          </div>

          <div className={s.securityCard}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📜</div>
            <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '15px' }}>Transparent History</h4>
            <p style={{ margin: 0, color: '#9AA6B8', fontSize: '13px', lineHeight: 1.45 }}>
              Every deposit, bid hold, escrow release, and refund is logged in your immutable transaction log.
            </p>
          </div>
        </div>

        {/* ════ 11. COMPACT FOOTER ════ */}
        <footer className={s.compactFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo size={24} fontSize={16} light={true} />
            <span>© 2026 ChronoBid Inc. All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/bidder/dashboard" style={{ color: '#9AA6B8', textDecoration: 'none' }}>Home</Link>
            <Link href="/bidder/live" style={{ color: '#9AA6B8', textDecoration: 'none' }}>Auctions</Link>
            <Link href="/bidder/wallet" style={{ color: '#9AA6B8', textDecoration: 'none' }}>Wallet</Link>
            <a href="#security" style={{ color: '#9AA6B8', textDecoration: 'none' }}>Security</a>
          </div>
        </footer>

      </div>

      {/* ════ 12. REDESIGNED PRODUCTION-QUALITY ADD FUNDS MODAL (DITTO REFERENCE) ════ */}
      {isAddFundsOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <button onClick={() => setIsAddFundsOpen(false)} className={s.modalCloseBtn} title="Close modal">✕</button>

            {modalStep === 'SELECT' && (
              <>
                {/* Modal Left Side — Form */}
                <div className={s.modalLeft}>
                  <div>
                    <h2 className={s.modalTitle}>Add Funds to Your Wallet</h2>
                    <p className={s.modalSub}>
                      Add funds securely to participate in auctions. Your money will be used only when you place eligible bids or complete auction payments.
                    </p>

                    <form onSubmit={handleContinueToPayment}>
                      {/* Step 1 */}
                      <div className={s.stepHeaderRow}>
                        <span className={s.stepBadge}>1</span>
                        <span className={s.stepTitleText}>Choose Amount</span>
                      </div>

                      {/* Presets */}
                      <div className={s.presetGrid}>
                        {[
                          { val: 50, label: '$50' },
                          { val: 100, label: '$100' },
                          { val: 250, label: '$250' },
                          { val: 500, label: '$500' },
                          { val: 1000, label: '$1,000' }
                        ].map(p => (
                          <button
                            type="button"
                            key={p.val}
                            onClick={() => handlePresetSelect(p.val)}
                            className={`${s.presetBtn} ${selectedPreset === p.val ? s.presetBtnActive : ''}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Amount */}
                      <label className={s.customAmountLabel}>Or enter a custom amount</label>
                      <div className={s.customAmountGroup}>
                        <span className={s.currencySymbolLarge}>{selectedCurrency.symbol}</span>
                        <input
                          type="number"
                          value={enteredAmountStr}
                          onChange={e => handleAmountInputChange(e.target.value)}
                          className={s.customAmountInputLarge}
                          placeholder="500"
                          min="1"
                          required
                        />
                        <div style={{ position: 'relative' }}>
                          <select
                            value={selectedCurrency.code}
                            onChange={e => handleCurrencyChange(e.target.value)}
                            className={s.currencySelect}
                          >
                            {SUPPORTED_CURRENCIES.map(curr => (
                              <option key={curr.code} value={curr.code}>{curr.code}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {validationError && (
                        <div style={{ color: '#EF4444', fontSize: '12.5px', marginBottom: '14px', fontWeight: 600 }}>
                          ⚠️ {validationError}
                        </div>
                      )}

                      {/* Step 2 */}
                      <div className={s.stepHeaderRow}>
                        <span className={s.stepBadge}>2</span>
                        <span className={s.stepTitleText}>Review</span>
                      </div>

                      {/* Review Box */}
                      <div className={s.reviewBox}>
                        <div className={s.reviewRow}>
                          <span>Amount to add</span>
                          <span className={s.reviewRowValue}>
                            {selectedCurrency.symbol}{currentEnteredNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className={s.reviewRow}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Processing fee <span style={{ cursor: 'pointer', color: '#94A3B8' }} title="No fee charged by ChronoBid">ⓘ</span>
                          </span>
                          <span className={s.reviewRowValue}>
                            {selectedCurrency.symbol}0.00
                          </span>
                        </div>

                        {selectedCurrency.code !== 'USD' && (
                          <div className={s.reviewRow} style={{ fontSize: '12px', color: '#0284C7' }}>
                            <span>Exchange Rate</span>
                            <span>1 USD = {selectedCurrency.symbol}{selectedCurrency.rateToUSD}</span>
                          </div>
                        )}

                        <div className={s.reviewDivider}></div>

                        <div className={s.reviewTotalRow}>
                          <span>Total</span>
                          <span className={s.reviewTotalValue}>
                            {selectedCurrency.symbol}{totalCharged.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={currentEnteredNum <= 0 || !!validationError}
                        className={s.btnContinuePayment}
                      >
                        Continue to Payment →
                      </button>

                      <div className={s.paymentRedirectNote}>
                        🔒 You will be redirected to Razorpay's secure payment page.
                      </div>
                    </form>
                  </div>
                </div>

                {/* Modal Right Side — Razorpay Info */}
                <div className={s.modalRight}>
                  <div>
                    {/* Header */}
                    <div className={s.rzpHeaderRow}>
                      <div className={s.rzpLogoWrap}>
                        <svg width="110" height="24" viewBox="0 0 120 28" fill="none">
                          <path d="M14.2 2L2 26h8.5l3.8-7.5L20.5 26H28L14.2 2z" fill="#0284C7"/>
                          <path d="M10.5 26l5.2-10L21.5 26h-11z" fill="#0284C7" opacity="0.75"/>
                          <text x="32" y="21" fontFamily="Inter, sans-serif" fontWeight="900" fontStyle="italic" fontSize="22" fill="#0C2340">Razorpay</text>
                        </svg>
                      </div>
                      <span className={s.testModeBadge}>TEST MODE</span>
                    </div>

                    <h3 className={s.rzpSecTitle}>Secure Payments by Razorpay</h3>
                    <p className={s.rzpSecSub}>Complete your payment using your preferred method.</p>

                    {/* Sandbox Notice Box */}
                    <div className={s.sandboxNoticeBox}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className={s.sandboxNoticeTitle}>This is a Test Payment (Sandbox)</h4>
                        <p className={s.sandboxNoticeText}>
                          You can use Razorpay's test environment to simulate payments without using real money.
                        </p>
                      </div>
                    </div>

                    {/* Supported Payment Methods */}
                    <div className={s.stepTitleText} style={{ marginBottom: '12px' }}>Supported Payment Methods</div>
                    <div className={s.methodsGrid}>
                      <div className={s.methodCard} onClick={() => handleSelectMethodAndProceed('CARDS')} style={{ cursor: 'pointer' }} title="Pay with Credit or Debit Card">
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <line x1="2" y1="8" x2="22" y2="8"/>
                          <rect x="6" y="12" width="4" height="2" rx="0.5" fill="#0F172A"/>
                        </svg>
                        <h5 className={s.methodTitle}>Cards</h5>
                        <p className={s.methodSub}>Visa, Mastercard, RuPay, Amex</p>
                      </div>

                      <div className={s.methodCard} onClick={() => handleSelectMethodAndProceed('UPI')} style={{ cursor: 'pointer' }} title="Pay with UPI / QR Code">
                        <svg width="42" height="20" viewBox="0 0 70 24" fill="none">
                          <text x="0" y="19" fontFamily="Inter, sans-serif" fontWeight="900" fontStyle="italic" fontSize="20" fill="#0F172A">UPI</text>
                          <path d="M48 4l8 8-8 8V4z" fill="#059669"/>
                          <path d="M56 4l8 8-8 8V4z" fill="#D9A928"/>
                        </svg>
                        <h5 className={s.methodTitle}>UPI</h5>
                        <p className={s.methodSub}>Google Pay, PhonePe, Paytm and more</p>
                      </div>

                      <div className={s.methodCard} onClick={() => handleSelectMethodAndProceed('NET_BANKING')} style={{ cursor: 'pointer' }} title="Pay with Internet Banking">
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 18h20"/>
                          <path d="M2 8h20"/>
                          <path d="M4 5l8-3 8 3"/>
                          <path d="M5 8v10"/>
                          <path d="M10 8v10"/>
                          <path d="M14 8v10"/>
                          <path d="M19 8v10"/>
                        </svg>
                        <h5 className={s.methodTitle}>Net Banking</h5>
                        <p className={s.methodSub}>All major banks</p>
                      </div>

                      <div className={s.methodCard} onClick={() => handleSelectMethodAndProceed('WALLETS')} style={{ cursor: 'pointer' }} title="Pay with Online Wallet">
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/>
                          <circle cx="16" cy="12" r="1.5" fill="#0F172A"/>
                          <path d="M5 6V4a2 2 0 0 1 2-2h10"/>
                        </svg>
                        <h5 className={s.methodTitle}>Wallets</h5>
                        <p className={s.methodSub}>PhonePe, Paytm, Amazon Pay and more</p>
                      </div>

                      <div className={s.methodCard} onClick={() => handleSelectMethodAndProceed('EMI')} style={{ cursor: 'pointer' }} title="Pay via EMI / Installments">
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="15" rx="2" ry="2"/>
                          <line x1="16" y1="1" x2="16" y2="5"/>
                          <line x1="8" y1="1" x2="8" y2="5"/>
                          <line x1="3" y1="8" x2="21" y2="8"/>
                          <circle cx="8" cy="12" r="1" fill="#0F172A"/>
                          <circle cx="12" cy="12" r="1" fill="#0F172A"/>
                          <circle cx="16" cy="12" r="1" fill="#0F172A"/>
                        </svg>
                        <h5 className={s.methodTitle}>EMI</h5>
                        <p className={s.methodSub}>EMI on Cards (Where available)</p>
                      </div>

                      <div className={s.methodCard} onClick={() => handleSelectMethodAndProceed('INTL_CARDS')} style={{ cursor: 'pointer' }} title="Pay with International Cards">
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="10" r="8"/>
                          <line x1="4" y1="10" x2="20" y2="10"/>
                          <path d="M12 2a11 11 0 0 1 3.5 8A11 11 0 0 1 12 18 11 11 0 0 1 8.5 10 11 11 0 0 1 12 2z"/>
                        </svg>
                        <h5 className={s.methodTitle}>International Cards</h5>
                        <p className={s.methodSub}>Pay with international credit/debit cards</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Security Icons */}
                  <div className={s.footerTrustGrid}>
                    <div className={s.trustCardItem}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                      <div>
                        <h6 className={s.trustTitle}>Encrypted &amp; Secure</h6>
                        <p className={s.trustText}>Your payment info is processed securely.</p>
                      </div>
                    </div>

                    <div className={s.trustCardItem}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 12l2 2 4-4"/>
                      </svg>
                      <div>
                        <h6 className={s.trustTitle}>Trusted Businesses</h6>
                        <p className={s.trustText}>Powering payments for millions.</p>
                      </div>
                    </div>

                    <div className={s.trustCardItem}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F172A" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                      </svg>
                      <div>
                        <h6 className={s.trustTitle}>Instant Wallet Credit</h6>
                        <p className={s.trustText}>Updated instantly after success.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step: Razorpay Interactive Test Mode Checkout Flow */}
            {modalStep === 'CHECKOUT_SANDBOX' && (
              <div style={{ gridColumn: 'span 2', background: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', padding: '0' }}>
                {/* Razorpay Top Header Bar */}
                <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="105" height="24" viewBox="0 0 120 28" fill="none">
                      <path d="M14.2 2L2 26h8.5l3.8-7.5L20.5 26H28L14.2 2z" fill="#0284C7"/>
                      <path d="M10.5 26l5.2-10L21.5 26h-11z" fill="#0284C7" opacity="0.75"/>
                      <text x="32" y="21" fontFamily="Inter, sans-serif" fontWeight="900" fontStyle="italic" fontSize="22" fill="#FFFFFF">Razorpay</text>
                    </svg>
                    <span style={{ background: '#0284C7', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '12px', letterSpacing: '0.05em' }}>
                      TEST MODE (SANDBOX)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => setModalStep('SELECT')}
                      style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#CBD5E1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                      ← Change Amount / Currency
                    </button>
                    <button onClick={() => setIsAddFundsOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>

                {/* Amount Ribbon Summary */}
                <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block' }}>RECIPIENT &amp; PURPOSE</span>
                    <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 800 }}>ChronoBid Auction House • Wallet Funding</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block' }}>TOTAL AMOUNT</span>
                    <span style={{ fontSize: '20px', color: '#0284C7', fontWeight: 900 }}>
                      {selectedCurrency.symbol}{currentEnteredNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Main Split Body: Left Payment Tabs + Right Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '440px' }}>
                  {/* Left Methods Tabs */}
                  <div style={{ background: '#F1F5F9', borderRight: '1px solid #E2E8F0', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', padding: '0 8px 8px 8px', letterSpacing: '0.06em' }}>SELECT PAYMENT METHOD</div>

                    {[
                      { id: 'CARDS', label: 'Cards (Credit/Debit)', icon: '💳', sub: 'Visa, Mastercard, RuPay' },
                      { id: 'UPI', label: 'UPI / QR Code', icon: '⚡', sub: 'GPay, PhonePe, Paytm' },
                      { id: 'NET_BANKING', label: 'Net Banking', icon: '🏛️', sub: 'SBI, HDFC, ICICI, Axis' },
                      { id: 'WALLETS', label: 'Wallets', icon: '👛', sub: 'Amazon Pay, Paytm' },
                      { id: 'EMI', label: 'EMI / Installments', icon: '📅', sub: 'No Cost EMI available' },
                      { id: 'INTL_CARDS', label: 'International Cards', icon: '🌐', sub: 'Global Multi-Currency' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActivePaymentMethod(tab.id as any)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: activePaymentMethod === tab.id ? '1.5px solid #0284C7' : '1px solid transparent',
                          background: activePaymentMethod === tab.id ? '#FFFFFF' : 'transparent',
                          color: activePaymentMethod === tab.id ? '#0284C7' : '#334155',
                          fontWeight: activePaymentMethod === tab.id ? 800 : 600,
                          cursor: 'pointer',
                          boxShadow: activePaymentMethod === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px' }}>{tab.label}</div>
                          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 400 }}>{tab.sub}</div>
                        </div>
                      </button>
                    ))}

                    <div style={{ marginTop: 'auto', padding: '12px 8px 0 8px', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🔒 256-Bit TLS Encryption</span>
                    </div>
                  </div>

                  {/* Right Method Form Details */}
                  <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* CARDS PANEL */}
                      {activePaymentMethod === 'CARDS' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Enter Card Details</h4>
                            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '4px 10px', borderRadius: '12px' }}>
                              ✔ Test Card Pre-filled
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Card Number</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  value={cardNumber}
                                  onChange={e => setCardNumber(e.target.value)}
                                  placeholder="4111 1111 1111 1111"
                                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
                                />
                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 900, color: '#0284C7' }}>VISA / MC</span>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Expiry (MM/YY)</label>
                                <input
                                  type="text"
                                  value={cardExp}
                                  onChange={e => setCardExp(e.target.value)}
                                  placeholder="12/28"
                                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>CVV / CVC</label>
                                <input
                                  type="password"
                                  value={cardCvv}
                                  onChange={e => setCardCvv(e.target.value)}
                                  placeholder="123"
                                  maxLength={4}
                                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
                                />
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Cardholder Name</label>
                              <input
                                type="text"
                                value={cardName}
                                onChange={e => setCardName(e.target.value)}
                                placeholder="Jeevan Babu"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 600, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* UPI PANEL */}
                      {activePaymentMethod === 'UPI' && (
                        <div>
                          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Pay via UPI App or VPA ID</h4>

                          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                            <button
                              onClick={() => setUpiTabMode('VPA')}
                              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: upiTabMode === 'VPA' ? '#0284C7' : '#E2E8F0', color: upiTabMode === 'VPA' ? '#FFFFFF' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '12.5px' }}
                            >
                              UPI ID / VPA
                            </button>
                            <button
                              onClick={() => setUpiTabMode('QR')}
                              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: upiTabMode === 'QR' ? '#0284C7' : '#E2E8F0', color: upiTabMode === 'QR' ? '#FFFFFF' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '12.5px' }}
                            >
                              Scan QR Code
                            </button>
                          </div>

                          {upiTabMode === 'VPA' ? (
                            <div style={{ maxWidth: '420px' }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Enter VPA / UPI ID</label>
                              <input
                                type="text"
                                value={upiId}
                                onChange={e => setUpiId(e.target.value)}
                                placeholder="success@razorpay"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, outline: 'none', color: '#0F172A', marginBottom: '14px' }}
                              />

                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>OR SELECT PREFERRED UPI APP</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                {[
                                  { name: 'Google Pay', handle: 'user@okicici', bg: '#EA4335' },
                                  { name: 'PhonePe', handle: 'user@ybl', bg: '#5F259F' },
                                  { name: 'Paytm', handle: 'user@paytm', bg: '#00B9F1' },
                                  { name: 'BHIM', handle: 'user@upi', bg: '#005697' }
                                ].map(app => (
                                  <button
                                    key={app.name}
                                    onClick={() => setUpiId(app.handle)}
                                    style={{ padding: '10px 6px', borderRadius: '8px', border: upiId === app.handle ? '2px solid #0284C7' : '1px solid #CBD5E1', background: '#FFFFFF', textAlign: 'center', cursor: 'pointer' }}
                                  >
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: app.bg }}>{app.name}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', maxWidth: '320px', margin: '0 auto' }}>
                              <div style={{ width: '140px', height: '140px', background: '#FFFFFF', border: '2px solid #0F172A', borderRadius: '8px', margin: '0 auto 10px auto', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="110" height="110" viewBox="0 0 100 100" fill="#0F172A">
                                  <rect x="0" y="0" width="30" height="30"/>
                                  <rect x="70" y="0" width="30" height="30"/>
                                  <rect x="0" y="70" width="30" height="30"/>
                                  <rect x="10" y="10" width="10" height="10" fill="#FFFFFF"/>
                                  <rect x="80" y="10" width="10" height="10" fill="#FFFFFF"/>
                                  <rect x="10" y="80" width="10" height="10" fill="#FFFFFF"/>
                                  <rect x="40" y="40" width="20" height="20"/>
                                  <rect x="60" y="70" width="30" height="20"/>
                                </svg>
                              </div>
                              <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 800 }}>Scan QR using GPay, PhonePe, or Paytm</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* NET BANKING PANEL */}
                      {activePaymentMethod === 'NET_BANKING' && (
                        <div>
                          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Select Your Bank</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            {[
                              { code: 'HDFC', name: 'HDFC Bank', color: '#004B8D' },
                              { code: 'ICICI', name: 'ICICI Bank', color: '#F37021' },
                              { code: 'SBI', name: 'State Bank of India', color: '#280071' },
                              { code: 'AXIS', name: 'Axis Bank', color: '#97144D' },
                              { code: 'KOTAK', name: 'Kotak Mahindra', color: '#ED1C24' },
                              { code: 'PNB', name: 'Punjab National Bank', color: '#A20A3B' }
                            ].map(b => (
                              <button
                                key={b.code}
                                onClick={() => setSelectedBank(b.code)}
                                style={{ padding: '14px 10px', borderRadius: '10px', border: selectedBank === b.code ? '2px solid #0284C7' : '1px solid #CBD5E1', background: selectedBank === b.code ? '#F0F9FF' : '#FFFFFF', cursor: 'pointer', textAlign: 'center' }}
                              >
                                <div style={{ fontSize: '13px', fontWeight: 800, color: b.color }}>{b.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WALLETS PANEL */}
                      {activePaymentMethod === 'WALLETS' && (
                        <div>
                          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Select Payment Wallet</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px', maxWidth: '420px' }}>
                            {['Amazon Pay', 'Paytm Wallet', 'PhonePe Wallet', 'MobiKwik'].map(w => (
                              <button
                                key={w}
                                onClick={() => setSelectedWallet(w)}
                                style={{ padding: '14px', borderRadius: '10px', border: selectedWallet === w ? '2px solid #0284C7' : '1px solid #CBD5E1', background: selectedWallet === w ? '#F0F9FF' : '#FFFFFF', cursor: 'pointer', fontWeight: 800, color: '#0F172A', fontSize: '13px' }}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* EMI PANEL */}
                      {activePaymentMethod === 'EMI' && (
                        <div>
                          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Select EMI Plan</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            {[
                              { tenure: '3 Months', amount: `$${(currentEnteredNum / 3).toFixed(2)}/mo` },
                              { tenure: '6 Months', amount: `$${(currentEnteredNum / 6).toFixed(2)}/mo` },
                              { tenure: '12 Months', amount: `$${(currentEnteredNum / 12).toFixed(2)}/mo` }
                            ].map(plan => (
                              <button
                                key={plan.tenure}
                                onClick={() => setSelectedEmiTenure(plan.tenure)}
                                style={{ padding: '14px', borderRadius: '10px', border: selectedEmiTenure === plan.tenure ? '2px solid #0284C7' : '1px solid #CBD5E1', background: selectedEmiTenure === plan.tenure ? '#F0F9FF' : '#FFFFFF', cursor: 'pointer', textAlign: 'center' }}
                              >
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{plan.tenure}</div>
                                <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 700 }}>{plan.amount}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* INTERNATIONAL CARDS PANEL */}
                      {activePaymentMethod === 'INTL_CARDS' && (
                        <div>
                          <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Global Multi-Currency Card Payment</h4>
                          <div style={{ maxWidth: '420px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Country / Region</label>
                            <select
                              value={intlCountry}
                              onChange={e => setIntlCountry(e.target.value)}
                              style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, outline: 'none', color: '#0F172A', marginBottom: '14px' }}
                            >
                              {['United States', 'United Kingdom', 'Germany', 'United Arab Emirates', 'Singapore', 'Malaysia', 'Canada', 'Australia'].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer inside Modal */}
                    <div style={{ paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                      <button
                        onClick={() => setModalStep('FAILED')}
                        disabled={isDepositProcessing}
                        style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                      >
                        🔴 Test Failed State
                      </button>

                      <button
                        onClick={handleConfirmSandboxPayment}
                        disabled={isDepositProcessing}
                        style={{ background: '#10B981', color: '#FFFFFF', border: 'none', padding: '14px 32px', borderRadius: '10px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {isDepositProcessing ? 'Processing Deposit...' : `🟢 Pay ${selectedCurrency.symbol}${currentEnteredNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} →`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Payment Success Screen */}
            {modalStep === 'SUCCESS' && (
              <div style={{ gridColumn: 'span 2', padding: '56px 40px', textAlign: 'center', background: '#FFFFFF' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', border: '2px solid #34D399', color: '#10B981', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  ✓
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#0F172A', margin: '0 0 10px 0' }}>
                  Funds Added Successfully!
                </h3>
                <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '480px', margin: '0 auto 28px auto' }}>
                  <strong>{selectedCurrency.symbol}{currentEnteredNum.toLocaleString()}</strong> has been credited to your ChronoBid bidding wallet.
                </p>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', maxWidth: '440px', margin: '0 auto 32px auto', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#64748B', fontSize: '13.5px' }}>
                    <span>Transaction ID</span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>{completedTxnId || 'TXN_RZP_984729'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#64748B', fontSize: '13.5px' }}>
                    <span>Payment Method</span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>Razorpay Sandbox</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#64748B', fontSize: '13.5px' }}>
                    <span>Status</span>
                    <span style={{ color: '#10B981', fontWeight: 800 }}>COMPLETED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontSize: '16px', fontWeight: 800, paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
                    <span>New Available Balance</span>
                    <span>${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddFundsOpen(false)}
                  className={s.btnContinuePayment}
                  style={{ width: 'auto', padding: '14px 36px', display: 'inline-flex' }}
                >
                  Back to Wallet →
                </button>
              </div>
            )}

            {/* Step: Payment Failed Screen */}
            {modalStep === 'FAILED' && (
              <div style={{ gridColumn: 'span 2', padding: '56px 40px', textAlign: 'center', background: '#FFFFFF' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #F87171', color: '#EF4444', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  ✕
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#0F172A', margin: '0 0 10px 0' }}>
                  Payment Unsuccessful
                </h3>
                <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '480px', margin: '0 auto 28px auto' }}>
                  Your wallet has not been credited. You can try again using another payment method or currency.
                </p>

                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setModalStep('SELECT')}
                    className={s.btnContinuePayment}
                    style={{ width: 'auto', padding: '14px 28px' }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setIsAddFundsOpen(false)}
                    className={s.btnSecondaryOutline}
                    style={{ color: '#0F172A', borderColor: '#CBD5E1' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ 13. FLOATING JASPER AI ASSISTANT ════ */}
      {!isJasperOpen && (
        <button onClick={() => setIsJasperOpen(true)} className={s.jasperFab}>
          <span>🤖</span>
          <span>Ask Jasper AI</span>
        </button>
      )}

      {isJasperOpen && (
        <div className={s.jasperDrawer}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D9A928', color: '#050E1E', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🤖</div>
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>Jasper Wallet Assistant</span>
            </div>
            <button onClick={() => setIsJasperOpen(false)} style={{ background: 'none', border: 'none', color: '#9AA6B8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>

          <p style={{ fontSize: '12.5px', color: '#9AA6B8', margin: '0 0 12px 0' }}>
            Ask questions about reserved funds, escrow holds, payment methods, or refunds.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {[
              "What does reserved mean?",
              "How does escrow work?",
              "Why is my money locked?",
              "When will my refund arrive?",
              "How do I add funds?"
            ].map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => askJasper(promptText)}
                className={s.promptChip}
              >
                💬 "{promptText}"
              </button>
            ))}
          </div>

          {jasperReply && (
            <div style={{ background: 'rgba(217,169,40,0.1)', border: '1px solid rgba(217,169,40,0.3)', borderRadius: '12px', padding: '12px', color: '#F7F3E8', fontSize: '13px', lineHeight: 1.45, marginBottom: '12px' }}>
              <strong>Jasper:</strong> {jasperReply}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={jasperInput}
              onChange={e => setJasperInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askJasper()}
              placeholder="Ask Jasper about your wallet..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(217,169,40,0.3)', borderRadius: '10px', padding: '8px 12px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
            />
            <button
              onClick={() => askJasper()}
              disabled={isJasperLoading}
              className={s.btnPrimaryGold}
              style={{ padding: '8px 14px', fontSize: '12.5px' }}
            >
              {isJasperLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
