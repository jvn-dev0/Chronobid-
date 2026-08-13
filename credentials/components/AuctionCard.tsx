'use client';
import React from 'react';
import Link from 'next/link';

interface Auction {
  id: number;
  title: string;
  description?: string;
  reserve_price: number;
  current_highest_bid?: number;
  end_time: string;
  image_url?: string;
  status: string;
}

export default function AuctionCard({ auction }: { auction: Auction }) {
  const timeLeft = new Date(auction.end_time).getTime() - new Date().getTime();
  const isEnded = timeLeft <= 0;
  
  // Only calculate days/hours if not ended
  const days = isEnded ? 0 : Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = isEnded ? 0 : Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isEndingSoon = !isEnded && days === 0 && hours < 24;

  const currentPrice = auction.current_highest_bid || auction.reserve_price || 0;

  return (
    <div style={{
      background: '#161b22',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #30363d',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ height: '200px', background: '#21262d', position: 'relative' }}>
        {auction.image_url ? (
          <img src={`http://localhost:8000${auction.image_url}`} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c9baf' }}>No Image Available</div>
        )}
        {isEndingSoon && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#f85149', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            Ending Soon
          </div>
        )}
      </div>
      
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#fff' }}>{auction.title}</h3>
        <p style={{ margin: '0 0 1rem 0', color: '#8c9baf', fontSize: '0.9rem', flex: 1 }}>{(auction.description || 'Rare collectible item').substring(0, 80)}...</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#8c9baf', marginBottom: '2px' }}>
              {auction.current_highest_bid ? 'Current Bid' : 'Base Price'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#eab308' }}>${currentPrice.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#8c9baf', marginBottom: '2px' }}>Time Left</div>
            <div style={{ fontSize: '0.9rem', color: isEndingSoon || isEnded ? '#f85149' : '#fff' }}>
              {isEnded ? 'Ended' : (days > 0 ? `${days}d ${hours}h` : `${hours}h remaining`)}
            </div>
          </div>
        </div>

        <Link href={`/bidder/auction/${auction.id}`} style={{
          display: 'block',
          width: '100%',
          padding: '0.75rem',
          background: isEnded ? '#30363d' : '#4fc08d',
          color: isEnded ? '#8c9baf' : '#fff',
          textAlign: 'center',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          transition: 'background 0.2s',
          pointerEvents: isEnded ? 'none' : 'auto'
        }}>
          {isEnded ? 'Auction Closed' : 'Place Bid'}
        </Link>
      </div>
    </div>
  );
}
