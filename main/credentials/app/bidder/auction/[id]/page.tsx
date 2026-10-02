'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import s from './auction.module.css';
import { getToken } from '../../../../lib/api';

interface BidHistory {
  id: number;
  bid_amount: number;
  timestamp: string;
  buyer_name: string;
}

interface AuctionDetail {
  id: number;
  title: string;
  reserve_price: number;
  status: string;
  start_time: string;
  end_time: string;
  ai_data: any;
  description: string;
  condition: string;
  material: string;
  seller_name: string;
  current_highest_bid: number | null;
  image_url: string | null;
  bid_history: BidHistory[];
}

export default function BiddingPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidding, setBidding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [lockedBalance, setLockedBalance] = useState<number>(0);

  const fetchWallet = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch('http://127.0.0.1:8000/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const wData = await res.json();
        setWalletBalance(wData.balance || 0);
        setLockedBalance(wData.locked_balance || 0);
      }
    } catch {}
  };

  const fetchAuction = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch(`http://127.0.0.1:8000/api/auctions/${id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuction(data);
      } else {
        console.error("Failed to fetch auction details");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAuction();
      fetchWallet();
      
      // Setup simple polling every 10 seconds to refresh bids
      const interval = setInterval(() => {
        fetchAuction();
        fetchWallet();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const availableBalance = Math.max(0, walletBalance - lockedBalance);

  const handlePlaceBid = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!bidAmount) return;
    
    const numericBid = parseFloat(bidAmount);
    if (availableBalance < numericBid) {
      setErrorMsg('INSUFFICIENT_FUNDS');
      return;
    }

    setBidding(true);
    try {
      const token = getToken();
      const res = await fetch('http://127.0.0.1:8000/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          auction_id: parseInt(id as string, 10),
          bid_amount: numericBid
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✓ Bid placed successfully! $${numericBid.toLocaleString()} locked in Escrow.`);
        setBidAmount('');
        fetchAuction();
        fetchWallet();
      } else {
        if (data.detail && data.detail.toLowerCase().includes('insufficient')) {
          setErrorMsg('INSUFFICIENT_FUNDS');
        } else {
          setErrorMsg(data.detail || "Failed to place bid");
        }
      }
    } catch (err) {
      setErrorMsg("A network error occurred.");
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return <div className={s.loadingState}>Loading Auction Details...</div>;
  }

  if (!auction) {
    return <div className={s.loadingState}>Auction Not Found</div>;
  }

  const currentPrice = auction.current_highest_bid || auction.reserve_price;
  const minRequiredBid = auction.current_highest_bid ? auction.current_highest_bid + 10 : auction.reserve_price;
  
  // Quick calc for Time Left
  const endDate = new Date(auction.end_time);
  const now = new Date();
  const diffTime = Math.abs(endDate.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const timeLeftStr = diffDays > 1 ? `${diffDays} days left` : 'Ending Soon';

  return (
    <div className={s.pageContainer}>
      <div className={s.topNav}>
        <button className={s.backBtn} onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </button>
        <div className={s.breadcrumbs}>
          <Link href="/bidder/dashboard">Dashboard</Link> / <span>{auction.title}</span>
        </div>
      </div>
      
      <div className={s.grid}>
        {/* Left Column */}
        <div className={s.leftCol}>
          <div className={s.imageGallery}>
            {auction.ai_data?.category_confidence && (
              <div className={s.aiBadge}>
                ✨ AI Authenticity Verified ({Math.round(auction.ai_data.category_confidence * 100)}%)
              </div>
            )}
            
            {auction.image_url ? (
              <img 
                src={auction.image_url.startsWith('http') ? auction.image_url : `http://localhost:8000${auction.image_url.startsWith('/') ? '' : '/'}${auction.image_url}`} 
                alt={auction.title} 
                className={s.mainImage} 
                onError={(e) => {
                  const target = e.currentTarget;
                  const filename = auction.image_url?.split('/').pop() || '';
                  if (filename && !target.src.endsWith(filename)) {
                    target.src = `http://localhost:8000/uploads/${filename}`;
                  }
                }}
              />
            ) : (
              <div className={s.noImage}>No Image Provided</div>
            )}
          </div>
          
          <div className={s.infoSection}>
            <h1 className={s.title}>{auction.title}</h1>
            
            <div className={s.sellerBox}>
              <div className={s.sellerAvatar}>
                {auction.seller_name.charAt(0)}
              </div>
              <div className={s.sellerInfo}>
                <h4>{auction.seller_name}</h4>
                <p>Verified Seller</p>
              </div>
            </div>
            
            <div className={s.description}>
              {auction.description || "No description provided."}
            </div>
            
            <div className={s.attributes}>
              <div className={s.attrCard}>
                <div className={s.attrLabel}>Condition</div>
                <div className={s.attrValue}>{auction.condition || 'N/A'}</div>
              </div>
              <div className={s.attrCard}>
                <div className={s.attrLabel}>Material</div>
                <div className={s.attrValue}>{auction.material || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className={s.rightCol}>
          <div className={s.bidPanel}>
            <div className={s.timerBox}>
              <div className={s.timerLabel}>Time Left</div>
              <div className={s.timerValue}>⏳ {timeLeftStr}</div>
            </div>
            
            <div className={s.priceSection}>
              <div className={s.priceLabel}>Current Bid</div>
              <div className={s.currentPrice}>${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className={s.minBid}>Enter ${minRequiredBid.toLocaleString()} or more</div>
            </div>

            {/* Available Vault Balance Banner */}
            <div style={{ background: '#0F254A', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '12px', padding: '12px 16px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#9AA6B8', fontWeight: 700, display: 'block' }}>AVAILABLE VAULT BALANCE</span>
                <span style={{ fontSize: '16px', color: '#34D399', fontWeight: 900 }}>
                  ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Link href="/bidder/wallet" style={{ color: '#D9A928', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none' }}>
                + Add Funds
              </Link>
            </div>
            
            {auction.status === 'Live' ? (
              <div className={s.bidForm}>
                <div className={s.inputWrapper}>
                  <span className={s.currencySymbol}>$</span>
                  <input 
                    type="number" 
                    className={s.bidInput} 
                    placeholder={minRequiredBid.toString()}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={minRequiredBid}
                  />
                </div>

                {errorMsg === 'INSUFFICIENT_FUNDS' ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '14px', margin: '12px 0', color: '#FCA5A5', textAlign: 'left' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#EF4444', marginBottom: '4px' }}>
                      ⚠️ Insufficient Vault Balance!
                    </div>
                    <p style={{ fontSize: '12.5px', margin: '0 0 10px 0', color: '#F87171', lineHeight: 1.4 }}>
                      Your available balance (${availableBalance.toLocaleString()}) is lower than the requested bid (${parseFloat(bidAmount || '0').toLocaleString()}).
                    </p>
                    <Link href="/bidder/wallet" style={{ display: 'inline-flex', background: '#EF4444', color: '#FFFFFF', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', textDecoration: 'none' }}>
                      💳 Add Funds to Wallet →
                    </Link>
                  </div>
                ) : errorMsg ? (
                  <div className={s.errorMsg}>⚠️ {errorMsg}</div>
                ) : null}

                {successMsg && <div className={s.successMsg}>{successMsg}</div>}

                <button 
                  className={s.placeBidBtn} 
                  onClick={handlePlaceBid}
                  disabled={bidding || !bidAmount || parseFloat(bidAmount) < minRequiredBid}
                  style={{ marginTop: '12px' }}
                >
                  {bidding ? 'Placing Bid...' : 'Confirm & Reserve Bid →'}
                </button>
              </div>
            ) : (
              <div className={s.errorMsg} style={{textAlign: 'center', marginTop: 0}}>
                This auction is {auction.status}. Bidding is closed.
              </div>
            )}
          </div>
          
          <div className={s.historyBox}>
            <h3 className={s.historyTitle}>Bid History ({auction.bid_history.length})</h3>
            <div className={s.historyList}>
              {auction.bid_history.length > 0 ? (
                auction.bid_history.map(bid => (
                  <div key={bid.id} className={s.historyItem}>
                    <div className={s.historyUser}>
                      <div className={s.historyAvatar}>{bid.buyer_name.charAt(0)}</div>
                      <div>
                        <div className={s.historyName}>{bid.buyer_name}</div>
                        <div className={s.historyTime}>{new Date(bid.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={s.historyAmount}>${bid.bid_amount.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div style={{color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', padding: '1rem'}}>
                  No bids yet. Be the first!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
