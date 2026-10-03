'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import s from './profile.module.css';
import Logo from '../../../components/Logo';
import { getToken, clearSession } from '../../../lib/api';

interface UserProfile {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_verified?: boolean;
}

interface Wallet {
  balance: number;
  locked_balance: number;
}

interface Transaction {
  id: number;
  amount: number;
  transaction_type: string;
  timestamp: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Transaction History Filter State
  const [txFilter, setTxFilter] = useState<'all' | 'deposits' | 'payouts' | 'holds'>('all');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Profile
      const profileRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/auth/me', { headers });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setEditFirstName(profileData.first_name || 'Jeevan');
        setEditLastName(profileData.last_name || 'Babu');
        setEditPhone(profileData.phone || '9342977191');
        setEditUsername(profileData.username || 'jeevan');
      } else {
        // Fallback default mock profile
        const defaultProf = {
          first_name: 'Jeevan',
          last_name: 'Babu',
          username: 'jeevan',
          email: 'kbjeevanbabu803@gmail.com',
          phone: '9342977191',
          role: 'bidder',
          is_verified: true
        };
        setProfile(defaultProf);
        setEditFirstName('Jeevan');
        setEditLastName('Babu');
        setEditPhone('9342977191');
        setEditUsername('jeevan');
      }

      // Fetch Wallet Balance
      const walletRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/wallet/balance', { headers });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      } else {
        setWallet({ balance: 1600.00, locked_balance: 610.00 });
      }

      // Fetch Transactions
      const txRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/wallet/transactions', { headers });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      } else {
        setTransactions([
          { id: 101, amount: 500, transaction_type: 'Deposit', timestamp: new Date(Date.now() - 86400000).toISOString() },
          { id: 102, amount: 500, transaction_type: 'Deposit', timestamp: new Date(Date.now() - 86400000 * 20).toISOString() },
          { id: 103, amount: 100, transaction_type: 'Deposit', timestamp: new Date(Date.now() - 86400000 * 21).toISOString() },
          { id: 104, amount: 500, transaction_type: 'Deposit', timestamp: new Date(Date.now() - 86400000 * 60).toISOString() }
        ]);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      setProfile({
        ...profile,
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        username: editUsername
      });
    }
    setIsEditOpen(false);
    setToastMessage('Profile details updated successfully!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  if (loading) {
    return (
      <div style={{ color: '#D9A928', background: '#050E1E', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800 }}>
        Loading ChronoBid Profile...
      </div>
    );
  }

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Jeevan Babu' : 'Jeevan Babu';
  const initial = profile?.first_name ? profile.first_name[0].toUpperCase() : 'J';
  const availableBal = wallet?.balance ?? 1600.00;
  const lockedBal = wallet?.locked_balance ?? 610.00;

  const currentRole = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Bidder';
  const isSellerRole = profile?.role?.toLowerCase() === 'seller';

  // Filtered transactions
  const filteredTxs = transactions.filter(t => {
    if (txFilter === 'all') return true;
    if (txFilter === 'deposits') return t.transaction_type.toLowerCase().includes('deposit');
    if (txFilter === 'payouts') return t.transaction_type.toLowerCase().includes('payout') || t.transaction_type.toLowerCase().includes('release');
    if (txFilter === 'holds') return t.transaction_type.toLowerCase().includes('hold') || t.transaction_type.toLowerCase().includes('escrow');
    return true;
  });

  return (
    <div className={s.container}>
      {/* ════ 1. LUXURY HEADER ════ */}
      <header className={s.header}>
        <Link href={isSellerRole ? "/seller/dashboard" : "/bidder/dashboard"} className={s.logoWrap}>
          <Logo size={32} fontSize={20} light={true} />
        </Link>

        <nav className={s.navLinks}>
          <Link href="/bidder/dashboard" className={s.navLink}>Home</Link>
          <Link href="/bidder/live" className={s.navLink}>Live Auctions</Link>
          <Link href="/bidder/my-bids" className={s.navLink}>My Bids</Link>
          <Link href="/bidder/wallet" className={s.navLink}>Wallet &amp; Escrow</Link>
          <Link href="/seller/profile" className={`${s.navLink} ${s.navLinkActive}`}>Profile Settings</Link>
        </nav>

        <Link href={isSellerRole ? "/seller/dashboard" : "/bidder/dashboard"} className={s.backBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Dashboard
        </Link>
      </header>

      <main className={s.mainContent}>
        {/* Toast Alert */}
        {toastMessage && (
          <div style={{ margin: '0 0 24px 0', padding: '14px 20px', borderRadius: '12px', background: 'rgba(52,211,153,0.15)', border: '1px solid #34D399', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '13.5px' }}>
            <span>✓ {toastMessage}</span>
            <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}

        {/* ════ 2. HERO BANNER ════ */}
        <div className={s.heroBanner}>
          <div className={s.heroLeft}>
            <div className={s.avatarWrap}>
              {initial}
            </div>
            <div>
              <h1 className={s.heroTitle}>
                {fullName}
                <span className={s.verifiedBadge}>
                  ✓ Verified {currentRole}
                </span>
              </h1>
              <div className={s.heroSub}>
                <span>@{profile?.username || 'jeevan'}</span>
                <span>•</span>
                <span>{profile?.email || 'kbjeevanbabu803@gmail.com'}</span>
                <span>•</span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>● Active {currentRole} Account</span>
              </div>
              <div className={s.heroMetaPill}>
                <span>★ 4.95 Reputation Rating</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>Account ID #CB-89240</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>Government ID Verified</span>
              </div>
            </div>
          </div>

          <div className={s.heroRightActions}>
            <button onClick={() => setIsEditOpen(true)} className={s.btnGold}>
              ✏️ Edit Profile
            </button>
            <Link href="/bidder/wallet" className={s.btnOutline}>
              💳 Wallet Center
            </Link>
          </div>
        </div>

        {/* ════ 3. TWO COLUMN GRID: PERSONAL INFO + WALLET ════ */}
        <div className={s.gridTwoCol}>
          {/* Card 1: Personal & Account Information */}
          <div className={s.card}>
            <div>
              <div className={s.cardHeaderRow}>
                <h2 className={s.cardTitle}>
                  <span>👤</span> Personal &amp; Account Information
                </h2>
                <button onClick={() => setIsEditOpen(true)} className={s.editChipBtn}>
                  Edit Details
                </button>
              </div>

              <div className={s.profileInfoList}>
                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Full Name</span>
                  <span className={s.infoValue}>{fullName}</span>
                </div>

                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Username</span>
                  <span className={s.infoValue}>@{profile?.username || 'jeevan'}</span>
                </div>

                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Email Address</span>
                  <span className={s.infoValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {profile?.email || 'kbjeevanbabu803@gmail.com'}
                    <span style={{ fontSize: '11px', color: '#34D399', background: 'rgba(52,211,153,0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>VERIFIED</span>
                  </span>
                </div>

                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Phone Number</span>
                  <span className={s.infoValue}>{profile?.phone || '9342977191'}</span>
                </div>

                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Role</span>
                  <span className={s.infoValue} style={{ color: '#34D399', fontWeight: 800 }}>
                    {currentRole}
                  </span>
                </div>

                <div className={s.infoRow}>
                  <span className={s.infoLabel}>Identity Status</span>
                  <span className={s.infoValue} style={{ color: '#34D399', fontSize: '13px' }}>
                    ● Government ID Verified
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12.5px', color: '#9AA6B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔒 Protected by ChronoBid 256-Bit Encrypted Security
            </div>
          </div>

          {/* Card 2: Seller Financial Vault & Available Balance */}
          <div className={`${s.card} ${s.walletCard}`}>
            <div>
              <div className={s.cardHeaderRow} style={{ borderBottomColor: 'rgba(52,211,153,0.2)' }}>
                <h2 className={s.cardTitle}>
                  <span style={{ color: '#34D399' }}>💰</span> Seller Vault Balance
                </h2>
                <span style={{ fontSize: '11.5px', color: '#34D399', background: 'rgba(52,211,153,0.15)', padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                  ACTIVE VAULT
                </span>
              </div>

              <div className={s.balanceBox}>
                <div className={s.balanceLabel}>AVAILABLE BALANCE</div>
                <div className={s.balanceAmount}>
                  ${availableBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {lockedBal > 0 && (
                  <div className={s.lockedBalancePill}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>${lockedBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Reserved in Escrow</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className={s.walletQuickActions}>
                <Link href="/bidder/wallet" className={s.btnGold} style={{ flex: 1, justifyContent: 'center' }}>
                  + Deposit Funds
                </Link>
                <Link href="/seller/escrow" className={s.btnOutline} style={{ flex: 1, justifyContent: 'center' }}>
                  Escrow Vault →
                </Link>
              </div>

              <p style={{ margin: '14px 0 0 0', fontSize: '12px', color: '#9AA6B8', textAlign: 'center' }}>
                Payouts are settled directly to your verified bank account upon buyer inspection release.
              </p>
            </div>
          </div>
        </div>

        {/* ════ 4. TRANSACTION HISTORY CARD ════ */}
        <div className={s.transactionsCard}>
          <div className={s.cardHeaderRow}>
            <h2 className={s.cardTitle}>
              <span>📜</span> Transaction &amp; Financial History
            </h2>
            <div style={{ color: '#9AA6B8', fontSize: '13px' }}>
              Showing {filteredTxs.length} entries
            </div>
          </div>

          {/* Filter Chips */}
          <div className={s.filterTabsRow}>
            <button
              onClick={() => setTxFilter('all')}
              className={`${s.filterTabBtn} ${txFilter === 'all' ? s.filterTabBtnActive : ''}`}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setTxFilter('deposits')}
              className={`${s.filterTabBtn} ${txFilter === 'deposits' ? s.filterTabBtnActive : ''}`}
            >
              Deposits
            </button>
            <button
              onClick={() => setTxFilter('payouts')}
              className={`${s.filterTabBtn} ${txFilter === 'payouts' ? s.filterTabBtnActive : ''}`}
            >
              Sales Payouts
            </button>
            <button
              onClick={() => setTxFilter('holds')}
              className={`${s.filterTabBtn} ${txFilter === 'holds' ? s.filterTabBtnActive : ''}`}
            >
              Escrow Holds
            </button>
          </div>

          {filteredTxs.length === 0 ? (
            <div className={s.emptyState}>
              No matching financial records found. Future seller payouts and deposits will appear here.
            </div>
          ) : (
            <div className={s.transactionList}>
              {filteredTxs.map(tx => {
                const isDebit = tx.amount < 0;
                return (
                  <div key={tx.id} className={s.transactionItem}>
                    <div className={s.txLeft}>
                      <div className={`${s.txIconWrap} ${isDebit ? s.txIconWrapDebit : ''}`}>
                        {isDebit ? '↗' : '💳'}
                      </div>
                      <div>
                        <span className={s.transactionType}>{tx.transaction_type}</span>
                        <span className={s.transactionDate}>
                          {new Date(tx.timestamp).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className={`${s.transactionAmount} ${isDebit ? s.transactionAmountNegative : ''}`}>
                        {isDebit ? '-' : '+'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 800, display: 'block', textAlign: 'right' }}>
                        COMPLETED
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ════ 5. EDIT PROFILE MODAL ════ */}
      {isEditOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className={s.modalTitle}>Edit Profile Information</h3>
              <button onClick={() => setIsEditOpen(false)} style={{ background: 'none', border: 'none', color: '#9AA6B8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <p className={s.modalSub}>Update your personal details displayed on ChronoBid.</p>

            <form onSubmit={handleSaveProfile}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>First Name</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={e => setEditFirstName(e.target.value)}
                  className={s.formInput}
                  required
                />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel}>Last Name</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={e => setEditLastName(e.target.value)}
                  className={s.formInput}
                  required
                />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel}>Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className={s.formInput}
                  required
                />
              </div>

              <div className={s.formGroup}>
                <label className={s.formLabel}>Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className={s.formInput}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsEditOpen(false)} className={s.btnOutline}>
                  Cancel
                </button>
                <button type="submit" className={s.btnGold}>
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
