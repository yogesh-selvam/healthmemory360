import { useEffect, useState, type SyntheticEvent, type ReactNode } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, History, HeartPulse, Activity, Brain, Apple,
  MessageCircle, CalendarClock, TriangleAlert, Stethoscope, Siren, Users,
  UserRound, Settings, ShieldCheck, Bell, LogOut, FileText, Plus, Check,
  MapPin, Send, RefreshCw
} from 'lucide-react';

type NavItem = [string, any, string];

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('hm_token');
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const exact: Record<string, string> = {
  '/': 'healthmemory_360_landing_page_1',
  '/login': 'healthmemory_360_login_authentication',
  '/register': 'authentication_sign_in_register',
  '/app': 'healthmemory_360_dashboard_1',
  '/app/records': 'medical_records_vault',
  '/app/records/upload': 'upload_medical_record_ingestion_pipeline',
  '/app/timeline': 'health_timeline_my_journey',
  '/app/compare': 'report_comparison_side_by_side_analysis',
  '/app/physical': 'physical_health_biometric_overview',
  '/app/fitness': 'fitness_activity_movement',
  '/app/wellness': 'mental_wellness_mood_rest',
  '/app/nutrition': 'nutrition_dietary_habits_hydration',
  '/app/ai': 'ask_healthmemory_ai_assistant',
  '/app/doctor': 'doctor_brief_clinical_visit_preparation',
  '/app/profile': 'patient_profile_health_identity',
  '/app/profile/care-team': 'patient_profile_care_team',
  '/app/settings': 'preferences_clinical_thresholds',
  '/app/settings/integrations': 'preferences_connected_integrations',
  '/app/privacy': 'privacy_security_data_sovereignty_1',
};

const nav: NavItem[] = [
  ['/app', LayoutDashboard, 'Dashboard'],
  ['/app/records', FolderOpen, 'Medical Records'],
  ['/app/timeline', History, 'Health Timeline'],
  ['/app/compare', Activity, 'Report Comparison'],
  ['/app/physical', HeartPulse, 'Physical Health'],
  ['/app/fitness', Activity, 'Fitness'],
  ['/app/wellness', Brain, 'Mental Wellness'],
  ['/app/nutrition', Apple, 'Nutrition'],
  ['/app/ai', MessageCircle, 'Ask HealthMemory'],
  ['/app/reminders', CalendarClock, 'Smart Reminders'],
  ['/app/alerts', TriangleAlert, 'Health Alerts'],
  ['/app/doctor', Stethoscope, 'Doctor Brief'],
  ['/app/emergency', Siren, 'Emergency / SOS'],
  ['/app/health-sphere', Users, 'Health Sphere'],
  ['/app/profile', UserRound, 'Patient Profile'],
  ['/app/settings', Settings, 'Settings'],
  ['/app/privacy', ShieldCheck, 'Privacy'],
];

function goForText(navigate: (path: string) => void, value: string) {
  const v = value.toLowerCase();
  if (v.includes('get started') || v.includes('sign in') || v.includes('login') || v.includes('log in')) return navigate('/login');
  if (v.includes('create account') || v.includes('register')) return navigate('/register');
  if (v.includes('upload record') || v.includes('upload medical record') || v.includes('medical records')) return navigate('/app/records');
  if (v.includes('dashboard')) return navigate('/app');
  if (v.includes('timeline') || v.includes('health history') || v.includes('my journey')) return navigate('/app/timeline');
  if (v.includes('compare') || v.includes('what changed')) return navigate('/app/compare');
  if (v.includes('physical health')) return navigate('/app/physical');
  if (v.includes('fitness')) return navigate('/app/fitness');
  if (v.includes('mental wellness') || v.includes('wellness')) return navigate('/app/wellness');
  if (v.includes('nutrition')) return navigate('/app/nutrition');
  if (v.includes('ask healthmemory') || v.includes('ask ai') || v.includes('ai assistant')) return navigate('/app/ai');
  if (v.includes('reminder')) return navigate('/app/reminders');
  if (v.includes('alert') || v.includes('notification')) return navigate('/app/alerts');
  if (v.includes('doctor brief') || v.includes('doctor')) return navigate('/app/doctor');
  if (v.includes('emergency') || v.includes('sos')) return navigate('/app/emergency');
  if (v.includes('health sphere') || v.includes('community')) return navigate('/app/health-sphere');
  if (v.includes('profile') || v.includes('health identity')) return navigate('/app/profile');
  if (v.includes('setting') || v.includes('preference')) return navigate('/app/settings');
  if (v.includes('privacy') || v.includes('security')) return navigate('/app/privacy');
}

