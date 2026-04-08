'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://timso-backend-n5w1.vercel.app';
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('timso_token') : null;
const authH = () => { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Job { id: number | string; title: string; company_name: string; location: string; type: string; salary?: string; tags: string[]; applicant_count?: number; is_active: boolean; created_at: string; }
interface JobApplicant { id: number | string; user_id: number | string; full_name?: string; email?: string; username?: string; profile_picture?: string; status: string; created_at?: string; }
interface PostJobForm { title: string; description: string; location: string; type: string; salary: string; tags: string; }

const G = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:'Outfit',sans-serif;background:#faf9f7;color:#0f0e0c}
.font-syne{font-family:'Syne',sans-serif}
@keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes overlayIn{from{opacity:0}to{opacity:1}}
@keyframes sheetIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.a-rise{opacity:0;animation:riseIn .5s cubic-bezier(.16,1,.3,1) forwards}
.sk{background:linear-gradient(90deg,#f2f0eb 25%,#fff 50%,#f2f0eb 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
.card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:20px;transition:all .3s}
.card:hover{box-shadow:0 8px 28px rgba(0,0,0,.06);transform:translateY(-2px)}
.btn{border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:inline-flex;align-items:center;gap:8px;padding:10px 20px}
.btn-primary{background:#0f0e0c;color:#fff}
.btn-primary:hover{background:#f97316}
.btn-ghost{background:#fff;color:#0f0e0c;border:1.5px solid rgba(0,0,0,.1)}
.btn-ghost:hover{border-color:#0f0e0c}
.btn-danger{background:rgba(239,68,68,.1);color:#ef4444}
.btn-danger:hover{background:rgba(239,68,68,.2)}
.inp{width:100%;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;padding:10px 14px;font-size:13px;font-family:'Outfit',sans-serif;color:#0f0e0c;outline:none;transition:border-color .18s;background:#fff;box-sizing:border-box}
.inp:focus{border-color:#f97316}
.lbl{font-size:12px;font-weight:700;color:#6b6860;display:block;margin-bottom:6px}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:center;justify-content:center;animation:overlayIn .2s ease;padding:16px}
.sheet{background:#fff;border-radius:24px;padding:32px;width:100%;max-width:520px;box-shadow:0 24px 80px rgba(0,0,0,.18);animation:sheetIn .3s cubic-bezier(.16,1,.3,1) forwards}
.badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px}
.badge-applied{background:rgba(249,115,22,.1);color:#d45e00}
.badge-reviewing{background:rgba(96,165,250,.1);color:#2563eb}
.badge-accepted{background:rgba(34,197,94,.1);color:#16a34a}
.badge-rejected{background:rgba(239,68,68,.1);color:#ef4444}
`;

const timeAgo = (d?: string) => { if (!d) return ''; try { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`; } catch { return d; } };
const getInitials = (name?: string) => (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const COLORS = ['#f97316','#a89fff','#fbbf24','#34d399','#fb7185','#60a5fa'];
const getColor = (id: number | string) => COLORS[Number(id) % COLORS.length];
const JOB_EMOJIS = ['💼','🚀','⚡','🎯','🔮','🌿','🏗️','🎨','📊','🔧'];
const getEmoji = (id: number | string) => JOB_EMOJIS[Number(id) % JOB_EMOJIS.length];

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState<PostJobForm>({ title: '', description: '', location: 'Remote', type: 'Full-time', salary: '', tags: '' });
  const [postLoading, setPostLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/jobs/my-company`, { withCredentials: true, headers: authH() });
      setJobs(r.data?.data?.jobs || []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    axios.get(`${API}/api/auth/me`, { withCredentials: true, headers: authH() })
      .then(r => {
        const u = r.data?.user || r.data?.data?.user || r.data?.data || r.data;
        if (!u || u.role !== 'admin') router.push('/dashboard');
      })
      .catch(() => router.push('/login'));
    fetchJobs();
  }, [router, fetchJobs]);

  const fetchApplicants = async (job: Job) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    try {
      const r = await axios.get(`${API}/api/jobs/${job.id}/applications`, { withCredentials: true, headers: authH() });
      setApplicants(r.data?.data?.applications || []);
    } catch { setApplicants([]); }
    finally { setLoadingApplicants(false); }
  };

  const handlePostJob = async () => {
    if (!postForm.title.trim()) return;
    setPostLoading(true);
    try {
      await axios.post(`${API}/api/jobs`, { ...postForm }, { withCredentials: true, headers: authH() });
      showToast('Job posted!');
      setShowPostModal(false);
      setPostForm({ title: '', description: '', location: 'Remote', type: 'Full-time', salary: '', tags: '' });
      fetchJobs();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax?.response?.data?.message || 'Failed to post job', 'error');
    } finally { setPostLoading(false); }
  };

  const handleDeleteJob = async (jobId: number | string) => {
    try {
      await axios.delete(`${API}/api/jobs/${jobId}`, { withCredentials: true, headers: authH() });
      showToast('Job deleted');
      if (selectedJob?.id === jobId) setSelectedJob(null);
      fetchJobs();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleUpdateStatus = async (appId: number | string, status: string) => {
    try {
      await axios.patch(`${API}/api/jobs/applications/${appId}/status`, { status }, { withCredentials: true, headers: authH() });
      showToast('Status updated!');
      if (selectedJob) fetchApplicants(selectedJob);
    } catch { showToast('Failed', 'error'); }
  };

  return (
    <>
      <style>{G}</style>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 18px', borderRadius: 14, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, background: toast.type === 'success' ? '#0f0e0c' : '#ef4444', color: '#fff', boxShadow: '0 8px 28px rgba(0,0,0,.14)' }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowPostModal(false) }}>
          <div className="sheet">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h2 className="font-syne" style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>Post a Job</h2>
              <button onClick={() => setShowPostModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,.08)', background: '#f8f7f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label className="lbl">Job Title *</label><input className="inp" value={postForm.title} onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" /></div>
              <div><label className="lbl">Description</label><textarea className="inp" rows={3} value={postForm.description} onChange={e => setPostForm(p => ({ ...p, description: e.target.value }))} placeholder="What will this person do?" style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="lbl">Location</label><input className="inp" value={postForm.location} onChange={e => setPostForm(p => ({ ...p, location: e.target.value }))} /></div>
                <div><label className="lbl">Type</label>
                  <select className="inp" value={postForm.type} onChange={e => setPostForm(p => ({ ...p, type: e.target.value }))}>
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                  </select>
                </div>
              </div>
              <div><label className="lbl">Salary (optional)</label><input className="inp" value={postForm.salary} onChange={e => setPostForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. $80k–$120k" /></div>
              <div><label className="lbl">Tags (comma separated)</label><input className="inp" value={postForm.tags} onChange={e => setPostForm(p => ({ ...p, tags: e.target.value }))} placeholder="React, TypeScript" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowPostModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" disabled={!postForm.title.trim() || postLoading} onClick={handlePostJob} style={{ flex: 2, justifyContent: 'center' }}>
                {postLoading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block' }} /> : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.06)', padding: '0 48px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', fontSize: 13 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Dashboard
          </button>
          <div>
            <h1 className="font-syne" style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Job Board</h1>
            <p style={{ fontSize: 12, color: '#9e9b94', margin: 0 }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPostModal(true)}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4"/></svg>
          Post Job
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedJob ? '1fr 1fr' : '1fr', gap: 0, maxWidth: 1200, margin: '0 auto', padding: '32px 24px', minHeight: 'calc(100vh - 68px)' }}>

        {/* Jobs List */}
        <div style={{ paddingRight: selectedJob ? 24 : 0 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1,2,3].map(i => <div key={i} className="card" style={{ padding: 24 }}><div className="sk" style={{ height: 20, width: '60%', marginBottom: 10 }} /><div className="sk" style={{ height: 14, width: '40%' }} /></div>)}
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: '#fff', border: '1.5px dashed rgba(0,0,0,.1)', borderRadius: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💼</div>
              <h3 className="font-syne" style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px' }}>No jobs posted yet</h3>
              <p style={{ color: '#9e9b94', margin: '0 0 24px' }}>Post your first job to start receiving applications.</p>
              <button className="btn btn-primary" onClick={() => setShowPostModal(true)}>Post First Job</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {jobs.map((job, i) => (
                <div key={job.id} className="card a-rise" style={{ padding: 24, cursor: 'pointer', border: selectedJob?.id === job.id ? '1.5px solid #f97316' : '1px solid rgba(0,0,0,.06)', animationDelay: `${i * 0.05}s` }} onClick={() => fetchApplicants(job)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(249,115,22,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{getEmoji(job.id)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="font-syne" style={{ fontSize: 16, fontWeight: 900 }}>{job.title}</span>
                        {job.applicant_count !== undefined && job.applicant_count > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(249,115,22,.1)', color: '#d45e00' }}>👥 {job.applicant_count}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#6b6860' }}>{job.location}</span>
                        <span style={{ fontSize: 12, color: '#9e9b94' }}>·</span>
                        <span style={{ fontSize: 12, color: '#6b6860' }}>{job.type}</span>
                        {job.salary && <><span style={{ fontSize: 12, color: '#9e9b94' }}>·</span><span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>{job.salary}</span></>}
                        <span style={{ fontSize: 12, color: '#9e9b94' }}>·</span>
                        <span style={{ fontSize: 12, color: '#9e9b94' }}>{timeAgo(job.created_at)}</span>
                      </div>
                    </div>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={e => { e.stopPropagation(); handleDeleteJob(job.id); }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applicants Panel */}
        {selectedJob && (
          <div style={{ borderLeft: '1px solid rgba(0,0,0,.06)', paddingLeft: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 className="font-syne" style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px' }}>Applicants</h2>
                <p style={{ fontSize: 13, color: '#9e9b94', margin: 0 }}>for "{selectedJob.title}"</p>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(0,0,0,.08)', background: '#f8f7f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6b6860" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {loadingApplicants ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2].map(i => <div key={i} className="card" style={{ padding: 16, display: 'flex', gap: 12 }}><div className="sk" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} /><div style={{ flex: 1 }}><div className="sk" style={{ height: 14, width: '50%', marginBottom: 8 }} /><div className="sk" style={{ height: 11, width: '70%' }} /></div></div>)}
              </div>
            ) : applicants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8f7f4', borderRadius: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: '#9e9b94', margin: 0, fontSize: 14 }}>No applications yet for this job.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applicants.map(app => (
                  <div key={app.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: getColor(app.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {getInitials(app.full_name || app.username)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{app.full_name || app.username}</div>
                        <div style={{ fontSize: 12, color: '#6b6860' }}>{app.email}</div>
                      </div>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['reviewing', 'accepted', 'rejected'].map(s => (
                        <button key={s} onClick={() => handleUpdateStatus(app.id, s)} disabled={app.status === s}
                          style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: app.status === s ? 'default' : 'pointer', border: 'none', fontFamily: 'Outfit,sans-serif', transition: 'all .2s', opacity: app.status === s ? 0.4 : 1, background: s === 'accepted' ? 'rgba(34,197,94,.1)' : s === 'rejected' ? 'rgba(239,68,68,.1)' : 'rgba(96,165,250,.1)', color: s === 'accepted' ? '#16a34a' : s === 'rejected' ? '#ef4444' : '#2563eb' }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
