'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ─── data ──────────────────────────────────────── */
const TEAM = [
  { bg:'#f97316', init:'AK', name:'Alex Kowalski',  role:'Co-founder & CEO',         bio:'Former eng lead at Dropbox. Built Timso after living the hybrid chaos firsthand.' },
  { bg:'#a89fff', init:'NV', name:'Nina Vasquez',   role:'Co-founder & CPO',         bio:'Ex-product at Notion & Slack. Believes the best tools feel invisible when used.' },
  { bg:'#34d399', init:'DL', name:'Denis Loginov',  role:'Head of Engineering',      bio:'10+ years building infrastructure at scale. Joined from Siemens Digital.' },
  { bg:'#fbbf24', init:'AS', name:'Anna Smirnova',  role:'Head of Design',           bio:'Design systems lead at Figma before joining. Makes complex things feel simple.' },
  { bg:'#fb7185', init:'MR', name:'Mikhail Repin',  role:'Head of Growth',           bio:'Scaled two B2B SaaS products from zero to 50K users. Data-driven to the core.' },
  { bg:'#60a5fa', init:'YO', name:'Yuna Oh',        role:'Customer Success',         bio:'Reduced churn 40% in her first quarter. The team\'s most vocal user advocate.' },
];

const VALUES = [
  { icon:'🎯', t:'Async-first',      b:'We build for the reality that your team isn\'t online at the same time — and that\'s a feature, not a bug.' },
  { icon:'🔍', t:'Radical honesty',  b:'Open roadmap, honest pricing, no dark patterns. What you see is exactly what you get, always.' },
  { icon:'🤝', t:'Built together',   b:'Every major feature ships because a real customer asked for it. Our users are co-builders.' },
  { icon:'⚡', t:'Speed always',     b:'Fast to load, fast to set up, fast to support. Respecting your time is non-negotiable.' },
  { icon:'🌍', t:'Global by default',b:'Built for distributed teams across time zones from day one. Not bolted on — designed in.' },
  { icon:'🔒', t:'Privacy by design',b:'SOC 2 Type II, GDPR compliant. Your team data belongs to you. Zero data selling. Ever.' },
];

const MILESTONES = [
  { year:'2021', t:'The spark',    b:'Alex & Nina quit their jobs after watching hybrid teams struggle with the same chaos for years.' },
  { year:'2022', t:'First users',  b:'A scrappy Slack bot. 12 beta teams. Within 6 months, 800+ teams were begging for more.' },
  { year:'2023', t:'Timso 1.0',    b:'Full platform launch. Day swaps, HRIS integrations, custom statuses. 2,400+ teams in 90 days.' },
  { year:'2024', t:'Series A',     b:'$12M raised. Team grew from 6 to 28 people. Enterprise SSO, BambooHR native sync shipped.' },
  { year:'2025', t:'V2.0 ships',   b:'AI scheduling, 14+ integrations, real-time occupancy analytics. 8,000+ teams globally.' },
];

const NUMBERS = [
  { n:'8,000+', l:'Teams worldwide',   icon:'🌍' },
  { n:'98%',    l:'Satisfaction rate', icon:'⭐' },
  { n:'60+',    l:'Countries',         icon:'🗺' },
  { n:'$12M',   l:'Series A raised',   icon:'🚀' },
];

const PRESS = [
  { src:'TechCrunch',  q:'The Notion of hybrid work management.' },
  { src:'Forbes',      q:'One of 25 startups redefining the future workplace.' },
  { src:'Product Hunt',q:'#1 Product of the Day — December 2023.' },
  { src:'The Verge',   q:'Finally, a team calendar that doesn\'t suck.' },
];

