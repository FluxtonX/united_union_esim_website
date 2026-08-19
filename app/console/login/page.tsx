'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

import { API_BASE_URL } from '../../config';

export default function ConsoleLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const token = data.data?.accessToken || data.token;
        if (token) {
          localStorage.setItem('uu_access_token', token);
        }
        localStorage.setItem('uu_console_auth', 'true');
        localStorage.setItem('uu_console_user_email', email);
        router.push('/console/admindashboard');
        return;
      } else {
        setErrorMsg(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (_) {
      setErrorMsg('Unable to connect to authentication server. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

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
                UnitedUnion <span className="text-slate-800 font-bold">Console</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none mt-0.5">
                Staff Authentication
              </span>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-[#1e63ff] transition-colors uppercase tracking-wider"
          >
            ← Storefront
          </a>
        </div>
        <div className="w-full h-px bg-slate-200/80 mt-5 mb-6 md:mb-12"></div>
      </header>

      {/* 2. Login Card */}
      <main className="flex-1 flex items-center justify-center py-6 md:py-12">
        <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-[28px] p-6 md:p-8 shadow-[0_12px_40px_rgba(30,99,255,0.03)]">
          <h1 className="text-2xl font-extrabold text-slate-900 text-center tracking-tight mb-2">
            Console Sign In
          </h1>
          <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
            Enter your credentials to access the management panel
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold">
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4.5 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="name@unitedunion.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4.5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1e63ff]/10 focus:border-[#1e63ff] text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4.5 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4.5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1e63ff]/10 focus:border-[#1e63ff] text-sm text-slate-800"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-5 bg-[#1e63ff] hover:bg-[#1551df] disabled:bg-slate-400 text-white rounded-2xl text-center text-sm font-bold tracking-wide transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400 font-medium">Don't have an account? </span>
            <a
              href="/console/signup"
              className="text-xs font-bold text-[#1e63ff] hover:underline"
            >
              Register Here
            </a>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full text-center text-xs text-slate-400/80 py-4 mt-8 border-t border-slate-200/30">
        <span>&copy; {new Date().getFullYear()} UnitedUnion. Staff Operations.</span>
      </footer>
    </div>
  );
}
