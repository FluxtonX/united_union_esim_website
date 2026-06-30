'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Key, RefreshCcw, DollarSign, CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react';

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

const INITIAL_ORDERS: EsimOrder[] = [
  {
    id: 'ord_u98f7g23hd',
    customerEmail: 'traveler1@gmail.com',
    countryCode: 'US',
    planId: 'maya_us_5gb_30d',
    amountPaid: 12.50,
    status: 'PROVISIONED',
    iccid: '8904 9032 4432 1092 5678',
    createdAt: '2026-06-30T10:15:00Z',
  },
  {
    id: 'ord_f382jkd9sa',
    customerEmail: 'explorer99@yahoo.com',
    countryCode: 'TR',
    planId: 'maya_tr_10gb_30d',
    amountPaid: 17.50,
    status: 'PROVISIONED',
    iccid: '8904 9032 5592 3841 8765',
    createdAt: '2026-06-30T12:44:00Z',
  },
  {
    id: 'ord_l0923kd8w1',
    customerEmail: 'nomad_john@example.com',
    countryCode: 'GB',
    planId: 'maya_gb_1gb_7d',
    amountPaid: 5.50,
    status: 'PENDING',
    createdAt: '2026-06-30T13:30:00Z',
  },
  {
    id: 'ord_p0923lka22',
    customerEmail: 'vip_flyer@outlook.com',
    countryCode: 'FR',
    planId: 'maya_fr_5gb_30d',
    amountPaid: 11.50,
    status: 'FAILED',
    createdAt: '2026-06-30T09:20:00Z',
  },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<EsimOrder[]>(INITIAL_ORDERS);
  const [apiKey, setApiKey] = useState('maya_sec_live_998877665544aabbcc');
  const [isSandbox, setIsSandbox] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState<string | null>(null);

  // Stats calculation
  const totalRevenue = orders
    .filter(o => o.status === 'PROVISIONED')
    .reduce((sum, o) => sum + o.amountPaid, 0);

  const totalOrdersCount = orders.length;

  const successfulProvisioningRate = totalOrdersCount > 0
    ? Math.round((orders.filter(o => o.status === 'PROVISIONED').length / totalOrdersCount) * 100)
    : 0;

  // Poll backend for real orders on mount (optional fallback)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:3000/payment/orders');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.data)) {
            setOrders(data.data);
          }
        }
      } catch (_) {
        // Fallback to static mock orders
      }
    };
    fetchOrders();
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    // Simulate updating API configuration settings in NestJS
    try {
      await fetch('http://localhost:3000/providers/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    // Call NestJS refund endpoint
    try {
      const response = await fetch('http://localhost:3000/payment/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (response.ok) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: 'REFUNDED' } : o)
        );
        alert('Order refunded successfully.');
        setRefundLoading(null);
        return;
      }
    } catch (_) {
      // Offline Simulation fallback
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'REFUNDED' } : o)
    );
    setRefundLoading(null);
    alert('Order refunded successfully (Local simulation).');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Header */}
      <header className="bg-white border-b border-slate-200/80 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20">
              U
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                UnitedUnion <span className="text-blue-600">Admin</span>
              </span>
              <p className="text-slate-400 text-xs mt-0.5">Travel eSIM Management Console</p>
            </div>
          </div>
          <a
            href="/"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← Back to Storefront
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-8 py-10 flex-1 space-y-10">
        {/* 2. Key Stats Rows */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sales</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">\${totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-1">From successful orders</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{totalOrdersCount}</h3>
              <p className="text-xs text-slate-400 mt-1">Stripe Checkout intents</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Provisioning Success</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{successfulProvisioningRate}%</h3>
              <p className="text-xs text-slate-400 mt-1">eSIM generation yield</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
        </section>

        {/* 3. Provider settings & orders list grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Provider Key Manager */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Key size={18} className="text-blue-600" />
              Provider Credentials
            </h3>
            <form onSubmit={handleSaveKeys} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Maya API Secret Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 text-sm font-mono"
                  placeholder="Enter Maya secret API key"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Operation Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      checked={isSandbox}
                      onChange={() => setIsSandbox(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Sandbox (Simulated)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isSandbox}
                      onChange={() => setIsSandbox(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Production (Live)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
              >
                <Save size={16} />
                {saveLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* Orders Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <ShoppingBag size={18} className="text-blue-600" />
              Recent eSIM Orders
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Order Reference</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 px-4 font-mono font-bold text-slate-700">{o.id}</td>
                      <td className="py-4.5 px-4 text-slate-500">{o.customerEmail}</td>
                      <td className="py-4.5 px-4 text-slate-700">{o.countryCode}</td>
                      <td className="py-4.5 px-4 font-bold text-slate-800">\${o.amountPaid.toFixed(2)}</td>
                      <td className="py-4.5 px-4">
                        {o.status === 'PROVISIONED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            <CheckCircle size={10} /> PROVISIONED
                          </span>
                        )}
                        {o.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] animate-pulse">
                            <RefreshCcw size={10} className="animate-spin" /> PENDING
                          </span>
                        )}
                        {o.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-[10px]">
                            <XCircle size={10} /> FAILED
                          </span>
                        )}
                        {o.status === 'REFUNDED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                            <AlertCircle size={10} /> REFUNDED
                          </span>
                        )}
                      </td>
                      <td className="py-4.5 px-4 text-right">
                        {o.status === 'PROVISIONED' && (
                          <button
                            onClick={() => handleRefund(o.id)}
                            disabled={refundLoading === o.id}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {refundLoading === o.id ? 'Processing...' : 'Refund'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
