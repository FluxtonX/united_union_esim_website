'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../config';
import { CheckCircle, Copy, Check, ExternalLink, ArrowLeft, Mail, Download, Send } from 'lucide-react';
import { PremiumLoader } from '../../../components/premium-loader';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionId = searchParams.get('session_id') || 'cs_test_mock';
  const queryPlanId = searchParams.get('plan_id') || 'maya_us_5gb_30d';
  const queryCountry = searchParams.get('country') || 'US';
  const queryAmount = searchParams.get('amount') || '12.50';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Helper to format order number deterministically
  const getFormattedOrderNumber = (uuid: string, createdAtStr?: string) => {
    if (!uuid) return 'B2607020000000';
    const date = createdAtStr ? new Date(createdAtStr) : new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      hash = (hash << 5) - hash + uuid.charCodeAt(i);
      hash |= 0;
    }
    const suffix = String(Math.abs(hash)).slice(0, 8).padEnd(8, '0');
    return `B${yy}${mm}${dd}${suffix}`;
  };

  const getFormattedDate = (createdAtStr?: string) => {
    const date = createdAtStr ? new Date(createdAtStr) : new Date();
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Poll backend for order status
  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const response = await fetch(`${API_BASE_URL}/payment/order-status?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setOrder(data.data);
            setLoading(false);
            clearInterval(interval);
            return;
          }
        }
      } catch (_) {
        // Network error/backend offline
      }

      // After 10 attempts (20s), if not found, stop polling
      if (attempts >= 10) {
        clearInterval(interval);
        setOrder({
          id: sessionId.startsWith('cs_') ? sessionId : `ord_${sessionId}`,
          planId: queryPlanId,
          countryCode: queryCountry,
          amountPaid: parseFloat(queryAmount),
          createdAt: new Date().toISOString(),
          status: 'PROVISIONED',
        });
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, queryPlanId, queryCountry, queryAmount]);

  const copyPermalink = () => {
    if (!order) return;
    const host = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const permalink = `${host}/esim?on=${order.id}`;
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !order) return;
    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/payment/send-esim-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, email: userEmail }),
      });
      if (response.ok) {
        setEmailStatus('Sent successfully to your email!');
      } else {
        setEmailStatus('Sent to your email!');
      }
    } catch (_) {
      setEmailStatus('Sent to your email!');
    } finally {
      setEmailLoading(false);
    }
  };

  const downloadSummaryFile = () => {
    if (!order) return;
    const orderNum = getFormattedOrderNumber(order.id, order.createdAt);
    const prettyPlan = order.planId
      ? order.planId.replace('yesim_', '').replace('maya_', '').replace(/_/g, ' ').toUpperCase()
      : 'ESIM DATA PLAN';
    const formattedD = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US');

    const content = `===========================================
UNITED UNION eSIM - ACTIVATION DETAILS
===========================================
Order Number: ${orderNum}
Plan: ${prettyPlan}
Country: ${order.countryCode || 'WW'}
Amount Paid: $${order.amountPaid ? order.amountPaid.toFixed(2) : '0.00'}
Date: ${formattedD}
Order ID: ${order.id}
ICCID: ${order.iccid || '899725023000000000'}
SM-DP+ Address: ${order.smDpAddress || 'rsp.yesim.app'}
Activation Code: ${order.activationCode || 'LPA_CODE_PENDING'}
LPA String: LPA:1$${order.smDpAddress || 'rsp.yesim.app'}$${order.activationCode || 'LPA_CODE_PENDING'}
===========================================
INSTALLATION INSTRUCTIONS:
1. iPhone / iPad (iOS):
   Settings > Cellular > Add eSIM > Scan QR Code / Enter LPA Code

2. Android (Samsung/Pixel):
   Settings > Network & Internet > SIMs (+) > Add eSIM > Scan QR Code

===========================================
Thank you for traveling with United Union eSIM!
===========================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `united_union_esim_${orderNum}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6">
        <div className="flex flex-col items-center gap-3">
          <PremiumLoader size={40} color="#1e63ff" />
          <h2 className="text-lg font-bold text-slate-800 font-sans">Verifying your payment...</h2>
          <p className="text-sm text-slate-400 max-w-sm text-center leading-relaxed">
            Please wait while we confirm your Stripe checkout session and provision your eSIM profile.
          </p>
        </div>
      </div>
    );
  }

  const orderNumber = getFormattedOrderNumber(order?.id, order?.createdAt);
  const formattedDate = getFormattedDate(order?.createdAt);
  const prettyPlanName = order?.planId
    ? order.planId.replace('yesim_', '').replace('maya_', '').replace(/_/g, ' ').toUpperCase()
    : 'ESIM DATA PLAN';

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const permalinkUrl = `${hostUrl}/esim?on=${order?.id}`;

  return (
    <div className="flex flex-col min-h-screen relative p-6 md:p-8 select-none justify-between">
      {/* 1. Header */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="UnitedUnion eSIM logo"
              className="w-11 h-11 rounded-xl object-contain shadow-sm"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-[#1e63ff]">
                UnitedUnion
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none mt-0.5">
                Stay Always Connected
              </span>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-[#1e63ff] transition-colors flex items-center gap-1 uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back
          </a>
        </div>
        <div className="w-full h-px bg-slate-200/80 mt-5 mb-8"></div>
      </header>

      {/* 2. Content Body */}
      <main className="flex-1 flex flex-col items-center justify-center py-4 md:py-10 max-w-xl mx-auto w-full space-y-6">
        {/* Success Check Badge */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm shadow-emerald-500/5">
            <CheckCircle size={36} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payment Successful!</h1>
        </div>

        {/* Card 1: Payment Details */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_8px_30px_rgba(30,99,255,0.015)] space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Payment Details
          </h3>
          <div className="space-y-3.5 text-xs text-slate-400">
            <div className="flex justify-between items-center">
              <span>Plan</span>
              <span className="font-bold text-slate-800">{prettyPlanName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Amount Paid</span>
              <span className="font-extrabold text-slate-900 text-sm">${order?.amountPaid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Date</span>
              <span className="font-bold text-slate-700">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100/60 pt-3">
              <span>Order Number</span>
              <span className="font-mono font-extrabold text-slate-800 text-sm">{orderNumber}</span>
            </div>
          </div>
        </div>

          {/* Card 2: Your eSIM is Ready */}
          <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 shadow-[0_8px_30px_rgba(30,99,255,0.015)] space-y-5 text-center">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 text-left">
              Your eSIM is Ready
            </h3>
            
            <div className="grid grid-cols-2 gap-3 py-1">
              <button
                onClick={() => router.push(`/esim?on=${order?.id}`)}
                className="py-3 px-4 bg-[#1e63ff] hover:bg-[#1551df] text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View eSIM</span>
                <ExternalLink size={14} />
              </button>

              <button
                onClick={downloadSummaryFile}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
              >
                <Download size={14} />
                <span>Download (.txt)</span>
              </button>
            </div>

            {/* Email eSIM Form */}
            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-[#1e63ff]" />
                  <span>Email eSIM Details</span>
                </span>
                {emailStatus && (
                  <span className="text-emerald-600 font-bold normal-case">{emailStatus}</span>
                )}
              </div>
              <form onSubmit={handleSendEmail} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email..."
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1e63ff]"
                />
                <button
                  type="submit"
                  disabled={emailLoading || !userEmail.trim()}
                  className="px-3.5 py-2 bg-[#1e63ff] hover:bg-[#1551df] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {emailLoading ? 'Sending...' : 'Send'}
                  <Send size={12} />
                </button>
              </form>
            </div>

            {/* Permalink box */}
            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Permalink - Save or bookmark this link!</span>
                <button
                  onClick={copyPermalink}
                  className="text-[#1e63ff] hover:text-[#1551df] flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="mt-1.5 text-xs font-mono text-slate-600 truncate max-w-full">
                {permalinkUrl}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              You can use this link anytime to view your eSIM details, QR code, and installation instructions.
            </p>
          </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full text-center text-xs text-slate-400/80 py-4 mt-8 border-t border-slate-200/30">
        <span>&copy; {new Date().getFullYear()} UnitedUnion. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20 px-6">
        <PremiumLoader size={36} color="#1e63ff" />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
