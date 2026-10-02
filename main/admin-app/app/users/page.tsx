"use client";

import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Gavel,
  CheckCircle,
  ShieldAlert,
  Settings,
  Search,
  Bell,
  RefreshCw,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Lock,
  Unlock,
  ChevronRight,
  MoreVertical,
  X,
  Mail,
  Phone,
  Calendar,
  Sparkles
} from "lucide-react";
import { getAdminSession, logoutAdmin, AdminUser, ADMIN_CONFIG } from "../../lib/auth";

interface UserRecord {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  role: string; // "Bidder", "Seller", "Admin"
  status: string; // "Active", "Frozen"
  verification_status: string; // "Verified", "Pending", "Unverified"
  created_at: string;
}

export default function PowerAdminUsersPage() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState("Bidder");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch 100% database-driven users list from FastAPI backend
  const fetchUsersFromDB = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { token } = getAdminSession();
      if (!token) {
        window.location.href = "/";
        return;
      }

      const res = await fetch(`${ADMIN_CONFIG.apiBaseUrl}/api/admin/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        logoutAdmin();
        return;
      }

      if (!res.ok) {
        throw new Error("Unable to load users data from database.");
      }

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load registered users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { token, user: sessionUser } = getAdminSession();
    if (!token || !sessionUser) {
      window.location.href = "/";
    } else {
      setAdminUser(sessionUser);
      setAuthorized(true);
      fetchUsersFromDB();
    }
  }, []);

  // 1-Click Freeze / Unfreeze Action
  const handleToggleStatus = async (userId: number) => {
    setActionLoading(true);
    try {
      const { token } = getAdminSession();
      const res = await fetch(`${ADMIN_CONFIG.apiBaseUrl}/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to update user status");
      }

      // Re-fetch users list from DB
      await fetchUsersFromDB();
    } catch (err: any) {
      alert("Error updating user account status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Role Action
  const handleChangeRole = async () => {
    if (!roleModalUser) return;
    setActionLoading(true);
    try {
      const { token } = getAdminSession();
      const res = await fetch(`${ADMIN_CONFIG.apiBaseUrl}/api/admin/users/${roleModalUser.id}/change-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_role: newRole.toLowerCase() }),
      });

      if (!res.ok) {
        throw new Error("Role change failed");
      }

      setRoleModalUser(null);
      await fetchUsersFromDB();
    } catch (err: any) {
      alert("Failed to update user role in database.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-amber-400 font-mono text-xs">
        Verifying Admin Privileges...
      </div>
    );
  }

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toString() === searchQuery;

    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate Metrics from DB Records
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === "Active").length;
  const frozenUsersCount = users.filter((u) => u.status === "Frozen").length;
  const sellersCount = users.filter((u) => u.role === "Seller").length;

  const adminInitials = adminUser ? `${adminUser.first_name?.[0] || "S"}${adminUser.last_name?.[0] || "A"}` : "SA";
  const adminFullName = adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Super Admin";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row">
      {/* ─── 1. Minimal Power Admin Sidebar (Dark Navy #0B0F19) ─── */}
      <aside className="w-full md:w-64 bg-[#0b0f19] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-amber-400 tracking-tight">ChronoBid</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Bid. Win. Own History.</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto text-xs font-medium">
          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Overview</p>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </a>
          </div>

          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Management</p>
            <div className="space-y-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold shadow-xs"
              >
                <UsersIcon className="w-4 h-4" />
                <span>Users</span>
              </button>
              <a
                href="/dashboard"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Item Approval</span>
              </a>
              <a
                href="/dashboard"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
              >
                <Gavel className="w-4 h-4" />
                <span>Auctions</span>
              </a>
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Security</p>
            <div className="space-y-1">
              <a
                href="/dashboard"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>AI Verification</span>
              </a>
              <a
                href="/dashboard"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Fraud & Risk</span>
              </a>
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Finance</p>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Finance & Escrow</span>
            </a>
          </div>

          <div>
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">System</p>
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </a>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">PORT 3001 • LIVE DB</span>
          <button
            onClick={logoutAdmin}
            className="p-2 rounded-lg hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ─── 2. Main Workspace ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, username, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs shadow-xs">
                {adminInitials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{adminFullName}</p>
                <p className="text-[10px] text-amber-600 font-medium">Super Admin</p>
              </div>
            </div>

            <button
              onClick={logoutAdmin}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Users Main Workspace */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Page Title & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <UsersIcon className="w-7 h-7 text-amber-600" />
                <span>Users</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage registered users, roles, account status and access.
              </p>
            </div>

            <button
              onClick={fetchUsersFromDB}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Users Data</span>
            </button>
          </div>

          {/* User Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Total Users</span>
                <span className="text-xl font-bold font-mono text-slate-900">{loading ? "..." : totalUsersCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UsersIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Active Users</span>
                <span className="text-xl font-bold font-mono text-emerald-600">{loading ? "..." : activeUsersCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Frozen Accounts</span>
                <span className="text-xl font-bold font-mono text-rose-600">{loading ? "..." : frozenUsersCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Verified Sellers</span>
                <span className="text-xl font-bold font-mono text-amber-600">{loading ? "..." : sellersCount}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar & Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Roles</option>
                <option value="bidder">Bidder</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-mono self-end sm:self-auto">
              Showing <span className="font-bold text-slate-700">{filteredUsers.length}</span> of <span className="font-bold text-slate-700">{users.length}</span> users
            </div>
          </div>

          {/* ─── ERROR STATE ─── */}
          {errorMsg && (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">Unable to load data</h3>
                <p className="text-xs text-rose-600 mt-1">{errorMsg}</p>
              </div>
              <button
                onClick={fetchUsersFromDB}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Retry Loading
              </button>
            </div>
          )}

          {/* ─── MAIN USERS TABLE ─── */}
          {!errorMsg && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Phone</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Verification</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                            <span>Loading registered users from database...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !filteredUsers.length ? (
                      /* ─── EMPTY STATE ─── */
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                          <div className="max-w-xs mx-auto space-y-2">
                            <UserX className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-700">No users found</p>
                            <p className="text-[11px] text-slate-400">There are no registered users matching your search or role filters.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const userInitials = `${u.first_name?.[0] || "U"}${u.last_name?.[0] || ""}`.toUpperCase();
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-slate-900">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                                  {userInitials}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{u.first_name} {u.last_name}</p>
                                  <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{u.phone}</td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  u.role === "Admin"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : u.role === "Seller"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 w-fit ${
                                  u.status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                <span>{u.status}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                                  u.verification_status === "Verified" || u.verification_status === "Approved"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : u.verification_status === "Pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {u.verification_status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{u.created_at}</td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* View User Modal */}
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                  title="View User Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Change Role */}
                                <button
                                  onClick={() => {
                                    setRoleModalUser(u);
                                    setNewRole(u.role);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                                  title="Change User Role"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>

                                {/* Freeze / Unfreeze */}
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleToggleStatus(u.id)}
                                  className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
                                    u.status === "Active"
                                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {u.status === "Active" ? (
                                    <>
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Freeze</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>Unfreeze</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── VIEW USER MODAL ─── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-serif font-bold text-slate-900">User Profile Summary</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-lg">
                {selectedUser.first_name[0]}{selectedUser.last_name[0]}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{selectedUser.first_name} {selectedUser.last_name}</h4>
                <p className="text-xs text-slate-500 font-mono">User ID: #{selectedUser.id} • @{selectedUser.username}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span>Email:</span>
                </span>
                <span className="font-mono text-slate-800 font-semibold">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>Phone:</span>
                </span>
                <span className="font-mono text-slate-800 font-semibold">{selectedUser.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Assigned Role:</span>
                </span>
                <span className="font-bold text-slate-800">{selectedUser.role}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Registration Date:</span>
                </span>
                <span className="font-mono text-slate-800">{selectedUser.created_at}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

      {/* ─── CHANGE ROLE MODAL ─── */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-serif font-bold text-slate-900">Change User Role</h3>
              <button onClick={() => setRoleModalUser(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Update role for <span className="font-bold text-slate-900">{roleModalUser.first_name} {roleModalUser.last_name}</span> (#{roleModalUser.id}):
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="role"
                  value="Bidder"
                  checked={newRole === "Bidder"}
                  onChange={() => setNewRole("Bidder")}
                  className="accent-amber-500"
                />
                <div>
                  <p className="font-semibold text-slate-800">Bidder</p>
                  <p className="text-[11px] text-slate-400">Standard user account</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="role"
                  value="Seller"
                  checked={newRole === "Seller"}
                  onChange={() => setNewRole("Seller")}
                  className="accent-amber-500"
                />
                <div>
                  <p className="font-semibold text-slate-800">Seller</p>
                  <p className="text-[11px] text-slate-400">Can host luxury auction lots</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="role"
                  value="Admin"
                  checked={newRole === "Admin"}
                  onChange={() => setNewRole("Admin")}
                  className="accent-amber-500"
                />
                <div>
                  <p className="font-semibold text-slate-800">Admin</p>
                  <p className="text-[11px] text-slate-400">Full operations admin privileges</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleChangeRole}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                {actionLoading ? "Updating..." : "Confirm Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
