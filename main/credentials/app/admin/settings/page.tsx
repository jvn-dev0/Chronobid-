'use client';
import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';

export default function SettingsPage() {
  const [config, setConfig] = useState({
    seller_commission_fee: 5.0,
    buyer_premium_fee: 2.5,
    listing_fee: 10.0,
    auto_approve_ocr: 95,
    auto_reject_face: 40
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/admin/settings/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/admin/settings/', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>System Settings</h2>
          <p className={styles.pageSubtitle}>Configure global platform parameters, fees, and API keys.</p>
        </div>
        <div className={styles.tableActions}>
          <button className={styles.primaryButton} onClick={handleSave}>Save Changes</button>
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
              <input type="number" value={config.seller_commission_fee} onChange={(e) => setConfig({...config, seller_commission_fee: parseFloat(e.target.value)})} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Buyer Premium Fee (%)
              </label>
              <input type="number" value={config.buyer_premium_fee} onChange={(e) => setConfig({...config, buyer_premium_fee: parseFloat(e.target.value)})} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Listing Fee ($)
              </label>
              <input type="number" value={config.listing_fee} onChange={(e) => setConfig({...config, listing_fee: parseFloat(e.target.value)})} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
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
              <input type="number" value={config.auto_approve_ocr} onChange={(e) => setConfig({...config, auto_approve_ocr: parseInt(e.target.value)})} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', margin: 0 }}>Scores above this bypass manual review.</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Auto-Reject Face Match Score (%)
              </label>
              <input type="number" value={config.auto_reject_face} onChange={(e) => setConfig({...config, auto_reject_face: parseInt(e.target.value)})} className={styles.searchInput} style={{ width: '100%', padding: '10px' }} />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px', margin: 0 }}>Scores below this automatically reject the application.</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
