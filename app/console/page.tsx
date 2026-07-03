'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { API_BASE_URL } from '../config';

export default function ConsoleRoot() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      // First check if mock authentication exists in localStorage
      const mockAuth = localStorage.getItem('uu_console_mock_auth');
      if (mockAuth === 'true') {
        router.replace('/console/admindashboard');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          router.replace('/console/admindashboard');
        } else {
          router.replace('/console/login');
        }
      } catch (_) {
        // Backend offline, fallback to login
        router.replace('/console/login');
      }
    }

    checkAuth();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-800 p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-[#1e63ff]" size={40} />
        <span className="text-sm font-semibold tracking-wide text-slate-500 animate-pulse">
          Loading UnitedUnion Console...
        </span>
      </div>
    </div>
  );
}
