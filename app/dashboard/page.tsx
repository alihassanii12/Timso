'use client';

import { useEffect } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

export default function DashboardRouter() {
  useEffect(() => {
    const token = localStorage.getItem('timso_token');

    axios.get(`${API}/api/auth/me`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (!u?.id) { window.location.href = '/login'; return; }

        // pending role → needs setup
        if (!u.role || u.role === 'pending') {
          window.location.href = '/login';
          return;
        }

        if (u.role === 'admin') {
          window.location.href = '/admin/admin-dashboard';
        } else if (u.company_id) {
          window.location.href = '/user/user-dashboard';
        } else {
          window.location.href = '/find-company';
        }
      })
      .catch(() => { window.location.href = '/login'; });
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,.1)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
