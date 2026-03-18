'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ─── data ──────────────────────────────────────── */
const BRANDS = ['⬡ amazon','✦ grammarly','◈ Dropbox','▲ ORACLE','≡ slack','● okta','𝕏 twitter','◎ mastercard','⬡ softserve','≋ SIEMENS','✦ Luxoft','◈ Deloitte'];
const TEAM = [
  { bg:'#f97316', init:'KK', name:'Katya K.',   where:'9th floor',  tag:'Office', tc:'text-orange-600 bg-orange-100' },
  { bg:'#a89fff', init:'MR', name:'Mikhail R.', where:'WFH',        tag:'Remote', tc:'text-violet-600 bg-violet-100' },
  { bg:'#fbbf24', init:'AS', name:'Anna S.',    where:'Day off',    tag:'Away',   tc:'text-gray-500 bg-gray-100' },
  { bg:'#34d399', init:'DL', name:'Denis L.',   where:'Meeting rm', tag:'Office', tc:'text-orange-600 bg-orange-100' },
  { bg:'#f87171', init:'NP', name:'Nina P.',    where:'Focus mode', tag:'Remote', tc:'text-violet-600 bg-violet-100' },
];
const APP_ROWS = [
  { bg:'#f97316', init:'KK', n:'Katya Kilichuk', s:'In office · 9th floor', b:'🏢 Office', bc:'bg-orange-100 text-orange-700' },
  { bg:'#a89fff', init:'MR', n:'Mikhail Repin',  s:'Working remotely',       b:'🏠 Remote', bc:'bg-violet-100 text-violet-700' },
  { bg:'#fbbf24', init:'AS', n:'Anna Smirnova',  s:'Day off · Returns Mon',  b:'🌴 Away',   bc:'bg-gray-100 text-gray-500' },
  { bg:'#34d399', init:'DL', n:'Denis Loginov',  s:'In office · Meeting',    b:'🏢 Office', bc:'bg-orange-100 text-orange-700' },
  { bg:'#fb7185', init:'NP', n:'Nina Petrov',    s:'Remote · Focus mode',    b:'🏠 Remote', bc:'bg-violet-100 text-violet-700' },
];
const WEEK = [
  { label:'Mon', num:'16', dots:['#f97316','#f97316','#9b87ff'], today:false },
  { label:'Tue', num:'17', dots:['#f97316','#f97316','#f97316'], today:true  },
  { label:'Wed', num:'18', dots:['#9b87ff','#9b87ff'],           today:false },
  { label:'Thu', num:'19', dots:['#f97316','#d1d5db'],           today:false },
  { label:'Fri', num:'20', dots:['#f97316','#f97316','#9b87ff'], today:false },
];
const TESTIMONIALS = [
  { av:'SM', avBg:'#f97316', nm:'Sophie Müller',  rl:'HR Director · Grammarly',    txt:'"Timso ended the daily \'who\'s in today?\' Slack messages. Complete game-changer."' },
  { av:'JK', avBg:'#a89fff', nm:'James Kim',       rl:'Engineering Lead · Dropbox', txt:'"Custom statuses are brilliant. Both teams work their own way inside one platform."' },
  { av:'LP', avBg:'#fbbf24', nm:'Laura Petrov',    rl:'Operations · Siemens',       txt:'"Day swaps now take two taps. The Slack integration means zero context-switching."' },
  { av:'AK', avBg:'#34d399', nm:'Alexei Kovalev',  rl:'CTO · Luxoft',               txt:'"Rolled out to 200+ people in one afternoon. BambooHR sync — zero manual entry."' },
  { av:'DR', avBg:'#fb7185', nm:'Diana Russo',     rl:'Workplace Lead · Okta',      txt:'"Office utilization up 34% in month one. The analytics alone justify the subscription."' },
];
const FAQ_ITEMS = [
  { q:'How long does it take to set up?',         a:'Most teams are fully live in under 15 minutes. Connect your HRIS, invite your team, configure statuses — no IT required.' },
  { q:'Does timso work with our existing tools?', a:'Yes! Slack, Teams, BambooHR, Workday, Hibob, and more. New integrations added monthly.' },
  { q:'Is our data secure and private?',          a:'SOC 2 Type II certified, GDPR compliant. All data encrypted in transit and at rest.' },
  { q:'Can each team have different statuses?',   a:'Yes — Engineering, Design, HR can all have completely different status sets in the same account.' },
  { q:'Is there a free trial for the Pro plan?',  a:'14-day free trial, no credit card required. Full access to every Pro feature.' },
];
const HOW_STEPS = [
  { num:'01', icon:'🔌', h:'Connect your stack',   p:'Link Slack, Teams, or your HRIS in under 2 minutes. No code or IT needed.' },
  { num:'02', icon:'🎨', h:'Design your statuses', p:'Create custom status types that match how your specific team operates.' },
  { num:'03', icon:'⚡', h:'Stay synchronized',    p:"Everyone always knows who's where — live, across devices and time zones." },
];
const CHECK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 6l3 3 5-5' stroke='%23f97316' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") center/12px no-repeat`;

