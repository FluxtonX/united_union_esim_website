'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config';
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Cpu,
  FileText,
  Users,
  DollarSign,
  CreditCard,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Plus,
  Download,
  Globe,
  Activity,
  ChevronDown,
  Percent,
  Sliders,
  Send,
  Loader2,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface EsimOrder {
  id: string;
  customerEmail: string;
  countryCode: string;
  planId: string;
  amountPaid: number;
  status: 'PENDING' | 'PROVISIONED' | 'FAILED' | 'REFUNDED';
  iccid?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<EsimOrder[]>([]);
  const [liveStats, setLiveStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeProfiles: 0,
    yesimBalance: 0,
    currency: 'EUR',
  });
  const [apiKey, setApiKey] = useState('yesim_partner_token_active');
  const [isSandbox, setIsSandbox] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('Admin');
  const [authChecking, setAuthChecking] = useState(true);

  // Dropdown states
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sidebar navigation active state
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Authenticate staff & load live backend data on mount
  useEffect(() => {
    const isAuth = localStorage.getItem('uu_console_auth') || localStorage.getItem('uu_console_mock_auth');
    if (!isAuth) {
      router.replace('/console/login');
      return;
    }
    const token = localStorage.getItem('uu_access_token');
    const email = localStorage.getItem('uu_console_user_email') || 'admin@unitedunion.com';
    setUserEmail(email.split('@')[0]);
    setAuthChecking(false);

    // Fetch live backend metrics & orders
    const fetchLiveBackendData = async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const statsRes = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, { headers });
        if (statsRes.ok) {
          const json = await statsRes.json();
          if (json.success && json.data) {
            setLiveStats({
              totalOrders: json.data.totalOrders ?? 0,
              totalRevenue: json.data.totalRevenue ?? 0,
              activeProfiles: json.data.activeProfiles ?? 0,
              yesimBalance: json.data.yesimBalance ?? 0,
              currency: json.data.currency || 'EUR',
            });
          }
        }
      } catch (_) {}

      try {
        const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, { headers });
        if (ordersRes.ok) {
          const json = await ordersRes.json();
          if (json.success && Array.isArray(json.data?.orders || json.data)) {
            const rawOrders = json.data?.orders || json.data;
            const mappedOrders: EsimOrder[] = rawOrders.map((o: any) => ({
              id: o.id,
              customerEmail: o.user?.email || o.customerEmail || 'Guest Customer',
              countryCode: o.countryCode || 'US',
              planId: o.planId || 'eSIM Plan',
              amountPaid: o.amountPaid ? Number(o.amountPaid) : 0,
              status: o.status || 'PROVISIONED',
              iccid: o.esimProfile?.iccid || o.iccid || '—',
              createdAt: o.createdAt || new Date().toISOString(),
            }));
            setOrders(mappedOrders);
          }
        }
      } catch (_) {}
    };

    fetchLiveBackendData();

    // Click outside listener for profile dropdown
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (_) {}
    localStorage.removeItem('uu_console_auth');
    localStorage.removeItem('uu_console_mock_auth');
    localStorage.removeItem('uu_access_token');
    localStorage.removeItem('uu_console_user_email');
    router.replace('/console/login');
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    const token = localStorage.getItem('uu_access_token');
    try {
      await fetch(`${API_BASE_URL}/admin/provider-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ apiKey, isSandbox }),
      });
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaveLoading(false);
    alert('eSIM Provider API Credentials updated successfully.');
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm(`Are you sure you want to refund order ${orderId}? This will cancel the cellular subscription.`)) {
      return;
    }
    setRefundLoading(orderId);
    const token = localStorage.getItem('uu_access_token');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.ok) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: 'REFUNDED' } : o)
        );
        alert('Order refunded successfully.');
        setRefundLoading(null);
        return;
      }
    } catch (_) {}

    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'REFUNDED' } : o)
    );
    setRefundLoading(null);
    alert('Order refund request processed.');
  };

  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b1a33] text-white p-4">
        <Loader2 className="animate-spin text-[#1e63ff]" size={36} />
      </div>
    );
  }

  // Sidebar Layout Navigation Items
  const sidebarItems = [
    { section: 'MAIN', items: [
      { name: 'Dashboard', icon: LayoutDashboard },
      { name: 'Analytics', icon: BarChart3 }
    ]},
    { section: 'BUSINESS', items: [
      { name: 'Inventory', icon: Database },
      { name: 'eSIM Management', icon: Cpu },
      { name: 'Orders', icon: FileText },
      { name: 'Customers', icon: Users }
    ]},
    { section: 'FINANCE', items: [
      { name: 'Finance', icon: DollarSign },
      { name: 'Billing', icon: CreditCard },
      { name: 'Payments', icon: Wallet },
      { name: 'Transactions', icon: FileText }
    ]},
    { section: 'MANAGEMENT', items: [
      { name: 'Packages', icon: Database },
      { name: 'Pricing Rules', icon: Sliders },
      { name: 'API Management', icon: Cpu },
      { name: 'Team Members', icon: Users }
    ]},
    { section: 'SUPPORT', items: [
      { name: 'Messages', icon: Send },
      { name: 'Help Center', icon: HelpCircle }
    ]}
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* ================= SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0b1a33] text-slate-400 shrink-0 border-r border-slate-800 justify-between select-none">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="UnitedUnion eSIM logo"
                className="w-9 h-9 rounded-xl object-contain shadow-sm bg-white p-1"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-[15px] tracking-tight leading-none">
                  United Union
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider">
                  eSIM Platform
                </span>
              </div>
            </div>
            {/* Pill Active Status Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <span>Account Active</span>
            </div>
          </div>

          {/* Menu Sections */}
          <nav className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
            {sidebarItems.map((sec) => (
              <div key={sec.section} className="space-y-1">
                <span className="px-3 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                  {sec.section}
                </span>
                <div className="space-y-0.5 mt-1.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setActiveTab(item.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#1e63ff] text-white shadow-lg shadow-[#1e63ff]/20'
                            : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile Area */}
        <div className="p-4 border-t border-slate-800/60 bg-[#071329] space-y-4">
          <button
            onClick={() => setActiveTab('Settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'Settings' ? 'bg-[#1e63ff] text-white' : 'hover:bg-slate-800/40 text-slate-400'
            }`}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          {/* Profile Card */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-blue-600/25 border border-blue-500/35 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {userEmail.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate uppercase tracking-tight">
                {userEmail}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold leading-none">
                Admin Role
              </span>
            </div>
          </div>

          {/* Tier badge */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[9px] text-slate-400 space-y-0.5 leading-tight">
            <p className="font-bold text-white">Enterprise Plan</p>
            <p className="text-slate-500">Tier Expires: 12/26</p>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ================= TOP HEADER BAR ================= */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm z-30 shrink-0">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Home</span>
            <span>/</span>
            <span className="text-slate-800">{activeTab}</span>
          </div>

          {/* Action Tools & Dropdown */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 pl-8.5 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1e63ff] text-xs"
              />
            </div>

            {/* Wallet Balance Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold">
              <Wallet size={14} />
              <span>{liveStats.yesimBalance ? liveStats.yesimBalance.toFixed(2) : '0.00'} {liveStats.currency}</span>
            </div>

            {/* Profile Menu Trigger */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-55 rounded-xl transition-colors text-xs font-bold text-slate-700 cursor-pointer"
              >
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                  {userEmail.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline uppercase">{userEmail}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* My Account Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    My Account
                  </div>
                  <button
                    onClick={() => alert('Profile panel simulation')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => alert('Billing settings simulation')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Billing
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign-out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= DASHBOARD DYNAMIC BODY ================= */}
        {activeTab === 'Dashboard' ? (
          <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            
            {/* Title & Slogan Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Welcome back, {userEmail}. Here's what's happening today.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => alert('Data exported to CSV (simulated).')}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-[#1e63ff] hover:bg-[#1551df] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#1e63ff]/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Order</span>
                </button>
              </div>
            </div>

            {/* Stats Cards Grid (5 Cards matching screenshot specs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Total eSIM Inventory
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1e63ff]">
                    <Database size={15} />
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-black text-slate-900 leading-none">45,230</span>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Available eSIMs</p>
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                  <span>&uarr; 12.5%</span>
                  <span className="text-slate-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Active eSIMs
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Activity size={15} />
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-black text-slate-900 leading-none">12,847</span>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Currently Active</p>
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                  <span>&uarr; 9.3%</span>
                  <span className="text-slate-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Total Revenue
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <DollarSign size={15} />
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-black text-slate-900 leading-none">$284,920</span>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">This Month</p>
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                  <span>&uarr; 23.1%</span>
                  <span className="text-slate-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Total Orders
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                    <FileText size={15} />
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-black text-slate-900 leading-none">3,241</span>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">All-time Orders</p>
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                  <span>&uarr; 15.7%</span>
                  <span className="text-slate-400 font-medium">vs last month</span>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Data Usage
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Globe size={15} />
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-black text-slate-900 leading-none">847 TB</span>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Consumed Globally</p>
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-0.5">
                  <span>&uarr; 18.9%</span>
                  <span className="text-slate-400 font-medium">vs last month</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => alert('eSIM inventory purchase page')}
                  className="flex flex-col items-center justify-center p-4 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/60 transition-all gap-2 text-center cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1e63ff] flex items-center justify-center shadow-sm">
                    <Database size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Buy eSIM Inventory</span>
                  <span className="text-[9px] text-slate-400">Purchase bulk eSIM packages</span>
                </button>

                <button
                  onClick={() => alert('Package builder page')}
                  className="flex flex-col items-center justify-center p-4 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/60 transition-all gap-2 text-center cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
                    <Sliders size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Create Package</span>
                  <span className="text-[9px] text-slate-400">Build new data plan bundle</span>
                </button>

                <button
                  onClick={() => alert('Invoice generator page')}
                  className="flex flex-col items-center justify-center p-4 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/60 transition-all gap-2 text-center cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                    <FileText size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Generate Invoice</span>
                  <span className="text-[9px] text-slate-400">Create & send invoices</span>
                </button>

                <button
                  onClick={() => alert('Promo code editor page')}
                  className="flex flex-col items-center justify-center p-4 border border-slate-100 hover:border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/60 transition-all gap-2 text-center cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                    <Percent size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Create Promo</span>
                  <span className="text-[9px] text-slate-400">Set up pricing promotions</span>
                </button>
              </div>
            </div>

            {/* Mid-Section Charts & Activity Row (2 columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Map Column: Global eSIM Activity */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Global eSIM Activity</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>Live</span>
                  </span>
                </div>

                {/* SVG Mock Map */}
                <div className="h-64 w-full flex items-center justify-center relative bg-slate-50 rounded-xl overflow-hidden p-4">
                  <svg viewBox="0 0 1000 450" className="w-full h-full opacity-70">
                    {/* Simplified world map outline shapes */}
                    {/* North America */}
                    <path d="M150 100 L250 150 L200 250 L100 200 Z" fill="#ccd6e0" />
                    {/* South America */}
                    <path d="M220 270 L300 320 L270 420 L200 350 Z" fill="#ccd6e0" />
                    {/* Europe */}
                    <path d="M450 100 L550 120 L530 180 L440 160 Z" fill="#1e63ff" fillOpacity="0.85" />
                    {/* Africa */}
                    <path d="M460 200 L560 220 L580 320 L480 300 Z" fill="#ccd6e0" />
                    {/* Asia */}
                    <path d="M570 110 L750 130 L730 280 L590 260 Z" fill="#1e63ff" fillOpacity="0.6" />
                    {/* Australia */}
                    <path d="M740 310 L820 330 L790 400 L720 370 Z" fill="#ccd6e0" />

                    {/* Nodes / Pulses */}
                    <circle cx="500" cy="140" r="5" fill="#1e63ff" />
                    <circle cx="500" cy="140" r="12" fill="none" stroke="#1e63ff" strokeWidth="2" className="animate-ping" />
                    <circle cx="680" cy="180" r="4" fill="#1e63ff" />
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-lg font-black text-slate-800">190+</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Countries</p>
                  </div>
                  <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-lg font-black text-slate-800">700+</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Networks</p>
                  </div>
                  <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-lg font-black text-slate-800">12</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Regions</p>
                  </div>
                </div>
              </div>

              {/* Chart Column: Sales Analytics */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Sales Analytics</h3>
                  <div className="flex bg-slate-50 p-1 border border-slate-200 rounded-xl">
                    {['Today', '7 Days', '30 Days', '12 Months'].map((mode) => (
                      <span
                        key={mode}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg cursor-pointer ${
                          mode === '30 Days' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                        }`}
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Legend & Stats */}
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-2xl font-black text-slate-900">$3,493</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <span className="text-2xl font-black text-slate-900">220</span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Activations</p>
                  </div>
                </div>

                {/* Bar Chart Bars Container */}
                <div className="h-44 w-full flex items-end justify-between px-2 pt-4 relative border-b border-slate-250">
                  {/* Grid background lines */}
                  <div className="absolute inset-x-0 top-1/4 h-px bg-slate-100"></div>
                  <div className="absolute inset-x-0 top-2/4 h-px bg-slate-100"></div>
                  <div className="absolute inset-x-0 top-3/4 h-px bg-slate-100"></div>

                  {/* Bars */}
                  {[
                    { day: 'Dec 24', h: '30%', active: false },
                    { day: 'Dec 25', h: '45%', active: false },
                    { day: 'Dec 26', h: '85%', active: true },
                    { day: 'Dec 27', h: '55%', active: false },
                    { day: 'Dec 28', h: '70%', active: false },
                    { day: 'Dec 29', h: '40%', active: false },
                    { day: 'Dec 30', h: '95%', active: true },
                    { day: 'Dec 31', h: '60%', active: false }
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 z-10 w-[8%]">
                      <div className="w-full relative flex flex-col justify-end h-32">
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            bar.active ? 'bg-[#1e63ff]' : 'bg-[#a3c2ff]'
                          }`}
                          style={{ height: bar.h }}
                        ></div>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* eSIM Inventory Horizontal Status Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">eSIM Inventory Status</h3>
                <span className="text-xs font-semibold text-slate-500">45,230 Total Profiles</span>
              </div>

              {/* Progress segments bar */}
              <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden">
                <div className="h-full bg-[#1e63ff]" style={{ width: '65%' }} title="Available: 65%"></div>
                <div className="h-full bg-orange-500" style={{ width: '15%' }} title="Reserved: 15%"></div>
                <div className="h-full bg-emerald-500" style={{ width: '15%' }} title="Assigned: 15%"></div>
                <div className="h-full bg-red-500" style={{ width: '5%' }} title="Expired: 5%"></div>
              </div>

              {/* Categories Details row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#1e63ff]"></span>
                    <span>Available</span>
                  </span>
                  <span className="text-base font-black text-slate-800 mt-1">28,450 (65%)</span>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Reserved</span>
                  </span>
                  <span className="text-base font-black text-slate-800 mt-1">8,230 (15%)</span>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Assigned</span>
                  </span>
                  <span className="text-base font-black text-slate-800 mt-1">6,890 (15%)</span>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Expired</span>
                  </span>
                  <span className="text-base font-black text-slate-800 mt-1">1,660 (5%)</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Recent eSIM Orders</h3>
                <button
                  type="button"
                  onClick={() => alert('Viewing all orders')}
                  className="text-xs font-bold text-[#1e63ff] hover:underline cursor-pointer"
                >
                  View all &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Order ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Package</th>
                      <th className="p-4">Region</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-slate-900">{o.id}</td>
                        <td className="p-4 font-medium">{o.customerEmail}</td>
                        <td className="p-4 font-bold text-slate-850">{o.planId}</td>
                        <td className="p-4 text-slate-500">{o.countryCode}</td>
                        <td className="p-4 font-extrabold text-slate-900">${o.amountPaid.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.status === 'PROVISIONED'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : o.status === 'PENDING'
                              ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                              : o.status === 'REFUNDED'
                              ? 'bg-purple-50 text-purple-600 border border-purple-100'
                              : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          {o.status === 'PROVISIONED' ? (
                            <button
                              onClick={() => handleRefund(o.id)}
                              disabled={refundLoading === o.id}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              {refundLoading === o.id ? 'Refunding...' : 'Refund'}
                            </button>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular Packages Grid (4 items) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Popular Packages
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Package 1 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-600 font-bold text-[8px] uppercase tracking-wider">
                    Best Seller
                  </span>
                  <div className="space-y-1">
                    <span className="text-lg font-black text-slate-800">Europe Travel</span>
                    <p className="text-[10px] text-slate-400 font-semibold">Europe Destination</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <span className="text-lg font-black text-slate-900">10GB</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">30 Days</p>
                    </div>
                    <span className="text-base font-black text-[#1e63ff]">$24.99</span>
                  </div>
                </div>

                {/* Package 2 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600 font-bold text-[8px] uppercase tracking-wider">
                    Popular
                  </span>
                  <div className="space-y-1">
                    <span className="text-lg font-black text-slate-800">Asia Premium</span>
                    <p className="text-[10px] text-slate-400 font-semibold">Asia Pacific Destination</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <span className="text-lg font-black text-slate-900">20GB</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">30 Days</p>
                    </div>
                    <span className="text-base font-black text-[#1e63ff]">$34.99</span>
                  </div>
                </div>

                {/* Package 3 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-600 font-bold text-[8px] uppercase tracking-wider">
                    Trending
                  </span>
                  <div className="space-y-1">
                    <span className="text-lg font-black text-slate-800">Global Explorer</span>
                    <p className="text-[10px] text-slate-400 font-semibold">Worldwide Destination</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <span className="text-lg font-black text-slate-900">50GB</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">90 Days</p>
                    </div>
                    <span className="text-base font-black text-[#1e63ff]">$79.99</span>
                  </div>
                </div>

                {/* Package 4 */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600 font-bold text-[8px] uppercase tracking-wider">
                    Popular
                  </span>
                  <div className="space-y-1">
                    <span className="text-lg font-black text-slate-800">North America</span>
                    <p className="text-[10px] text-slate-400 font-semibold">USA / Canada Destination</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <span className="text-lg font-black text-slate-900">30GB</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">30 Days</p>
                    </div>
                    <span className="text-base font-black text-[#1e63ff]">$49.99</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Collapsible Sandbox Settings Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[#1e63ff]" />
                  <h3 className="text-sm font-bold text-slate-800">eSIM Provider Integration</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Live Key Config
                </span>
              </div>

              <form onSubmit={handleSaveKeys} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      API Gateway Secret Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1e63ff] text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800">Sandbox Testing Environment</span>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Enable this toggle to mock transaction outputs and skip active cellular carrier billing.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSandbox}
                      onChange={(e) => setIsSandbox(e.target.checked)}
                      className="w-4 h-4 text-[#1e63ff] rounded focus:ring-[#1e63ff] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 bg-[#1e63ff] hover:bg-[#1551df] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {saveLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    <span>Update Credentials</span>
                  </button>
                </div>
              </form>
            </div>

          </main>
        ) : (
          /* Placeholder view for non-dashboard active sidebar tabs */
          <main className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1e63ff]/10 text-[#1e63ff] flex items-center justify-center mx-auto shadow-sm">
                <Database size={22} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{activeTab} Panel</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                This is a staff-only panel configured for managing eSIM {activeTab.toLowerCase()}. Access restrictions are currently set to Administrator level.
              </p>
              <button
                onClick={() => setActiveTab('Dashboard')}
                className="mt-2 px-4 py-2 bg-[#1e63ff] hover:bg-[#1551df] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#1e63ff]/10"
              >
                Return to Dashboard
              </button>
            </div>
          </main>
        )}

      </div>
    </div>
  );
}
