'use client';
import React, { useState } from 'react';
import styles from '../admin.module.css';
import { MoreHorizontal, ShieldBan, ShieldCheck, Mail, Eye } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/admin/users/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>User Management</h2>
          <p className={styles.pageSubtitle}>View and manage all registered users on ChronoBid.</p>
        </div>
        <div className={styles.tableActions}>
          <button className={styles.secondaryButton}>Export CSV</button>
          <button className={styles.primaryButton}>+ Add User</button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>All Users</h3>
          <input type="text" placeholder="Search users..." className={styles.searchInput} style={{width: '250px'}} />
        </div>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{fontWeight: '500', color: '#6b7280'}}>#{user.id}</td>
                <td style={{fontWeight: '600'}}>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    user.status === 'Active' ? styles.statusActive : 
                    user.status === 'Pending' ? styles.statusPending : styles.statusSuspended
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.joinDate}</td>
                <td>
                  <div className={styles.actionMenu}>
                    <button className={styles.iconAction} title="View Profile"><Eye size={16} /></button>
                    <button className={styles.iconAction} title="Send Email"><Mail size={16} /></button>
                    {user.status === 'Active' ? (
                      <button className={`${styles.iconAction} ${styles.danger}`} title="Suspend User"><ShieldBan size={16} /></button>
                    ) : (
                      <button className={styles.iconAction} style={{color: '#10b981'}} title="Activate User"><ShieldCheck size={16} /></button>
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
