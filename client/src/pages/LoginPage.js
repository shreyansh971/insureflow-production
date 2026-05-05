import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../features/auth/authSlice';

export default function LoginPage({ addToast }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [email, setEmail]       = useState('');
  const [pass, setPass]         = useState('');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const switchMode = (m) => {
    setMode(m); setErrors({});
    setEmail(''); setPass(''); setName(''); setPhone(''); setConfirmPass('');
  };

  const validate = () => {
    const e = {};
    if (mode === 'signup' && !name.trim())           e.name = 'Full name is required';
    if (!email.includes('@'))                         e.email = 'Enter a valid email address';
    if (pass.length < 6)                              e.pass = 'Password must be at least 6 characters';
    if (mode === 'signup' && pass !== confirmPass)    e.confirmPass = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let result;
      if (mode === 'login') {
        result = await dispatch(loginUser({ email, password: pass }));
        if (loginUser.fulfilled.match(result)) {
          const user = result.payload.user;
          if (addToast) addToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
          navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        } else {
          if (addToast) addToast(result.payload || 'Login failed', 'error');
        }
      } else {
        result = await dispatch(registerUser({ name, email, password: pass, phone }));
        if (registerUser.fulfilled.match(result)) {
          const user = result.payload.user;
          if (addToast) addToast(`Account created! Welcome, ${user.name.split(' ')[0]}!`, 'success');
          navigate('/dashboard');
        } else {
          if (addToast) addToast(result.payload || 'Registration failed', 'error');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      {/* Left panel */}
      <div className="login-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="logo-icon" style={{ width: 44, height: 44, fontSize: 22 }}>🏥</div>
            <span className="logo-text" style={{ fontSize: 22 }}>Insure<span>Flow</span></span>
          </div>
          <h1 style={{ fontSize: 36, color: '#fff', marginBottom: 12, lineHeight: 1.1 }}>
            Manage claims<br /><span style={{ color: '#60a5fa' }}>with clarity.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 28 }}>
            A centralised platform for filing, tracking and adjudicating health insurance claims — built for speed and transparency.
          </p>
          {['Real-time status updates', 'Secure document upload', 'Smart conflict detection',
            'Hospital network search', 'PDF settlement letters', 'OCR bill verification'].map((f) => (
            <span key={f} className="feature-pill"><span className="fp-dot" />{f}</span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 28, gap: 0 }}>
            {[['login','Sign In'], ['signup','Create Account']].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 700, border: 'none',
                  background: 'none', cursor: 'pointer', color: mode === m ? 'var(--accent)' : 'var(--ink3)',
                  borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -2, transition: 'all .15s',
                }}>
                {label}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 24, marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 24 }}>
            {mode === 'login'
              ? 'Sign in to your InsureFlow account'
              : 'New policyholders sign up here. Admins are created by the system.'}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Signup-only fields */}
            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="req">*</span></label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} type="text"
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Arjun Sharma" autoFocus />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" type="tel"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210" />
                </div>
              </>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address <span className="req">*</span></label>
              <input className={`form-input ${errors.email ? 'error' : ''}`} type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus={mode === 'login'} />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password <span className="req">*</span></label>
              <input className={`form-input ${errors.pass ? 'error' : ''}`} type="password"
                value={pass} onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••" />
              {errors.pass && <div className="form-error">{errors.pass}</div>}
            </div>

            {/* Confirm password (signup only) */}
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="req">*</span></label>
                <input className={`form-input ${errors.confirmPass ? 'error' : ''}`} type="password"
                  value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••" />
                {errors.confirmPass && <div className="form-error">{errors.confirmPass}</div>}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 16px',
                marginTop: 4, opacity: submitting ? 0.7 : 1, fontSize: 15 }}>
              {submitting
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--ink3)' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => switchMode('signup')}
                  style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => switchMode('login')}
                  style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 24, fontSize: 11.5, color: 'var(--ink3)', textAlign: 'center',
            borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            InsureFlow · MERN Stack · All data saved to MongoDB
          </div>
        </div>
      </div>
    </div>
  );
}
