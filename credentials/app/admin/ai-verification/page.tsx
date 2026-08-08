'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';
import { Eye, ShieldAlert, CheckCircle2, ShieldX, Bot, ScanFace, Image as ImageIcon } from 'lucide-react';

export default function AIVerificationPage() {
  const [reports, setReports] = useState([
    { id: 'AI-2991', type: 'Identity', target: 'John Doe', ocrConfidence: 98, faceMatch: 99, risk: 'Low', status: 'Passed', date: '2 hrs ago' },
    { id: 'AI-2992', type: 'Object Detection', target: 'AUC-991', ocrConfidence: 95, faceMatch: 85, risk: 'Low', status: 'Passed', date: '5 hrs ago' },
    { id: 'AI-2993', type: 'Counterfeit', target: 'AUC-994', ocrConfidence: 45, faceMatch: 30, risk: 'High', status: 'Flagged', date: '1 day ago' },
    { id: 'AI-2994', type: 'Identity', target: 'Jane Smith', ocrConfidence: 75, faceMatch: 60, risk: 'Medium', status: 'Manual Review', date: '1 day ago' },
  ]);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>AI Verification Reports</h2>
          <p className={styles.pageSubtitle}>Review automated identity, object detection, and counterfeit analysis reports.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Total Scans (24h)</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Bot size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>1,284</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Auto-Approved</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>89%</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Manual Reviews</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Eye size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>142</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Counterfeits Blocked</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>38</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Recent AI Reports</h3>
          <div className={styles.tableActions}>
            <button className={styles.secondaryButton}>Filter by Risk</button>
          </div>
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Scan Type</th>
              <th>Target</th>
              <th>Primary Score</th>
              <th>Secondary Score</th>
              <th>Risk Level</th>
              <th>AI Decision</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td style={{fontWeight: '500', color: '#6b7280'}}>{report.id}</td>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {report.type === 'Identity' ? <ScanFace size={16} color="#6b7280" /> : <ImageIcon size={16} color="#6b7280" />}
                    {report.type}
                  </div>
                </td>
                <td style={{fontWeight: '600'}}>{report.target}</td>
                <td>{report.ocrConfidence}%</td>
                <td>{report.faceMatch}%</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    report.risk === 'Low' ? styles.statusActive : 
                    report.risk === 'Medium' ? styles.statusPending : styles.statusSuspended
                  }`}>
                    {report.risk}
                  </span>
                </td>
                <td>{report.status}</td>
                <td>{report.date}</td>
                <td>
                  <div className={styles.actionMenu}>
                    <button className={styles.iconAction} title="View Full Report"><Eye size={16} /></button>
                    {report.status !== 'Passed' && (
                      <button className={styles.iconAction} style={{color: '#10b981'}} title="Override & Approve"><CheckCircle2 size={16} /></button>
                    )}
                    {report.status !== 'Flagged' && (
                      <button className={`${styles.iconAction} ${styles.danger}`} title="Override & Reject"><ShieldX size={16} /></button>
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
