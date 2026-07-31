'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import s from './profile.module.css';

interface UserProfile {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
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

  useEffect(() => {
    const token = localStorage.getItem('chronobid_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Profile
        const profileRes = await fetch('http://localhost:8000/api/auth/me', { headers });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // Fetch Wallet Balance
        const walletRes = await fetch('http://localhost:8000/api/wallet/balance', { headers });
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          setWallet(walletData);
        }

        // Fetch Transactions
        const txRes = await fetch('http://localhost:8000/api/wallet/transactions', { headers });
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  if (loading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading Profile...</div>;
  }

  return (
    <div className={s.container}>
      <header className={s.header}>
        <Link href="/seller/dashboard" className={s.logo}>
          Chronobid
        </Link>
        <Link href="/seller/dashboard" className={s.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Dashboard
        </Link>
      </header>

      <main className={s.mainContent}>
        <h1 className={s.pageTitle}>My Profile & Wallet</h1>

        {/* Profile Card */}
        <div className={s.card}>
          <h2 className={s.cardTitle}>Personal Information</h2>
          <div className={s.profileInfo}>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Full Name</span>
              <span className={s.infoValue}>{profile?.first_name} {profile?.last_name}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Username</span>
              <span className={s.infoValue}>@{profile?.username}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Email</span>
              <span className={s.infoValue}>{profile?.email}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Phone</span>
              <span className={s.infoValue}>{profile?.phone || 'Not Provided'}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Role</span>
              <span className={s.infoValue} style={{ textTransform: 'capitalize', color: '#4fc08d' }}>{profile?.role}</span>
            </div>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className={`${s.card} ${s.walletCard}`}>
          <div className={s.balanceLabel}>Available Balance</div>
          <div className={s.balanceAmount}>${wallet?.balance.toFixed(2) || '0.00'}</div>
          {wallet?.locked_balance && wallet.locked_balance > 0 ? (
            <div className={s.lockedBalance}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ${wallet.locked_balance.toFixed(2)} in Escrow
            </div>
          ) : null}
        </div>

        {/* Transactions History */}
        <div className={`${s.card} ${s.transactionsCard}`}>
          <h2 className={s.cardTitle}>Transaction History</h2>
          {transactions.length === 0 ? (
            <div className={s.emptyState}>No transactions found yet. When items sell, your payouts will appear here.</div>
          ) : (
            <div className={s.transactionList}>
              {transactions.map(tx => {
                const isDebit = tx.amount < 0;
                return (
                  <div key={tx.id} className={`${s.transactionItem} ${isDebit ? s.debit : ''}`}>
                    <div className={s.transactionDetails}>
                      <span className={s.transactionType}>{tx.transaction_type}</span>
                      <span className={s.transactionDate}>
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className={`${s.transactionAmount} ${isDebit ? s.negative : ''}`}>
                      {isDebit ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
