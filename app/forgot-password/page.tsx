'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const G = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Outfit:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;cursor:none;font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}
#cur-arrow{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .2s,height .2s,opacity .2s}
body.cur-moving #cur-arrow{width:22px!important;height:22px!important}
body.cur-hover  #cur-arrow{width:18px!important;height:18px!important;opacity:.7}
body.cur-active #cur-arrow{width:10px!important;height:10px!important;opacity:.5}
body.cur-on-dark #cur-arrow path{fill:#fff!important;stroke:#fff!important}
@keyframes riseIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes logoR{0%,100%{border-color:#0f0e0c}50%{border-color:#f97316}}
@keyframes logoRP{0%,100%{opacity:0;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.a-rise{opacity:0;animation:riseIn .7s cubic-bezier(.16,1,.3,1) forwards}
.a-logo{animation:logoR 3s ease-in-out infinite}
.a-logop::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid #f97316;opacity:0;animation:logoRP 3s ease-in-out infinite}
.a-slide{animation:slideDown .4s cubic-bezier(.16,1,.3,1) forwards}
.input-field{width:100%;border:1.5px solid rgba(0,0,0,.1);border-radius:14px;padding:13px 16px;font-size:14px;font-family:'Outfit',sans-serif;color:#0f0e0c;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;cursor:none}
.input-field:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.1)}
.input-field.error{border-color:#ef4444;background:#fff9f9}
.input-field::placeholder{color:#9e9b94}
.btn-submit{width:100%;background:#0f0e0c;color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:none;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s}
.btn-submit::before{content:'';position:absolute;inset:0;background:#f97316;transform:translateX(-101%);transition:transform .4s cubic-bezier(.16,1,.3,1);border-radius:14px}
.btn-submit:hover::before{transform:translateX(0)}
.btn-submit:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,.35)}
.btn-submit:disabled{opacity:.6;pointer-events:none}
.btn-submit span{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px}
.nav-link-auth{transition:color .2s,background .2s}
.nav-link-auth:hover{color:#0f0e0c;background:rgba(0,0,0,.05)}
.step-dot{transition:all .4s cubic-bezier(.16,1,.3,1)}
.otp-input{width:52px;height:56px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;text-align:center;font-size:22px;font-weight:800;font-family:'Syne',sans-serif;color:#0f0e0c;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s;cursor:none}
.otp-input:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.1)}
.otp-input.filled{border-color:#0f0e0c;background:#f8f7f4}
.otp-input.otp-err{border-color:#ef4444;background:#fff9f9}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
.otp-input.otp-err{animation:shake .35s cubic-bezier(.36,.07,.19,.97)}
@media(max-width:768px){
  body{cursor:auto}
  #cur-arrow{display:none}
  .fp-nav{padding:13px 16px!important}
  .fp-back-text{display:none}
  .otp-input{width:42px!important;height:50px!important;font-size:18px!important}
}
@media(max-width:480px){
  .fp-h1{font-size:clamp(24px,7vw,32px)!important;letter-spacing:-1px!important}
  .otp-input{width:38px!important;height:46px!important;font-size:16px!important;border-radius:10px!important}
}
`;

type Step = 1 | 2 | 3;
// 🔥 YAHAN CHANGE KIYA - direct Vercel backend URL
const BASE = 'https://timso-backend-n5w1.vercel.app' ;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [step, setStep]               = useState<Step>(1);
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords]     = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // cursor — desktop only
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return;
    const arrow = document.getElementById('cur-arrow') as HTMLElement;
    let mt: ReturnType<typeof setTimeout>;
    const onMove = (e: MouseEvent) => {
      arrow.style.left = (e.clientX - 2) + 'px';
      arrow.style.top  = (e.clientY - 2) + 'px';
      document.body.classList.add('cur-moving');
      clearTimeout(mt);
      mt = setTimeout(() => document.body.classList.remove('cur-moving'), 150);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        let n: Element | null = el; let dark = false;
        for (let i = 0; i < 6; i++) {
          if (!n || n === document.body) break;
          const rgb = window.getComputedStyle(n).backgroundColor.match(/\d+/g);
          if (rgb) {
            const [r, g, b, a] = rgb.map(Number);
            if ((a === undefined || a > 0.1) && r < 80 && g < 80 && b < 80) { dark = true; break; }
          }
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

  // Focus first OTP box when step 2 mounts
  useEffect(() => {
    if (step === 2) setTimeout(() => otpRefs.current[0]?.focus(), 200);
  }, [step]);

  // resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Send OTP ──────────────────────────────────────
  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(''); setSuccessMsg('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Enter a valid email address' }); return;
    }
    setErrors({}); setLoading(true);
    try {
      await axios.post(
        `${BASE}/api/auth/forgot-password`,
        { email },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      setStep(2);
      setResendTimer(60);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e?.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────
  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const code = otp.join('');
    if (code.length < 6) { setErrors({ otp: 'Enter the 6-digit code' }); return; }
    setErrors({}); setLoading(true);
    try {
      await axios.post(
        `${BASE}/api/auth/verify-otp`,
        { email, otp: code },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      setStep(3);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setServerError(e?.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Change password ───────────────────────────────
  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs: Record<string, string> = {};
    if (passwords.password.length < 8)
      errs.password = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(passwords.password))
      errs.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(passwords.password))
      errs.password = 'Must contain a number';
    if (passwords.password !== passwords.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      await axios.post(
        `${BASE}/api/auth/reset-password`,
        {
          email,
          otp:             otp.join(''),
          password:        passwords.password,
          confirmPassword: passwords.confirmPassword,
        },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      setSuccessMsg('Password changed successfully! Redirecting to login…');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      const res = e?.response?.data;
      if (res?.errors) setErrors(res.errors);
      setServerError(res?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const resendOtp = async () => {
    if (resendTimer > 0) return;
    setServerError(''); setLoading(true);
    try {
      await axios.post(
        `${BASE}/api/auth/forgot-password`,
        { email },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
    } catch {
      setServerError('Could not resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input ─────────────────────────────────────────────
  const handleOtp = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    // paste support
    if (value.length === 6) {
      const digits = value.replace(/\D/g,'').slice(0,6).split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
      return;
    }
    next[index] = value.slice(-1);
    setOtp(next);
    setErrors({});
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp]; next[index-1]=''; setOtp(next);
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && index > 0) otpRefs.current[index-1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index+1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
  };

  // password strength
  const pwStrength = (() => {
    const p = passwords.password; if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][pwStrength];

  const stepLabels = ['Email', 'Verify OTP', 'New Password'];

  // Spinner SVG
  const Spinner = () => (
    <svg className="w-4 h-4" style={{ animation: 'spin .8s linear infinite' }} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );

  return (
    <>
      <style>{G}</style>
      <svg id="cur-arrow" viewBox="0 0 24 24" fill="none">
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round"/>
      </svg>

      {/* NAV */}
      <nav className="fp-nav" style={{
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
          <span className="a-logo a-logop relative" style={{display:'inline-block',width:10,height:10,borderRadius:'50%',border:'2.5px solid #0f0e0c',marginLeft:4}}></span>
        </button>
        <button
          onClick={() => router.push('/login')}
          className="nav-link-auth"
          style={{fontSize:13,fontWeight:600,color:'#6b6860',padding:'8px 14px',borderRadius:100,border:'1px solid rgba(0,0,0,.1)',background:'transparent',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          <span className="fp-back-text">Back to login</span>
        </button>
      </nav>

      {/* MAIN */}
      <div style={{minHeight:'100svh',display:'flex',alignItems:'center',justifyContent:'center',background:'#faf9f7',padding:'clamp(80px,12vw,100px) clamp(16px,4vw,24px) clamp(32px,5vw,48px)'}}>
        <div style={{width:'100%',maxWidth:460}}>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10 a-rise" style={{ animationDelay: '.05s' }}>
            {stepLabels.map((label, i) => {
              const s = i + 1;
              const isActive   = step === s;
              const isComplete = step > s;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`step-dot w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black
                      ${isComplete ? 'bg-[#22c55e] text-white' : isActive ? 'bg-[#0f0e0c] text-white' : 'bg-black/[.06] text-[#9e9b94]'}`}>
                      {isComplete
                        ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                        : s}
                    </div>
                    <span className={`text-[10px] font-semibold tracking-wide whitespace-nowrap
                      ${isActive ? 'text-[#0f0e0c]' : isComplete ? 'text-[#22c55e]' : 'text-[#9e9b94]'}`}>
                      {label}
                    </span>
                  </div>
                  {s < 3 && <div className={`step-dot h-px w-10 mb-4 ${step > s ? 'bg-[#22c55e]' : 'bg-black/[.1]'}`}></div>}
                </div>
              );
            })}
          </div>

          {/* Success banner */}
          {successMsg && (
            <div className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 a-slide"
              style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <p className="text-[13px] text-green-700 font-medium">{successMsg}</p>
            </div>
          )}

          {/* Error banner */}
          {serverError && (
            <div className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 a-slide"
              style={{ background: '#fff1f0', border: '1px solid #fca5a5' }}>
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" fill="none" viewBox="0 0 12 12"><path d="M6 3v4M6 8.5v.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <p className="text-[13px] text-red-700 font-medium">{serverError}</p>
            </div>
          )}

          {/* ── STEP 1 — Email ── */}
          {step === 1 && (
            <div className="a-rise" style={{ animationDelay: '.1s' }}>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(249,115,22,.1)' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h1 className="fp-h1 font-syne font-black tracking-[-2px] leading-[1.1] text-[#0f0e0c] mb-2" style={{fontSize:"clamp(26px,5vw,34px)"}}>Forgot password?</h1>
                <p className="text-[15px] text-[#6b6860] leading-relaxed">
                  Enter your email and we&apos;ll send a 6-digit OTP to reset your password.
                </p>
              </div>

              <form onSubmit={sendOtp} noValidate className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f0e0c] mb-1.5">Email address</label>
                  <input
                    type="email" autoComplete="email" value={email}
                    onChange={e => { setEmail(e.target.value); setErrors({}); }}
                    placeholder="you@company.com"
                    className={`input-field ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <p className="mt-1 text-[12px] text-red-500">{errors.email}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-submit mt-2">
                  <span>{loading && <Spinner/>}{loading ? 'Sending OTP…' : 'Send OTP'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2 — OTP ── */}
          {step === 2 && (
            <div className="a-rise" style={{ animationDelay: '.1s' }}>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(249,115,22,.1)' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <h1 className="fp-h1 font-syne font-black tracking-[-2px] leading-[1.1] text-[#0f0e0c] mb-2" style={{fontSize:"clamp(26px,5vw,34px)"}}>Check your email</h1>
                <p className="text-[15px] text-[#6b6860] leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-[#0f0e0c]">{email}</span>.
                </p>
              </div>

              <form onSubmit={verifyOtp} noValidate className="flex flex-col gap-6">
                <div>
                  <div className="flex gap-2.5 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={6}
                        value={digit}
                        onChange={e => handleOtp(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        onFocus={e => e.target.select()}
                        className={`otp-input${digit ? ' filled' : ''}`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                  {errors.otp && <p className="mt-2 text-[12px] text-red-500 text-center">{errors.otp}</p>}
                </div>

                <button type="submit" disabled={loading || otp.join('').length < 6} className="btn-submit">
                  <span>{loading && <Spinner/>}{loading ? 'Verifying…' : 'Verify OTP'}</span>
                </button>
              </form>

              {/* Resend + change email */}
              <div className="mt-5 text-center">
                <span className="text-[13px] text-[#9e9b94]">Didn&apos;t receive it? </span>
                {resendTimer > 0 ? (
                  <span className="text-[13px] font-semibold text-[#9e9b94]">Resend in {resendTimer}s</span>
                ) : (
                  <button onClick={resendOtp} disabled={loading}
                    className="text-[13px] font-semibold text-[#0f0e0c] cursor-none border-none bg-transparent hover:underline disabled:opacity-50">
                    Resend OTP
                  </button>
                )}
              </div>
              <button onClick={() => { setStep(1); setOtp(['','','','','','']); setServerError(''); }}
                className="mt-3 w-full text-[13px] text-[#9e9b94] cursor-none border-none bg-transparent hover:text-[#0f0e0c] transition-colors">
                ← Change email
              </button>
            </div>
          )}

          {/* ── STEP 3 — New password ── */}
          {step === 3 && (
            <div className="a-rise" style={{ animationDelay: '.1s' }}>
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(249,115,22,.1)' }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2">
                    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                </div>
                <h1 className="fp-h1 font-syne font-black tracking-[-2px] leading-[1.1] text-[#0f0e0c] mb-2" style={{fontSize:"clamp(26px,5vw,34px)"}}>Set new password</h1>
                <p className="text-[15px] text-[#6b6860] leading-relaxed">OTP verified ✓ — choose a strong new password.</p>
              </div>

              <form onSubmit={changePassword} noValidate className="flex flex-col gap-4">
                {/* New password */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f0e0c] mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'} autoComplete="new-password"
                      value={passwords.password}
                      onChange={e => { setPasswords(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Min 8 characters"
                      className={`input-field pr-12 ${errors.password ? 'error' : ''}`}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e9b94] cursor-none">
                      {showPass
                        ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                  {passwords.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i=>(
                          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= pwStrength ? strengthColor : 'rgba(0,0,0,.08)' }}></div>
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-[12px] text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#0f0e0c] mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                      value={passwords.confirmPassword}
                      onChange={e => { setPasswords(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                      placeholder="Repeat new password"
                      className={`input-field pr-12 ${errors.confirmPassword ? 'error' : ''}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e9b94] cursor-none">
                      {showConfirm
                        ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-[12px] text-red-500">{errors.confirmPassword}</p>}
                </div>

                {/* Requirements */}
                <div className="bg-[#f8f7f4] rounded-xl p-4 flex flex-col gap-2">
                  {([
                    ['At least 8 characters', passwords.password.length >= 8],
                    ['One uppercase letter',  /[A-Z]/.test(passwords.password)],
                    ['One number',           /[0-9]/.test(passwords.password)],
                  ] as [string, boolean][]).map(([label, met]) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${met ? 'bg-[#22c55e]' : 'bg-black/[.1]'}`}>
                        {met && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                      </div>
                      <span className={`text-[12px] font-medium ${met ? 'text-[#0f0e0c]' : 'text-[#9e9b94]'}`}>{label}</span>
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={loading} className="btn-submit mt-1">
                  <span>{loading && <Spinner/>}{loading ? 'Changing password…' : 'Change password'}</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </>
  );
}