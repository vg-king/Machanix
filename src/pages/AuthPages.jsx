import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CarFront } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/" aria-label="Machanix home">
          <span className="brand-mark"><CarFront size={27} strokeWidth={2.8} /><span className="mark-dot" /></span>
          <span className="brand-name"><b>Mach</b>anix<span className="brand-period">.</span></span>
        </Link>
        <span className="eyebrow">MACHANIX ACCOUNT</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === 'ADMIN' ? '/admin' : '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your Machanix account.">
      <form className="auth-form" onSubmit={submit}>
        <label><span>EMAIL ADDRESS</span><input type="email" required autoComplete="username" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="admin@machanix.demo" /></label>
        <label><span>PASSWORD</span><input type="password" required autoComplete="current-password" value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} placeholder="Enter your password" /></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-red btn-full" type="submit" disabled={loading}>{loading ? 'LOGGING IN…' : 'LOG IN'} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">New to Machanix? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await signup(form);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Create your Machanix account.">
      <form className="auth-form" onSubmit={submit}>
        <label><span>NAME</span><input required minLength={2} maxLength={80} value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} placeholder="Your name" /></label>
        <label><span>EMAIL ADDRESS</span><input type="email" required value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="you@example.com" /></label>
        <label><span>PASSWORD</span><input type="password" required minLength={8} maxLength={128} value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} placeholder="At least 8 characters" /></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-red btn-full" type="submit" disabled={loading}>{loading ? 'CREATING ACCOUNT…' : 'SIGN UP'} <ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
