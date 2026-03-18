'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const G = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;cursor:none;font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}

/* ── Cursor ── */
#cur-arrow{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .2s,height .2s,opacity .2s}
body.cur-moving #cur-arrow{width:22px!important;height:22px!important}
body.cur-hover  #cur-arrow{width:18px!important;height:18px!important;opacity:.7}
body.cur-active #cur-arrow{width:10px!important;height:10px!important;opacity:.5}
body.cur-on-dark #cur-arrow path{fill:#fff!important;stroke:#fff!important}

/* ── Animations ── */
@keyframes riseIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes logoR{0%,100%{border-color:#0f0e0c}50%{border-color:#f97316}}
@keyframes logoRP{0%,100%{opacity:0;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.a-rise{opacity:0;animation:riseIn .7s cubic-bezier(.16,1,.3,1) forwards}
.a-logo{animation:logoR 3s ease-in-out infinite}
.a-logop::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid #f97316;opacity:0;animation:logoRP 3s ease-in-out infinite}

/* ── Inputs ── */
.input-field{width:100%;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;padding:13px 16px;font-size:14px;font-family:'Outfit',sans-serif;color:#0f0e0c;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;cursor:none}
.input-field:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.1)}
.input-field.error{border-color:#ef4444;background:#fff9f9}
.input-field.error:focus{box-shadow:0 0 0 3px rgba(239,68,68,.1)}
.input-field::placeholder{color:#9e9b94}

/* ── Submit btn ── */
.btn-submit{width:100%;background:#0f0e0c;color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:none;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s}
.btn-submit::before{content:'';position:absolute;inset:0;background:#f97316;transform:translateX(-101%);transition:transform .4s cubic-bezier(.16,1,.3,1);border-radius:14px}
.btn-submit:hover::before{transform:translateX(0)}
.btn-submit:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,.35)}
.btn-submit:disabled{opacity:.6;pointer-events:none}
.btn-submit span{position:relative;z-index:1}

/* ── Social btn ── */
.social-btn{background:#fff;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;padding:13px;font-size:14px;font-weight:600;font-family:'Outfit',sans-serif;cursor:none;color:#0f0e0c;display:flex;align-items:center;justify-content:center;gap:10px;transition:border-color .2s,background .2s,transform .2s;width:100%}
.social-btn:hover{border-color:#0f0e0c;background:#f8f7f4;transform:translateY(-1px)}

.nav-link-auth{transition:color .2s,background .2s}
.nav-link-auth:hover{color:#0f0e0c;background:rgba(0,0,0,.05)}
.error-banner{animation:shake .4s cubic-bezier(.36,.07,.19,.97) both}

/* ── Responsive ── */
@media(max-width:768px){
  body{cursor:auto}
  #cur-arrow{display:none}
  .ln-nav{padding:13px 16px!important}
  .ln-hint{display:none!important}
}
@media(max-width:480px){
  .ln-h1{font-size:clamp(24px,7vw,32px)!important;letter-spacing:-1px!important}
  .ln-sub{font-size:14px!important}
}
`;

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const arrow = document.getElementById('cur-arrow') as HTMLElement;
    let mt: ReturnType<typeof setTimeout>;
    const onMove = (e: MouseEvent) => {
      arrow.style.left = (e.clientX - 2) + 'px';
      arrow.style.top  = (e.clientY - 2) + 'px';
      document.body.classList.add('cur-moving'); clearTimeout(mt);
      mt = setTimeout(() => document.body.classList.remove('cur-moving'), 150);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        let n: Element | null = el; let dark = false;
        for (let i = 0; i < 6; i++) {
          if (!n || n === document.body) break;
          const rgb = window.getComputedStyle(n).backgroundColor.match(/\d+/g);
          if (rgb) { const [r,g,b,a] = rgb.map(Number); if ((a===undefined||a>0.1)&&r<80&&g<80&&b<80){dark=true;break} }
          n = n.parentElement;
        }
        document.body.classList.toggle('cur-on-dark', dark);
      }
    };
    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('a,button,input').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cur-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cur-hover'));
    });
    document.addEventListener('mousedown', () => document.body.classList.add('cur-active'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('cur-active'));
    return () => { document.removeEventListener('mousemove', onMove); };
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.email)    errs.email    = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/auth/login',
        form,
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      if (data?.data?.token) {
        document.cookie = `auth-token=${data.data.token}; path=/; SameSite=Lax`;
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      const res = ax?.response?.data;
      setServerError(res?.message || 'Invalid email or password');
      if (res?.errors) setErrors(res.errors);
      setLoading(false);
    }
  };

  return (
    <>
      <style>{G}</style>

      <svg id="cur-arrow" viewBox="0 0 24 24" fill="none" style={{position:'fixed',pointerEvents:'none',zIndex:99999,width:14,height:14,top:0,left:0}}>
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round"/>
      </svg>

      {/* ── NAV ── */}
      <nav className="ln-nav" style={{
        position:'fixed',top:0,left:0,right:0,zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'18px 48px',
        background:'rgba(255,255,255,.92)',backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(0,0,0,.06)',
      }}>
        <button
          onClick={() => router.push('/')}
          className="font-syne font-black"
          style={{fontSize:'clamp(18px,2.5vw,22px)',display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',color:'#0f0e0c',padding:0,fontFamily:'inherit'}}>
          timso
          <span className="relative a-logo a-logop" style={{display:'inline-block',width:10,height:10,borderRadius:'50%',border:'2.5px solid #0f0e0c',flexShrink:0}}></span>
        </button>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span className="ln-hint" style={{fontSize:13,color:'#6b6860'}}>Don&apos;t have an account?</span>
          <button
            onClick={() => router.push('/register')}
            className="nav-link-auth font-semibold"
            style={{fontSize:13,color:'#0f0e0c',padding:'8px 16px',borderRadius:100,border:'1px solid rgba(0,0,0,.1)',background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>
            Sign up free
          </button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div style={{
        minHeight:'100svh',display:'flex',alignItems:'center',justifyContent:'center',
        background:'#faf9f7',
        padding:'clamp(80px,12vw,100px) clamp(16px,4vw,24px) clamp(32px,5vw,48px)',
      }}>
        <div style={{width:'100%',maxWidth:420}}>

          {/* Heading */}
          <div className="mb-8 a-rise" style={{animationDelay:'.05s',marginBottom:'clamp(24px,4vw,32px)'}}>
            <h1 className="ln-h1 font-syne font-black text-[#0f0e0c]"
              style={{fontSize:'clamp(28px,6vw,36px)',letterSpacing:'-2px',lineHeight:1.1,margin:'0 0 8px'}}>
              Welcome back
            </h1>
            <p className="ln-sub" style={{fontSize:'clamp(13px,2vw,15px)',color:'#6b6860',margin:0}}>
              Sign in to your Timso account.
            </p>
          </div>

          {/* Social buttons */}
          <div className="a-rise" style={{animationDelay:'.1s',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'clamp(16px,3vw,24px)'}}>
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

          {/* Divider */}
          <div className="a-rise" style={{animationDelay:'.13s',display:'flex',alignItems:'center',gap:12,marginBottom:'clamp(16px,3vw,24px)'}}>
            <div style={{flex:1,height:1,background:'rgba(0,0,0,.07)'}}></div>
            <span style={{fontSize:12,color:'#9e9b94',fontWeight:500,whiteSpace:'nowrap'}}>or continue with email</span>
            <div style={{flex:1,height:1,background:'rgba(0,0,0,.07)'}}></div>
          </div>

          {/* Error banner */}
          {serverError && (
            <div className="error-banner a-rise" style={{marginBottom:16,display:'flex',alignItems:'center',gap:12,background:'#fff1f0',border:'1px solid #fca5a5',borderRadius:14,padding:'12px 16px'}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'#ef4444',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="10" height="10" fill="none" viewBox="0 0 12 12"><path d="M6 3v4M6 8.5v.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <p style={{fontSize:13,color:'#b91c1c',fontWeight:500,margin:0}}>{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} noValidate className="a-rise" style={{animationDelay:'.16s',display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label style={{display:'block',fontSize:13,fontWeight:600,color:'#0f0e0c',marginBottom:6}}>Email address</label>
              <input
                name="email" type="email" autoComplete="email"
                value={form.email} onChange={change}
                placeholder="you@company.com"
                className={`input-field${errors.email ? ' error' : ''}`}
              />
              {errors.email && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.email}</p>}
            </div>

            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <label style={{fontSize:13,fontWeight:600,color:'#0f0e0c'}}>Password</label>
                <button type="button" onClick={() => router.push('/forgot-password')}
                  style={{fontSize:12,fontWeight:600,color:'#6b6860',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',transition:'color .2s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='#0f0e0c')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#6b6860')}>
                  Forgot password?
                </button>
              </div>
              <div style={{position:'relative'}}>
                <input
                  name="password" type={showPass ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password} onChange={change}
                  placeholder="••••••••"
                  className={`input-field${errors.password ? ' error' : ''}`}
                  style={{paddingRight:48}}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#9e9b94',cursor:'pointer',padding:0,display:'flex'}}>
                  {showPass
                    ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={{margin:'4px 0 0',fontSize:12,color:'#ef4444'}}>{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-submit" style={{marginTop:4}}>
              <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {loading && (
                  <svg style={{width:16,height:16,animation:'spin .65s linear infinite'}} fill="none" viewBox="0 0 24 24">
                    <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                )}
                {loading ? 'Signing in…' : 'Sign in'}
              </span>
            </button>
          </form>

          <p className="a-rise" style={{animationDelay:'.22s',marginTop:'clamp(16px,3vw,24px)',textAlign:'center',fontSize:13,color:'#9e9b94'}}>
            New to Timso?{' '}
            <button onClick={() => router.push('/register')}
              style={{fontSize:13,fontWeight:600,color:'#0f0e0c',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',textDecoration:'underline'}}>
              Create a free account
            </button>
          </p>

        </div>
      </div>
    </>
  );
}