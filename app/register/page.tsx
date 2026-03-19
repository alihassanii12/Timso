'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;cursor:none;font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}

/* ── Cursor ── */
#cur{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .18s,height .18s,opacity .18s}
body.cm #cur{width:22px!important;height:22px!important}
body.ch #cur{width:18px!important;height:18px!important;opacity:.7}
body.ca #cur{width:10px!important;height:10px!important;opacity:.5}
body.cd #cur path{fill:#fff!important;stroke:#fff!important}

/* ── Animations ── */
@keyframes riseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes logoR{0%,100%{border-color:#0f0e0c}50%{border-color:#f97316}}
@keyframes logoRP{0%,100%{opacity:0;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes checkPop{0%{transform:scale(0) rotate(-10deg)}65%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cardIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.a-rise{opacity:0;animation:riseIn .65s cubic-bezier(.16,1,.3,1) forwards}
.a-logo{animation:logoR 3s ease-in-out infinite}
.a-logop::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid #f97316;opacity:0;animation:logoRP 3s ease-in-out infinite}

/* ── Inputs ── */
.inp{width:100%;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;padding:13px 16px;font-size:14px;font-family:'Outfit',sans-serif;color:#0f0e0c;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;cursor:none}
.inp:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.1)}
.inp.err{border-color:#ef4444;background:#fff9f9}
.inp::placeholder{color:#9e9b94}

/* ── Buttons ── */
.btn-sub{width:100%;background:#0f0e0c;color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:none;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-sub::before{content:'';position:absolute;inset:0;background:#f97316;transform:translateX(-101%);transition:transform .4s cubic-bezier(.16,1,.3,1);border-radius:14px}
.btn-sub:hover::before{transform:translateX(0)}
.btn-sub:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,.35)}
.btn-sub:disabled{opacity:.5;pointer-events:none}
.btn-sub>span{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
.btn-ghost{background:#fff;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;cursor:none;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;transition:all .2s}
.btn-ghost:hover{border-color:#0f0e0c;background:#f2f0eb}
.social-btn{width:100%;background:#fff;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;padding:13px;font-size:14px;font-weight:600;font-family:'Outfit',sans-serif;cursor:none;color:#0f0e0c;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s}
.social-btn:hover{border-color:#0f0e0c;background:#f8f7f4;transform:translateY(-1px)}
.nav-a{transition:all .2s;text-decoration:none}
.nav-a:hover{background:rgba(0,0,0,.05)}
.spin-s{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite}

/* ── Role cards ── */
.role-card{position:relative;border-radius:22px;cursor:none;transition:all .3s cubic-bezier(.16,1,.3,1);padding:clamp(18px,3vw,28px) clamp(16px,2.5vw,24px) clamp(16px,2.5vw,24px);display:flex;flex-direction:column;gap:10px;text-align:left;border:2px solid rgba(0,0,0,.08);background:#fff;overflow:hidden;animation:cardIn .5s cubic-bezier(.16,1,.3,1) both;width:100%}
.role-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.1);border-color:rgba(0,0,0,.14)}
.role-card.sel{transform:translateY(-4px)}
.role-card .blob{position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;opacity:.08;transition:opacity .3s,transform .3s;pointer-events:none}
.role-card:hover .blob,.role-card.sel .blob{opacity:.14;transform:scale(1.15)}
.role-card .ck{position:absolute;top:14px;right:14px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform .3s cubic-bezier(.16,1,.3,1)}
.role-card.sel .ck{transform:scale(1);animation:checkPop .4s cubic-bezier(.16,1,.3,1) forwards}
.role-icon{width:clamp(44px,7vw,56px);height:clamp(44px,7vw,56px);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:clamp(22px,3.5vw,28px);transition:transform .3s;flex-shrink:0}
.role-card:hover .role-icon,.role-card.sel .role-icon{transform:scale(1.1) rotate(-6deg)}
.role-name{font-family:'Syne',sans-serif;font-weight:900;font-size:clamp(16px,2.5vw,20px);letter-spacing:-.5px;color:#0f0e0c;line-height:1}
.role-sub{font-size:clamp(11px,1.4vw,12px);color:#9e9b94;line-height:1.55;font-weight:500}
.feat-list{display:flex;flex-direction:column;gap:6px;margin-top:4px}
.feat-item{display:flex;align-items:center;gap:8px;font-size:clamp(11px,1.4vw,12px);font-weight:600}
.feat-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.prog{transition:all .4s cubic-bezier(.16,1,.3,1)}

/* ── Responsive ── */
@media(max-width:768px){
  body{cursor:auto}
  #cur{display:none}
  .rg-nav{padding:13px 16px!important}
  .rg-nav-hint{display:none!important}
}
@media(max-width:540px){
  .role-cards-grid{grid-template-columns:1fr!important}
  .rg-h1{font-size:clamp(24px,7vw,30px)!important;letter-spacing:-1px!important}
  .step-label{display:none!important}
}
@media(max-width:400px){
  .social-grid{grid-template-columns:1fr!important}
}
`;

interface RoleDef {
  id: 'admin' | 'user';
  name: string;
  tagline: string;
  icon: string;
  features: string[];
  accent: string;
  accentSoft: string;
  blobColor: string;
}

const ROLES: RoleDef[] = [
  {
    id: 'admin',
    name: 'Admin',
    tagline: 'Full control over the workspace — manage team, approve swaps, view analytics.',
    icon: '👑',
    features: ['Approve & decline day swaps','View team analytics','Manage all users & roles','Access all settings'],
    accent: '#f97316',
    accentSoft: 'rgba(249,115,22,.1)',
    blobColor: '#f97316',
  },
  {
    id: 'user',
    name: 'User',
    tagline: 'Update your status, request day swaps and stay connected with your team.',
    icon: '🙋',
    features: ['Update daily attendance','Submit day swap requests','View team board','Track your own requests'],
    accent: '#0f0e0c',
    accentSoft: 'rgba(15,14,12,.06)',
    blobColor: '#0f0e0c',
  },
];

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ fullname: '', username: '', email: '', password: '', confirmPassword: '' });
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user' | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* Cursor */
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const cur = document.getElementById('cur') as HTMLElement;
    if (!cur) return;
    let mt: ReturnType<typeof setTimeout>;
    const mv = (e: MouseEvent) => {
      cur.style.left = (e.clientX - 2) + 'px';
      cur.style.top  = (e.clientY - 2) + 'px';
      document.body.classList.add('cm'); clearTimeout(mt);
      mt = setTimeout(() => document.body.classList.remove('cm'), 140);
      let n: Element | null = document.elementFromPoint(e.clientX, e.clientY); let dark = false;
      for (let i = 0; i < 6; i++) {
        if (!n || n === document.body) break;
        const rgb = window.getComputedStyle(n).backgroundColor.match(/\d+/g);
        if (rgb) { const [r,g,b,a] = rgb.map(Number); if ((a===undefined||a>0.1)&&r<80&&g<80&&b<80){dark=true;break} }
        n = n.parentElement;
      }
      document.body.classList.toggle('cd', dark);
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mousedown', () => document.body.classList.add('ca'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('ca'));
    return () => document.removeEventListener('mousemove', mv);
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.fullname.trim() || form.fullname.trim().length < 2) errs.fullname = 'Full name must be at least 2 characters';
    if (!form.username.trim() || form.username.trim().length < 3) errs.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = 'Only letters, numbers and underscores';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (form.password.length < 8) errs.password = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errs.password = 'Must contain a number';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goStep2 = () => { if (validateStep1()) setStep(2); };
  const goStep3 = (e: FormEvent) => { e.preventDefault(); if (validateStep2()) setStep(3); };

const BASE = 'https://timso-backend.vercel.app';

  const submit = async () => {
    if (!selectedRole) return;
    setLoading(true); setServerError('');
    try {
      const { data } = await axios.post(
        `${BASE}/api/auth/register`,
        {
          fullname:        form.fullname,
          username:        form.username,
          email:           form.email,
          password:        form.password,
          confirmPassword: form.confirmPassword,
          role:            selectedRole,
        },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      // Token cookie mein save karo (data.data.token ya data.accessToken dono handle)
      const token = data?.data?.token || data?.accessToken;
      if (token) {
        document.cookie = `auth-token=${token}; path=/; SameSite=Lax`;
      }

      // Backend requiresOtp: true bhejta hai → verify-email page
      if (data?.requiresOtp) {
        router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
      } else {
        router.push('/dashboard');
      }

    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      const res = ax?.response?.data;
      if (res?.errors) setErrors(res.errors);
      setServerError(res?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const pwStr = (() => {
    const p = form.password; if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStr];
  const strColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][pwStr];
  const STEPS = ['Your details', 'Set password', 'Choose role'];
  const selRoleDef = ROLES.find(r => r.id === selectedRole);

  const EyeOn = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
  const EyeOff = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick} className="btn-ghost" style={{width:50,height:50,borderRadius:14,flexShrink:0}}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
  );
  const ErrorBanner = () => serverError ? (
    <div style={{marginBottom:16,display:'flex',alignItems:'center',gap:12,borderRadius:14,padding:'12px 16px',background:'#fff1f0',border:'1px solid #fca5a5'}}>
      <div style={{width:20,height:20,borderRadius:'50%',background:'#ef4444',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width="10" height="10" fill="none" viewBox="0 0 12 12"><path d="M6 3v4M6 8.5v.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p style={{fontSize:13,color:'#b91c1c',fontWeight:500,margin:0}}>{serverError}</p>
    </div>
  ) : null;

  return (
    <>
      <style>{G}</style>

      <svg id="cur" viewBox="0 0 24 24" fill="none" style={{position:'fixed',pointerEvents:'none',zIndex:99999,width:14,height:14,top:0,left:0}}>
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round"/>
      </svg>

      {/* ── NAV ── */}
      <nav className="rg-nav" style={{
        position:'fixed',top:0,left:0,right:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'18px 48px',
        background:'rgba(250,249,247,.92)',backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(0,0,0,.06)',
      }}>
        <button onClick={() => router.push('/')} className="font-syne"
          style={{fontWeight:900,fontSize:'clamp(18px,2.5vw,22px)',display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',color:'#0f0e0c',padding:0,fontFamily:'inherit'}}>
          timso
          <span className="a-logo a-logop" style={{position:'relative',width:10,height:10,borderRadius:'50%',border:'2.5px solid #0f0e0c',marginLeft:2,display:'inline-block'}}/>
        </button>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span className="rg-nav-hint" style={{fontSize:13,color:'#6b6860'}}>Already have an account?</span>
          <button onClick={() => router.push('/login')} className="nav-a"
            style={{fontSize:13,fontWeight:600,color:'#0f0e0c',padding:'8px 16px',borderRadius:100,border:'1px solid rgba(0,0,0,.1)',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>
            Sign in
          </button>
        </div>
      </nav>

      {/* ── PAGE ── */}
      <div style={{
        minHeight:'100svh',display:'flex',alignItems:'center',justifyContent:'center',
        background:'#faf9f7',
        padding:'clamp(80px,12vw,100px) clamp(16px,4vw,24px) clamp(32px,5vw,48px)',
      }}>
        <div style={{width:'100%',maxWidth: step === 3 ? 'min(600px, 100%)' : 'min(480px, 100%)'}}>

          {/* ── STEP INDICATOR ── */}
          <div className="a-rise" style={{animationDelay:'.05s',display:'flex',alignItems:'center',marginBottom:'clamp(24px,4vw,36px)',flexWrap:'wrap',gap:4}}>
            {STEPS.map((label, idx) => {
              const s = (idx + 1) as Step;
              const done = step > s;
              const active = step === s;
              return (
                <div key={s} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div className="prog" style={{
                      width:26,height:26,borderRadius:'50%',flexShrink:0,
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,
                      background: done || active ? '#0f0e0c' : 'rgba(0,0,0,.06)',
                      color: done || active ? '#fff' : '#9e9b94',
                    }}>
                      {done
                        ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                        : s}
                    </div>
                    <span className="step-label" style={{fontSize:12,fontWeight:600,color:active?'#0f0e0c':done?'#6b6860':'#9e9b94'}}>
                      {label}
                    </span>
                  </div>
                  {s < 3 && (
                    <div className="prog" style={{height:1,width:24,margin:'0 8px',flexShrink:0,background:step>s?'#0f0e0c':'rgba(0,0,0,.1)'}}/>
                  )}
                </div>
              );
            })}
          </div>

          {/* ════ STEP 1 ════ */}
          {step === 1 && (
            <div className="a-rise" style={{animationDelay:'.08s'}}>
              <div style={{marginBottom:'clamp(20px,4vw,28px)'}}>
                <h1 className="rg-h1 font-syne font-black text-[#0f0e0c]"
                  style={{fontSize:'clamp(26px,6vw,36px)',letterSpacing:'-2px',lineHeight:1.1,margin:'0 0 8px'}}>
                  Create your account
                </h1>
                <p style={{fontSize:'clamp(13px,2vw,15px)',color:'#6b6860',margin:0,lineHeight:1.6}}>
                  Join 2,400+ teams already using Timso.
                </p>
              </div>

              <div className="social-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'clamp(14px,3vw,20px)'}}>
                <button className="social-btn">
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="social-btn">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="#0f0e0c">
                    <path d="M9 0C4.03 0 0 4.03 0 9c0 3.98 2.58 7.35 6.16 8.54.45.08.61-.2.61-.44v-1.53c-2.5.54-3.03-1.21-3.03-1.21-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.1.97 2.61.74.08-.58.31-.97.57-1.19-1.99-.23-4.08-1-4.08-4.43 0-.98.35-1.78.93-2.41-.09-.23-.4-1.14.09-2.37 0 0 .76-.24 2.48.93A8.64 8.64 0 0 1 9 4.32c.77 0 1.54.1 2.26.3 1.72-1.17 2.48-.93 2.48-.93.49 1.23.18 2.14.09 2.37.58.63.93 1.43.93 2.41 0 3.44-2.1 4.2-4.1 4.42.32.28.61.83.61 1.67v2.47c0 .24.16.52.62.43A9.003 9.003 0 0 0 18 9c0-4.97-4.03-9-9-9z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'clamp(14px,3vw,20px)'}}>
                <div style={{flex:1,height:1,background:'rgba(0,0,0,.07)'}}/>
                <span style={{fontSize:12,color:'#9e9b94',fontWeight:500,whiteSpace:'nowrap'}}>or continue with email</span>
                <div style={{flex:1,height:1,background:'rgba(0,0,0,.07)'}}/>
              </div>

              <form onSubmit={e => { e.preventDefault(); goStep2(); }} noValidate style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0f0e0c',marginBottom:6}}>Full name</label>
                  <input name="fullname" type="text" autoComplete="name" value={form.fullname} onChange={change}
                    placeholder="John Doe" className={`inp${errors.fullname ? ' err' : ''}`}/>
                  {errors.fullname && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.fullname}</p>}
                </div>
                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0f0e0c',marginBottom:6}}>Username</label>
                  <div style={{position:'relative'}}>
                    <span style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',color:'#9e9b94',fontSize:14,fontWeight:500,pointerEvents:'none'}}>@</span>
                    <input name="username" type="text" autoComplete="username" value={form.username} onChange={change}
                      placeholder="johndoe" className={`inp${errors.username ? ' err' : ''}`} style={{paddingLeft:30}}/>
                  </div>
                  {errors.username && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.username}</p>}
                </div>
                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0f0e0c',marginBottom:6}}>Work email</label>
                  <input name="email" type="email" autoComplete="email" value={form.email} onChange={change}
                    placeholder="you@company.com" className={`inp${errors.email ? ' err' : ''}`}/>
                  {errors.email && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.email}</p>}
                </div>
                <button type="submit" className="btn-sub" style={{marginTop:4}}>
                  <span>Continue →</span>
                </button>
              </form>

              <p style={{marginTop:16,fontSize:12,color:'#9e9b94',lineHeight:1.6}}>
                By creating an account you agree to our{' '}
                <button onClick={() => router.push('/terms')} style={{fontSize:12,color:'#0f0e0c',fontWeight:600,background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit'}}>Terms</button>
                {' '}and{' '}
                <button onClick={() => router.push('/privacy')} style={{fontSize:12,color:'#0f0e0c',fontWeight:600,background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit'}}>Privacy Policy</button>.
              </p>
            </div>
          )}

          {/* ════ STEP 2 ════ */}
          {step === 2 && (
            <div className="a-rise" style={{animationDelay:'.08s'}}>
              <div style={{marginBottom:'clamp(20px,4vw,28px)'}}>
                <h1 className="rg-h1 font-syne font-black text-[#0f0e0c]"
                  style={{fontSize:'clamp(26px,6vw,36px)',letterSpacing:'-2px',lineHeight:1.1,margin:'0 0 8px'}}>
                  Secure your account
                </h1>
                <p style={{fontSize:'clamp(13px,2vw,15px)',color:'#6b6860',margin:0,lineHeight:1.6}}>
                  Choose a strong password to protect your data.
                </p>
              </div>

              <ErrorBanner />

              <form onSubmit={goStep3} noValidate style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0f0e0c',marginBottom:6}}>Password</label>
                  <div style={{position:'relative'}}>
                    <input name="password" type={showPass ? 'text' : 'password'} autoComplete="new-password"
                      value={form.password} onChange={change} placeholder="Min 8 characters"
                      className={`inp${errors.password ? ' err' : ''}`} style={{paddingRight:48}}/>
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#9e9b94',cursor:'pointer',padding:0,display:'flex'}}>
                      {showPass ? <EyeOn /> : <EyeOff />}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{marginTop:8}}>
                      <div style={{display:'flex',gap:4,marginBottom:4}}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{height:4,flex:1,borderRadius:100,transition:'all .3s',background:i<=pwStr?strColor:'rgba(0,0,0,.08)'}}/>
                        ))}
                      </div>
                      <p style={{fontSize:11,fontWeight:600,margin:0,color:strColor}}>{strLabel}</p>
                    </div>
                  )}
                  {errors.password && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.password}</p>}
                </div>

                <div>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0f0e0c',marginBottom:6}}>Confirm password</label>
                  <div style={{position:'relative'}}>
                    <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                      value={form.confirmPassword} onChange={change} placeholder="Repeat your password"
                      className={`inp${errors.confirmPassword ? ' err' : ''}`} style={{paddingRight:48}}/>
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#9e9b94',cursor:'pointer',padding:0,display:'flex'}}>
                      {showConfirm ? <EyeOn /> : <EyeOff />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.confirmPassword}</p>}
                </div>

                {/* Password checklist */}
                <div style={{background:'#f2f0eb',borderRadius:14,padding:'clamp(12px,2vw,16px)',display:'flex',flexDirection:'column',gap:8}}>
                  {([
                    ['At least 8 characters', form.password.length >= 8],
                    ['One uppercase letter', /[A-Z]/.test(form.password)],
                    ['One number', /[0-9]/.test(form.password)],
                  ] as [string, boolean][]).map(([lbl, met]) => (
                    <div key={lbl} style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s',background:met?'#22c55e':'rgba(0,0,0,.1)'}}>
                        {met && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{fontSize:12,fontWeight:500,color:met?'#0f0e0c':'#9e9b94'}}>{lbl}</span>
                    </div>
                  ))}
                </div>

                <div style={{display:'flex',gap:10,marginTop:4}}>
                  <BackBtn onClick={() => setStep(1)} />
                  <button type="submit" className="btn-sub" style={{flex:1}}>
                    <span>Next: Choose role →</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ════ STEP 3 ════ */}
          {step === 3 && (
            <div className="a-rise" style={{animationDelay:'.06s'}}>
              <div style={{marginBottom:'clamp(20px,4vw,32px)'}}>
                <h1 className="rg-h1 font-syne font-black text-[#0f0e0c]"
                  style={{fontSize:'clamp(26px,6vw,36px)',letterSpacing:'-2px',lineHeight:1.1,margin:'0 0 8px'}}>
                  What&apos;s your role?
                </h1>
                <p style={{fontSize:'clamp(13px,2vw,15px)',color:'#6b6860',margin:0,lineHeight:1.6}}>
                  This determines your access level in Timso.
                </p>
              </div>

              <ErrorBanner />

              {/* Role cards */}
              <div className="role-cards-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(10px,2vw,16px)',marginBottom:'clamp(16px,3vw,24px)'}}>
                {ROLES.map((role, i) => {
                  const sel = selectedRole === role.id;
                  return (
                    <button key={role.id} onClick={() => setSelectedRole(role.id)}
                      className={`role-card${sel ? ' sel' : ''}`}
                      style={{animationDelay:`${i * .1}s`,borderColor: sel ? role.accent : 'rgba(0,0,0,.08)',boxShadow: sel ? `0 20px 60px ${role.accent}20` : 'none'}}>
                      <div className="blob" style={{background:role.blobColor}}/>
                      <div className="ck" style={{background:role.accent}}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5l2.5 2.5L9 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="role-icon" style={{background: sel ? role.accentSoft : '#f8f7f4'}}>{role.icon}</div>
                      <div>
                        <div className="role-name" style={{color: sel ? role.accent : '#0f0e0c'}}>{role.name}</div>
                        <div className="role-sub" style={{marginTop:5}}>{role.tagline}</div>
                      </div>
                      <div className="feat-list">
                        {role.features.map(f => (
                          <div key={f} className="feat-item">
                            <div className="feat-dot" style={{background: sel ? role.accent : '#c8c5be'}}/>
                            <span style={{color: sel ? '#0f0e0c' : '#9e9b94'}}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background: sel ? role.accent : 'transparent',borderRadius:'0 0 20px 20px',transition:'all .3s'}}/>
                    </button>
                  );
                })}
              </div>

              {/* Selected summary */}
              {selRoleDef && (
                <div style={{marginBottom:'clamp(14px,2.5vw,20px)',padding:'clamp(10px,2vw,13px) clamp(14px,2.5vw,18px)',borderRadius:14,background:`${selRoleDef.accent}0d`,border:`1.5px solid ${selRoleDef.accent}30`,display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:'clamp(16px,3vw,20px)'}}>{selRoleDef.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0f0e0c'}}>{selRoleDef.name} role selected</div>
                    <div style={{fontSize:11,color:'#9e9b94',marginTop:1}}>
                      {selRoleDef.id === 'admin' ? 'Full access — Analytics, Manage Team, Approve Swaps' : 'Standard access — Attendance, Day Swaps, Team Board'}
                    </div>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={selRoleDef.accent} strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                </div>
              )}

              <div style={{display:'flex',gap:10}}>
                <BackBtn onClick={() => setStep(2)} />
                <button onClick={submit} disabled={!selectedRole || loading} className="btn-sub" style={{flex:1}}>
                  <span>
                    {loading
                      ? <><span className="spin-s"/>Creating account…</>
                      : selectedRole
                        ? `Create account as ${selRoleDef?.name} →`
                        : 'Select a role to continue'}
                  </span>
                </button>
              </div>

              <p style={{marginTop:12,fontSize:12,color:'#c8c5be',textAlign:'center'}}>
                Not sure?{' '}
                <button onClick={() => setSelectedRole('user')} style={{fontSize:12,fontWeight:700,color:'#9e9b94',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline',fontFamily:'inherit'}}>
                  Pick User
                </button>
                {' '}— you can always ask your admin to upgrade later.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}