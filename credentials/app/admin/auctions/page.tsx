'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';
import { Eye, CheckCircle2, XCircle, Clock, PlayCircle, StopCircle, Award } from 'lucide-react';

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState([
    { id: 'AUC-991', title: 'Vintage Rolex Submariner 1980', seller: 'Vintage Timepieces', category: 'Rolex', currentBid: 12500, status: 'Pending_Verification', endTime: '2023-10-25' },
    { id: 'AUC-992', title: 'Omega Speedmaster Professional', seller: 'Swiss Classics', category: 'Omega', currentBid: 4200, status: 'Live', endTime: '2023-10-20' },
    { id: 'AUC-993', title: 'Patek Philippe Calatrava', seller: 'Elite Chronos', category: 'Patek', currentBid: 18000, status: 'Ended', endTime: '2023-10-18' },
    { id: 'AUC-994', title: 'Audemars Piguet Royal Oak', seller: 'Luxury Watches Co.', category: 'AP', currentBid: 0, status: 'Draft', endTime: '2023-11-01' },
    { id: 'AUC-995', title: 'Cartier Tank Francaise', seller: 'Vintage Timepieces', category: 'Cartier', currentBid: 3100, status: 'Live', endTime: '2023-10-22' },
  ]);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Auction Management</h2>
          <p className={styles.pageSubtitle}>Monitor, approve, and manage all watch auctions across the platform.</p>
        </div>
        <div className={styles.tableActions}>
          <button className={styles.secondaryButton}>Export Report</button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>All Auctions</h3>
          <div className={styles.tableActions}>
            <input type="text" placeholder="Search auctions..." className={styles.searchInput} style={{width: '250px'}} />
            <select className={styles.searchInput} style={{width: '150px', cursor: 'pointer'}}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Current Bid</th>
              <th>Status</th>
              <th>Ends On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((auction) => (
              <tr key={auction.id}>
                <td style={{fontWeight: '500', color: '#6b7280'}}>{auction.id}</td>
                <td style={{fontWeight: '600', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={auction.title}>
                  {auction.title}
                </td>
                <td>{auction.seller}</td>
                <td>{auction.category}</td>
                <td style={{fontWeight: '600'}}>${auction.currentBid.toLocaleString()}</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    auction.status === 'Live' ? styles.statusActive : 
                    auction.status === 'Pending_Verification' ? styles.statusPending : 
                    auction.status === 'Ended' ? styles.statusSuspended : ''
                  }`} style={auction.status === 'Draft' ? { backgroundColor: '#f3f4f6', color: '#4b5563' } : {}}>
                    {auction.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{auction.endTime}</td>
                <td>
                  <div className={styles.actionMenu}>
                    <button className={styles.iconAction} title="View Auction Details"><Eye size={16} /></button>
                    
                    {auction.status === 'Pending_Verification' && (
                      <>
                        <button className={styles.iconAction} style={{color: '#10b981'}} title="Approve & Set Live"><CheckCircle2 size={16} /></button>
                        <button className={`${styles.iconAction} ${styles.danger}`} title="Reject Auction"><XCircle size={16} /></button>
                      </>
                    )}
                    
                    {auction.status === 'Live' && (
                      <>
                        <button className={styles.iconAction} style={{color: '#f59e0b'}} title="Feature Auction"><Award size={16} /></button>
                        <button className={`${styles.iconAction} ${styles.danger}`} title="Cancel Auction"><StopCircle size={16} /></button>
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