function StitchFrame({ dir }: { dir: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {}, 0);
    return () => window.clearTimeout(timer);
  }, [dir]);

  const onLoad = async (event: SyntheticEvent<HTMLIFrameElement>) => {
    const frame = event.currentTarget;
    const doc = frame.contentDocument;
    if (!doc) return;

    // Login / register are the only forms that need direct API wiring.
    if (dir === 'healthmemory_360_login_authentication') {
      const form = doc.querySelector('form#authForm') || doc.querySelector('form');
      const email = (doc.querySelector('#emailInput') as HTMLInputElement | null)
        || (doc.querySelector('input[type="email"]') as HTMLInputElement | null)
        || (doc.querySelector('#email') as HTMLInputElement | null);
      const password = (doc.querySelector('#passwordInput') as HTMLInputElement | null)
        || (doc.querySelector('input[type="password"]') as HTMLInputElement | null)
        || (doc.querySelector('#password') as HTMLInputElement | null);
      const submitButton = (doc.querySelector('#submitBtn') as HTMLButtonElement | null)
        || (doc.querySelector('#submit-cta') as HTMLButtonElement | null)
        || (doc.querySelector('button[type="submit"]') as HTMLButtonElement | null);
      if (form && email && password && submitButton && !form.getAttribute('data-hm-wired')) {
        form.setAttribute('data-hm-wired', '1');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          submitButton.disabled = true;
          const label = doc.querySelector('#btnText') as HTMLElement | null;
          if (label) label.textContent = 'Signing in…';
          else submitButton.textContent = 'Signing in…';
          try {
            const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) });
            localStorage.setItem('hm_token', data.token);
            localStorage.setItem('hm_user', JSON.stringify(data.user || {}));
            navigate('/app');
          } catch (err: any) {
            alert(err?.message || 'Login failed');
            submitButton.disabled = false;
            if (label) label.textContent = 'Sign In to HealthMemory';
            else submitButton.textContent = 'Sign In to HealthMemory 360';
          }
        });
      }
    }

    if (dir === 'authentication_sign_in_register') {
      const form = doc.querySelector('#authForm') as HTMLFormElement | null;
      if (form && !form.getAttribute('data-hm-wired')) {
        form.setAttribute('data-hm-wired', '1');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = (doc.querySelector('#emailInput') as HTMLInputElement)?.value?.trim();
          const password = (doc.querySelector('#passwordInput') as HTMLInputElement)?.value || '';
          const demoName = 'Saravanan M';
          const createTab = doc.querySelector('#tabCreateAccount') as HTMLButtonElement | null;
          const isCreate = createTab?.className.includes('bg-surface-white');
          try {
            if (isCreate) {
              const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: demoName, email, password }) });
              localStorage.setItem('hm_token', data.token);
              localStorage.setItem('hm_user', JSON.stringify(data.user || {}));
            } else {
              const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
              localStorage.setItem('hm_token', data.token);
              localStorage.setItem('hm_user', JSON.stringify(data.user || {}));
            }
            navigate('/app');
          } catch (err: any) { alert(err?.message || 'Authentication failed'); }
        });
      }
    }

    // Medical record upload: capture the actual selected file and send it to the backend.
    if (dir === 'upload_medical_record_ingestion_pipeline') {
      const fileInput = doc.querySelector('#file-selector') as HTMLInputElement | null;
      if (fileInput && !fileInput.getAttribute('data-hm-wired')) {
        fileInput.setAttribute('data-hm-wired', '1');
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files?.[0];
          if (!file) return;
          const date = (doc.querySelector('#record-date') as HTMLInputElement | null)?.value;
          const provider = (doc.querySelector('#provider-input') as HTMLInputElement | null)?.value;
          const formData = new FormData();
          formData.append('file', file);
          if (date) formData.append('recordDate', date);
          if (provider) formData.append('provider', provider);
          try {
            const data = await api('/records/upload', { method: 'POST', body: formData });
            sessionStorage.setItem('hm_last_record', JSON.stringify(data.record));
            alert('Record uploaded and processed successfully.');
            navigate(`/app/records/${data.record._id || data.record.id}/review`);
          } catch (err: any) { alert(err?.message || 'Upload failed'); }
        });
      }
    }

    // AI assistant: connect the existing Stitch input to the record-grounded backend.
    if (dir === 'ask_healthmemory_ai_assistant') {
      const input = doc.querySelector('#ai-user-query-input') as HTMLInputElement | null;
      const button = doc.querySelector('#ai-submit-button') as HTMLButtonElement | null;
      if (input && button && !button.getAttribute('data-hm-wired')) {
        button.setAttribute('data-hm-wired', '1');
        const createBubble = (role: 'user' | 'assistant', text: string) => {
          const wrapper = doc.createElement('div');
          wrapper.className = role === 'user'
            ? 'flex items-start justify-end gap-3 self-end max-w-xl'
            : 'flex items-start gap-3.5 max-w-full';
          wrapper.innerHTML = role === 'user'
            ? `<div class="flex flex-col items-end gap-1"><div class="bg-primary text-on-primary px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-sm"><p class="font-body-md text-body-md text-on-primary">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div></div>`
            : `<div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-ai-purple to-teal-accent flex items-center justify-center text-white shrink-0 shadow-sm mt-1"><span class="material-symbols-outlined text-[20px]">spark</span></div><div class="flex-1 flex flex-col gap-3 min-w-0"><div class="bg-surface-white rounded-3xl rounded-tl-xs p-6 shadow-sm flex flex-col gap-5"><div class="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></div></div>`;
          return wrapper;
        };

        const submit = async () => {
          const prompt = input.value.trim();
          if (!prompt) return;
          const messageContainer = doc.querySelector('main');
          if (messageContainer) {
            messageContainer.appendChild(createBubble('user', prompt));
          }
          button.disabled = true;
          const old = button.innerHTML;
          button.textContent = 'Reviewing…';
          try {
            const data = await api('/ai/ask', { method: 'POST', body: JSON.stringify({ message: prompt }) });
            const text = String(data.answer || 'No answer returned.');
            if (messageContainer) {
              messageContainer.appendChild(createBubble('assistant', text));
            }
            if (Array.isArray(data.actions) && data.actions.length) {
              const actionsWrap = doc.createElement('div');
              actionsWrap.className = 'flex flex-wrap items-center gap-2 pt-2';
              data.actions.forEach((action: any) => {
                const btn = doc.createElement('button');
                btn.type = 'button';
                btn.className = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors';
                btn.textContent = action.label || 'Open';
                btn.addEventListener('click', () => {
                  if (action.type === 'navigate' && action.target) {
                    window.parent.location.href = action.target;
                  }
                  if (action.type === 'view_record' && action.target) {
                    window.parent.location.href = action.target;
                  }
                });
                actionsWrap.appendChild(btn);
              });
              if (messageContainer) messageContainer.appendChild(actionsWrap);
            }
          } catch (err: any) {
            if (messageContainer) messageContainer.appendChild(createBubble('assistant', err?.message || 'AI request failed'));
          } finally {
            button.disabled = false;
            button.innerHTML = old;
            input.value = '';
          }
        };
        button.addEventListener('click', submit);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      }
    }

    // Doctor Brief actions.
    if (dir === 'doctor_brief_clinical_visit_preparation') {
      const send = doc.querySelector('#sendPortalBtn') as HTMLButtonElement | null;
      const download = doc.querySelector('#downloadPdfBtn') as HTMLButtonElement | null;
      if (send && !send.getAttribute('data-hm-wired')) {
        send.setAttribute('data-hm-wired','1');
        send.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            const result = await api('/doctor-brief/generate', { method:'POST', body: JSON.stringify({ questions:['What changed in my recent records?','What should I discuss with my clinician?'] }) });
            alert(`Doctor Brief generated successfully (${result._id || 'saved'}).`);
          } catch (err:any) { alert(err?.message || 'Could not generate Doctor Brief'); }
        });
      }
      if (download && !download.getAttribute('data-hm-wired')) {
        download.setAttribute('data-hm-wired','1');
        download.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            const result = await api('/doctor-brief/generate', { method:'POST', body: JSON.stringify({ questions:[] }) });
            const blob = new Blob([JSON.stringify(result,null,2)], {type:'application/json'});
            const url = URL.createObjectURL(blob);
            const a = doc.createElement('a'); a.href=url; a.download='HealthMemory360-Doctor-Brief.json'; a.click(); URL.revokeObjectURL(url);
          } catch (err:any) { alert(err?.message || 'Could not export Doctor Brief'); }
        });
      }
    }

    // Medical-record vault upload button opens the real hidden file picker.
    const vaultUpload = doc.querySelector('#trigger-upload-btn') as HTMLButtonElement | null;
    if (vaultUpload && !vaultUpload.getAttribute('data-hm-wired')) {
      vaultUpload.setAttribute('data-hm-wired','1');
      vaultUpload.addEventListener('click', (e) => { e.preventDefault(); (doc.querySelector('#real-file-input') as HTMLInputElement | null)?.click(); });
    }
    const vaultInput = doc.querySelector('#real-file-input') as HTMLInputElement | null;
    if (vaultInput && !vaultInput.getAttribute('data-hm-wired')) {
      vaultInput.setAttribute('data-hm-wired','1');
      vaultInput.addEventListener('change', async () => {
        const file = vaultInput.files?.[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try { const result = await api('/records/upload',{method:'POST',body:fd}); sessionStorage.setItem('hm_last_record',JSON.stringify(result.record)); alert('Medical record uploaded successfully.'); navigate(`/app/records/${result.record._id}/review`); }
        catch(err:any){ alert(err?.message || 'Upload failed'); }
      });
    }

    // Generic Stitch navigation bridge.
    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const element = target?.closest('a,button,[role="button"]') as HTMLElement | null;
      if (!element) return;
      if (element.id === 'submit-cta' || element.id === 'submitBtn' || element.id === 'ai-submit-button' || element.id === 'tabSignIn' || element.id === 'tabCreateAccount' || element.id === 'demoAutofillBtn') return;
      if (element.id === 'file-selector' || element.id === 'real-file-input') return;
      const text = `${element.textContent || ''} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('href') || ''}`.trim();
      const before = window.location.pathname;
      if (!text) return;
      e.preventDefault();
      e.stopPropagation();
      goForText(navigate, text);
      if (before === window.location.pathname && /cancel|return to records/i.test(text)) navigate('/app/records');
    };
    doc.addEventListener('click', clickHandler, true);
  };

  return <iframe className="stitch-frame" src={`/stitch/${dir}/index.html`} title={`HealthMemory 360 ${dir}`} onLoad={onLoad} />;
}