/* ──── CSS — exact same system as homepage ──────── */
const G = `
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;cursor:none;font-family:'Outfit',sans-serif;background:#fff;color:#0f0e0c;overflow-x:hidden;width:100%}
.font-syne{font-family:'Syne',sans-serif}

/* ── Cursor (identical to homepage) ── */
#cur-arrow{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .2s,height .2s,opacity .2s}
body.cur-moving #cur-arrow{width:22px!important;height:22px!important}
body.cur-hover  #cur-arrow{width:18px!important;height:18px!important;opacity:.7}
body.cur-active #cur-arrow{width:10px!important;height:10px!important;opacity:.5}
body.cur-on-dark #cur-arrow path{fill:#fff!important;stroke:#fff!important}

/* ── Keyframes ── */
@keyframes riseIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes wordSlide{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes logoR{0%,100%{border-color:#0f0e0c}50%{border-color:#f97316}}
@keyframes logoRP{0%,100%{opacity:0;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes dotsDrift{0%,100%{background-position:0 0}50%{background-position:8px 8px}}
@keyframes linesweep{0%,100%{opacity:.08;transform:scaleX(1)}50%{opacity:.2;transform:scaleX(1.2)}}
@keyframes sfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes countIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes stripeScroll{from{background-position:0 0}to{background-position:40px 0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes lineExpand{from{width:0}to{width:100%}}
@keyframes ctaP{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.5}50%{transform:translate(-50%,-50%) scale(1.1);opacity:1}}

/* ── Animation helpers ── */
.a-rise{opacity:0;animation:riseIn .8s cubic-bezier(.16,1,.3,1) forwards}
.a-word{opacity:0;display:inline-block;animation:wordSlide .9s cubic-bezier(.16,1,.3,1) forwards}
.a-logo{animation:logoR 3s ease-in-out infinite}
.a-logop::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid #f97316;opacity:0;animation:logoRP 3s ease-in-out infinite}
.a-dots{animation:dotsDrift 20s ease-in-out infinite}
.a-line{animation:linesweep 6s ease-in-out infinite}
.a-l1{animation-delay:0s}.a-l2{animation-delay:2s}
.a-float{animation:sfloat 7s ease-in-out infinite}
.a-float2{animation:sfloat 7s ease-in-out 3s infinite}
.cnt-in{animation:countIn .65s cubic-bezier(.16,1,.3,1) both}

/* ── Scroll reveal (identical to homepage) ── */
.rv{opacity:0;transform:translateY(40px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
.rv-l{opacity:0;transform:translateX(-40px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
.rv-r{opacity:0;transform:translateX(40px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
.rv.in{opacity:1;transform:translateY(0)}.rv-l.in{opacity:1;transform:translateX(0)}.rv-r.in{opacity:1;transform:translateX(0)}
.rv.out{opacity:0;transform:translateY(24px);transition:opacity .5s,transform .5s}
.rv-l.out{opacity:0;transform:translateX(-24px);transition:opacity .5s,transform .5s}
.rv-r.out{opacity:0;transform:translateX(24px);transition:opacity .5s,transform .5s}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}.d5{transition-delay:.5s}.d6{transition-delay:.6s}

/* ── Buttons ── */
.btn-main{position:relative;overflow:hidden;transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s}
.btn-main::before{content:'';position:absolute;inset:0;background:#f97316;transform:translateX(-101%);transition:transform .45s cubic-bezier(.16,1,.3,1);border-radius:100px}
.btn-main:hover::before{transform:translateX(0)}
.btn-main:hover{color:#0f0e0c;transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.15)}
.btn-nav{position:relative;overflow:hidden}
.btn-nav::before{content:'';position:absolute;inset:0;background:#f97316;clip-path:circle(0% at 50% 50%);transition:clip-path .5s cubic-bezier(.16,1,.3,1)}
.btn-nav:hover::before{clip-path:circle(150% at 50% 50%)}
.btn-nav:hover{color:#0f0e0c}
.btn-outline{transition:border-color .3s,background .3s,transform .3s}
.btn-outline:hover{border-color:#0f0e0c;background:#0f0e0c;color:#fff;transform:translateY(-3px)}
.btn-orange{transition:transform .3s,box-shadow .3s}
.btn-orange:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(249,115,22,.4)}
.nav-link:hover{color:#0f0e0c}
.nav-login:hover{color:#0f0e0c!important;background:rgba(0,0,0,.06)}
.nav-login{transition:color .3s,background .3s}
.ft-a{color:rgba(255,255,255,.4);text-decoration:none}
.ft-a:hover{color:#f97316}
.soc-b:hover{background:#f97316;border-color:#f97316;transform:translateY(-4px);color:#0f0e0c}
.soc-b{transition:background .3s,transform .3s,border-color .3s}

/* ── NAV (identical to homepage) ── */
#t-nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:20px 48px;transition:background .4s,box-shadow .4s,padding .4s}
.nav-desktop-pill{display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.04);padding:6px 6px 6px 18px;border-radius:100px;border:1px solid rgba(0,0,0,.07)}
.sticky-nav{background:rgba(255,255,255,.95)!important;backdrop-filter:blur(28px)!important;box-shadow:0 1px 0 rgba(0,0,0,.07)!important}

/* ── Hamburger ── */
.ham-btn{display:none;width:42px;height:42px;flex-shrink:0;flex-direction:column;gap:5px;align-items:center;justify-content:center;background:rgba(255,255,255,.9);border:1.5px solid rgba(0,0,0,.1);border-radius:10px;cursor:pointer;position:relative;z-index:60}
.ham-line{display:block;width:20px;height:2px;background:#0f0e0c;border-radius:2px;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .3s}
.ham-open .ham-line:nth-child(1){transform:translateY(7px) rotate(45deg)}
.ham-open .ham-line:nth-child(2){opacity:0;transform:scaleX(0)}
.ham-open .ham-line:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

/* ── Mobile menu — with X close button ── */
.mob-menu{display:none;position:fixed;top:0;left:0;right:0;background:#fff;z-index:55;flex-direction:column;padding:0;box-shadow:0 8px 40px rgba(0,0,0,.12);border-bottom:1px solid rgba(0,0,0,.07)}
.mob-menu.open{display:flex}

/* ── About-specific cards and interactions ── */
.tm-card{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s,border-color .3s}
.tm-card:hover{transform:translateY(-8px);box-shadow:0 28px 70px rgba(0,0,0,.1);border-color:rgba(0,0,0,.12)}
.tm-card:hover .tm-avatar{transform:scale(1.06)}
.tm-avatar{transition:transform .4s cubic-bezier(.16,1,.3,1)}
.tm-card:hover .tm-role{color:#f97316}
.tm-role{transition:color .3s}

.val-card{transition:border-color .35s,background .35s,transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s}
.val-card:hover{border-color:#f97316;background:rgba(249,115,22,.03);transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,.07)}
.val-card:hover .val-icon{background:#f97316;transform:scale(1.1) rotate(-5deg)}
.val-icon{transition:background .3s,transform .4s cubic-bezier(.16,1,.3,1)}

.ml-row{border-bottom:1px solid rgba(0,0,0,.06);transition:background .25s,padding-left .3s cubic-bezier(.16,1,.3,1)}
.ml-row:hover{background:rgba(249,115,22,.03);padding-left:14px!important}
.ml-row:hover .ml-year{color:#f97316}
.ml-year{transition:color .3s}
.ml-row:hover .ml-dot-inner{background:#f97316;transform:scale(1.3)}
.ml-dot-inner{transition:background .3s,transform .3s}

.pr-card{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s,border-color .3s}
.pr-card:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,.09);border-color:#f97316}

.stat-card{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s}
.stat-card:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,.09)}
.stat-card:hover .stat-num{color:#f97316}
.stat-num{transition:color .35s}

.hero-badge-float{transition:transform .3s,box-shadow .3s}
.hero-badge-float:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.14)}

.a-ctap::before{content:'';position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.12),transparent 65%);top:50%;left:50%;transform:translate(-50%,-50%);animation:ctaP 5s ease-in-out infinite;pointer-events:none}

/* ── Striped accent ── */
.stripe-bg{background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(249,115,22,.06) 6px,rgba(249,115,22,.06) 12px);animation:stripeScroll 2s linear infinite}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  body{cursor:auto}
  #cur-arrow{display:none}
  #t-nav{padding:14px 16px}
  .nav-desktop-pill{display:none}
  .ham-btn{display:flex}
  .about-hero-grid{grid-template-columns:1fr!important}
  .about-hero-right{display:none!important}
  .team-grid{grid-template-columns:1fr 1fr!important}
  .values-grid{grid-template-columns:1fr 1fr!important}
  .stats-grid{grid-template-columns:1fr 1fr!important}
  .story-grid{grid-template-columns:1fr!important;gap:40px!important}
  .footer-grid{grid-template-columns:1fr 1fr!important;gap:28px!important}
  .footer-brand{grid-column:1/-1!important}
}
@media(max-width:580px){
  #t-nav{padding:12px 14px}
  .team-grid{grid-template-columns:1fr!important}
  .values-grid{grid-template-columns:1fr!important}
  .stats-grid{grid-template-columns:1fr 1fr!important}
  .hero-cta-row{flex-direction:column!important;align-items:stretch!important}
  .hero-cta-row button,.hero-cta-row a{width:100%!important;text-align:center!important}
  .footer-grid{grid-template-columns:1fr!important}
  .footer-brand{grid-column:1!important}
  .cta-btns{flex-direction:column!important;align-items:stretch!important}
  .cta-btns button{width:100%!important}
}
@media(min-width:901px) and (max-width:1200px){
  #t-nav{padding:16px 28px}
  .team-grid{grid-template-columns:repeat(3,1fr)!important}
  .values-grid{grid-template-columns:repeat(3,1fr)!important}
}
`;

