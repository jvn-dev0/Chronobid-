'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Gavel, 
  ShieldCheck, 
  AlertTriangle, 
  Wallet, 
  CreditCard, 
  Truck, 
  Star, 
  Bell, 
  LifeBuoy, 
  BarChart4, 
  Settings, 
  Search,
  LogOut,
  FolderTree,
  Activity,
  Bot
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'User Management', href: '/admin/users', icon: Users, section: 'Users' },
    { name: 'Seller Applications', href: '/admin/sellers', icon: Store, section: 'Users' },
    { name: 'Auctions', href: '/admin/auctions', icon: Gavel, section: 'Core' },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree, section: 'Core' },
    { name: 'AI Verification', href: '/admin/ai-verification', icon: Bot, section: 'Security' },
    { name: 'Fraud Detection', href: '/admin/fraud', icon: AlertTriangle, section: 'Security' },
    { name: 'Wallets', href: '/admin/finance', icon: Wallet, section: 'Finance' },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard, section: 'Finance' },
    { name: 'Shipping', href: '/admin/shipping', icon: Truck, section: 'Operations' },
    { name: 'Reviews', href: '/admin/reviews', icon: Star, section: 'Operations' },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell, section: 'Operations' },
    { name: 'Support Tickets', href: '/admin/support', icon: LifeBuoy, section: 'Operations' },
    { name: 'Reports & Analytics', href: '/admin/analytics', icon: BarChart4, section: 'System' },
    { name: 'Activity Logs', href: '/admin/logs', icon: Activity, section: 'System' },
    { name: 'Platform Settings', href: '/admin/settings', icon: Settings, section: 'System' },
  ];

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <ShieldCheck className={styles.logoIcon} />
          <h1 className={styles.brandName}>ChronoBid</h1>
        </div>
        
        <nav className={styles.sidebarMenu}>
          {/* Main Dashboard Link */}
          <Link 
            href="/admin" 
            className={`${styles.menuItem} ${pathname === '/admin' ? styles.active : ''}`}
          >
            <LayoutDashboard className={styles.menuIcon} />
            Dashboard
          </Link>

          {/* Grouped Links */}
          <div className={styles.menuSection}>Users & Sellers</div>
          {navigation.filter(n => n.section === 'Users').map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.menuItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}>
              <item.icon className={styles.menuIcon} />
              {item.name}
            </Link>
          ))}

          <div className={styles.menuSection}>Auctions & Items</div>
          {navigation.filter(n => n.section === 'Core').map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.menuItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}>
              <item.icon className={styles.menuIcon} />
              {item.name}
            </Link>
          ))}

          <div className={styles.menuSection}>Security & AI</div>
          {navigation.filter(n => n.section === 'Security').map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.menuItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}>
              <item.icon className={styles.menuIcon} />
              {item.name}
            </Link>
          ))}

          <div className={styles.menuSection}>Finance</div>
          {navigation.filter(n => n.section === 'Finance').map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.menuItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}>
              <item.icon className={styles.menuIcon} />
              {item.name}
            </Link>
          ))}
          
          <div className={styles.menuSection}>Operations</div>
          {navigation.filter(n => n.section === 'Operations').map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.menuItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}>
              <item.icon className={styles.menuIcon} />
              {item.name}
            </Link>
          ))}

          <div className={styles.menuSection}>System</div>
          {navigation.filter(n => n.section === 'System').map((item) => (
            <Link key={item.name} href={item.href} className={`${styles.menuItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}>
              <item.icon className={styles.menuIcon} />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search users, auctions, transactions..." 
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.topbarRight}>
            <button className={styles.iconButton}>
              <Bell size={20} />
              <span className={styles.badge}></span>
            </button>
            
            <div className={styles.adminProfile}>
              <div className={styles.avatar}>SA</div>
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>Super Admin</span>
                <span className={styles.adminRole}>Owner</span>
              </div>
            </div>
            
            <button className={styles.iconButton}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