/* ─── Global CSS ─────────────────────────────────── */
const G = `
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:hidden}
body{margin:0;cursor:none;font-family:'Outfit',sans-serif;background:#fff;color:#0f0e0c;overflow-x:hidden;width:100%}
.font-syne{font-family:'Syne',sans-serif}

/* ── Cursor ── */
#cur-arrow{position:fixed;top:0;left:0;width:14px;height:14px;pointer-events:none;z-index:99999;transition:width .2s,height .2s,opacity .2s}
body.cur-moving #cur-arrow{width:22px!important;height:22px!important}
body.cur-hover  #cur-arrow{width:18px!important;height:18px!important;opacity:.7}
body.cur-active #cur-arrow{width:10px!important;height:10px!important;opacity:.5}
body.cur-on-dark #cur-arrow path{fill:#fff!important;stroke:#fff!important}

/* ── Keyframes ── */
@keyframes riseIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes wordSlide{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes tscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes fbadge{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes dotsDrift{0%,100%{background-position:0 0}50%{background-position:8px 8px}}
@keyframes logoR{0%,100%{border-color:#0f0e0c}50%{border-color:#f97316}}
@keyframes logoRP{0%,100%{opacity:0;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
@keyframes uslide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes ctaP{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.5}50%{transform:translate(-50%,-50%) scale(1.1);opacity:1}}
@keyframes sfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-24px)}}
@keyframes linesweep{0%,100%{opacity:.08;transform:scaleX(1)}50%{opacity:.2;transform:scaleX(1.2)}}

/* ── Animation classes ── */
.a-rise{opacity:0;animation:riseIn .8s cubic-bezier(.16,1,.3,1) forwards}
.a-word{opacity:0;display:inline-block;animation:wordSlide .9s cubic-bezier(.16,1,.3,1) forwards}
.a-mq{display:flex;gap:48px;align-items:center;animation:mq 20s linear infinite;width:max-content}
.a-mq:hover{animation-play-state:paused}
.a-ts{display:flex;gap:20px;animation:tscroll 28s linear infinite;width:max-content}
.a-ts:hover{animation-play-state:paused}
.a-fb1{animation:fbadge 4s ease-in-out infinite}
.a-fb2{animation:fbadge 4s ease-in-out 1.5s infinite}
.a-dots{animation:dotsDrift 20s ease-in-out infinite}
.a-logo{animation:logoR 3s ease-in-out infinite}
.a-logop::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1.5px solid #f97316;opacity:0;animation:logoRP 3s ease-in-out infinite}
.a-usl{animation:uslide .4s cubic-bezier(.16,1,.3,1) backwards}
.a-ctap::before{content:'';position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,.12),transparent 65%);top:50%;left:50%;transform:translate(-50%,-50%);animation:ctaP 5s ease-in-out infinite;pointer-events:none}
.a-sf1{animation:sfloat 8s ease-in-out infinite}
.a-sf2{animation:sfloat 8s ease-in-out 3s infinite}
.a-line{animation:linesweep 6s ease-in-out infinite}
.a-l1{animation-delay:0s}.a-l2{animation-delay:2s}.a-l3{animation-delay:4s}

/* ── Scroll reveal ── */
.rv{opacity:0;transform:translateY(40px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
.rv-l{opacity:0;transform:translateX(-40px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
.rv-r{opacity:0;transform:translateX(40px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1)}
.rv.in{opacity:1;transform:translateY(0)}.rv-l.in{opacity:1;transform:translateX(0)}.rv-r.in{opacity:1;transform:translateX(0)}
.rv.out{opacity:0;transform:translateY(24px);transition:opacity .5s,transform .5s}
.rv-l.out{opacity:0;transform:translateX(-24px);transition:opacity .5s,transform .5s}
.rv-r.out{opacity:0;transform:translateX(24px);transition:opacity .5s,transform .5s}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}

/* ── UI components ── */
.bc-hover{transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s}
.bc-hover:hover{transform:translateY(-6px) scale(1.006);box-shadow:0 24px 60px rgba(0,0,0,.1)}
.btn-main{position:relative;overflow:hidden;transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s}
.btn-main::before{content:'';position:absolute;inset:0;background:#f97316;transform:translateX(-101%);transition:transform .45s cubic-bezier(.16,1,.3,1);border-radius:100px}
.btn-main:hover::before{transform:translateX(0)}
.btn-main:hover{color:#0f0e0c;transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.15)}
.btn-nav{position:relative;overflow:hidden}
.btn-nav::before{content:'';position:absolute;inset:0;background:#f97316;clip-path:circle(0% at 50% 50%);transition:clip-path .5s cubic-bezier(.16,1,.3,1)}
.btn-nav:hover::before{clip-path:circle(150% at 50% 50%)}
.btn-nav:hover{color:#0f0e0c}
.app-win{transform:perspective(900px) rotateX(6deg) rotateY(-2deg);transition:transform .6s cubic-bezier(.16,1,.3,1)}
.bc-hover:hover .app-win{transform:perspective(900px) rotateX(0) rotateY(0)}
.pf-frame{transform:perspective(1200px) rotateX(8deg);transition:transform .8s cubic-bezier(.16,1,.3,1)}
.pf-frame:hover{transform:perspective(1200px) rotateX(2deg)}
.sp-feat{transition:border-color .3s,background .3s,transform .3s}
.sp-feat:hover{border-color:#f97316;background:rgba(249,115,22,.04);transform:translateX(6px)}
.sp-feat:hover .sp-icon{background:#f97316}
.sp-icon{transition:background .3s}
.swap-it{transition:border-color .3s,background .3s,transform .3s}
.swap-it:hover{border-color:#f97316;background:rgba(249,115,22,.06);transform:translateX(4px)}
.t-card{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s}
.t-card:hover{transform:translateY(-8px);box-shadow:0 24px 60px rgba(0,0,0,.1)}
.p-card{transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s}
.p-card:hover{transform:translateY(-8px);box-shadow:0 32px 80px rgba(0,0,0,.1)}
.p-popular{transform:scale(1.03)}
.p-popular:hover{transform:scale(1.03) translateY(-8px)!important;box-shadow:0 32px 80px rgba(0,0,0,.15)!important}
.soc-b{transition:background .3s,transform .3s,border-color .3s}
.soc-b:hover{background:#f97316;border-color:#f97316;transform:translateY(-4px);color:#0f0e0c}
.step-b{transition:background .4s,transform .4s cubic-bezier(.16,1,.3,1)}
.how-step:hover .step-b{background:#f97316;color:#0f0e0c;transform:scale(1.15)}
.metric-c{transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s}
.metric-c:hover{transform:translateY(-6px);box-shadow:0 16px 40px rgba(0,0,0,.1)}
.ch-c{transition:transform .3s,background .3s,border-color .3s}
.ch-c:hover{transform:translateY(-4px);background:#f97316;border-color:#f97316;color:#0f0e0c}
.mq-b{transition:color .3s}
.mq-b:hover{color:#0f0e0c}
.faq-icon{transition:transform .4s cubic-bezier(.16,1,.3,1),background .3s,border-color .3s}
.faq-open .faq-icon{transform:rotate(45deg);background:#f97316;border-color:#f97316}
.faq-ans{max-height:0;overflow:hidden;transition:max-height .55s cubic-bezier(.16,1,.3,1),padding .4s}
.faq-open .faq-ans{max-height:220px;padding-bottom:24px}
.bar-c{border-radius:5px 5px 0 0;transition:transform .6s cubic-bezier(.16,1,.3,1),opacity .4s;transform:scaleY(0);transform-origin:bottom;opacity:0}
.sv{transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s}
.sv:hover{transform:translateY(-8px);box-shadow:0 40px 100px rgba(0,0,0,.12)}
.nav-link:hover{color:#0f0e0c}
.faq-row:hover{color:#f97316}
.ft-a:hover{color:#f97316}
.snd:hover{background:#f97316;color:#0f0e0c;transform:translateY(-2px)}
.snd{transition:background .3s,color .3s,transform .3s}
.btn-outline:hover{border-color:#0f0e0c;background:#0f0e0c;color:#fff;transform:translateY(-3px)}
.btn-outline{transition:border-color .3s,background .3s,transform .3s}
.sticky-nav{background:rgba(255,255,255,.95)!important;backdrop-filter:blur(28px)!important;box-shadow:0 1px 0 rgba(0,0,0,.07)!important}
.mask-x{mask-image:linear-gradient(to right,transparent,black 12%,black 88%,transparent)}
.pf-d:hover{border-color:#f97316;background:rgba(249,115,22,.05)}
.pf-d{transition:border-color .3s,background .3s}
.ghost-p{transition:background .3s,color .3s,border-color .3s}
.ghost-p:hover{background:#0f0e0c;color:#fff;border-color:#0f0e0c}
.solid-p:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(249,115,22,.35)}
.solid-p{transition:transform .3s,box-shadow .3s}
.nav-login{transition:color .3s,background .3s}
.nav-login:hover{color:#0f0e0c!important;background:rgba(0,0,0,.06)}

/* ── NAV — base (desktop) ── */
#t-nav{
  position:fixed;top:0;left:0;right:0;z-index:50;
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 48px;
  transition:background .4s,box-shadow .4s,padding .4s;
}
.nav-desktop-pill{
  display:flex;align-items:center;gap:4px;
  background:rgba(0,0,0,.04);
  padding:6px 6px 6px 18px;
  border-radius:100px;
  border:1px solid rgba(0,0,0,.07);
}

/* ── Hamburger — hidden on desktop ── */
.ham-btn{
  display:none;
  width:42px;height:42px;flex-shrink:0;
  flex-direction:column;gap:5px;align-items:center;justify-content:center;
  background:rgba(255,255,255,.9);
  border:1.5px solid rgba(0,0,0,.1);
  border-radius:10px;
  cursor:pointer;
  position:relative;z-index:60;
}
.ham-line{
  display:block;width:20px;height:2px;
  background:#0f0e0c;border-radius:2px;
  transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .3s,transform .35s;
}
.ham-open .ham-line:nth-child(1){transform:translateY(7px) rotate(45deg)}
.ham-open .ham-line:nth-child(2){opacity:0;transform:scaleX(0)}
.ham-open .ham-line:nth-child(3){transform:translateY(-7px) rotate(-45deg)}

/* ── Mobile menu overlay ── */
.mob-menu{
  display:none;
  position:fixed;top:0;left:0;right:0;
  background:#fff;
  z-index:55;
  flex-direction:column;
  padding:0;
  box-shadow:0 8px 40px rgba(0,0,0,.12);
  border-bottom:1px solid rgba(0,0,0,.07);
}
.mob-menu.open{display:flex}

/* ── RESPONSIVE ── */

/* Tablet and mobile (≤900px) */
@media(max-width:900px){
  body{cursor:auto}
  #cur-arrow{display:none}

  /* Nav */
  #t-nav{padding:14px 16px}
  .nav-desktop-pill{display:none}
  .ham-btn{display:flex}

  /* Hero */
  .hero-badges{display:none!important}
  .pf-frame{transform:none!important}

  /* Bento — flex column */
  .bento-grid{
    display:flex!important;
    flex-direction:column!important;
    gap:12px!important;
  }
  .app-preview-sidebar{display:none!important}
  .app-preview-grid{grid-template-columns:1fr!important}

  /* How */
  .how-steps-grid{grid-template-columns:1fr!important;gap:20px!important}
  .how-connector{display:none!important}

  /* Spotlight */
  .spotlight-grid{grid-template-columns:1fr!important;gap:28px!important}

  /* Pricing */
  .pricing-grid{
    grid-template-columns:1fr!important;
    max-width:440px!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }
  .p-popular{transform:none!important}
  .p-popular:hover{transform:translateY(-8px)!important}

  /* Footer */
  .footer-grid{grid-template-columns:1fr 1fr!important;gap:28px!important}
  .footer-brand{grid-column:1/-1!important}
}

/* Small mobile (≤580px) */
@media(max-width:580px){
  #t-nav{padding:12px 14px}

  .hero-cta-row{flex-direction:column!important;width:100%!important;max-width:340px!important;margin-left:auto!important;margin-right:auto!important}
  .hero-cta-row button{width:100%!important;justify-content:center!important}

  .hero-metrics{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;width:100%!important}

  .how-inner{padding:40px 18px!important;border-radius:20px!important}

  .cta-wrap{margin:8px!important;border-radius:20px!important;padding:48px 18px!important}
  .cta-btns{flex-direction:column!important;align-items:stretch!important;gap:10px!important}
  .cta-btns button{width:100%!important;text-align:center!important}

  .footer-grid{grid-template-columns:1fr!important}
  .footer-brand{grid-column:1!important}

  .pricing-grid{max-width:100%!important;padding:0 4px}
}

/* Tablet landscape (901–1200px) */
@media(min-width:901px) and (max-width:1200px){
  #t-nav{padding:16px 28px}

  .bento-grid{
    grid-template-columns:repeat(2,1fr)!important;
    grid-auto-rows:auto!important;
  }
  .bento-grid > *{grid-column:span 1!important;grid-row:span 1!important}
  .app-preview-sidebar{display:none!important}
  .app-preview-grid{grid-template-columns:1fr!important}

  .how-steps-grid{grid-template-columns:1fr!important;gap:20px!important}
  .how-connector{display:none!important}

  .pricing-grid{grid-template-columns:1fr 1fr!important}
  .p-popular{transform:none!important}
  .p-ent{grid-column:1/-1!important}

  .spotlight-grid{gap:36px!important}
}
`;

