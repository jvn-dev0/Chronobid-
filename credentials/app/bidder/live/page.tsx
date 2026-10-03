'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import s from '../bidder.module.css';
import { getToken } from '../../../lib/api';

interface LiveAuction {
  id: number;
  title: string;
  reserve_price: number;
  currentBid?: number;
  current_highest_bid?: number;
  status: string;
  image_url: string | null;
  start_time: string;
  end_time: string;
  seller_id?: number;
}

interface WalletData {
  balance: number;
  locked_balance: number;
}

export default function LiveAuctionsPage() {
  const [liveAuctions, setLiveAuctions] = useState<LiveAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, locked_balance: 0 });

  // Bidding Modal State
  const [selectedAuction, setSelectedAuction] = useState<LiveAuction | null>(null);
  const [customBidStr, setCustomBidStr] = useState<string>('');
  const [isBiddingProcessing, setIsBiddingProcessing] = useState(false);
  const [bidError, setBidError] = useState<string>('');
  const [bidSuccess, setBidSuccess] = useState<string>('');

  useEffect(() => {
    fetchLiveAuctions();
    fetchWalletBalance();
  }, []);

  const fetchLiveAuctions = async () => {
    try {
      const token = getToken();
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/auctions/live', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const fetchWalletBalance = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const wData = await res.json();
        setWallet(wData);
      }
    } catch {
      // fallback
    }
  };

  const availableBalance = Math.max(0, wallet.balance - wallet.locked_balance);

  const openBidModal = (auction: LiveAuction) => {
    setSelectedAuction(auction);
    const minBid = auction.current_highest_bid 
      ? auction.current_highest_bid + 100 
      : auction.reserve_price || 12000;
    setCustomBidStr(minBid.toString());
    setBidError('');
    setBidSuccess('');
  };

  const closeBidModal = () => {
    setSelectedAuction(null);
    setBidError('');
    setBidSuccess('');
  };

  const handlePlaceBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuction) return;

    setBidError('');
    setBidSuccess('');

    const bidNum = parseFloat(customBidStr);
    const minRequired = selectedAuction.current_highest_bid 
      ? selectedAuction.current_highest_bid + 1 
      : selectedAuction.reserve_price;

    if (isNaN(bidNum) || bidNum < minRequired) {
      setBidError(`Bid must be at least $${minRequired.toLocaleString()}`);
      return;
    }

    // VAULT BALANCE CHECK: Check if available balance is less than required bid
    if (availableBalance < bidNum) {
      setBidError(`INSUFFICIENT_FUNDS`);
      return;
    }

    setIsBiddingProcessing(true);

    try {
      const token = getToken();
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + '/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          auction_id: selectedAuction.id,
          bid_amount: bidNum
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBidSuccess(`✓ Bid placed successfully! $${bidNum.toLocaleString()} has been reserved in your escrow vault.`);
        await fetchWalletBalance();
        await fetchLiveAuctions();
      } else {
        if (data.detail && data.detail.toLowerCase().includes('insufficient')) {
          setBidError('INSUFFICIENT_FUNDS');
        } else {
          setBidError(data.detail || 'Failed to place bid');
        }
      }
    } catch {
      setBidError('Network error while processing bid.');
    } finally {
      setIsBiddingProcessing(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1240px', margin: '0 auto', color: '#F7F3E8', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ════ HEADER & VAULT BADGE ════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', fontFamily: 'Playfair Display, serif', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Live Auctions 
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 800 }}>
              ● LIVE NOW
            </span>
          </h1>
          <p style={{ color: '#9AA6B8', margin: 0, fontSize: '14px' }}>
            Discover rare vintage timepieces &amp; place bids backed by ChronoBid Escrow Vault.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#0B1A36', border: '1px solid rgba(217,169,40,0.3)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#9AA6B8', fontWeight: 700 }}>AVAILABLE VAULT:</span>
            <span style={{ fontSize: '16px', color: '#34D399', fontWeight: 900 }}>
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <Link href="/bidder/wallet" style={{ background: 'linear-gradient(135deg, #D9A928 0%, #B8860B 100%)', color: '#050E1E', padding: '9px 18px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(217,169,40,0.3)' }}>
            + Deposit Funds
          </Link>
        </div>
      </div>

      {/* ════ LIVE AUCTIONS LISTING ════ */}
      {loading ? (
        <div style={{ color: '#D9A928', fontSize: '16px', fontWeight: 700, padding: '40px 0' }}>Loading live auctions from database...</div>
      ) : liveAuctions.length === 0 ? (
        <div style={{ color: '#9AA6B8', padding: '60px 20px', backgroundColor: '#0B1A36', border: '1px solid rgba(217,169,40,0.2)', borderRadius: '20px', textAlign: 'center' }}>
          <h3>No live auctions available at the moment.</h3>
          <p>Check back soon for new curated luxury watch listings.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '28px' }}>
          {liveAuctions.map(auction => {
            const currentPrice = auction.current_highest_bid || auction.currentBid || auction.reserve_price || 12000;
            const isSurajItem = auction.seller_id === 3 || auction.title.toLowerCase().includes('vintage watch');

            return (
              <div 
                key={auction.id} 
                style={{ 
                  backgroundColor: '#0B1A36', 
                  border: isSurajItem ? '1.5px solid #D9A928' : '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '20px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: isSurajItem ? '0 10px 30px rgba(217,169,40,0.15)' : '0 6px 20px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}
              >
                {/* Image Wrap */}
                <div style={{ height: '240px', backgroundColor: '#050E1E', position: 'relative' }}>
                  {isSurajItem && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(135deg, #D9A928 0%, #B8860B 100%)', color: '#050E1E', fontWeight: 900, fontSize: '11px', padding: '4px 10px', borderRadius: '12px', zIndex: 10, letterSpacing: '0.04em' }}>
                      ★ SURAJ NAIR SELLER ITEM
                    </div>
                  )}

                  {auction.image_url ? (
                    <img 
                      src={auction.image_url.startsWith('http') ? auction.image_url : `${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'https://chronobid-backend.onrender.com') + ''}${auction.image_url.startsWith('/') ? '' : '/'}${auction.image_url}`} 
                      alt={auction.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        const target = e.currentTarget;
                        const text = (auction.title || '').toLowerCase();
                        if (text.includes('jewel') || text.includes('gold') || text.includes('ring') || text.includes('islamic') || text.includes('diamond')) {
                          target.src = '/category-assets/jewellery.png';
                        } else if (text.includes('art') || text.includes('paint') || text.includes('canvas')) {
                          target.src = '/category-assets/art.png';
                        } else if (text.includes('coin') || text.includes('currency')) {
                          target.src = '/category-assets/coins.png';
                        } else if (text.includes('car') || text.includes('auto')) {
                          target.src = '/category-assets/automobiles.png';
                        } else {
                          target.src = '/category-assets/watches.png';
                        }
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                      No Image Provided
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Link href={`/bidder/auction/${auction.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif' }}>
                        {auction.title}
                      </h3>
                    </Link>
                    <p style={{ color: '#9AA6B8', fontSize: '13px', margin: '0 0 18px 0' }}>
                      Seller: <strong style={{ color: '#D9A928' }}>Suraj Nair</strong> • Verified Luxury Watch Listing
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9AA6B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Bid</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34D399' }}>${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#9AA6B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Remaining</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F7F3E8' }}>⏳ 2 Days 14 Hrs</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href={`/bidder/auction/${auction.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', color: '#F7F3E8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '13.5px' }}>
                      View Lot
                    </Link>
                    <button 
                      onClick={() => openBidModal(auction)}
                      style={{ flex: 1.2, backgroundColor: '#D9A928', color: '#050E1E', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(217,169,40,0.3)' }}
                    >
                      Place Bid →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════ 2. INSTANT BIDDING & VAULT CHECK MODAL ════ */}
      {selectedAuction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 14, 30, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0B1A36', border: '1px solid rgba(217, 169, 40, 0.35)', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '36px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', position: 'relative' }}>
            <button onClick={closeBidModal} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#9AA6B8', fontSize: '20px', cursor: 'pointer' }}>✕</button>

            <div style={{ display: 'inline-block', background: 'rgba(217, 169, 40, 0.15)', color: '#D9A928', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', marginBottom: '12px' }}>
              CHRONOBID ESCROW BIDDING
            </div>

            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#ffffff', margin: '0 0 6px 0' }}>
              Place Bid on {selectedAuction.title}
            </h3>
            <p style={{ color: '#9AA6B8', fontSize: '13.5px', margin: '0 0 20px 0' }}>
              Seller: <strong style={{ color: '#ffffff' }}>Suraj Nair</strong>
            </p>

            {/* Vault Balance Ribbon */}
            <div style={{ background: '#0F254A', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '14px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11.5px', color: '#9AA6B8', fontWeight: 700, display: 'block' }}>AVAILABLE VAULT BALANCE</span>
                <span style={{ fontSize: '18px', color: '#34D399', fontWeight: 900 }}>
                  ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Link href="/bidder/wallet" style={{ color: '#D9A928', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none' }}>
                + Deposit
              </Link>
            </div>

            {/* INSUFFICIENT FUNDS WARNING BOX */}
            {bidError === 'INSUFFICIENT_FUNDS' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #FCA5A5', borderRadius: '16px', padding: '18px', marginBottom: '20px', color: '#FCA5A5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#EF4444', marginBottom: '6px' }}>
                  <span>⚠️ Insufficient Vault Balance!</span>
                </div>
                <p style={{ fontSize: '13px', margin: '0 0 14px 0', lineHeight: 1.45, color: '#F87171' }}>
                  Your available balance (<strong>${availableBalance.toLocaleString()}</strong>) is less than the bid amount required (<strong>${parseFloat(customBidStr || '0').toLocaleString()}</strong>).
                </p>
                <Link href="/bidder/wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EF4444', color: '#FFFFFF', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                  💳 Add Funds to Wallet Now →
                </Link>
              </div>
            )}

            {/* OTHER ERROR */}
            {bidError && bidError !== 'INSUFFICIENT_FUNDS' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#EF4444', fontSize: '13px', fontWeight: 700 }}>
                ⚠️ {bidError}
              </div>
            )}

            {/* SUCCESS BOX */}
            {bidSuccess && (
              <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34D399', borderRadius: '14px', padding: '16px', marginBottom: '20px', color: '#34D399', fontSize: '13.5px', fontWeight: 700 }}>
                {bidSuccess}
              </div>
            )}

            {!bidSuccess && (
              <form onSubmit={handlePlaceBidSubmit}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#9AA6B8', marginBottom: '6px' }}>
                  Enter Bid Amount (USD)
                </label>
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#D9A928', fontSize: '20px', fontWeight: 900 }}>$</span>
                  <input 
                    type="number" 
                    value={customBidStr}
                    onChange={e => setCustomBidStr(e.target.value)}
                    placeholder="12000"
                    style={{ width: '100%', padding: '14px 14px 14px 34px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(217, 169, 40, 0.35)', color: '#ffffff', fontSize: '18px', fontWeight: 800, outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ fontSize: '12px', color: '#9AA6B8', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒 Funds are held in ChronoBid Escrow and only released upon delivery.</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={closeBidModal} style={{ background: 'rgba(255,255,255,0.06)', color: '#F7F3E8', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isBiddingProcessing} style={{ background: 'linear-gradient(135deg, #D9A928 0%, #B8860B 100%)', color: '#050E1E', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217,169,40,0.3)' }}>
                    {isBiddingProcessing ? 'Processing Bid...' : 'Confirm & Reserve Bid →'}
                  </button>
                </div>
              </form>
            )}

            {bidSuccess && (
              <button onClick={closeBidModal} style={{ width: '100%', background: 'linear-gradient(135deg, #D9A928 0%, #B8860B 100%)', color: '#050E1E', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
