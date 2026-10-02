'use client';
import React, { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { 
  Users, 
  Store, 
  Gavel, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const revenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 5000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 8900 },
  { name: 'Sat', revenue: 12390 },
  { name: 'Sun', revenue: 14490 },
];

const categoryData = [
  { name: 'Rolex', value: 400 },
  { name: 'Omega', value: 300 },
  { name: 'Patek', value: 300 },
  { name: 'Cartier', value: 200 },
];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    total_revenue: 0,
    revenue_growth: 0,
    active_auctions: 0,
    auctions_growth: 0,
    total_users: 0,
    users_growth: 0,
    pending_approvals: 0
  });

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };
    fetchStats();
  }, []);

  if (!mounted) return null; // Prevent hydration errors with recharts

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Dashboard Overview</h2>
          <p className={styles.pageSubtitle}>Welcome back, Admin. Here is what is happening today.</p>
        </div>
      </div>

      {/* Quick Alerts */}
      <div className={styles.alertsList} style={{ marginBottom: '24px' }}>
        <div className={`${styles.alertItem} ${styles.critical}`}>
          <AlertTriangle size={20} color="#ef4444" />
          <div className={styles.alertContent}>
            <h4>High Risk Alert: Potential Fraud Detected</h4>
            <p>AI has flagged user ID #4928 for duplicate identity documents.</p>
          </div>
        </div>
        <div className={`${styles.alertItem} ${styles.info}`}>
          <CheckCircle2 size={20} color="#3b82f6" />
          <div className={styles.alertContent}>
            <h4>{stats.pending_approvals} New Seller Applications</h4>
            <p>There are new seller applications waiting for operations review.</p>
          </div>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Total Revenue</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>${stats.total_revenue.toLocaleString()}</div>
          <div className={styles.kpiBottom}>
            <span className={stats.revenue_growth >= 0 ? styles.trendUp : styles.trendDown}>
              {stats.revenue_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.revenue_growth)}%
            </span> from last month
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Active Auctions</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Gavel size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.active_auctions.toLocaleString()}</div>
          <div className={styles.kpiBottom}>
            <span className={stats.auctions_growth >= 0 ? styles.trendUp : styles.trendDown}>
              {stats.auctions_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.auctions_growth)}%
            </span> from last month
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Total Users</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}>
              <Users size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.total_users.toLocaleString()}</div>
          <div className={styles.kpiBottom}>
            <span className={stats.users_growth >= 0 ? styles.trendUp : styles.trendDown}>
              {stats.users_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.users_growth)}%
            </span> from last month
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiTitle}>Pending Approvals</span>
            <div className={styles.kpiIconWrapper} style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.pending_approvals.toLocaleString()}</div>
          <div className={styles.kpiBottom}>
            <span className={styles.trendDown}>↓ 2.4%</span> from last month
          </div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Revenue Growth</h3>
            <button className={styles.cardAction}>View Full Report</button>
          </div>
          <div className={styles.chartPlaceholder}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Top Categories</h3>
          </div>
          <div className={styles.chartPlaceholder}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} width={60} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
