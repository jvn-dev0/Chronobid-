'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';
import { AlertTriangle, UserX, Wallet, CheckCircle2, Search, Crosshair } from 'lucide-react';

export default function FraudDetectionPage() {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    const fetchFraudAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/admin/auctions/fraud-alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch (err) {
        console.error("Failed to fetch fraud alerts", err);
      }
    };
    fetchFraudAlerts();
  }, []);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Fraud Detection & Security</h2>
          <p className={styles.pageSubtitle}>Monitor AI-flagged suspicious behavior, bid manipulation, and payment risks.</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Active Security Alerts</h3>
          <div className={styles.tableActions}>
            <button className={styles.primaryButton}>Export Audit Log</button>
          </div>
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Target User</th>
              <th>Alert Type</th>
              <th>Risk Level</th>
              <th>Details</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td style={{fontWeight: '500', color: '#6b7280'}}>{incident.id}</td>
                <td style={{fontWeight: '600'}}>{incident.user}</td>
                <td>{incident.type}</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    incident.risk === 'Critical' ? styles.statusSuspended : 
                    incident.risk === 'High' ? styles.statusPending : styles.statusActive
                  }`}>
                    {incident.risk}
                  </span>
                </td>
                <td style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={incident.details}>
                  {incident.details}
                </td>
                <td>
                  <span style={{
                    color: incident.status === 'Resolved' ? '#10b981' : '#6b7280',
                    fontWeight: '500', fontSize: '0.85rem'
                  }}>
                    {incident.status}
                  </span>
                </td>
                <td>{incident.date}</td>
                <td>
                  <div className={styles.actionMenu}>
                    <button className={styles.iconAction} title="Investigate Profile"><Crosshair size={16} /></button>
                    {incident.status !== 'Resolved' && (
                      <>
                        <button className={`${styles.iconAction} ${styles.danger}`} title="Freeze Wallet & Ban"><UserX size={16} /></button>
                        <button className={styles.iconAction} style={{color: '#10b981'}} title="Mark as Safe / Resolved"><CheckCircle2 size={16} /></button>
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
