'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Landmark, CheckCircle2, XCircle } from 'lucide-react';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/admin/finance/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Finance & Treasury</h2>
          <p className={styles.pageSubtitle}>Manage platform revenue, approve large withdrawals, and oversee escrow balances.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Total Escrow Locked</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Landmark size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>$2.45M</div>
          <div className={styles.kpiTrend} style={{ color: '#10b981' }}>
            <ArrowUpRight size={16} /> +12% this month
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Platform Revenue (MTD)</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>$184,500</div>
          <div className={styles.kpiTrend} style={{ color: '#10b981' }}>
            <ArrowUpRight size={16} /> +5.2% this month
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Pending Withdrawals</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>$45,200</div>
          <div className={styles.kpiTrend} style={{ color: '#6b7280' }}>
            14 requests waiting
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Transaction Ledger</h3>
          <div className={styles.tableActions}>
            <button className={styles.secondaryButton}>Export CSV</button>
            <button className={styles.primaryButton}>Generate Tax Report</button>
          </div>
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>TXN ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td style={{fontWeight: '500', color: '#6b7280'}}>{txn.id}</td>
                <td style={{fontWeight: '600'}}>{txn.user}</td>
                <td>{txn.type}</td>
                <td style={{fontWeight: '600', color: txn.type === 'Withdrawal' ? '#ef4444' : '#10b981'}}>
                  {txn.type === 'Withdrawal' ? '-' : '+'}${txn.amount.toLocaleString()}
                </td>
                <td>{txn.method}</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    txn.status === 'Completed' ? styles.statusActive : 
                    txn.status === 'Locked' ? styles.statusActive : 
                    txn.status === 'Pending Review' ? styles.statusPending : styles.statusSuspended
                  }`}>
                    {txn.status}
                  </span>
                </td>
                <td>{txn.date}</td>
                <td>
                  <div className={styles.actionMenu}>
                    {txn.status === 'Pending Review' && (
                      <>
                        <button className={styles.iconAction} style={{color: '#10b981'}} title="Approve Withdrawal"><CheckCircle2 size={16} /></button>
                        <button className={`${styles.iconAction} ${styles.danger}`} title="Reject & Refund"><XCircle size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