function Shell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('hm_user') || '{}');
  return <div className="shell">
    <aside className="side">
      <div className="brand"><div className="brand-mark">✚</div><div><strong>HealthMemory <span>360</span></strong><small>Longitudinal Health</small></div></div>
      <nav className="nav">{nav.map(([to, I, label]) => <Link key={to} className={loc.pathname === to ? 'active' : ''} to={to}><I size={18}/><span>{label}</span></Link>)}</nav>
      <button className="btn btn-secondary" style={{width:'100%',marginTop:18}} onClick={() => { localStorage.removeItem('hm_token'); localStorage.removeItem('hm_user'); navigate('/login'); }}><LogOut size={16}/> Sign out</button>
    </aside>
    <header className="top"><div><div className="eyebrow">Personal Health OS</div><div className="title">{pageTitle(loc.pathname)}</div></div><div style={{display:'flex',gap:10,alignItems:'center'}}><Link className="btn btn-secondary" to="/app/alerts"><Bell size={17}/></Link><Link className="btn btn-primary" to="/app/ai">Ask AI</Link><span className="muted" style={{fontWeight:700}}>{user.name || 'Patient'}</span></div></header>
    <main className="shell-main">{children}</main>
    <nav className="mobile-nav">{nav.slice(0,5).map(([to,I,label]) => <Link key={to} className={loc.pathname === to ? 'active' : ''} to={to}><I size={18}/><div>{label.split(' ')[0]}</div></Link>)}</nav>
  </div>;
}

