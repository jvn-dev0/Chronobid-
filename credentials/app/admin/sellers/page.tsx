'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';
import { Eye, FileCheck, XCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function SellersPage() {
  const [applications, setApplications] = useState([
    { id: 'APP-1049', shopName: 'Vintage Timepieces LLC', applicant: 'James Carter', status: 'Pending Review', submitted: '2 hours ago', aiScore: 92 },
    { id: 'APP-1050', shopName: 'Swiss Classics', applicant: 'Elena Rossi', status: 'Pending Review', submitted: '5 hours ago', aiScore: 88 },
    { id: 'APP-1051', shopName: 'Global Watches', applicant: 'Michael Chang', status: 'More Info Needed', submitted: '1 day ago', aiScore: 45 },
    { id: 'APP-1045', shopName: 'Elite Chronos', applicant: 'Sarah Jenkins', status: 'Approved', submitted: '2 days ago', aiScore: 98 },
  ]);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Seller Applications</h2>
          <p className={styles.pageSubtitle}>Review and verify new seller applications before they can list auctions.</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Application Queue</h3>
          <div className={styles.tableActions}>
            <button className={styles.secondaryButton}>Filter Status</button>
          </div>
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>App ID</th>
              <th>Shop Name</th>
              <th>Applicant</th>
              <th>AI Confidence</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td style={{fontWeight: '500', color: '#6b7280'}}>{app.id}</td>
                <td style={{fontWeight: '600'}}>{app.shopName}</td>
                <td>{app.applicant}</td>
                <td>
                  <span style={{
                    color: app.aiScore >= 90 ? '#10b981' : app.aiScore >= 70 ? '#f59e0b' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {app.aiScore}% Match
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    app.status === 'Approved' ? styles.statusActive : 
                    app.status === 'Pending Review' ? styles.statusPending : styles.statusSuspended
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td>{app.submitted}</td>
                <td>
                  <div className={styles.actionMenu}>
                    <button className={styles.iconAction} title="View Application Documents"><Eye size={16} /></button>
                    <button className={styles.iconAction} title="View AI Report"><FileText size={16} /></button>
                    {app.status !== 'Approved' && (
                      <>
                        <button className={styles.iconAction} style={{color: '#10b981'}} title="Approve Seller"><CheckCircle2 size={16} /></button>
                        <button className={`${styles.iconAction} ${styles.danger}`} title="Reject Seller"><XCircle size={16} /></button>
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
