'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;cursor:none;font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c;overflow-x:hidden}
.font-syne{font-family:'Syne',sans-serif}

#cur{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .18s,height .18s,opacity .18s}
body.cm #cur{width:22px!important;height:22px!important}
body.ca #cur{width:10px!important;height:10px!important;opacity:.5}
body.cd #cur path{fill:#fff!important;stroke:#fff!important}

@keyframes riseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes logoR{0%,100%{border-color:#0f0e0c}50%{border-color:#f97316}}
@keyframes logoRP{0%,100%{opacity:0;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes checkIn{0%{transform:scale(0) rotate(-10deg)}65%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1) rotate(0deg)}}

.a-rise{opacity:0;animation:riseIn .65s cubic-bezier(.16,1,.3,1) forwards}
.a-logo{animation:logoR 3s ease-in-out infinite}
.a-logop::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid #f97316;opacity:0;animation:logoRP 3s ease-in-out infinite}
.shake{animation:shake .4s cubic-bezier(.36,.07,.19,.97) both}
.pop{animation:pop .25s ease}

/* OTP inputs */
.otp-input{
  width:52px;height:62px;border:1.5px solid rgba(0,0,0,.12);border-radius:14px;
  font-size:24px;font-weight:900;font-family:'Syne',sans-serif;
  text-align:center;color:#0f0e0c;background:#fff;outline:none;
  transition:border-color .2s,box-shadow .2s,transform .15s;
  cursor:none;caret-color:transparent;
}
.otp-input:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.12);transform:translateY(-2px)}
.otp-input.filled{border-color:#0f0e0c;background:#faf9f7}
.otp-input.err{border-color:#ef4444;background:#fff9f9;animation:shake .4s cubic-bezier(.36,.07,.19,.97) both}

.btn-sub{width:100%;background:#0f0e0c;color:#fff;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:none;position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-sub::before{content:'';position:absolute;inset:0;background:#f97316;transform:translateX(-101%);transition:transform .4s cubic-bezier(.16,1,.3,1);border-radius:14px}
.btn-sub:hover::before{transform:translateX(0)}
.btn-sub:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,.35)}
.btn-sub:disabled{opacity:.5;pointer-events:none}
.btn-sub>span{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
.spin-s{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite}

.success-check{animation:checkIn .5s cubic-bezier(.16,1,.3,1) forwards}

@media(max-width:768px){body{cursor:auto}#cur{display:none}.vf-nav{padding:13px 16px!important}}
@media(max-width:480px){.otp-input{width:44px;height:56px;font-size:20px}.otp-wrap{gap:8px!important}}
`;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasError, setHasError] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cursor
  useEffect(() => {
    if (window.innerWidth <= 768) return;
    const cur = document.getElementById('cur') as HTMLElement;
    if (!cur) return;
    let mt: ReturnType<typeof setTimeout>;
    const mv = (e: MouseEvent) => {
      cur.style.left = (e.clientX - 2) + 'px';
      cur.style.top = (e.clientY - 2) + 'px';
      document.body.classList.add('cm'); clearTimeout(mt);
      mt = setTimeout(() => document.body.classList.remove('cm'), 140);
      let n: Element | null = document.elementFromPoint(e.clientX, e.clientY); let dark = false;
      for (let i = 0; i < 6; i++) {
        if (!n || n === document.body) break;
        const rgb = window.getComputedStyle(n).backgroundColor.match(/\d+/g);
        if (rgb) { const [r, g, b, a] = rgb.map(Number); if ((a === undefined || a > 0.1) && r < 80 && g < 80 && b < 80) { dark = true; break; } }
        n = n.parentElement;
      }
      document.body.classList.toggle('cd', dark);
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mousedown', () => document.body.classList.add('ca'));
    document.addEventListener('mouseup', () => document.body.classList.remove('ca'));
    return () => document.removeEventListener('mousemove', mv);
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    setHasError(false);

    // Auto move to next
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all filled
    if (digit && index === 5) {
      const fullOtp = [...newOtp.slice(0, 5), digit].join('');
      if (fullOtp.length === 6) {
        setTimeout(() => submitOtp(fullOtp), 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      setTimeout(() => submitOtp(pasted), 100);
    }
  };

  const submitOtp = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      setHasError(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(`${BASE}/api/auth/verify-email`, {
        email,
        otp: code,
      }, { withCredentials: true });

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1800);

    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax?.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(msg);
      setHasError(true);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    try {
      await axios.post(`${BASE}/api/auth/resend-otp`, { email }, { withCredentials: true });
      setResendCooldown(60);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || 'Failed to resend OTP');
    }
    setResendLoading(false);
  };

  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  return (
    <>
      <style>{G}</style>

      <svg id="cur" viewBox="0 0 24 24" fill="none" style={{ position: 'fixed', pointerEvents: 'none', zIndex: 99999, width: 14, height: 14, top: 0, left: 0 }}>
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round" />
      </svg>

      {/* Nav */}
      <nav className="vf-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', background: 'rgba(250,249,247,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <button onClick={() => router.push('/')} className="font-syne"
          style={{ fontWeight: 900, fontSize: 'clamp(18px,2.5vw,22px)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#0f0e0c', padding: 0, fontFamily: 'inherit' }}>
          timso
          <span className="a-logo a-logop" style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', border: '2.5px solid #0f0e0c', marginLeft: 2, display: 'inline-block' }} />
        </button>
      </nav>

      {/* Main */}
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', padding: 'clamp(80px,12vw,100px) clamp(16px,4vw,24px) clamp(32px,5vw,48px)' }}>
        <div style={{ width: '100%', maxWidth: 'min(420px, 100%)' }}>

          {success ? (
            /* ── Success State ── */
            <div className="a-rise" style={{ textAlign: 'center' }}>
              <div className="success-check" style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="font-syne" style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-1.5px', margin: '0 0 8px', color: '#0f0e0c' }}>Email verified!</h1>
              <p style={{ fontSize: 15, color: '#6b6860', margin: '0 0 4px' }}>Taking you to dashboard…</p>
              <div style={{ width: 20, height: 20, border: '2px solid rgba(0,0,0,.1)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin .65s linear infinite', margin: '16px auto 0' }} />
            </div>
          ) : (
            /* ── OTP Form ── */
            <>
              <div className="a-rise" style={{ marginBottom: 'clamp(24px,4vw,32px)' }}>
                {/* Icon */}
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(249,115,22,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h1 className="font-syne" style={{ fontWeight: 900, fontSize: 'clamp(26px,6vw,34px)', letterSpacing: '-2px', lineHeight: 1.1, margin: '0 0 8px' }}>
                  Check your email
                </h1>
                <p style={{ fontSize: 'clamp(13px,2vw,15px)', color: '#6b6860', margin: 0, lineHeight: 1.6 }}>
                  We sent a 6-digit code to{' '}
                  <span style={{ fontWeight: 700, color: '#0f0e0c' }}>{maskedEmail || 'your email'}</span>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="shake" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, background: '#fff1f0', border: '1px solid #fca5a5', borderRadius: 14, padding: '12px 16px' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 12 12"><path d="M6 3v4M6 8.5v.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <p style={{ fontSize: 13, color: '#b91c1c', fontWeight: 500, margin: 0 }}>{error}</p>
                </div>
              )}

              {/* OTP Inputs */}
              <div className="a-rise otp-wrap" style={{ animationDelay: '.08s', display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }} onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`otp-input${digit ? ' filled' : ''}${hasError ? ' err' : ''}`}
                  />
                ))}
              </div>

              {/* Submit */}
              <div className="a-rise" style={{ animationDelay: '.12s' }}>
                <button
                  onClick={() => submitOtp()}
                  disabled={loading || otp.join('').length !== 6}
                  className="btn-sub"
                >
                  <span>
                    {loading
                      ? <><span className="spin-s" />Verifying…</>
                      : 'Verify email →'}
                  </span>
                </button>
              </div>

              {/* Resend */}
              <p className="a-rise" style={{ animationDelay: '.15s', marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9e9b94' }}>
                Didn&apos;t receive the code?{' '}
                <button
                  onClick={resendOtp}
                  disabled={resendCooldown > 0 || resendLoading}
                  style={{ fontSize: 13, fontWeight: 700, color: resendCooldown > 0 ? '#c8c5be' : '#0f0e0c', background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: resendCooldown > 0 ? 'none' : 'underline' }}>
                  {resendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </button>
              </p>

              {/* Wrong email */}
              <p className="a-rise" style={{ animationDelay: '.18s', marginTop: 8, textAlign: 'center', fontSize: 12, color: '#c8c5be' }}>
                Wrong email?{' '}
                <button
                  onClick={() => router.push('/register')}
                  style={{ fontSize: 12, fontWeight: 600, color: '#9e9b94', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline' }}>
                  Go back
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',background:'#faf9f7'}}>
        <div style={{width:20,height:20,border:'2px solid rgba(0,0,0,.1)',borderTopColor:'#f97316',borderRadius:'50%',animation:'spin .65s linear infinite'}}/>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}