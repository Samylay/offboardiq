import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', orgName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Zap className="w-8 h-8 text-brand-600" />
            <span className="text-2xl font-bold">OffboardIQ</span>
          </Link>
          <p className="text-gray-600 mt-2">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input type="text" className="input" value={form.firstName} onChange={update('firstName')} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input type="text" className="input" value={form.lastName} onChange={update('lastName')} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                <input type="text" className="input" value={form.orgName} onChange={update('orgName')} required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={form.email} onChange={update('email')} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input" value={form.password} onChange={update('password')} required minLength={8} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-gray-600">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-brand-600 font-medium hover:underline">
              {isRegister ? 'Sign in' : 'Start free trial'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
