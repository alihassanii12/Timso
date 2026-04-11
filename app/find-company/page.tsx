'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null;
const authH = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface User { id?:number|string; full_name?:string; username?:string; email?:string; profile_picture?:string; bio?:string; skills?:string; experience?:string; location?:string; phone_number?:string; cv_url?:string; }
interface Company { id:number|string; name:string; description?:string; admin_id:number|string; logo_url?:string; }
interface Job { id:number|string; title:string; description?:string; location:string; type:string; salary?:string; tags:string[]; created_at:string; }
interface JobApplication { id:number|string; job_id:number|string; status:string; }

const COLORS = ['#f97316','#a78bfa','#fbbf24','#34d399','#fb7185','#60a5fa'];
const getColor = (id:number|string) => COLORS[Number(id)%COLORS.length];
const getInit = (n?:string) => (n||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const timeAgo = (d:string) => { try { const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60)return s+'s ago'; if(s<3600)return Math.floor(s/60)+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; } catch { return d; } };





export default function FindCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User|null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company|null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [applying, setApplying] = useState<number|string|null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({fullName:'',username:'',phone:'',location:'',bio:'',skills:'',experience:'',cvUrl:''});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const showToast = (msg:string, type:'success'|'error'='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // Initial load — only runs once
  useEffect(() => {
    const loadUser = async () => {
      try {
        const r = await axios.get(`${API}/api/auth/me`, {withCredentials:true, headers:authH()});
        const u = r.data?.user||r.data?.data?.user||r.data?.data||r.data;
        if (!u) { router.push('/login'); return; }
        if (u?.role==='admin') { router.push('/admin/admin-dashboard'); return; }
        if (u?.company_id) { router.push('/user/user-dashboard'); return; }
        setUser(u);
        setProfileForm({ fullName:u.full_name||'', username:u.username||'', phone:u.phone_number||'', location:u.location||'', bio:u.bio||'', skills:u.skills||'', experience:u.experience||'', cvUrl:u.cv_url||'' });
      } catch { router.push('/login'); }
    };
    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll only for company_id acceptance — does NOT touch form state
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await axios.get(`${API}/api/auth/me`, {withCredentials:true, headers:authH()});
        const u = r.data?.user||r.data?.data?.user||r.data?.data||r.data;
        if (u?.company_id) { clearInterval(interval); setRedirecting(true); router.push('/user/user-dashboard'); }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanies = useCallback(async () => {
    try { const r=await axios.get(`${API}/api/companies`,{withCredentials:true,headers:authH()}); setCompanies(r.data?.companies||[]); }
    catch { setCompanies([]); } finally { setLoadingCompanies(false); }
  }, []);

  const fetchMyApplications = useCallback(async () => {
    try { const r=await axios.get(`${API}/api/jobs/my-applications`,{withCredentials:true,headers:authH()}); setMyApplications(r.data?.data?.applications||[]); }
    catch { setMyApplications([]); }
  }, []);

  useEffect(() => { fetchCompanies(); fetchMyApplications(); }, [fetchCompanies, fetchMyApplications]);

  const fetchJobs = useCallback(async (companyId:number|string) => {
    setLoadingJobs(true);
    try { const r=await axios.get(`${API}/api/jobs/company/${companyId}`,{withCredentials:true,headers:authH()}); setJobs(r.data?.data?.jobs||[]); }
    catch { setJobs([]); } finally { setLoadingJobs(false); }
  }, []);

  const selectCompany = (company:Company) => { setSelectedCompany(company); setJobs([]); fetchJobs(company.id); };

  const handleApply = async (jobId:number|string, title:string) => {
    setApplying(jobId);
    try { await axios.post(`${API}/api/jobs/${jobId}/apply`,{},{withCredentials:true,headers:authH()}); showToast(`Applied to "${title}"!`); fetchMyApplications(); if(selectedCompany) fetchJobs(selectedCompany.id); }
    catch(err:unknown) { const ax=err as {response?:{data?:{message?:string}}}; showToast(ax?.response?.data?.message||'Failed','error'); }
    finally { setApplying(null); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const r = await axios.put(`${API}/api/auth/profile`, { fullName:profileForm.fullName, username:profileForm.username, phoneNumber:profileForm.phone, location:profileForm.location, bio:profileForm.bio, skills:profileForm.skills, experience:profileForm.experience, cvUrl:profileForm.cvUrl }, {withCredentials:true,headers:authH()});
      if (r.data?.success) { setUser(prev=>({...prev,...r.data.user})); showToast('Profile saved!'); }
    } catch(e:unknown) { const ax=e as {response?:{data?:{message?:string}}}; showToast(ax?.response?.data?.message||'Failed','error'); }
    finally { setSavingProfile(false); }
  };

  const uploadAvatar = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(!f) return; setUploadingAvatar(true);
    try {
      const fd=new FormData(); fd.append('avatar',f);
      const r=await axios.post(`${API}/api/avatar/upload`,fd,{headers:{...authH(),'Content-Type':'multipart/form-data'},withCredentials:true});
      if(r.data?.success) { setUser(prev=>({...prev,profile_picture:r.data.data.avatar_url})); showToast('Photo updated!'); }
    } catch { showToast('Upload failed','error'); } finally { setUploadingAvatar(false); }
  };

  const getAppStatus = (jobId:number|string) => myApplications.find(a=>String(a.job_id)===String(jobId));
  const filtered = companies.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||(c.description||'').toLowerCase().includes(search.toLowerCase()));
  const skills = profileForm.skills ? profileForm.skills.split(',').map(s=>s.trim()).filter(Boolean) : [];

  const inp:React.CSSProperties = {width:'100%',border:'1px solid #e0e0e0',borderRadius:8,padding:'8px 11px',fontSize:13,fontFamily:'Outfit,sans-serif',outline:'none',background:'#fff',color:'#111',boxSizing:'border-box'};
  const ta:React.CSSProperties = {...inp,resize:'vertical',minHeight:72};
  const lbl:React.CSSProperties = {fontSize:11,fontWeight:700,color:'#666',display:'block',marginBottom:4};

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',fontFamily:'Outfit,sans-serif',background:'#f5f5f5'}}>
      {toast&&<div style={{position:'fixed',bottom:20,right:20,zIndex:9999,padding:'11px 16px',borderRadius:12,fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,background:toast.type==='success'?'#111':'#ef4444',color:'#fff',boxShadow:'0 6px 24px rgba(0,0,0,.15)'}}>{toast.type==='success'?'✓':'✕'} {toast.msg}</div>}

      {/* LEFT PANEL */}
      <div style={{width:360,flexShrink:0,borderRight:'1.5px solid #ebebeb',display:'flex',flexDirection:'column',background:'#fff',overflow:'hidden'}}>
        {/* Top bar */}
        <div style={{padding:'14px 16px',borderBottom:'1.5px solid #ebebeb',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <button onClick={()=>router.push('/login')} style={{width:30,height:30,borderRadius:8,border:'1.5px solid #e5e5e5',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:900,letterSpacing:'-.3px',color:'#111'}}>Find Company</div>
            <div style={{fontSize:11,color:'#aaa'}}>{filtered.length} companies</div>
          </div>
        </div>

        {/* MY PROFILE SECTION */}
        <div style={{borderBottom:'1.5px solid #ebebeb',flexShrink:0}}>
          <button onClick={()=>setShowProfile(p=>!p)} style={{width:'100%',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,background:'none',border:'none',cursor:'pointer',fontFamily:'Outfit,sans-serif',textAlign:'left'}}>
            <div style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',position:'relative',background:getColor(user?.full_name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {user?.profile_picture&&(user.profile_picture.startsWith('data:')||user.profile_picture.startsWith('http'))&&<img src={user.profile_picture} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
              <span style={{fontSize:13,fontWeight:800,color:'#fff'}}>{getInit(user?.full_name||user?.username)}</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.full_name||user?.username||'My Profile'}</div>
              <div style={{fontSize:11,color:'#aaa'}}>{showProfile?'Hide profile':'Edit profile & skills'}</div>
            </div>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#aaa" strokeWidth="2.5" style={{transform:showProfile?'rotate(90deg)':'rotate(0)',transition:'transform .2s',flexShrink:0}}><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {showProfile&&(
            <div style={{padding:'0 16px 16px',display:'flex',flexDirection:'column',gap:10,maxHeight:400,overflowY:'auto'}}>
              {/* Avatar */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',position:'relative',background:getColor(user?.full_name?.charCodeAt(0)||0),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {user?.profile_picture&&(user.profile_picture.startsWith('data:')||user.profile_picture.startsWith('http'))&&<img src={user.profile_picture} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
                  <span style={{fontSize:16,fontWeight:800,color:'#fff'}}>{getInit(user?.full_name||user?.username)}</span>
                </div>
                <label style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,background:'#111',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                  {uploadingAvatar?'Uploading...':'Change Photo'}
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={uploadAvatar}/>
                </label>
              </div>
              {/* Basic */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div><label style={lbl}>Full Name</label><input style={inp} value={profileForm.fullName} onChange={e=>setProfileForm(p=>({...p,fullName:e.target.value}))} placeholder="Your name"/></div>
                <div><label style={lbl}>Username</label><input style={inp} value={profileForm.username} onChange={e=>setProfileForm(p=>({...p,username:e.target.value}))} placeholder="username"/></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={profileForm.phone} onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} placeholder="+92 300..."/></div>
                <div><label style={lbl}>Location</label><input style={inp} value={profileForm.location} onChange={e=>setProfileForm(p=>({...p,location:e.target.value}))} placeholder="City, Country"/></div>
              </div>
              <div><label style={lbl}>Bio</label><textarea style={ta} value={profileForm.bio} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} placeholder="Tell employers about yourself..."/></div>
              <div>
                <label style={lbl}>Skills <span style={{fontWeight:400,color:'#bbb'}}>(comma separated)</span></label>
                <input style={inp} value={profileForm.skills} onChange={e=>setProfileForm(p=>({...p,skills:e.target.value}))} placeholder="React, Node.js, TypeScript..."/>
                {skills.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>{skills.map((s,i)=><span key={i} style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,background:'rgba(167,139,250,.15)',color:'#a78bfa'}}>{s}</span>)}</div>}
              </div>
              <div><label style={lbl}>Experience</label><textarea style={ta} value={profileForm.experience} onChange={e=>setProfileForm(p=>({...p,experience:e.target.value}))} placeholder="Work history, projects..."/></div>
              <div><label style={lbl}>CV / Portfolio URL</label><input style={inp} value={profileForm.cvUrl} onChange={e=>setProfileForm(p=>({...p,cvUrl:e.target.value}))} placeholder="https://drive.google.com/..."/></div>
              <button onClick={saveProfile} disabled={savingProfile} style={{padding:'9px',borderRadius:9,border:'none',background:'#111',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>
                {savingProfile?'Saving...':'Save Profile'}
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{padding:'10px 14px',borderBottom:'1.5px solid #ebebeb',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#f5f5f5',border:'1.5px solid transparent',borderRadius:10,padding:'7px 11px'}}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#aaa" strokeWidth="2.2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input style={{flex:1,border:'none',outline:'none',fontSize:13,fontFamily:'Outfit,sans-serif',color:'#111',background:'transparent'}} placeholder="Search companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
            {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'#bbb',padding:0,display:'flex'}}><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg></button>}
          </div>
        </div>

        {/* Companies list */}
        <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
          {loadingCompanies?[1,2,3].map(i=>(
            <div key={i} style={{padding:'10px 12px',display:'flex',gap:10,marginBottom:4}}>
              <div style={{width:34,height:34,borderRadius:10,background:'#f0f0f0',flexShrink:0}}/>
              <div style={{flex:1}}><div style={{height:11,background:'#f0f0f0',borderRadius:4,width:'60%',marginBottom:5}}/><div style={{height:9,background:'#f0f0f0',borderRadius:4,width:'80%'}}/></div>
            </div>
          )):filtered.length===0?(
            <div style={{textAlign:'center',padding:'28px 16px',color:'#aaa'}}>
              <div style={{fontSize:28,marginBottom:8}}>🏙️</div>
              <div style={{fontSize:13,fontWeight:600}}>{search?'No results':'No companies yet'}</div>
            </div>
          ):filtered.map((company,i)=>(
            <div key={company.id} onClick={()=>selectCompany(company)} style={{padding:'10px 12px',borderRadius:11,cursor:'pointer',transition:'all .12s',border:'1.5px solid '+(selectedCompany?.id===company.id?'rgba(249,115,22,.3)':'transparent'),background:selectedCompany?.id===company.id?'rgba(249,115,22,.05)':'transparent',marginBottom:4,display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:34,height:34,borderRadius:10,background:'rgba(249,115,22,.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                {company.logo_url?(
                  <img src={company.logo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ):(
                  <span style={{fontSize:13,fontWeight:800,color:'#f97316'}}>{company.name.slice(0,2).toUpperCase()}</span>
                )}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:800,color:'#111',marginBottom:2}}>{company.name}</div>
                <div style={{fontSize:11,color:'#aaa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{company.description||'Click to view jobs'}</div>
              </div>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#ccc" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{flex:1,overflowY:'auto',background:'#f5f5f5'}}>
        {myApplications.length>0&&(
          <div style={{background:'rgba(249,115,22,.06)',borderBottom:'1px solid rgba(249,115,22,.15)',padding:'10px 28px',display:'flex',alignItems:'center',gap:8}}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2.2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span style={{fontSize:12,fontWeight:600,color:'#d45e00'}}>{myApplications.filter(a=>a.status==='applied').length} application(s) pending — you'll be redirected when accepted</span>
          </div>
        )}

        {!selectedCompany?(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',padding:40}}>
            <div style={{fontSize:56,marginBottom:14}}>👈</div>
            <h2 style={{fontSize:20,fontWeight:900,margin:'0 0 8px',letterSpacing:'-1px',fontFamily:'Outfit,sans-serif'}}>Select a company</h2>
            <p style={{color:'#aaa',fontSize:13,maxWidth:260,lineHeight:1.6}}>Click on a company to see their open positions and apply.</p>
          </div>
        ):(
          <div style={{padding:'28px 28px'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:22}}>
              <div style={{width:46,height:46,borderRadius:14,background:'rgba(249,115,22,.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                {selectedCompany.logo_url?(
                  <img src={selectedCompany.logo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ):(
                  <span style={{fontSize:16,fontWeight:800,color:'#f97316'}}>{selectedCompany.name.slice(0,2).toUpperCase()}</span>
                )}
              </div>
              <div style={{flex:1}}>
                <h1 style={{fontSize:22,fontWeight:900,margin:'0 0 4px',letterSpacing:'-1px',fontFamily:'Outfit,sans-serif'}}>{selectedCompany.name}</h1>
                {selectedCompany.description&&<p style={{fontSize:13,color:'#777',margin:'0 0 6px',lineHeight:1.6}}>{selectedCompany.description}</p>}
                <span style={{fontSize:12,color:'#aaa',fontWeight:600}}>{loadingJobs?'Loading...':jobs.length+' open position'+(jobs.length!==1?'s':'')}</span>
              </div>
            </div>

            {loadingJobs?(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                {[1,2,3].map(i=><div key={i} style={{background:'#fff',border:'1.5px solid #ebebeb',borderRadius:14,padding:18}}><div style={{height:14,background:'#f0f0f0',borderRadius:4,width:'70%',marginBottom:8}}/><div style={{height:11,background:'#f0f0f0',borderRadius:4,width:'50%',marginBottom:14}}/><div style={{height:38,background:'#f0f0f0',borderRadius:9}}/></div>)}
              </div>
            ):jobs.length===0?(
              <div style={{textAlign:'center',padding:'44px 28px',background:'#fff',border:'1.5px dashed #e5e5e5',borderRadius:14}}>
                <div style={{fontSize:36,marginBottom:10}}>📭</div>
                <h3 style={{fontSize:16,fontWeight:900,margin:'0 0 5px',fontFamily:'Outfit,sans-serif'}}>No open positions</h3>
                <p style={{color:'#aaa',margin:0,fontSize:13}}>{selectedCompany.name} hasn't posted any jobs yet.</p>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
                {jobs.map((job,i)=>{
                  const appStatus=getAppStatus(job.id);
                  const isApplied=!!appStatus;
                  return (
                    <div key={job.id} style={{background:'#fff',border:'1.5px solid #ebebeb',borderRadius:14,padding:'18px',transition:'all .2s',animationDelay:i*.05+'s'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
                        <div style={{width:34,height:34,borderRadius:10,background:'rgba(249,115,22,.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                {selectedCompany.logo_url?(
                  <img src={selectedCompany.logo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ):(
                  <span style={{fontSize:11,fontWeight:800,color:'#f97316'}}>{selectedCompany.name.slice(0,2).toUpperCase()}</span>
                )}
              </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:900,margin:'0 0 2px',color:'#111',fontFamily:'Outfit,sans-serif'}}>{job.title}</div>
                          <div style={{fontSize:11,color:'#aaa'}}>{selectedCompany.name} · {timeAgo(job.created_at)}</div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:10}}>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:100,background:'#f5f5f5',color:'#666'}}>{job.location}</span>
                        <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:100,background:'#f5f5f5',color:'#666'}}>{job.type}</span>
                        {job.tags?.slice(0,2).map(t=><span key={t} style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:100,background:'rgba(249,115,22,.08)',color:'#d45e00'}}>{t}</span>)}
                      </div>
                      {job.description&&<p style={{fontSize:12,color:'#777',lineHeight:1.6,margin:'0 0 10px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{job.description}</p>}
                      {job.salary&&<div style={{fontSize:13,fontWeight:800,color:'#16a34a',marginBottom:10}}>💰 {job.salary}</div>}
                      {(() => {
                        const st = appStatus?.status;
                        const isRejected = st === 'rejected';
                        const isAccepted = st === 'accepted';
                        const isPending = st === 'applied' || st === 'reviewing';
                        const bg = isRejected ? 'rgba(239,68,68,.1)' : (isApplied ? 'rgba(34,197,94,.1)' : '#111');
                        const col = isRejected ? '#ef4444' : (isApplied ? '#16a34a' : '#fff');
                        return (
                          <button onClick={()=>!isApplied&&handleApply(job.id,job.title)} disabled={isApplied||applying===job.id} style={{width:'100%',background:bg,color:col,border:'none',borderRadius:9,padding:'9px',fontSize:13,fontWeight:700,cursor:isApplied?'default':'pointer',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                            {applying===job.id
                              ? <span style={{width:13,height:13,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .65s linear infinite'}}/>
                              : isRejected ? '✕ Not Selected'
                              : isAccepted ? '✓ Accepted!'
                              : isPending ? <><span style={{width:10,height:10,border:'2px solid #16a34a44',borderTopColor:'#16a34a',borderRadius:'50%',display:'inline-block',animation:'spin .65s linear infinite'}}/> Pending...</>
                              : <>Apply Now <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                            }
                          </button>
                        );
                      })()}
                    </div>
                  );
                }) }
              </div>
            )}
          </div>
        )}
      </div>
      {redirecting&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
          <div style={{width:48,height:48,border:'4px solid rgba(255,255,255,.2)',borderTopColor:'#f97316',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
          <div style={{color:'#fff',fontSize:16,fontWeight:700,fontFamily:'Outfit,sans-serif'}}>Redirecting to dashboard...</div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