function pageTitle(p: string) {
  const x = nav.find(n => n[0] === p); return x ? x[2] : p.includes('emergency') ? 'Emergency' : p.includes('health-sphere') ? 'Health Sphere' : 'HealthMemory 360';
}

function ExtensionPage({ type }: { type: 'reminders'|'alerts'|'emergency'|'sphere' }) {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { if (type === 'reminders') setData(await api('/reminders')); if (type === 'alerts') setData(await api('/alerts')); if (type === 'emergency') setData(await api('/emergency/profile')); if (type === 'sphere') setData(await api('/community/posts')); } catch (e:any) { setData({error:e.message}); } };
  useEffect(() => { load(); }, [type]);

  if (type === 'reminders') return <><section className="card"><div className="eyebrow">Smart follow-up engine</div><h2 className="title">Never lose the next step.</h2><p className="muted">Record-derived and patient-created reminders, persisted in MongoDB.</p><button className="btn btn-primary" onClick={async()=>{setBusy(true);try{await api('/reminders',{method:'POST',body:JSON.stringify({title:'Follow-up check-up',note:'Created from the HealthMemory demo.',reminderDate:new Date(Date.now()+7*86400000).toISOString(),source:'user'})});await load();}catch(e:any){alert(e.message)}finally{setBusy(false)}}}>{busy?'Creating…':<><Plus size={16}/> Create reminder</>}</button></section><div className="card" style={{marginTop:18}}><h3>Upcoming reminders</h3>{Array.isArray(data)&&data.length?<table className="table"><thead><tr><th>Reminder</th><th>Date</th><th>Source</th><th>Status</th></tr></thead><tbody>{data.map((x:any)=><tr key={x._id}><td>{x.title}</td><td>{new Date(x.reminderDate).toLocaleDateString()}</td><td>{x.source}</td><td>{x.status}</td></tr>)}</tbody></table>:<p className="muted">No upcoming reminders.</p>}</div></>;

  if (type === 'alerts') return <><section className="card" style={{borderColor:'#fde68a'}}><div className="eyebrow">Contextual patient alert</div><h2 className="title">Health Alerts</h2><p className="muted">Alerts are derived from appointments, reminders and stored health history.</p><button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/> Refresh</button></section><div className="grid grid2" style={{marginTop:18}}>{data?.alerts?.length ? data.alerts.map((a:any,i:number)=><article className="card" key={i}><span className="badge" style={{background:a.severity==='urgent'?'#fee2e2':'#fef3c7',color:a.severity==='urgent'?'#b91c1c':'#92400e'}}>{a.severity}</span><h3>{a.title}</h3><p className="muted">{a.message}</p><small>{a.date ? new Date(a.date).toLocaleDateString() : ''}</small></article>):<article className="card"><Check size={22}/><h3>No active alerts</h3><p className="muted">You’re all caught up.</p></article>}</div></>;

  if (type === 'emergency') return <><section className="card"><div className="eyebrow">Restricted emergency workflow</div><h2 className="title">Emergency Health Card</h2><p className="muted">Prepare a patient-controlled emergency card. No ambulance dispatch is triggered.</p><button className="btn" style={{background:'#ef4444',color:'#fff'}} onClick={async()=>{try{let pos:any=null;if(navigator.geolocation){try{pos=await new Promise<any>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:5000}))}catch{}}const result=await api('/emergency/sos',{method:'POST',body:JSON.stringify({latitude:pos?.coords?.latitude,longitude:pos?.coords?.longitude})});alert(`Emergency card prepared: ${result.card.emergencyId}`);setData(await api('/emergency/profile'));}catch(e:any){alert(e.message)}}}><Siren size={16}/> Prepare Emergency Card</button></section><div className="grid grid2" style={{marginTop:18}}><section className="card"><h3>{JSON.parse(localStorage.getItem('hm_user')||'{}').name || 'Patient'}</h3><p>Blood group: <b>{data?.bloodGroup || 'Not recorded'}</b></p><p>Allergies: {(data?.allergies||[]).join(', ') || 'None recorded'}</p><p>Conditions: {(data?.conditions||[]).join(', ') || 'None recorded'}</p><p>Medications: {(data?.medications||[]).join(', ') || 'None recorded'}</p></section><section className="card"><h3>Emergency contacts</h3>{(data?.emergencyContacts||[]).map((c:any)=><p key={c.phone}><b>{c.name}</b> · {c.relationship} · {c.phone}</p>)}</section></div></>;

  return <><section className="card"><div className="eyebrow">Community · public by choice</div><h2 className="title">Health Sphere</h2><p className="muted">Community content is intentionally separated from private medical records.</p></section><div className="grid grid2" style={{marginTop:18}}>{Array.isArray(data)&&data.map((p:any)=><article className="card" key={p._id}><span className="badge" style={{background:'#ecfdf5',color:'#047857'}}>{p.category}</span><h3>{p.title}</h3><p className="muted">{p.body}</p><b>{p.likes || 0} likes</b></article>)}</div></>;
}

function Protected({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => { if (!localStorage.getItem('hm_token')) navigate('/login', { replace: true }); }, [navigate]);
  return <>{children}</>;
}

function RouteView({ path }: { path: string }) {
  const dir = exact[path];
  const protectedRoute = path.startsWith('/app');
  if (dir) return protectedRoute ? <Protected><StitchFrame dir={dir}/></Protected> : <StitchFrame dir={dir}/>;
  return <Protected><Shell><ExtensionPage type={path === '/app/reminders' ? 'reminders' : path === '/app/alerts' ? 'alerts' : path === '/app/emergency' ? 'emergency' : 'sphere'} /></Shell></Protected>;
}

export default function App() {
  const paths = [...Object.keys(exact), '/app/reminders', '/app/alerts', '/app/emergency', '/app/health-sphere'];
  return <Routes>{paths.map(p => <Route key={p} path={p} element={<RouteView path={p}/>}/>)}<Route path="/app/records/:id" element={<Protected><StitchFrame dir="medical_records_vault"/></Protected>}/><Route path="/app/records/:id/review" element={<Protected><StitchFrame dir="ai_processing_extracted_record_review"/></Protected>}/><Route path="*" element={<RouteView path="/"/>}/></Routes>;
}
