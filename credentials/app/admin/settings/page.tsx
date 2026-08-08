'use client';
import React from 'react';
import styles from '../admin.module.css';

export default function SettingsPage() {
  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>System Settings</h2>
          <p className={styles.pageSubtitle}>Configure global platform parameters, fees, and API keys.</p>
        </div>
        <div className={styles.tableActions}>
          <button className={styles.primaryButton}>Save Changes</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Fee Configuration */}
        <div className={styles.tableContainer} style={{ marginBottom: 0 }}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>Platform Fees</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Seller Commission Fee (%)
              </label>
              <input type="number" defaultValue={5.0} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Buyer Premium Fee (%)
              </label>
              <input type="number" defaultValue={2.5} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Listing Fee ($)
              </label>
              <input type="number" defaultValue={10.0} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
            </div>
          </div>
        </div>

        {/* AI Thresholds */}
        <div className={styles.tableContainer} style={{ marginBottom: 0 }}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>AI Verification Thresholds</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Auto-Approve OCR Confidence (%)
              </label>
              <input type="number" defaultValue={95} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', margin: 0 }}>Scores above this bypass manual review.</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Auto-Reject Face Match Score (%)
              </label>
              <input type="number" defaultValue={40} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', margin: 0 }}>Scores below this automatically reject the application.</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