export default function About() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsIn, setStatsIn] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 900;

    /* ── Custom cursor — exact copy from homepage ── */
    if (!isMobile) {
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
            if (rgb) { const [r,g,b,a] = rgb.map(Number); if ((a===undefined||a>0.1)&&r<80&&g<80&&b<80){dark=true;break} }
            n = n.parentElement;
          }
          document.body.classList.toggle('cur-on-dark', dark);
        }
      };
      document.addEventListener('mousemove', onMove);
      document.querySelectorAll('a,button').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cur-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cur-hover'));
      });
      document.addEventListener('mousedown', () => document.body.classList.add('cur-active'));
      document.addEventListener('mouseup',   () => document.body.classList.remove('cur-active'));
    }

    /* Sticky nav */
    const nav = document.getElementById('t-nav')!;
    const onScroll = () => nav.classList.toggle('sticky-nav', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Scroll reveal */
    const rEls = document.querySelectorAll('.rv,.rv-l,.rv-r');
    const rObs = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('out'); requestAnimationFrame(() => e.target.classList.add('in')); }
      else { e.target.classList.remove('in'); e.target.classList.add('out'); }
    }), { threshold: .08 });
    rEls.forEach(el => rObs.observe(el));

    /* Stats trigger */
    const sObs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setStatsIn(true); }, { threshold: .3 });
    if (statsRef.current) sObs.observe(statsRef.current);

    /* Hero particles */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.2;z-index:0';
    document.getElementById('ab-hero')?.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W=0,H=0;
    const resize = () => { W=canvas.width=canvas.offsetWidth; H=canvas.height=canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);
    const pts = Array.from({length:40},()=>({x:Math.random()*1400,y:Math.random()*700,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*1.6+.4,a:Math.random()*.5+.15}));
    let lt=0;
    const draw=(t:number)=>{requestAnimationFrame(draw);if(t-lt<33)return;lt=t;ctx?.clearRect(0,0,W,H);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;if(ctx){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(249,115,22,${p.a})`;ctx.fill()}});};
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      rObs.disconnect(); sObs.disconnect();
      canvas.remove();
    };
  }, []);

  const SectionLabel = ({ text, light=false }:{text:string;light?:boolean}) => (
    <div className="inline-flex items-center gap-2 font-bold tracking-[.14em] uppercase mb-4"
      style={{fontSize:11,color:light?'rgba(255,255,255,.45)':'#6b6860'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:'#f97316',display:'inline-block'}}></span>
      {text}
    </div>
  );

  return (
    <>
      <style>{G}</style>

      {/* ── Cursor — identical arrow SVG as homepage ── */}
      <svg id="cur-arrow" viewBox="0 0 24 24" fill="none">
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round"/>
      </svg>

      {/* ══════════════════════════════════════════════ */}
      {/* ── MOBILE MENU — compact dropdown panel ── */}
      <div className={`mob-menu ${menuOpen ? 'open' : ''}`}>
        {/* Header row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid rgba(0,0,0,.06)'}}>
          <span className="font-syne font-black text-[#0f0e0c]" style={{fontSize:20}}>timso</span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            type="button"
            style={{width:36,height:36,borderRadius:8,border:'1.5px solid rgba(0,0,0,.1)',background:'rgba(0,0,0,.04)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="#0f0e0c" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav style={{display:'flex',flexDirection:'column',gap:0,padding:'8px 8px'}}>
          <button
              onClick={() => { setMenuOpen(false); router.push('/about'); }}
              className="font-syne font-black text-left bg-transparent border-none cursor-pointer rounded-xl"
              style={{fontSize:16,padding:'12px 14px',fontFamily:'inherit',color:'#f97316',transition:'background .2s'}}>
              About
            </button>
        </nav>

        {/* Login + Start Free — same row */}
        <div style={{display:'flex',gap:8,padding:'4px 16px 20px'}}>
          <button
            onClick={() => { setMenuOpen(false); router.push('/login'); }}
            className="font-semibold text-[#0f0e0c] bg-transparent cursor-pointer rounded-full"
            style={{fontSize:14,padding:'11px 20px',border:'1.5px solid rgba(0,0,0,.15)',fontFamily:'inherit',flex:1}}>
            Login
          </button>
          <button
            onClick={() => { setMenuOpen(false); router.push('/register'); }}
            className="bg-[#0f0e0c] text-white rounded-full font-bold border-none font-outfit cursor-pointer"
            style={{fontSize:14,padding:'11px 20px',flex:1}}>
            Start Free
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── NAVBAR — identical to homepage ───────────── */}
      {/* ══════════════════════════════════════════════ */}
      <nav id="t-nav">
        <button
          onClick={() => router.push('/')}
          className="font-syne font-black text-[#0f0e0c] flex items-center flex-shrink-0 bg-transparent border-none cursor-pointer"
          style={{fontSize:'clamp(18px,2.5vw,22px)',gap:5,padding:0,fontFamily:'inherit'}}>
          timso
          <span className="relative w-2.5 h-2.5 rounded-full border-[2.5px] border-[#0f0e0c] a-logo a-logop"
            style={{display:'inline-block',flexShrink:0}}></span>
        </button>

        <div className="nav-desktop-pill">
          <button
              onClick={() => router.push('/about')}
              className="nav-link font-medium bg-transparent border-none cursor-pointer"
              style={{fontSize:13,padding:'4px 12px',transition:'color .3s',
                color:'#0f0e0c',fontWeight:600,fontFamily:'inherit'}}>
              About
            </button>
          <button
            onClick={() => router.push('/login')}
            className="nav-login font-semibold text-[#6b6860] rounded-full bg-transparent border-none cursor-pointer"
            style={{fontSize:13,padding:'8px 16px',transition:'color .3s,background .3s',fontFamily:'inherit'}}>
            Login
          </button>
          <button className="btn-nav relative overflow-hidden bg-[#0f0e0c] text-white font-semibold rounded-full border-none font-outfit cursor-pointer"
            style={{fontSize:13,padding:'10px 20px'}} onClick={() => router.push('/register')}>
            <span className="relative z-10">Start Free</span>
          </button>
        </div>

        <button className={`ham-btn${menuOpen ? ' ham-open' : ''}`}
          onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu" type="button">
          <span className="ham-line"></span>
          <span className="ham-line"></span>
          <span className="ham-line"></span>
        </button>
      </nav>

      {/* ══════════════════════════════════════════════ */}
      {/* ── HERO — light bg with dot grid, like home ── */}
      {/* ══════════════════════════════════════════════ */}
      <section id="ab-hero" className="relative overflow-hidden flex flex-col items-center justify-center text-center"
        style={{minHeight:'90svh',background:'linear-gradient(160deg,#fff 0%,#fdf9f5 50%,#fff8f2 100%)',padding:'clamp(110px,14vw,160px) clamp(16px,4vw,40px) clamp(60px,7vw,100px)'}}>

        {/* Same decorators as homepage hero */}
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 55% 50% at 15% 25%,rgba(249,115,22,.1),transparent),radial-gradient(ellipse 45% 55% at 85% 75%,rgba(92,59,255,.06),transparent)'}}></div>
        <div className="absolute inset-0 pointer-events-none a-dots" style={{backgroundImage:'radial-gradient(circle,rgba(0,0,0,.055) 1px,transparent 1px)',backgroundSize:'32px 32px',maskImage:'radial-gradient(ellipse 70% 70% at 50% 50%,black,transparent)'}}></div>
        <div className="absolute h-px pointer-events-none a-line a-l1" style={{width:400,top:'25%',left:-100,opacity:.15,background:'linear-gradient(90deg,transparent,#f97316,transparent)'}}></div>
        <div className="absolute h-px pointer-events-none a-line a-l2" style={{width:280,top:'65%',right:-60,opacity:.15,background:'linear-gradient(90deg,transparent,#f97316,transparent)'}}></div>

        {/* Floating side badges — like homepage */}
        <div className="a-float absolute hidden sm:flex items-center gap-2.5 bg-white rounded-2xl border border-black/[.07] hero-badge-float"
          style={{left:'clamp(16px,3vw,48px)',top:'38%',padding:'12px 18px',boxShadow:'0 12px 40px rgba(0,0,0,.08)',zIndex:2}}>
          <div style={{width:36,height:36,borderRadius:12,background:'rgba(249,115,22,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏢</div>
          <div><div className="font-bold text-[#0f0e0c]" style={{fontSize:12}}>Founded 2021</div><div className="text-[#6b6860]" style={{fontSize:10,marginTop:2}}>San Francisco</div></div>
        </div>
        <div className="a-float2 absolute hidden sm:flex items-center gap-2.5 bg-white rounded-2xl border border-black/[.07] hero-badge-float"
          style={{right:'clamp(16px,3vw,48px)',top:'55%',padding:'12px 18px',boxShadow:'0 12px 40px rgba(0,0,0,.08)',zIndex:2}}>
          <div style={{width:36,height:36,borderRadius:12,background:'rgba(92,59,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⭐</div>
          <div><div className="font-bold text-[#0f0e0c]" style={{fontSize:12}}>4.9 / 5 stars</div><div className="text-[#6b6860]" style={{fontSize:10,marginTop:2}}>from 2,400+ reviews</div></div>
        </div>

        {/* Badge pill */}
        <div className="a-rise inline-flex items-center gap-2 bg-white border border-black/[.09] rounded-full"
          style={{padding:'7px 18px 7px 9px',marginBottom:'clamp(20px,3vw,32px)',animationDelay:'.1s',boxShadow:'0 2px 16px rgba(0,0,0,.06)'}}>
          <div className="w-7 h-7 rounded-full bg-[#f97316] flex items-center justify-center" style={{fontSize:13}}>👋</div>
          <span className="font-semibold tracking-[.08em] uppercase text-[#6b6860]" style={{fontSize:11}}>28 people · 1 mission</span>
        </div>

        {/* Headline */}
        <h1 className="font-syne font-black leading-[.92] text-[#0f0e0c] a-rise"
          style={{fontSize:'clamp(44px,9vw,112px)',letterSpacing:'-0.035em',maxWidth:1000,animationDelay:'.25s',margin:0}}>
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.3s'}}>We&apos;re building</span></span><br/>
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.44s',color:'#f97316',WebkitTextFillColor:'#f97316',textShadow:'0 0 60px rgba(249,115,22,.22)'}}>the future</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.58s',background:'linear-gradient(135deg,#0f0e0c 0%,#0f0e0c 45%,#5c3bff 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>of work.</span></span>
        </h1>

        <p className="a-rise leading-[1.8] text-[#6b6860] font-outfit"
          style={{fontSize:'clamp(14px,2.2vw,18px)',maxWidth:500,margin:'clamp(14px,2.5vw,28px) auto 0',animationDelay:'.72s',padding:'0 8px'}}>
          Timso is a team of 28 who genuinely believe hybrid work can feel less like chaos and more like a superpower. This is our story.
        </p>

        <div className="a-rise hero-cta-row flex items-center justify-center flex-wrap"
          style={{gap:12,marginTop:'clamp(24px,4vw,44px)',animationDelay:'.88s'}}>
          <button className="btn-main bg-[#0f0e0c] text-white font-bold rounded-full border-none font-outfit"
            style={{fontSize:'clamp(13px,1.8vw,15px)',padding:'clamp(12px,2vw,16px) clamp(22px,3vw,36px)'}}
            onClick={() => router.push('/register')}>
            <span className="relative z-10">Get started free</span>
          </button>
          <button
            onClick={() => document.getElementById('team')?.scrollIntoView({behavior:'smooth'})}
            className="btn-outline bg-transparent font-semibold font-outfit text-[#0f0e0c] rounded-full border-none cursor-pointer"
            style={{fontSize:'clamp(13px,1.8vw,15px)',padding:'clamp(12px,2vw,16px) clamp(18px,2.5vw,28px)',border:'1.5px solid rgba(0,0,0,.15)'}}>
            Meet the team &#8595;
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── STATS — four bold cards on cream bg ──────── */}
      {/* ══════════════════════════════════════════════ */}
      <div ref={statsRef} style={{background:'#f8f7f4',padding:'clamp(40px,6vw,72px) clamp(16px,4vw,64px)',borderTop:'1px solid rgba(0,0,0,.06)',borderBottom:'1px solid rgba(0,0,0,.06)'}}>
        <div className="stats-grid grid mx-auto" style={{gridTemplateColumns:'repeat(4,1fr)',gap:'clamp(10px,2vw,20px)',maxWidth:1100}}>
          {NUMBERS.map((s,i)=>(
            <div key={s.l} className={`stat-card rv d${i+1} bg-white rounded-[clamp(16px,2vw,24px)] border border-black/[.07] flex flex-col items-center justify-center text-center`}
              style={{padding:'clamp(20px,3vw,36px) clamp(12px,2vw,20px)',boxShadow:'0 2px 10px rgba(0,0,0,.04)'}}>
              <div style={{fontSize:'clamp(20px,3vw,28px)',marginBottom:8}}>{s.icon}</div>
              <div className={`stat-num font-syne font-black ${statsIn?'cnt-in':''}`}
                style={{fontSize:'clamp(28px,4.5vw,52px)',letterSpacing:'-0.04em',lineHeight:.95,animationDelay:`${i*.1}s`}}>
                {s.n}
              </div>
              <div style={{fontSize:'clamp(11px,1.4vw,13px)',color:'#9e9b94',marginTop:8,fontWeight:500}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── STORY — two-column asymmetric layout ─────── */}
      {/* ══════════════════════════════════════════════ */}
      <section style={{padding:'clamp(60px,8vw,120px) clamp(16px,4vw,64px)'}}>
        <div className="story-grid grid items-start mx-auto" style={{gridTemplateColumns:'1fr 1.4fr',gap:'clamp(40px,6vw,100px)',maxWidth:1200}}>

          {/* Left — sticky label + headline */}
          <div className="rv-l" style={{position:'sticky',top:100}}>
            <SectionLabel text="Our story" />
            <h2 className="font-syne font-black leading-[.95] text-[#0f0e0c]"
              style={{fontSize:'clamp(28px,4vw,56px)',letterSpacing:'-0.03em',margin:'0 0 clamp(20px,3vw,32px)'}}>
              From a Slack bot to 8,000+ teams.
            </h2>
            {/* Orange accent bar */}
            <div style={{width:52,height:4,background:'#f97316',borderRadius:2,marginBottom:'clamp(20px,3vw,32px)'}}></div>
            {/* Mini stat strip */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[['2021','Year founded'],['28','Team members'],['60+','Countries']].map(([n,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:16}}>
                  <div className="font-syne font-black text-[#0f0e0c]" style={{fontSize:'clamp(22px,3vw,30px)',letterSpacing:'-1px',lineHeight:1,minWidth:60}}>{n}</div>
                  <div style={{fontSize:'clamp(11px,1.4vw,13px)',color:'#9e9b94',fontWeight:500}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — flowing content */}
          <div>
            <p className="rv" style={{fontSize:'clamp(16px,2.2vw,21px)',lineHeight:1.75,color:'#0f0e0c',fontWeight:500,letterSpacing:'-0.02em',marginBottom:'clamp(18px,2.5vw,28px)'}}>
              We started Timso because we lived the problem. Every morning someone posted in Slack: <span style={{color:'#f97316',fontWeight:700}}>&ldquo;who&apos;s in today?&rdquo;</span> — followed by half-empty offices or overcrowded floors, all because no team had a single source of truth.
            </p>
            <p className="rv" style={{fontSize:'clamp(14px,1.7vw,16px)',lineHeight:1.85,color:'#6b6860',marginBottom:'clamp(28px,4vw,48px)'}}>
              We believe the future of work is genuinely flexible. Not &ldquo;flexible&rdquo; as a buzzword — but flexible in a way that&apos;s organised, predictable, and actually enjoyable. Timso is the operating layer that makes hybrid teams feel as connected as if they shared the same floor.
            </p>

            {/* Timeline rows */}
            {MILESTONES.map((m,i)=>(
              <div key={m.year} className={`ml-row rv d${Math.min(i+1,5)}`}
                style={{display:'grid',gridTemplateColumns:'clamp(44px,6vw,60px) 20px 1fr',gap:'clamp(10px,2vw,24px)',padding:'clamp(16px,2.5vw,24px) 0 clamp(16px,2.5vw,24px) 0',alignItems:'flex-start',cursor:'default'}}>
                {/* Year */}
                <div className="ml-year font-syne font-black" style={{fontSize:'clamp(13px,1.6vw,15px)',color:'#f97316',paddingTop:3}}>{m.year}</div>
                {/* Dot */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:6,gap:0}}>
                  <div className="ml-dot-inner" style={{width:10,height:10,borderRadius:'50%',background:'#0f0e0c',flexShrink:0}}></div>
                  {i < MILESTONES.length-1 && <div style={{width:2,flex:1,background:'rgba(0,0,0,.07)',marginTop:4,minHeight:20}}></div>}
                </div>
                {/* Content */}
                <div style={{paddingBottom:4}}>
                  <div className="font-syne font-black text-[#0f0e0c]" style={{fontSize:'clamp(14px,1.8vw,18px)',letterSpacing:'-0.3px',marginBottom:6}}>{m.t}</div>
                  <p style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'#6b6860',margin:0}}>{m.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── TEAM — full-width card grid ──────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section id="team" style={{background:'#f8f7f4',padding:'clamp(60px,8vw,120px) clamp(16px,4vw,64px)'}}>
        <div className="rv text-center" style={{marginBottom:'clamp(36px,5vw,64px)'}}>
          <SectionLabel text="The team" />
          <h2 className="font-syne font-black leading-[.95] text-[#0f0e0c]"
            style={{fontSize:'clamp(28px,5vw,68px)',letterSpacing:'-0.03em',marginBottom:14}}>
            People who built this
          </h2>
          <p className="leading-[1.8] text-[#6b6860] mx-auto" style={{fontSize:'clamp(14px,1.8vw,17px)',maxWidth:480}}>
            Small, opinionated, and obsessed with making distributed work feel human.
          </p>
        </div>

        <div className="team-grid grid mx-auto" style={{gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(12px,2vw,20px)',maxWidth:1100}}>
          {TEAM.map((m,i)=>(
            <div key={m.init} className={`tm-card rv d${(i%3)+1} bg-white border border-black/[.07] overflow-hidden`}
              style={{borderRadius:'clamp(18px,2vw,28px)',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
              {/* Gradient header */}
              <div style={{height:'clamp(70px,10vw,100px)',background:`linear-gradient(135deg,${m.bg}30,${m.bg}18)`,position:'relative',flexShrink:0}}></div>
              {/* Avatar — overlaps header */}
              <div style={{padding:'0 clamp(18px,2.5vw,28px)',marginTop:'clamp(-28px,-4vw,-36px)',position:'relative',zIndex:1}}>
                <div className="tm-avatar font-syne font-black text-white flex items-center justify-center"
                  style={{width:'clamp(52px,7vw,68px)',height:'clamp(52px,7vw,68px)',borderRadius:'50%',background:m.bg,boxShadow:`0 6px 20px ${m.bg}66`,fontSize:'clamp(18px,2.5vw,24px)',border:'3px solid #fff'}}>
                  {m.init}
                </div>
                <div style={{marginTop:12,paddingBottom:'clamp(18px,2.5vw,28px)'}}>
                  <div className="font-syne font-black text-[#0f0e0c]" style={{fontSize:'clamp(14px,1.8vw,17px)',letterSpacing:'-0.3px',marginBottom:3}}>{m.name}</div>
                  <div className="tm-role font-medium" style={{fontSize:'clamp(10px,1.3vw,12px)',marginBottom:10,color:m.bg}}>{m.role}</div>
                  <p style={{fontSize:'clamp(12px,1.4vw,13px)',lineHeight:1.65,color:'#6b6860',margin:0}}>{m.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hiring banner */}
        <div className="rv mx-auto" style={{marginTop:'clamp(28px,4vw,48px)',maxWidth:1100}}>
          <div className="stripe-bg rounded-[clamp(16px,2vw,24px)] flex items-center justify-between flex-wrap"
            style={{padding:'clamp(18px,3vw,28px) clamp(20px,3vw,36px)',border:'1px solid rgba(249,115,22,.2)',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:44,height:44,borderRadius:14,background:'#f97316',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>💼</div>
              <div>
                <div className="font-syne font-black text-[#0f0e0c]" style={{fontSize:'clamp(14px,1.8vw,17px)',letterSpacing:'-0.3px'}}>We&apos;re hiring across all functions</div>
                <div style={{fontSize:'clamp(11px,1.4vw,13px)',color:'#6b6860',marginTop:3}}>6 open roles · Remote-friendly · Competitive equity</div>
              </div>
            </div>
            <button
              onClick={() => router.push('/careers')}
              className="btn-main bg-[#0f0e0c] text-white font-bold rounded-full border-none font-outfit cursor-pointer"
              style={{fontSize:13,padding:'11px 26px',flexShrink:0}}>
              <span className="relative z-10">View open roles &rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── VALUES — 3-col card grid ──────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <section style={{padding:'clamp(60px,8vw,120px) clamp(16px,4vw,64px)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          {/* Two-column intro */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:24,marginBottom:'clamp(36px,5vw,64px)',flexWrap:'wrap'}}>
            <div className="rv-l">
              <SectionLabel text="Our values" />
              <h2 className="font-syne font-black leading-[.95] text-[#0f0e0c]"
                style={{fontSize:'clamp(28px,5vw,68px)',letterSpacing:'-0.03em',margin:0}}>
                How we think,<br/>how we build.
              </h2>
            </div>
            <p className="rv-r leading-[1.8] text-[#6b6860]" style={{fontSize:'clamp(13px,1.7vw,16px)',maxWidth:380}}>
              Six principles that shape every product decision, every hire, and every customer conversation — without exception.
            </p>
          </div>

          <div className="values-grid grid" style={{gridTemplateColumns:'repeat(3,1fr)',gap:'clamp(10px,1.5vw,16px)'}}>
            {VALUES.map((v,i)=>(
              <div key={v.t} className={`val-card rv d${(i%3)+1} bg-white border border-black/[.07]`}
                style={{borderRadius:'clamp(16px,2vw,24px)',padding:'clamp(22px,3vw,36px)',boxShadow:'0 1px 6px rgba(0,0,0,.04)',cursor:'default'}}>
                <div className="val-icon rounded-2xl flex items-center justify-center"
                  style={{width:52,height:52,fontSize:24,background:'#f8f7f4',marginBottom:16}}>{v.icon}</div>
                <div className="font-syne font-black text-[#0f0e0c]" style={{fontSize:'clamp(14px,1.8vw,18px)',letterSpacing:'-0.3px',marginBottom:8}}>{v.t}</div>
                <p style={{fontSize:'clamp(12px,1.4vw,13px)',lineHeight:1.75,color:'#6b6860',margin:0}}>{v.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── PRESS — dark section with quote cards ────── */}
      {/* ══════════════════════════════════════════════ */}
      <section style={{background:'#0f0e0c',padding:'clamp(60px,8vw,120px) clamp(16px,4vw,64px)',position:'relative',overflow:'hidden'}}>
        <div className="absolute pointer-events-none" style={{width:'60vw',height:'60vw',maxWidth:700,maxHeight:700,borderRadius:'50%',background:'radial-gradient(circle,rgba(249,115,22,.1),transparent 65%)',top:'-20%',right:'-10%'}}></div>
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'radial-gradient(circle,rgba(249,115,22,.05) 1px,transparent 1px)',backgroundSize:'28px 28px'}}></div>

        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <div className="rv text-center" style={{marginBottom:'clamp(36px,5vw,60px)'}}>
            <SectionLabel text="In the press" light />
            <h2 className="font-syne font-black leading-[.95] text-white"
              style={{fontSize:'clamp(28px,5vw,68px)',letterSpacing:'-0.03em',marginBottom:14}}>
              What people are saying.
            </h2>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'clamp(10px,1.5vw,16px)'}}>
            {PRESS.map((p,i)=>(
              <div key={p.src} className={`pr-card rv d${i+1}`}
                style={{borderRadius:'clamp(16px,2vw,24px)',padding:'clamp(24px,3.5vw,40px)',border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',cursor:'default'}}>
                <div className="font-syne font-black" style={{fontSize:'clamp(13px,1.8vw,16px)',color:'rgba(255,255,255,.35)',letterSpacing:'-0.3px',marginBottom:16}}>{p.src}</div>
                <p className="font-syne font-black text-white" style={{fontSize:'clamp(16px,2.2vw,24px)',letterSpacing:'-0.5px',lineHeight:1.25,margin:0}}>
                  &ldquo;{p.q}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Backers strip */}
          <div className="rv" style={{marginTop:'clamp(40px,6vw,72px)',paddingTop:'clamp(28px,4vw,48px)',borderTop:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.2)',marginBottom:20,textAlign:'center'}}>Backed by</div>
            <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'clamp(20px,4vw,48px)',alignItems:'center'}}>
              {['Accel','Y Combinator','Index Ventures','First Round','Sequoia Scout'].map(b=>(
                <span key={b} className="font-syne font-black" style={{fontSize:'clamp(13px,1.8vw,17px)',color:'rgba(255,255,255,.2)',letterSpacing:'-0.3px',cursor:'default',transition:'color .3s'}}
                  onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,.7)')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.2)')}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* ── CTA — same rounded dark card as homepage ─── */}
      {/* ══════════════════════════════════════════════ */}
      <div className="rv a-ctap relative text-center overflow-hidden"
        style={{background:'#0f0e0c',margin:'clamp(20px,3vw,40px) clamp(8px,1.5vw,24px) clamp(20px,3vw,40px)',borderRadius:'clamp(20px,3vw,44px)',padding:'clamp(60px,8vw,130px) clamp(20px,5vw,80px)'}}>
        <div className="absolute rounded-full pointer-events-none" style={{width:300,height:300,background:'#f97316',opacity:.07,top:-100,left:'5%',animation:'sfloat 8s ease-in-out infinite'}}></div>
        <div className="absolute rounded-full pointer-events-none" style={{width:200,height:200,background:'#5c3bff',opacity:.07,bottom:-60,right:'10%',animation:'sfloat 8s ease-in-out 3s infinite'}}></div>

        <h2 className="font-syne font-black leading-[.92] text-white mx-auto relative z-10"
          style={{fontSize:'clamp(32px,7.5vw,96px)',letterSpacing:'clamp(-1.5px,-0.04em,-3px)',maxWidth:860,marginBottom:'clamp(24px,4vw,48px)'}}>
          Ready to end<br/><span style={{color:'#f97316'}}>&ldquo;who&apos;s in today?&rdquo;</span>
        </h2>

        <div className="cta-btns flex gap-3 justify-center items-center relative z-10 flex-wrap">
          <button className="btn-orange rounded-full font-black font-outfit border-none"
            style={{fontSize:'clamp(13px,2vw,16px)',padding:'clamp(14px,2vw,18px) clamp(28px,4vw,44px)',background:'#f97316',color:'#0f0e0c'}}
            onClick={() => router.push('/register')}>Start for free</button>
          <button className="font-semibold font-outfit rounded-full"
            style={{fontSize:'clamp(13px,2vw,16px)',padding:'clamp(14px,2vw,18px) clamp(28px,4vw,44px)',background:'rgba(255,255,255,.08)',border:'1.5px solid rgba(255,255,255,.15)',color:'#fff',cursor:'none',transition:'background .3s'}}
            onClick={() => router.push('/contact')}>Talk to us</button>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center" style={{gap:'clamp(16px,3vw,40px)',marginTop:'clamp(28px,4vw,48px)'}}>
          {['No credit card required','14-day free trial','Cancel anytime'].map(t=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:'rgba(249,115,22,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#f97316',flexShrink:0}}>✓</div>
              <span style={{fontSize:'clamp(11px,1.4vw,13px)',color:'rgba(255,255,255,.35)',fontWeight:500}}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER — identical to homepage ── */}
      <footer style={{background:'#0f0e0c',padding:'clamp(36px,5vw,70px) clamp(14px,4vw,64px) clamp(24px,4vw,44px)'}}>
        <div className="footer-grid grid" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'clamp(20px,4vw,56px)',marginBottom:'clamp(32px,5vw,56px)'}}>
          <div className="footer-brand">
            <div className="font-syne font-black text-white flex items-center" style={{fontSize:'clamp(18px,2.5vw,26px)',gap:5,marginBottom:12}}>
              timso
              <span className="relative inline-block rounded-full border-[2.5px] a-logo" style={{width:10,height:10,borderColor:'rgba(255,255,255,.5)',flexShrink:0,display:'inline-block'}}></span>
            </div>
            <p style={{fontSize:'clamp(12px,1.5vw,14px)',color:'rgba(255,255,255,.3)',lineHeight:1.8,maxWidth:260,margin:0}}>
              The hybrid work platform that keeps distributed teams aligned and in sync — without the chaos.
            </p>
          </div>
          {([['Product',['Features','Integrations','Pricing','Changelog']],['Company',['About','Blog','Careers','Press']],['Legal',['Privacy','Terms','Security','GDPR']]] as [string,string[]][]).map(([title,links])=>(
            <div key={title}>
              <div style={{fontSize:'clamp(9px,1.2vw,11px)',fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.25)',marginBottom:16}}>{title}</div>
              <ul style={{padding:0,margin:0,listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
                {links.map(l=>(
                  <li key={l}><a href="#" className="ft-a" style={{fontSize:'clamp(12px,1.5vw,14px)',transition:'color .3s'}}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,paddingTop:'clamp(14px,2.5vw,28px)',borderTop:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontSize:'clamp(10px,1.3vw,12px)',color:'rgba(255,255,255,.18)'}}>© 2025 Timso Inc. All rights reserved.</div>
          <div style={{display:'flex',gap:8}}>
            {['𝕏','in','▶','⬡'].map(s=>(
              <div key={s} className="soc-b rounded-full flex items-center justify-center text-white border"
                style={{width:36,height:36,fontSize:13,background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.08)'}}>{s}</div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}