export default function Home() {
  const router = useRouter();
  const counterRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [billing, setBilling] = useState<'m'|'y'>('m');
  const [faq, setFaq] = useState<number|null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Lock body scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 900;

    /* Custom cursor — desktop only */
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
    const onScroll = () => {
      nav.classList.toggle('sticky-nav', window.scrollY > 60);
      if (previewRef.current && !isMobile) {
        previewRef.current.style.transform = `perspective(1200px) rotateX(${Math.max(0, 8 - window.scrollY * .015)}deg)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Scroll reveal */
    const rEls = document.querySelectorAll('.rv,.rv-l,.rv-r');
    const rObs = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('out'); requestAnimationFrame(() => e.target.classList.add('in')); }
      else { e.target.classList.remove('in'); e.target.classList.add('out'); }
    }), { threshold: .1 });
    rEls.forEach(el => rObs.observe(el));

    /* Counter */
    let ci: ReturnType<typeof setInterval>;
    const cObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        clearInterval(ci); let n = 0;
        ci = setInterval(() => { n += 3; if (counterRef.current) counterRef.current.textContent = String(n); if (n >= 240) { if (counterRef.current) counterRef.current.textContent = '240+'; clearInterval(ci); } }, 10);
      } else { clearInterval(ci); if (counterRef.current) counterRef.current.textContent = '0'; }
    }, { threshold: .5 });
    if (counterRef.current) cObs.observe(counterRef.current);

    /* Bar animation */
    const bars = document.querySelectorAll('.bar-c') as NodeListOf<HTMLElement>;
    const bObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) bars.forEach((b, i) => setTimeout(() => { b.style.opacity = '1'; b.style.transform = 'scaleY(1)'; }, i * 80));
      else bars.forEach(b => { b.style.opacity = '0'; b.style.transform = 'scaleY(0)'; });
    }, { threshold: .5 });
    if (bars.length) bObs.observe(bars[0]);

    /* 3D tilt — desktop only */
    if (!isMobile) {
      document.querySelectorAll('.bc-hover').forEach((c: Element) => {
        const el = c as HTMLElement;
        el.addEventListener('mousemove', (e: Event) => {
          const me = e as MouseEvent, r = el.getBoundingClientRect();
          const x = (me.clientX - r.left) / r.width - .5, y = (me.clientY - r.top) / r.height - .5;
          el.style.transform = `translateY(-6px) rotateX(${-y*7}deg) rotateY(${x*7}deg) scale(1.006)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }

    /* Hero particles */
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.22;z-index:0';
    document.getElementById('hero-sec')?.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);
    const pts = Array.from({ length: 50 }, () => ({ x: Math.random()*1400, y: Math.random()*800, vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3, r: Math.random()*1.6+.5, a: Math.random()*.6+.2 }));
    let lt = 0;
    const draw = (t: number) => {
      requestAnimationFrame(draw); if (t - lt < 33) return; lt = t;
      ctx?.clearRect(0, 0, W, H);
      pts.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; if(ctx){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(249,115,22,${p.a})`;ctx.fill()} });
    };
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      rObs.disconnect(); cObs.disconnect(); bObs.disconnect();
      clearInterval(ci); canvas.remove();
    };
  }, []);

  /* ── Shared section label ── */
  const SectionLabel = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-2 font-bold tracking-[.14em] uppercase text-[#6b6860] mb-4" style={{fontSize:11}}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>{text}
    </div>
  );

  return (
    <>
      <style>{G}</style>

      {/* Custom cursor (hidden on mobile via CSS) */}
      <svg id="cur-arrow" viewBox="0 0 24 24" fill="none">
        <path d="M4 2L20 10.5L12.5 12.5L10 20L4 2Z" fill="#0f0e0c" stroke="#0f0e0c" strokeWidth="1" strokeLinejoin="round"/>
      </svg>

      {/* ── MOBILE MENU — compact dropdown panel ── */}
      <div className={`mob-menu ${menuOpen ? 'open' : ''}`}>
        {/* Header row — logo + X */}
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
              className="font-syne font-black text-[#0f0e0c] text-left bg-transparent border-none cursor-pointer rounded-xl"
              style={{fontSize:16,padding:'12px 14px',fontFamily:'inherit',transition:'background .2s'}}>
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

      {/* ── NAVBAR ── */}
      <nav id="t-nav">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="font-syne font-black text-[#0f0e0c] flex items-center flex-shrink-0 bg-transparent border-none cursor-pointer"
          style={{fontSize:'clamp(18px,2.5vw,22px)',gap:5,padding:0,fontFamily:'inherit'}}>
          timso
          <span className="relative w-2.5 h-2.5 rounded-full border-[2.5px] border-[#0f0e0c] a-logo a-logop"
            style={{display:'inline-block',flexShrink:0}}></span>
        </button>

        {/* Desktop pill — hidden on mobile via CSS */}
        <div className="nav-desktop-pill">
          <button
              onClick={() => router.push('/about')}
              className="nav-link font-medium text-[#6b6860] bg-transparent border-none cursor-pointer"
              style={{fontSize:13,padding:'4px 12px',transition:'color .3s',fontFamily:'inherit'}}>
              About
            </button>
          <button
            onClick={() => router.push('/login')}
            className="nav-login font-semibold text-[#6b6860] rounded-full bg-transparent border-none cursor-pointer"
            style={{fontSize:13,padding:'8px 16px',transition:'color .3s,background .3s',fontFamily:'inherit'}}>
            Login
          </button>
          <button
            className="btn-nav relative overflow-hidden bg-[#0f0e0c] text-white font-semibold rounded-full border-none font-outfit"
            style={{fontSize:13,padding:'10px 20px'}}
            onClick={() => router.push('/register')}>
            <span className="relative z-10">Start Free</span>
          </button>
        </div>

        {/* Hamburger — shown on mobile via CSS */}
        <button
          className={`ham-btn${menuOpen ? ' ham-open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          type="button">
          <span className="ham-line"></span>
          <span className="ham-line"></span>
          <span className="ham-line"></span>
        </button>
      </nav>

      {/* ── HERO ── */}
      <section id="hero-sec" className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{minHeight:'100svh',padding:'clamp(100px,15vw,140px) clamp(16px,4vw,40px) clamp(60px,8vw,100px)',background:'linear-gradient(160deg,#fff 0%,#fdf9f5 50%,#fff8f2 100%)'}}>
        <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 55% 50% at 15% 25%,rgba(249,115,22,.1),transparent),radial-gradient(ellipse 45% 55% at 85% 75%,rgba(92,59,255,.06),transparent)'}}></div>
        <div className="absolute inset-0 pointer-events-none a-dots" style={{backgroundImage:'radial-gradient(circle,rgba(0,0,0,.055) 1px,transparent 1px)',backgroundSize:'32px 32px',maskImage:'radial-gradient(ellipse 70% 70% at 50% 50%,black,transparent)'}}></div>
        <div className="absolute h-px pointer-events-none a-line a-l1" style={{width:400,top:'25%',left:-100,opacity:.15,background:'linear-gradient(90deg,transparent,#f97316,transparent)'}}></div>
        <div className="absolute h-px pointer-events-none a-line a-l2" style={{width:300,top:'55%',right:-50,opacity:.15,background:'linear-gradient(90deg,transparent,#f97316,transparent)'}}></div>

        {/* Announcement badge */}
        <div className="a-rise inline-flex items-center gap-2 bg-white border border-black/[.09] rounded-full"
          style={{padding:'7px 18px 7px 9px',marginBottom:'clamp(20px,3vw,36px)',animationDelay:'.15s',boxShadow:'0 2px 16px rgba(0,0,0,.06)'}}>
          <div className="w-7 h-7 rounded-full bg-[#f97316] flex items-center justify-center" style={{fontSize:13}}>🚀</div>
          <span className="font-semibold tracking-[.08em] uppercase text-[#6b6860]" style={{fontSize:11}}>New · Smart scheduling is live</span>
          <span className="bg-[#0f0e0c] text-white font-bold rounded-full tracking-[.06em]" style={{fontSize:10,padding:'2px 8px'}}>V2.0</span>
        </div>

        {/* Headline */}
        <h1 className="font-syne font-black leading-[.92] text-[#0f0e0c] a-rise"
          style={{fontSize:'clamp(40px,9.5vw,112px)',letterSpacing:'-0.035em',maxWidth:1100,animationDelay:'.3s',margin:0}}>
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.35s'}}>Your</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.48s',color:'#f97316',WebkitTextFillColor:'#f97316',textShadow:'0 0 60px rgba(249,115,22,.25)'}}>hybrid</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.60s'}}>team,</span></span><br/>
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.72s'}}>always</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className="a-word" style={{animationDelay:'.84s',background:'linear-gradient(135deg,#0f0e0c 0%,#0f0e0c 45%,#5c3bff 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>in sync.</span></span>
        </h1>

        <p className="a-rise leading-[1.8] text-[#6b6860] font-outfit"
          style={{fontSize:'clamp(14px,2.2vw,18px)',maxWidth:480,margin:'clamp(14px,2.5vw,28px) auto 0',animationDelay:'.95s',padding:'0 8px'}}>
          Manage who&apos;s where — office, remote, or away — with real-time status boards, smart day swaps, and seamless HR integrations.
        </p>

        {/* CTA buttons */}
        <div className="a-rise hero-cta-row flex items-center justify-center"
          style={{gap:12,marginTop:'clamp(24px,4vw,44px)',animationDelay:'1.1s',flexWrap:'wrap'}}>
          <button
            className="btn-main bg-[#0f0e0c] text-white font-bold rounded-full border-none font-outfit flex items-center"
            style={{fontSize:'clamp(13px,1.8vw,15px)',padding:'clamp(12px,1.8vw,16px) clamp(22px,3vw,36px)',gap:8}}
            onClick={() => router.push('/register')}>
            <span className="relative z-10">Get started free</span>
            <svg className="relative z-10" width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </button>
          <button
            className="btn-outline bg-transparent font-semibold font-outfit text-[#0f0e0c] rounded-full"
            style={{fontSize:'clamp(13px,1.8vw,15px)',padding:'clamp(12px,1.8vw,16px) clamp(18px,2.5vw,28px)',border:'1.5px solid rgba(0,0,0,.15)'}}>
            ▶&nbsp; Watch demo
          </button>
        </div>

        {/* App preview frame */}
        <div className="a-rise relative w-full"
          style={{maxWidth:900,marginTop:'clamp(36px,5vw,70px)',animationDelay:'1.3s'}}>
          <div className="absolute pointer-events-none" style={{bottom:-40,left:'50%',transform:'translateX(-50%)',width:600,height:100,background:'radial-gradient(ellipse,rgba(249,115,22,.25),transparent)',filter:'blur(30px)'}}></div>

          {/* Floating badges (desktop only) */}
          <div className="hero-badges absolute a-fb1 z-10 flex items-center gap-2.5 bg-white rounded-2xl border border-black/[.07]"
            style={{left:-40,top:'25%',padding:'12px 18px',boxShadow:'0 12px 40px rgba(0,0,0,.1)'}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(249,115,22,.15)',fontSize:18}}>🟢</div>
            <div><div className="font-bold text-[#0f0e0c]" style={{fontSize:12}}>14 in office today</div><div className="text-[#6b6860]" style={{fontSize:10,marginTop:2}}>2 more than yesterday</div></div>
          </div>
          <div className="hero-badges absolute a-fb2 z-10 flex items-center gap-2.5 bg-white rounded-2xl border border-black/[.07]"
            style={{right:-40,top:'50%',padding:'12px 18px',boxShadow:'0 12px 40px rgba(0,0,0,.1)'}}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(92,59,255,.1)',fontSize:18}}>🔄</div>
            <div><div className="font-bold text-[#0f0e0c]" style={{fontSize:12}}>Swap approved</div><div className="text-[#6b6860]" style={{fontSize:10,marginTop:2}}>Jun 18 → Jun 22</div></div>
          </div>

          <div ref={previewRef} className="pf-frame bg-white overflow-hidden border border-black/[.08]"
            style={{borderRadius:'clamp(12px,2vw,24px)',boxShadow:'0 32px 100px rgba(0,0,0,.12)'}}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-black/[.07] bg-[#f8f7f4]" style={{padding:'10px 16px'}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#ff5f56'}}></div>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#ffbd2e'}}></div>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#27c93f'}}></div>
              <div className="flex-1 text-center text-[#9e9b94] bg-black/[.04] rounded-lg" style={{fontSize:10,padding:'3px 8px',margin:'0 8px'}}>app.timso.io/team</div>
            </div>
            {/* App body */}
            <div className="app-preview-grid grid" style={{gridTemplateColumns:'180px 1fr',minHeight:220}}>
              <div className="app-preview-sidebar border-r border-black/[.07] bg-[#f8f7f4]" style={{padding:10}}>
                <div className="tracking-[.1em] uppercase text-[#9e9b94]" style={{fontSize:8,padding:'4px 8px 8px'}}>Team · 18 members</div>
                {TEAM.map((p,i)=>(
                  <div key={p.init} className="a-usl flex items-center gap-2 rounded-xl" style={{padding:'7px 9px',marginBottom:2,animationDelay:`${(i+1)*.1}s`}}>
                    <div className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0" style={{width:24,height:24,fontSize:9,background:p.bg}}>{p.init}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#0f0e0c] truncate" style={{fontSize:10}}>{p.name}</div>
                      <div className="text-[#9e9b94]" style={{fontSize:8,marginTop:1}}>{p.where}</div>
                    </div>
                    <div className={`font-bold rounded-full flex-shrink-0 ${p.tc}`} style={{fontSize:8,padding:'2px 6px'}}>{p.tag}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 bg-white" style={{padding:12}}>
                <div className="grid grid-cols-5 gap-1.5">
                  {WEEK.map(d=>(
                    <div key={d.label} className={`pf-d rounded-xl text-center border ${d.today?'border-[#f97316] bg-orange-50':'border-black/[.07] bg-[#f8f7f4]'}`} style={{padding:'5px 3px'}}>
                      <div className="tracking-[.05em] uppercase text-[#9e9b94]" style={{fontSize:7,marginBottom:2}}>{d.label}</div>
                      <div className={`font-syne font-black ${d.today?'text-[#f97316]':'text-[#0f0e0c]'}`} style={{fontSize:13}}>{d.num}</div>
                      <div className="flex justify-center gap-0.5 mt-1">{d.dots.map((c,i)=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:c}}></div>)}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                  {[['14','In office'],['8','Remote'],['3','Away'],['87%','Utilization']].map(([v,l])=>(
                    <div key={l} className="bg-[#f8f7f4] rounded-xl border border-black/[.07]" style={{padding:'8px 10px'}}>
                      <div className={`font-syne font-black leading-none ${l==='Utilization'?'text-[#f97316]':'text-[#0f0e0c]'}`} style={{fontSize:17}}>{v}</div>
                      <div className="text-[#9e9b94] uppercase tracking-[.05em]" style={{fontSize:7,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="a-rise hero-metrics flex gap-2 justify-center flex-wrap"
          style={{marginTop:'clamp(24px,4vw,44px)',animationDelay:'1.5s'}}>
          {[['2.4K+','Teams using timso'],['98%','Satisfaction rate'],['4 min','Avg setup time'],['14','Integrations']].map(([n,l],i)=>(
            <div key={n} className={`metric-c rv d${i+1} bg-white border border-black/[.07] rounded-2xl text-center`}
              style={{padding:'12px 18px',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
              <div className="font-syne font-black leading-none text-[#0f0e0c]" style={{fontSize:'clamp(22px,4vw,32px)',letterSpacing:'-1px'}}>{n}</div>
              <div className="text-[#6b6860] font-medium whitespace-nowrap" style={{fontSize:'clamp(10px,1.5vw,11px)',marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="overflow-hidden border-t border-b border-black/[.07] mask-x" style={{background:'#f8f7f4',padding:'14px 0'}}>
        <div className="a-mq">
          {[...BRANDS,...BRANDS].map((b,i)=>(
            <span key={i} className="mq-b font-syne font-bold text-[#c8c5be] whitespace-nowrap" style={{fontSize:'clamp(12px,1.8vw,14px)'}}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── BENTO ── */}
      <section id="features" style={{padding:'clamp(56px,8vw,120px) clamp(14px,4vw,64px)'}}>
        <div className="rv text-center" style={{marginBottom:'clamp(32px,5vw,60px)'}}>
          <SectionLabel text="Core Features" />
          <h2 className="font-syne font-black leading-[.98] text-[#0f0e0c]" style={{fontSize:'clamp(28px,5vw,68px)',letterSpacing:'-0.03em',marginBottom:12}}>Built for the way<br/>modern teams work</h2>
          <p className="leading-[1.8] text-[#6b6860] mx-auto" style={{fontSize:'clamp(14px,2vw,17px)',maxWidth:440}}>One platform for all statuses, schedules, and swaps.</p>
        </div>

        <div className="bento-grid grid max-w-[1300px] mx-auto"
          style={{gap:'clamp(8px,1.5vw,16px)',gridTemplateColumns:'repeat(12,1fr)',gridAutoRows:'auto'}}>

          {/* Live board — big */}
          <div className="bc-hover rv rv-l overflow-hidden" style={{gridColumn:'span 7',gridRow:'span 2',background:'#0f0e0c',borderRadius:'clamp(16px,2vw,28px)'}}>
            <div style={{padding:'clamp(22px,3vw,44px) clamp(22px,3vw,44px) clamp(12px,2vw,20px)'}}>
              <span style={{fontSize:'clamp(26px,4vw,40px)',display:'block',marginBottom:14}}>📍</span>
              <h3 className="font-syne font-black leading-[1.1] text-white" style={{fontSize:'clamp(16px,2.5vw,27px)',letterSpacing:'-0.5px',marginBottom:8}}>Live team<br/>location board</h3>
              <p style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'rgba(255,255,255,.45)'}}>See who&apos;s in office, remote, on leave, or unavailable — real-time, every device.</p>
            </div>
            <div style={{padding:'0 clamp(14px,2.5vw,28px) clamp(14px,2.5vw,28px)'}}>
              <div className="app-win overflow-hidden border border-white/[.08]" style={{borderRadius:14,boxShadow:'0 16px 48px rgba(0,0,0,.3)',background:'#f8f7f4'}}>
                <div className="flex items-center gap-1.5 border-b border-black/[.07] bg-[#f2f0eb]" style={{padding:'7px 12px'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#ff5f56'}}></div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#ffbd2e'}}></div>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#27c93f'}}></div>
                  <div className="flex-1 text-center text-[#9e9b94] mx-2" style={{fontSize:9}}>timso · Team Board</div>
                </div>
                {APP_ROWS.map((u,i)=>(
                  <div key={u.init} className="a-usl flex items-center gap-2 bg-white" style={{padding:'7px 12px',animationDelay:`${.1+i*.08}s`}}>
                    <div className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0" style={{width:22,height:22,fontSize:8,background:u.bg}}>{u.init}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#0f0e0c] truncate" style={{fontSize:10}}>{u.n}</div>
                      <div className="text-[#9e9b94] truncate" style={{fontSize:8,marginTop:1}}>{u.s}</div>
                    </div>
                    <div className={`font-bold rounded-full flex-shrink-0 ${u.bc}`} style={{fontSize:8,padding:'2px 6px'}}>{u.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="bc-hover rv d1 overflow-hidden" style={{gridColumn:'span 5',background:'#f97316',borderRadius:'clamp(16px,2vw,28px)'}}>
            <div style={{padding:'clamp(22px,3vw,44px)'}}>
              <span style={{fontSize:'clamp(26px,4vw,40px)',display:'block',marginBottom:14}}>🔗</span>
              <h3 className="font-syne font-black leading-[1.1] text-[#0f0e0c]" style={{fontSize:'clamp(16px,2.5vw,27px)',letterSpacing:'-0.5px',marginBottom:8}}>14+ HRIS<br/>Integrations</h3>
              <p style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'rgba(0,0,0,.55)'}}>Sync from BambooHR, Workday, Hibob &amp; more — automatically.</p>
              <div className="flex flex-wrap" style={{gap:6,marginTop:14}}>
                {['💬 Slack','🟦 Teams','🌿 BambooHR','⚙ Workday','👤 bob'].map(c=>(
                  <div key={c} className="ch-c rounded-full font-semibold text-[#0f0e0c]" style={{fontSize:11,padding:'5px 12px',background:'rgba(0,0,0,.12)',border:'1px solid rgba(0,0,0,.1)'}}>{c}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Counter */}
          <div className="bc-hover rv d2 overflow-hidden" style={{gridColumn:'span 5',background:'#1e1c19',borderRadius:'clamp(16px,2vw,28px)'}}>
            <div style={{padding:'clamp(22px,3vw,44px)'}}>
              <span style={{fontSize:'clamp(26px,4vw,40px)',display:'block',marginBottom:14}}>⚡</span>
              <div ref={counterRef} className="font-syne font-black text-[#f97316]" style={{fontSize:'clamp(44px,6vw,80px)',letterSpacing:'-4px',lineHeight:1,margin:'8px 0 4px'}}>0</div>
              <p style={{fontSize:'clamp(11px,1.5vw,13px)',lineHeight:1.75,color:'rgba(255,255,255,.45)'}}>minutes saved per employee each week</p>
              <h3 className="font-syne font-black text-white" style={{fontSize:'clamp(15px,2vw,22px)',letterSpacing:'-0.5px',marginTop:10}}>Hours back,<br/>every week</h3>
            </div>
          </div>

          {/* Custom statuses */}
          <div className="bc-hover rv d1 bg-[#f8f7f4] border border-black/[.07] overflow-hidden" style={{gridColumn:'span 4',borderRadius:'clamp(16px,2vw,28px)'}}>
            <div style={{padding:'clamp(22px,3vw,44px)'}}>
              <span style={{fontSize:'clamp(26px,4vw,40px)',display:'block',marginBottom:14}}>✨</span>
              <h3 className="font-syne font-black leading-[1.1] text-[#0f0e0c]" style={{fontSize:'clamp(16px,2.5vw,27px)',letterSpacing:'-0.5px',marginBottom:8}}>Custom<br/>Statuses</h3>
              <p style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'#6b6860'}}>Build your own status library per team.</p>
              <div className="flex flex-wrap" style={{gap:6,marginTop:12}}>
                <div className="ch-c rounded-full font-semibold text-[#0f0e0c]" style={{fontSize:11,padding:'5px 12px',background:'rgba(249,115,22,.12)',border:'1px solid rgba(249,115,22,.2)'}}>🏢 Office</div>
                {['🏠 Remote','✈ Travel'].map(c=><div key={c} className="ch-c rounded-full font-semibold text-[#0f0e0c] bg-[#f8f7f4] border border-black/[.07]" style={{fontSize:11,padding:'5px 12px'}}>{c}</div>)}
                <div className="ch-c rounded-full font-semibold text-[#0f0e0c]" style={{fontSize:11,padding:'5px 12px',border:'2px dashed #c8c5be',background:'transparent'}}>+ New</div>
              </div>
            </div>
          </div>

          {/* Day swaps */}
          <div className="bc-hover rv d2 overflow-hidden" style={{gridColumn:'span 4',background:'#0f0e0c',borderRadius:'clamp(16px,2vw,28px)'}}>
            <div style={{padding:'clamp(22px,3vw,44px)'}}>
              <span style={{fontSize:'clamp(26px,4vw,40px)',display:'block',marginBottom:14}}>🔄</span>
              <h3 className="font-syne font-black leading-[1.1] text-white" style={{fontSize:'clamp(16px,2.5vw,27px)',letterSpacing:'-0.5px',marginBottom:8}}>Smart Day<br/>Swaps</h3>
              <p style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'rgba(255,255,255,.45)'}}>Request, approve, and track swaps in seconds.</p>
              <div className="rounded-2xl" style={{background:'rgba(255,255,255,.07)',padding:14,marginTop:14}}>
                <div className="flex justify-between" style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:10}}>
                  <span>📅 Jun 18</span><span style={{color:'#f97316'}}>→</span><span>📅 Jun 22</span>
                </div>
                <div className="rounded-lg p-2 text-center font-black text-[#0f0e0c]" style={{background:'#f97316',fontSize:12}}>✓ Swap Approved</div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bc-hover rv d3 bg-white border border-black/[.07] overflow-hidden" style={{gridColumn:'span 4',borderRadius:'clamp(16px,2vw,28px)'}}>
            <div style={{padding:'clamp(22px,3vw,44px)'}}>
              <span style={{fontSize:'clamp(26px,4vw,40px)',display:'block',marginBottom:14}}>📈</span>
              <h3 className="font-syne font-black leading-[1.1] text-[#0f0e0c]" style={{fontSize:'clamp(16px,2.5vw,27px)',letterSpacing:'-0.5px',marginBottom:8}}>Office<br/>Analytics</h3>
              <p style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'#6b6860'}}>Understand utilization to plan smarter.</p>
              <div className="flex gap-1 items-end" style={{height:48,marginTop:14}}>
                {[['55%',true],['72%',true],['40%',true],['88%',true],['65%',true],['78%',false],['58%',false]].map(([h,f],i)=>(
                  <div key={i} className="bar-c flex-1" style={{height:h as string,background:f?'#f97316':'rgba(249,115,22,.18)'}}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{padding:'0 clamp(14px,3vw,48px)'}}>
        <div className="how-inner relative overflow-hidden"
          style={{background:'#0f0e0c',borderRadius:'clamp(20px,3vw,44px)',padding:'clamp(52px,7vw,100px) clamp(22px,5vw,80px)'}}>
          <div className="absolute pointer-events-none rounded-full" style={{width:600,height:600,background:'radial-gradient(circle,rgba(249,115,22,.09),transparent 70%)',top:-200,right:-100}}></div>
          <div className="rv text-center">
            <SectionLabel text="Process" />
            <h2 className="font-syne font-black leading-[.98] text-white mx-auto" style={{fontSize:'clamp(26px,5vw,68px)',letterSpacing:'-0.03em',maxWidth:540}}>Up and running<br/>in 3 simple steps</h2>
          </div>
          <div className="how-steps-grid grid relative" style={{gridTemplateColumns:'repeat(3,1fr)',marginTop:'clamp(36px,6vw,80px)'}}>
            <div className="how-connector absolute h-px" style={{top:52,left:'calc(100%/6)',right:'calc(100%/6)',background:'linear-gradient(to right,transparent,rgba(249,115,22,.3) 30%,rgba(249,115,22,.3) 70%,transparent)'}}></div>
            {HOW_STEPS.map((s,i)=>(
              <div key={s.num} className={`how-step rv d${i+1} text-center`} style={{padding:'0 clamp(10px,3vw,36px)'}}>
                <div className="step-b rounded-full border flex items-center justify-center font-syne font-black text-[#f97316] mx-auto relative z-10"
                  style={{width:46,height:46,fontSize:13,borderColor:'rgba(249,115,22,.3)',background:'rgba(249,115,22,.08)',marginBottom:'clamp(14px,2.5vw,28px)'}}>{s.num}</div>
                <span style={{fontSize:'clamp(20px,3vw,28px)',display:'block',marginBottom:10}}>{s.icon}</span>
                <div className="font-syne font-black text-white" style={{fontSize:'clamp(14px,2vw,21px)',letterSpacing:'-0.5px',marginBottom:8}}>{s.h}</div>
                <div style={{fontSize:'clamp(12px,1.5vw,14px)',lineHeight:1.75,color:'rgba(255,255,255,.38)'}}>{s.p}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPOTLIGHT ── */}
      <section style={{padding:'clamp(56px,8vw,120px) clamp(14px,4vw,64px)'}}>
        <div className="spotlight-grid grid items-center mx-auto" style={{gridTemplateColumns:'1fr 1fr',gap:'clamp(24px,5vw,80px)',maxWidth:1200}}>
          {/* Swap UI */}
          <div className="sv rv-l bg-white overflow-hidden border border-black/[.07]" style={{borderRadius:'clamp(16px,2vw,28px)',boxShadow:'0 20px 60px rgba(0,0,0,.08)'}}>
            <div className="flex items-center justify-between font-syne font-black text-[#0f0e0c]"
              style={{background:'#f97316',padding:'16px 22px',fontSize:'clamp(13px,2vw,16px)'}}>
              <span>🔄 Request Day Swap</span>
              <span className="font-medium opacity-70" style={{fontSize:11}}>timso</span>
            </div>
            <div className="bg-white flex flex-col" style={{padding:'16px 20px',gap:8}}>
              {[{dot:'#4ade80',l:'🏢 Office',active:false},{dot:'#f97316',l:'🔄 Swap Days',active:true},{dot:'#94a3b8',l:'🌙 Day Off',active:false},{dot:'#f59e0b',l:'✈ Travel',active:false}].map(it=>(
                <div key={it.l} className={`swap-it flex items-center gap-3 rounded-xl font-medium border-[1.5px] ${it.active?'bg-[#0f0e0c] text-white border-[#0f0e0c]':'bg-[#f8f7f4] text-[#0f0e0c] border-transparent'}`}
                  style={{padding:'11px 14px',fontSize:'clamp(11px,1.5vw,13px)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:it.dot,flexShrink:0}}></div>{it.l}
                </div>
              ))}
              <div className="rounded-2xl" style={{background:'rgba(249,115,22,.08)',padding:14,border:'1px solid rgba(249,115,22,.25)',marginTop:6}}>
                <div className="flex gap-2" style={{marginBottom:10}}>
                  <div className="bg-white rounded-xl flex-1 font-semibold text-[#0f0e0c] border border-black/[.07]" style={{padding:'7px 10px',fontSize:11}}>Jun 18, 2025</div>
                  <span className="font-bold text-[#0f0e0c] self-center" style={{fontSize:16}}>→</span>
                  <div className="bg-white rounded-xl flex-1 font-semibold text-[#6b6860] border border-black/[.07]" style={{padding:'7px 10px',fontSize:11}}>Select date</div>
                </div>
                <div className="font-semibold text-[#6b6860]" style={{fontSize:11,marginBottom:6}}>When away, contact:</div>
                <div className="bg-white rounded-xl flex justify-between items-center font-semibold text-[#0f0e0c] border border-black/[.07]" style={{padding:'7px 10px',fontSize:11,marginBottom:10}}>
                  <span>👤 Nina Simonov</span><span className="opacity-30">✕</span>
                </div>
                <button className="snd w-full bg-[#0f0e0c] text-white border-none rounded-xl font-bold font-outfit" style={{padding:11,fontSize:12}}>Send Swap Request</button>
              </div>
            </div>
          </div>

          {/* Text side */}
          <div className="rv-r">
            <SectionLabel text="Scheduling" />
            <h2 className="font-syne font-black leading-[.98] text-[#0f0e0c]" style={{fontSize:'clamp(24px,4vw,64px)',letterSpacing:'-0.03em',marginBottom:14}}>Flexible offices<br/>made effortless</h2>
            <p className="leading-[1.8] text-[#6b6860]" style={{fontSize:'clamp(13px,1.8vw,17px)',maxWidth:460}}>Hybrid teams need tools that flex. Timso gives everyone the power to manage their schedule without the email chaos.</p>
            <div className="flex flex-col" style={{gap:10,marginTop:20}}>
              {[{icon:'🔄',h:'One-tap swap requests',p:'Submit, approve, track changes in seconds.'},{icon:'📣',h:'Auto-notify your team',p:'Slack & Teams get automatic schedule updates.'},{icon:'📊',h:'Coverage insights',p:"Know if your office will be under-staffed early."}].map((f,i)=>(
                <div key={f.h} className={`sp-feat rv d${i+1} flex items-start rounded-2xl border border-black/[.07] bg-white`}
                  style={{gap:12,padding:'clamp(12px,2vw,16px)',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                  <div className="sp-icon rounded-xl bg-[#f8f7f4] flex items-center justify-center flex-shrink-0" style={{width:38,height:38,fontSize:18}}>{f.icon}</div>
                  <div>
                    <div className="font-bold text-[#0f0e0c]" style={{fontSize:13,marginBottom:3}}>{f.h}</div>
                    <div className="text-[#6b6860] leading-[1.6]" style={{fontSize:12}}>{f.p}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{paddingTop:'clamp(56px,8vw,120px)',paddingBottom:0}}>
        <div className="rv text-center" style={{marginBottom:'clamp(32px,5vw,56px)',padding:'0 clamp(14px,4vw,64px)'}}>
          <SectionLabel text="Reviews" />
          <h2 className="font-syne font-black leading-[.98] text-[#0f0e0c]" style={{fontSize:'clamp(26px,5vw,68px)',letterSpacing:'-0.03em'}}>Teams that switched<br/>never looked back</h2>
        </div>
        <div className="overflow-hidden mask-x">
          <div className="a-ts" style={{paddingBottom:8}}>
            {[...TESTIMONIALS,...TESTIMONIALS].map((t,i)=>(
              <div key={i} className="t-card flex-shrink-0 bg-white rounded-3xl border border-black/[.07]"
                style={{width:'clamp(260px,38vw,360px)',padding:'clamp(20px,3vw,32px)',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
                <div className="text-[#f97316] tracking-[3px]" style={{fontSize:12,marginBottom:12}}>★★★★★</div>
                <p className="leading-[1.8] text-[#6b6860]" style={{fontSize:'clamp(12px,1.5vw,14px)',marginBottom:16}}>{t.txt}</p>
                <div className="flex items-center" style={{gap:12}}>
                  <div className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0" style={{width:40,height:40,fontSize:13,background:t.avBg}}>{t.av}</div>
                  <div>
                    <div className="font-bold text-[#0f0e0c]" style={{fontSize:13}}>{t.nm}</div>
                    <div className="text-[#6b6860]" style={{fontSize:11,marginTop:2}}>{t.rl}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative overflow-hidden" style={{background:'#f8f7f4',padding:'clamp(56px,8vw,120px) clamp(14px,4vw,64px)'}}>
        <div className="absolute rounded-full pointer-events-none" style={{width:700,height:700,background:'radial-gradient(circle,rgba(249,115,22,.07),transparent 70%)',top:-300,right:-200}}></div>
        <div className="rv text-center">
          <SectionLabel text="Pricing" />
          <h2 className="font-syne font-black leading-[.98] text-[#0f0e0c]" style={{fontSize:'clamp(26px,5vw,68px)',letterSpacing:'-0.03em',marginBottom:12}}>Simple, honest pricing</h2>
          <p className="leading-[1.8] text-[#6b6860] mx-auto" style={{fontSize:'clamp(14px,2vw,17px)',maxWidth:460}}>No hidden fees. Cancel anytime.</p>
          <div className="rv d1 inline-flex items-center bg-white rounded-full border border-black/[.07]" style={{gap:4,padding:5,boxShadow:'0 2px 8px rgba(0,0,0,.05)',marginTop:24}}>
            {(['m','y'] as const).map(m=>(
              <button key={m} onClick={()=>setBilling(m)}
                className={`rounded-full font-semibold border-none font-outfit ${billing===m?'bg-[#0f0e0c] text-white':'text-[#6b6860] bg-transparent'}`}
                style={{fontSize:13,padding:'8px 20px',transition:'all .3s'}}>
                {m==='m'?'Monthly':<>Yearly <span style={{color:'#f97316',fontSize:11,fontWeight:'bold'}}>−20%</span></>}
              </button>
            ))}
          </div>
        </div>

        <div className="pricing-grid grid mx-auto" style={{gap:'clamp(12px,2vw,20px)',gridTemplateColumns:'repeat(3,1fr)',maxWidth:1100,marginTop:'clamp(28px,4vw,48px)'}}>
          {/* Starter */}
          <div className="p-card rv d1 bg-white border border-black/[.07] relative overflow-hidden" style={{borderRadius:'clamp(16px,2vw,28px)',padding:'clamp(22px,3vw,44px)',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
            <div className="font-bold tracking-[.13em] uppercase text-[#6b6860]" style={{fontSize:11,marginBottom:12}}>Starter</div>
            <div className="font-syne font-black leading-none text-[#0f0e0c]" style={{fontSize:'clamp(36px,5vw,60px)',letterSpacing:'-3px',marginBottom:4}}>$0</div>
            <div className="text-[#6b6860]" style={{fontSize:12,marginBottom:20}}>per user / month · forever free</div>
            <div className="h-px bg-black/[.07]" style={{margin:'16px 0'}}></div>
            {['Up to 10 team members','3 custom statuses','Slack integration','7-day history'].map(f=>(
              <div key={f} className="flex items-center gap-2.5 text-[#0f0e0c]" style={{fontSize:13,marginBottom:10}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:`${CHECK_SVG} rgba(249,115,22,.12)`,flexShrink:0}}></div>{f}
              </div>
            ))}
            <button className="ghost-p w-full rounded-2xl bg-transparent border font-bold font-outfit text-[#0f0e0c] border-black/[.12]" style={{fontSize:13,padding:13,marginTop:20}} onClick={()=>router.push('/register')}>Get started free</button>
          </div>

          {/* Pro */}
          <div className="p-card p-popular rv d2 border-0 relative overflow-hidden" style={{borderRadius:'clamp(16px,2vw,28px)',padding:'clamp(22px,3vw,44px)',background:'#0f0e0c'}}>
            <div className="absolute bg-[#f97316] text-[#0f0e0c] font-black tracking-[.08em] uppercase rounded-full" style={{fontSize:10,padding:'4px 10px',top:16,right:16}}>Most popular</div>
            <div className="font-bold tracking-[.13em] uppercase" style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:12}}>Pro</div>
            <div className="font-syne font-black leading-none text-white" style={{fontSize:'clamp(36px,5vw,60px)',letterSpacing:'-3px',marginBottom:4}}>{billing==='y'?'$6':'$8'}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:20}}>{billing==='y'?'per user / month, billed yearly':'per user / month, billed monthly'}</div>
            <div className="h-px" style={{background:'rgba(255,255,255,.1)',margin:'16px 0'}}></div>
            {['Unlimited members','Unlimited statuses','All 14+ integrations','Advanced analytics','Day swap workflows'].map(f=>(
              <div key={f} className="flex items-center gap-2.5" style={{fontSize:13,color:'rgba(255,255,255,.7)',marginBottom:10}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:`${CHECK_SVG} rgba(249,115,22,.18)`,flexShrink:0}}></div>{f}
              </div>
            ))}
            <button className="solid-p w-full rounded-2xl bg-[#f97316] text-[#0f0e0c] border-none font-bold font-outfit" style={{fontSize:13,padding:13,marginTop:20}} onClick={()=>router.push('/register')}>Start 14-day free trial</button>
          </div>

          {/* Enterprise */}
          <div className="p-card p-ent rv d3 bg-white border border-black/[.07] relative overflow-hidden" style={{borderRadius:'clamp(16px,2vw,28px)',padding:'clamp(22px,3vw,44px)',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
            <div className="font-bold tracking-[.13em] uppercase text-[#6b6860]" style={{fontSize:11,marginBottom:12}}>Enterprise</div>
            <div className="font-syne font-black leading-none text-[#0f0e0c]" style={{fontSize:'clamp(26px,3.5vw,40px)',letterSpacing:'-1px',marginBottom:4,paddingTop:4}}>Custom</div>
            <div className="text-[#6b6860]" style={{fontSize:12,marginBottom:20}}>tailored to your needs</div>
            <div className="h-px bg-black/[.07]" style={{margin:'16px 0'}}></div>
            {['Everything in Pro','SSO & SAML','Custom HRIS sync','SLA + dedicated support'].map(f=>(
              <div key={f} className="flex items-center gap-2.5 text-[#0f0e0c]" style={{fontSize:13,marginBottom:10}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:`${CHECK_SVG} rgba(249,115,22,.12)`,flexShrink:0}}></div>{f}
              </div>
            ))}
            <button className="ghost-p w-full rounded-2xl bg-transparent border font-bold font-outfit text-[#0f0e0c] border-black/[.12]" style={{fontSize:13,padding:13,marginTop:20}}>Contact sales</button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{padding:'clamp(56px,8vw,120px) clamp(14px,4vw,64px)'}}>
        <div className="rv text-center" style={{marginBottom:36}}>
          <SectionLabel text="FAQ" />
          <h2 className="font-syne font-black leading-[.98] text-[#0f0e0c]" style={{fontSize:'clamp(26px,5vw,68px)',letterSpacing:'-0.03em'}}>Questions? We&apos;ve<br/>got answers.</h2>
        </div>
        <div className="mx-auto" style={{maxWidth:820,marginTop:32}}>
          {FAQ_ITEMS.map((item,i)=>(
            <div key={i} className={`rv d${Math.min(i+1,4)} border-b border-black/[.07] ${faq===i?'faq-open':''}`}>
              <div className="faq-row flex items-center justify-between font-syne font-bold text-[#0f0e0c] select-none"
                style={{padding:'clamp(14px,2.5vw,22px) 0',fontSize:'clamp(14px,2.2vw,19px)',letterSpacing:'-0.3px',gap:12,cursor:'pointer'}}
                onClick={()=>setFaq(faq===i?null:i)}>
                {item.q}
                <div className="faq-icon rounded-full border border-black/[.12] flex items-center justify-center flex-shrink-0 text-[#0f0e0c]" style={{width:32,height:32,fontSize:18}}>+</div>
              </div>
              <div className="faq-ans leading-[1.8] text-[#6b6860]" style={{fontSize:'clamp(13px,1.8vw,15px)'}}>{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="rv cta-wrap relative text-center a-ctap overflow-hidden"
        style={{background:'#0f0e0c',margin:'0 clamp(8px,1.5vw,24px) clamp(40px,6vw,80px)',borderRadius:'clamp(20px,3vw,44px)',padding:'clamp(52px,8vw,130px) clamp(20px,5vw,80px)'}}>
        <div className="absolute rounded-full a-sf1" style={{width:300,height:300,background:'#f97316',opacity:.07,top:-100,left:'5%'}}></div>
        <div className="absolute rounded-full a-sf2" style={{width:200,height:200,background:'#5c3bff',opacity:.07,bottom:-60,right:'10%'}}></div>
        <h2 className="font-syne font-black leading-[.92] text-white mx-auto relative z-10"
          style={{fontSize:'clamp(30px,8vw,96px)',letterSpacing:'clamp(-1.5px,-0.04em,-3px)',maxWidth:860,marginBottom:'clamp(24px,4vw,50px)'}}>
          Stop asking<br/><span style={{color:'#f97316'}}>&quot;who&apos;s in today?&quot;</span>
        </h2>
        <div className="cta-btns flex gap-3 justify-center items-center relative z-10 flex-wrap">
          <button className="bg-[#f97316] text-[#0f0e0c] border-none font-black font-outfit rounded-full"
            style={{fontSize:'clamp(13px,2vw,16px)',padding:'clamp(13px,2vw,18px) clamp(26px,4vw,44px)',transition:'transform .3s,box-shadow .3s'}}
            onClick={()=>router.push('/register')}>Start for free</button>
          <button className="text-white font-semibold font-outfit rounded-full"
            style={{fontSize:'clamp(13px,2vw,16px)',padding:'clamp(13px,2vw,18px) clamp(26px,4vw,44px)',background:'rgba(255,255,255,.08)',border:'1.5px solid rgba(255,255,255,.15)',transition:'background .3s,transform .3s'}}>
            Talk to sales
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{background:'#0f0e0c',padding:'clamp(36px,5vw,70px) clamp(14px,4vw,64px) clamp(24px,4vw,44px)'}}>
        <div className="footer-grid grid" style={{gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'clamp(20px,4vw,56px)',marginBottom:'clamp(32px,5vw,56px)'}}>
          <div className="footer-brand">
            <div className="font-syne font-black text-white flex items-center" style={{fontSize:'clamp(18px,2.5vw,26px)',gap:5,marginBottom:12}}>
              timso<span className="relative inline-block rounded-full border-[2.5px] a-logo" style={{width:10,height:10,borderColor:'rgba(255,255,255,.5)',flexShrink:0}}></span>
            </div>
            <p className="leading-[1.8]" style={{fontSize:'clamp(12px,1.5vw,14px)',color:'rgba(255,255,255,.3)',maxWidth:260}}>The hybrid work platform that keeps distributed teams aligned and in sync — without the chaos.</p>
          </div>
          {([['Product',['Features','Integrations','Pricing','Changelog']],['Company',['About','Blog','Careers','Press']],['Legal',['Privacy','Terms','Security','GDPR']]] as [string,string[]][]).map(([title,links])=>(
            <div key={title}>
              <div className="font-bold tracking-[.14em] uppercase" style={{fontSize:'clamp(9px,1.2vw,11px)',color:'rgba(255,255,255,.25)',marginBottom:16}}>{title}</div>
              <ul className="list-none" style={{padding:0,margin:0,display:'flex',flexDirection:'column',gap:10}}>
                {links.map(l=>(
                  <li key={l}><a href="#" className="ft-a no-underline" style={{fontSize:'clamp(12px,1.5vw,14px)',color:'rgba(255,255,255,.4)',transition:'color .3s'}}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center flex-wrap border-t" style={{borderColor:'rgba(255,255,255,.06)',paddingTop:'clamp(14px,2.5vw,28px)',gap:12}}>
          <div style={{fontSize:'clamp(10px,1.3vw,12px)',color:'rgba(255,255,255,.18)'}}>© 2025 Timso Inc. All rights reserved.</div>
          <div className="flex" style={{gap:8}}>
            {['𝕏','in','▶','⬡'].map(s=>(
              <div key={s} className="soc-b rounded-full flex items-center justify-center text-white border" style={{width:36,height:36,fontSize:13,background:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.08)'}}>{s}</div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}