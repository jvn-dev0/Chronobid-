'use client';
import React, { useEffect, useState } from 'react';
import s from '../bidder.module.css'; // Reusing bidder dashboard styles
import AuctionCard from '@/components/AuctionCard'; // Assuming this exists or I will just build a custom card

export default function LiveAuctionsPage() {
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveAuctions = async () => {
      try {
        const token = localStorage.getItem('chronobid_token') || localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/auctions/live', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setLiveAuctions(data);
        }
      } catch (err) {
        console.error('Error fetching live auctions', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveAuctions();
  }, []);

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          Live Auctions <span style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', verticalAlign: 'middle', marginLeft: '12px' }}>● Live Now</span>
        </h1>
        <p style={{ color: '#94a3b8' }}>Discover rare items and place your bids before time runs out.</p>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Loading live auctions...</div>
      ) : liveAuctions.length === 0 ? (
        <div style={{ color: '#94a3b8', padding: '40px', backgroundColor: '#1e293b', borderRadius: '12px', textAlign: 'center' }}>
          No live auctions available at the moment. Check back soon!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {liveAuctions.map(auction => (
            <div key={auction.id} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', backgroundColor: '#0f172a', position: 'relative' }}>
                {auction.image_url ? (
                  <img src={auction.image_url} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                    No Image
                  </div>
                )}
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>{auction.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current Bid</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>${auction.currentBid || auction.reserve_price || 0}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ends In</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>24h 12m</div>
                  </div>
                </div>
                
                <button style={{ marginTop: 'auto', width: '100%', backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                  Place Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
