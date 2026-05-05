import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { selectUser } from '../features/auth/authSlice';
import { selectUserClaims, selectClaimById, fetchClaims, createClaim } from '../features/claims/claimsSlice';
import { StatusBadge } from '../components/common';
import { fmt, fmtDate } from '../utils/helpers';

// ─── MY CLAIMS ───────────────────────────────────────
export function MyClaimsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const claims   = useSelector(selectUserClaims(user?._id || user?.id));
  const [tab, setTab] = useState('all');

  useEffect(() => { dispatch(fetchClaims()); }, [dispatch]);
  const TABS = ['all','pending','under-review','approved','rejected'];
  const filtered = tab === 'all' ? claims : claims.filter((c) => c.status === tab);

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? `All (${claims.length})` : t.replace('-',' ').replace(/\b\w/g,l=>l.toUpperCase())}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Claim No.</th><th>Diagnosis</th><th>Hospital</th><th>Treatment</th><th>Claimed</th><th>Approved</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8}><div className="empty-state"><div className="es-icon">📭</div><div className="es-title">No claims found</div><div className="es-desc">No claims match this filter</div></div></td></tr>
              : filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className="claim-num">{c.id}</span></td>
                  <td><div style={{fontWeight:500}}>{c.diagnosis}</div><div style={{fontSize:11,color:'var(--ink3)'}}>{c.icd}</div></td>
                  <td style={{fontSize:13}}>{c.hospital.split(',')[0]}</td>
                  <td style={{fontSize:12,color:'var(--ink2)'}}>{fmtDate(c.dateFrom)} – {fmtDate(c.dateTo)}</td>
                  <td><strong>{fmt(c.amount)}</strong></td>
                  <td style={{color:c.approved?'var(--green)':'var(--ink3)'}}>{c.approved ? fmt(c.approved) : '—'}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/my-claims/${c.id}`)}>Details</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── CLAIM DETAIL ─────────────────────────────────────
const TL_LABELS = { pending:'Claim Submitted','under-review':'Under Review',approved:'Approved ✓',rejected:'Rejected ✕' };

export function ClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user  = useSelector(selectUser);
  const claim = useSelector(selectClaimById(id));
  if (!claim) return <div className="empty-state"><div className="es-icon">🔍</div><div className="es-title">Claim not found</div><button className="btn btn-outline btn-sm" style={{marginTop:12}} onClick={() => navigate(-1)}>← Back</button></div>;
  const backPath = user?.role === 'admin' ? '/admin/queue' : '/my-claims';

  return (
    <>
      <div style={{marginBottom:16}}><button className="btn btn-ghost btn-sm" onClick={() => navigate(backPath)}>← Back</button></div>
      {claim.conflict && (
        <div className="conflict-banner">
          <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
          <div><div style={{fontWeight:700,fontSize:13,color:'var(--red)'}}>Coverage Conflict Detected</div>
          <div style={{fontSize:12.5,color:'#7f1d1d',marginTop:2}}>Claimed amount ({fmt(claim.amount)}) exceeds available policy balance. Manual adjudication required.</div></div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start'}}>
        <div>
          <div className="card card-lg" style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
              <div>
                <div style={{fontSize:11,color:'var(--ink3)',fontFamily:'DM Mono,monospace',marginBottom:4}}>{claim.id}</div>
                <h2 style={{fontSize:21}}>{claim.diagnosis}</h2>
                <div style={{fontSize:13,color:'var(--ink3)',marginTop:2}}>{claim.icd} · {claim.hospital}</div>
              </div>
              <StatusBadge status={claim.status} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,paddingTop:16,borderTop:'1px solid var(--border)'}}>
              {[['Claimed Amount',fmt(claim.amount),'var(--ink)'],['Approved Amount',claim.approved?fmt(claim.approved):'—',claim.approved?'var(--green)':'var(--ink3)'],['Treatment',`${fmtDate(claim.dateFrom)} – ${fmtDate(claim.dateTo)}`,'var(--ink)']].map(([l,v,c])=>(
                <div key={l}><div style={{fontSize:11,color:'var(--ink3)',marginBottom:3,textTransform:'uppercase',letterSpacing:'.05em'}}>{l}</div><div style={{fontSize:17,fontFamily:'Syne,sans-serif',fontWeight:800,color:c}}>{v}</div></div>
              ))}
            </div>
            {claim.remarks && <div style={{marginTop:16,padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',fontSize:13}}><span style={{fontWeight:600,color:'var(--ink2)'}}>Adjudicator Remarks: </span>{claim.remarks}</div>}
          </div>
          <div className="card">
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📎 Uploaded Documents</div>
            {claim.docs.map((d) => (
              <div key={d} className="uploaded-file">
                <span style={{fontSize:20}}>📄</span>
                <span style={{flex:1,fontWeight:500}}>{d}</span>
                <span style={{fontSize:11,color:'var(--ink3)',fontFamily:'DM Mono,monospace'}}>PDF</span>
                <button className="btn btn-ghost btn-sm">View</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🕒 Claim Timeline</div>
            <div className="timeline">
              {claim.timeline.map((t, i) => {
                const isLast = i === claim.timeline.length - 1;
                const dc = t.status==='approved'?'done':t.status==='rejected'?'rejected':isLast?'active':'done';
                return (
                  <div className="tl-item" key={i}>
                    <div className={`tl-dot ${dc}`} />
                    <div className="tl-title">{TL_LABELS[t.status]||t.status}</div>
                    <div className="tl-time">{fmtDate(t.date)}</div>
                    {t.remark && <div className="tl-note">{t.remark}</div>}
                  </div>
                );
              })}
              {(claim.status==='pending'||claim.status==='under-review') && (
                <div className="tl-item"><div className="tl-dot pending"/><div className="tl-title" style={{color:'var(--ink3)'}}>Final Decision</div><div className="tl-time">Awaiting adjudicator</div></div>
              )}
            </div>
          </div>
          {claim.status==='approved' && (
            <button className="btn btn-success" style={{width:'100%',justifyContent:'center'}}
              onClick={() => alert('Settlement letter PDF — connect to /api/v1/claims/'+claim.id+'/settlement-letter in production')}>
              📥 Download Settlement Letter
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── NEW CLAIM WIZARD ──────────────────────────────────
const STEPS = ['Policy Info','Medical Details','Upload Documents','Review & Submit'];

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => {
        const n=i+1, done=n<step, active=n===step;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={`step-line ${done||active?'done':''}`} />}
            <div className="step-item">
              <div className={`step-circle ${done?'done':active?'active':'todo'}`}>{done?'✓':n}</div>
              <span className={`step-label ${done?'done':active?'active':'todo'}`}>{label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function NewClaimPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const ctx      = useOutletContext() || {};
  const { addToast } = ctx;

  const [step, setStep]   = useState(1);
  const [data, setData]   = useState({});
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (k, v) => setData((p) => ({ ...p, [k]: v }));

  const validateStep2 = () => {
    const e = {};
    if (!data.diagnosis) e.diagnosis = 'Required';
    if (!data.hospital)  e.hospital  = 'Required';
    if (!data.dateFrom)  e.dateFrom  = 'Required';
    if (!data.dateTo)    e.dateTo    = 'Required';
    if (!data.amount || Number(data.amount) <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddFiles = (incoming) => {
    const ok = incoming.filter((f) => f.size <= 10*1024*1024);
    setFiles((p) => [...p, ...ok].slice(0, 10));
    if (ok.length < incoming.length && addToast) addToast('Some files exceed 10MB limit', 'error');
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('amount',    data.amount);
      formData.append('diagnosis', data.diagnosis);
      formData.append('icd',       data.icd || '');
      formData.append('hospital',  data.hospital);
      formData.append('dateFrom',  data.dateFrom);
      formData.append('dateTo',    data.dateTo);
      files.forEach((f) => formData.append('docs', f));

      const result = await dispatch(createClaim(formData));
      if (createClaim.fulfilled.match(result)) {
        if (addToast) addToast('Claim submitted and saved to database!', 'success');
        navigate('/my-claims');
      } else {
        if (addToast) addToast(result.payload || 'Submission failed', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exceedsBal = data.amount && Number(data.amount) > user.policy.remaining;

  return (
    <div style={{ maxWidth: 680 }}>
      <Stepper step={step} />

      {step === 1 && (
        <div className="card card-lg">
          <h3 style={{marginBottom:4}}>Verify Policy Information</h3>
          <p style={{fontSize:13,color:'var(--ink3)',marginBottom:22}}>Confirm your active policy before filing.</p>
          <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:16,marginBottom:22}}>
            <div className="info-grid">
              {[['Policy ID',user.policy.id],['Provider',user.policy.provider],['Coverage Limit',fmt(user.policy.coverageLimit)],['Available Balance',fmt(user.policy.remaining)],['Valid From',fmtDate(user.policy.validFrom)],['Valid Until',fmtDate(user.policy.validUntil)]].map(([l,v])=>(
                <div key={l}><div className="ig-label" style={{fontSize:11,marginBottom:2}}>{l}</div><div className="ig-value">{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Continue → Medical Details</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card card-lg">
          <h3 style={{marginBottom:4}}>Medical Details</h3>
          <p style={{fontSize:13,color:'var(--ink3)',marginBottom:22}}>Provide details about your treatment.</p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Diagnosis <span className="req">*</span></label>
              <input className={`form-input ${errors.diagnosis?'error':''}`} value={data.diagnosis||''} placeholder="e.g. Appendectomy" onChange={(e) => handleChange('diagnosis',e.target.value)} />
              {errors.diagnosis && <div className="form-error">{errors.diagnosis}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">ICD-10 Code</label>
              <input className="form-input" value={data.icd||''} placeholder="e.g. K35.80" onChange={(e) => handleChange('icd',e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Hospital / Medical Facility <span className="req">*</span></label>
            <input className={`form-input ${errors.hospital?'error':''}`} value={data.hospital||''} placeholder="e.g. Apollo Hospital, Chennai" onChange={(e) => handleChange('hospital',e.target.value)} />
            {errors.hospital && <div className="form-error">{errors.hospital}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Treatment Start <span className="req">*</span></label>
              <input type="date" className={`form-input ${errors.dateFrom?'error':''}`} value={data.dateFrom||''} onChange={(e) => handleChange('dateFrom',e.target.value)} />
              {errors.dateFrom && <div className="form-error">{errors.dateFrom}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Treatment End <span className="req">*</span></label>
              <input type="date" className={`form-input ${errors.dateTo?'error':''}`} value={data.dateTo||''} onChange={(e) => handleChange('dateTo',e.target.value)} />
              {errors.dateTo && <div className="form-error">{errors.dateTo}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Claim Amount (₹) <span className="req">*</span></label>
            <input type="number" className={`form-input ${errors.amount?'error':''}`} value={data.amount||''} placeholder="Enter amount" style={{fontFamily:'DM Mono,monospace'}} onChange={(e) => handleChange('amount',e.target.value)} />
            {errors.amount && <div className="form-error">{errors.amount}</div>}
            <div className="form-hint">Available balance: {fmt(user.policy.remaining)}</div>
            {exceedsBal && <div style={{fontSize:12,color:'var(--red)',marginTop:4}}>⚠️ Exceeds policy balance — will be flagged for manual review.</div>}
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => validateStep2() && setStep(3)}>Continue → Upload Docs</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card card-lg">
          <h3 style={{marginBottom:4}}>Upload Supporting Documents</h3>
          <p style={{fontSize:13,color:'var(--ink3)',marginBottom:22}}>Upload bills, discharge summary, lab reports. Max 10 files.</p>
          <div className="upload-zone" onClick={() => document.getElementById('file-inp').click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag'); handleAddFiles(Array.from(e.dataTransfer.files)); }}>
            <div style={{fontSize:36,marginBottom:10}}>📂</div>
            <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>Click to browse or drag & drop</div>
            <div style={{fontSize:12,color:'var(--ink3)'}}>PDF, JPG, PNG up to 10MB each</div>
          </div>
          <input id="file-inp" type="file" style={{display:'none'}} multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleAddFiles(Array.from(e.target.files))} />
          {files.map((f, i) => (
            <div key={i} className="uploaded-file">
              <span style={{fontSize:20}}>📄</span>
              <span style={{flex:1,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
              <span style={{fontSize:11,color:'var(--ink3)',fontFamily:'DM Mono,monospace'}}>{(f.size/1024).toFixed(0)} KB</span>
              <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={() => setFiles((p) => p.filter((_,idx)=>idx!==i))}>✕</button>
            </div>
          ))}
          {files.length===0 && <p style={{fontSize:12.5,color:'var(--amber)',marginTop:12}}>⚠️ At least one document recommended for faster processing.</p>}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:20}}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Continue → Review</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card card-lg">
          <h3 style={{marginBottom:4}}>Review & Submit</h3>
          <p style={{fontSize:13,color:'var(--ink3)',marginBottom:22}}>Verify all details before submitting.</p>
          {exceedsBal && (
            <div className="conflict-banner">
              <span style={{fontSize:18}}>⚠️</span>
              <div><div style={{fontWeight:700,fontSize:13,color:'var(--red)'}}>Coverage Limit Exceeded</div>
              <div style={{fontSize:12.5,color:'#7f1d1d',marginTop:2}}>Your claim ({fmt(data.amount)}) exceeds your remaining balance ({fmt(user.policy.remaining)}). Will be flagged for manual review.</div></div>
            </div>
          )}
          <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:20,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:11,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:14,fontFamily:'DM Mono,monospace'}}>Claim Summary</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:14}}>
              {[['Diagnosis',data.diagnosis||'—'],['ICD Code',data.icd||'—'],['Hospital',data.hospital||'—'],['Claim Amount',data.amount?fmt(data.amount):'—'],['From',fmtDate(data.dateFrom)],['To',fmtDate(data.dateTo)]].map(([l,v])=>(
                <div key={l}><span style={{color:'var(--ink3)'}}>{l}: </span><strong>{v}</strong></div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>Documents ({files.length})</div>
            {files.length===0
              ? <span style={{fontSize:13,color:'var(--ink3)'}}>No documents attached</span>
              : files.map((f)=><div key={f.name} style={{fontSize:13,color:'var(--ink2)',padding:'3px 0'}}>📄 {f.name}</div>)}
          </div>
          <div style={{background:'var(--accent-lt)',border:'1px solid #bfdbfe',borderRadius:'var(--r-sm)',padding:'12px 14px',fontSize:12.5,color:'var(--accent-dk)',marginBottom:20}}>
            ℹ️ By submitting, you confirm all information is accurate. False claims may result in policy cancellation.
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Claim →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
