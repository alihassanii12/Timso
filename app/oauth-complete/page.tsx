'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

function OAuthCompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<'loading'|'role'|'company'|'done'>('loading');
  const [role, setRole] = useState<'admin'|'user'|''>('');
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = params.get('token') || '';
  const isNew = params.get('new') === '1';
  const paramRole = params.get('role');
  const hasCompany = params.get('has_company') === '1';
  const preset = params.get('preset'); // 'admin' if admin but no company yet

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    // Store token
    localStorage.setItem('timso_token', token);
    document.cookie = 'accessToken=' + encodeURIComponent(token) + '; path=/; SameSite=None; Secure; max-age=' + (15*60);

    if (isNew || !paramRole || paramRole === 'pending') {
      // New user — show role selection
      // If preset=admin, skip to company step directly
      if (preset === 'admin') {
        setRole('admin');
        setStep('company');
      } else {
        setStep('role');
      }
    } else if (paramRole === 'admin') {
      // Existing admin with company — go to dashboard
      router.push('/admin/admin-dashboard');
    } else if (hasCompany) {
      router.push('/user/user-dashboard');
    } else {
      router.push('/find-company');
    }
  }, [token, isNew, paramRole, hasCompany, preset, router]);

  const handleRoleSelect = async () => {
    if (!role) return;
    if (role === 'admin') { setStep('company'); return; }
    // User role — set directly
    await setRoleAPI('user');
  };

  const handleCompanySubmit = async () => {
    if (!companyName.trim()) { setError('Company name is required'); return; }
    await setRoleAPI('admin');
  };

  const setRoleAPI = async (r: 'admin'|'user') => {
    setSaving(true); setError('');
    try {
      console.log('🔄 Calling set-role API:', { role: r, token: token?.slice(0,20) + '...' });
      
      const res = await axios.post(API + '/api/oauth/set-role', {
        token, role: r,
        companyName: r === 'admin' ? companyName : undefined,
        companyDescription: r === 'admin' ? companyDesc : undefined,
      }, { withCredentials: true });

      console.log('✅ set-role response:', res.data);

      // Save new token
      const newToken = res.data?.accessToken;
      if (newToken) {
        localStorage.setItem('timso_token', newToken);
        document.cookie = 'accessToken=' + encodeURIComponent(newToken) + '; path=/; SameSite=None; Secure; max-age=' + (15*60);
      }

      // Route based on role
      if (r === 'admin') {
        window.location.href = '/admin/admin-dashboard';
      } else {
        window.location.href = '/find-company';
      }
    } catch(e: unknown) {
      console.error('❌ set-role error:', e);
      const ax = e as {response?:{data?:{message?:string}, status?: number}};
      console.error('Response:', ax?.response?.data, 'Status:', ax?.response?.status);
      setError(ax?.response?.data?.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const inp = {width:'100%',border:'1.5px solid #e0e0e0',borderRadius:12,padding:'11px 14px',fontSize:14,fontFamily:'Outfit,sans-serif',outline:'none',background:'#fff',color:'#111',boxSizing:'border-box' as const};

  if (step === 'loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#faf9f7',fontFamily:'Outfit,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:40,height:40,border:'3px solid #f0f0f0',borderTopColor:'#f97316',borderRadius:'50%',animation:'spin .7s linear infinite',margin:'0 auto 16px'}}/>
        <div style={{fontSize:14,color:'#888'}}>Setting up your account...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (step === 'role') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#faf9f7',fontFamily:'Outfit,sans-serif',padding:20}}>
      <div style={{width:'100%',maxWidth:480}}>
        <div style={{marginBottom:28,textAlign:'center'}}>
          <h1 style={{fontSize:28,fontWeight:900,letterSpacing:'-1px',margin:'0 0 8px',fontFamily:'Syne,sans-serif'}}>Choose your role</h1>
          <p style={{fontSize:14,color:'#888',margin:0}}>How will you use Timso?</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
          {([
            {id:'admin' as const, label:'Admin', desc:'Register your company and manage your team', icon:'🏢', color:'#f97316'},
            {id:'user' as const, label:'User', desc:'Join a company and collaborate with your team', icon:'🙋', color:'#111'},
          ]).map(r => (
            <button key={r.id} onClick={()=>setRole(r.id)} style={{padding:'20px 16px',borderRadius:16,border:'2px solid '+(role===r.id?r.color:'#e5e5e5'),background:role===r.id?r.color+'0d':'#fff',cursor:'pointer',textAlign:'left',transition:'all .15s',fontFamily:'Outfit,sans-serif'}}>
              <div style={{fontSize:28,marginBottom:10}}>{r.icon}</div>
              <div style={{fontSize:15,fontWeight:800,color:'#111',marginBottom:4}}>{r.label}</div>
              <div style={{fontSize:12,color:'#888',lineHeight:1.5}}>{r.desc}</div>
            </button>
          ))}
        </div>
        {error&&<div style={{marginBottom:12,padding:'10px 14px',borderRadius:10,background:'#fef2f2',color:'#ef4444',fontSize:13}}>{error}</div>}
        <button onClick={handleRoleSelect} disabled={!role||saving} style={{width:'100%',padding:'13px',borderRadius:12,border:'none',background:'#111',color:'#fff',fontSize:14,fontWeight:700,cursor:!role?'default':'pointer',fontFamily:'Outfit,sans-serif',opacity:!role?0.4:1}}>
          {saving?'Setting up...':'Continue →'}
        </button>
      </div>
    </div>
  );

  if (step === 'company') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#faf9f7',fontFamily:'Outfit,sans-serif',padding:20}}>
      <div style={{width:'100%',maxWidth:440}}>
        <button onClick={()=>setStep('role')} style={{marginBottom:20,background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#888',display:'flex',alignItems:'center',gap:6,fontFamily:'Outfit,sans-serif'}}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:900,letterSpacing:'-1px',margin:'0 0 8px',fontFamily:'Syne,sans-serif'}}>Register your company</h1>
          <p style={{fontSize:14,color:'#888',margin:0}}>You can update these details later in settings.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Company Name *</label>
            <input style={inp} value={companyName} onChange={e=>{setCompanyName(e.target.value);setError('');}} placeholder="Acme Inc."/>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,color:'#555',display:'block',marginBottom:5}}>Description <span style={{fontWeight:400,color:'#bbb'}}>(optional)</span></label>
            <input style={inp} value={companyDesc} onChange={e=>setCompanyDesc(e.target.value)} placeholder="What does your company do?"/>
          </div>
        </div>
        {error&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:10,background:'#fef2f2',color:'#ef4444',fontSize:13}}>{error}</div>}
        <button onClick={handleCompanySubmit} disabled={saving} style={{width:'100%',marginTop:20,padding:'13px',borderRadius:12,border:'none',background:'#111',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',opacity:saving?0.6:1}}>
          {saving?'Creating...':'Create Company & Continue →'}
        </button>
      </div>
    </div>
  );

  return null;
}

export default function OAuthComplete() {
  return (
    <Suspense>
      <OAuthCompleteInner />
    </Suspense>
  );
}
