import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errMsg, fieldErrors } from '../../utils/api';
import { whatsappUrl } from '../../constants/config';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    if (!form.email) return setErrors({ email: 'Email is required' });
    if (!form.password) return setErrors({ password: 'Password is required' });
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name}`);
      navigate(data.user.role === 'architect' ? '/architect/dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your CRM workspace">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          placeholder="you@company.com"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Log in
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-white/40 space-y-2">
        <p>
          Forgot password?{' '}
          <a href={whatsappUrl('Hi, I need help logging into my EstateCore CRM.')} target="_blank" rel="noreferrer" className="text-accent">
            Contact support
          </a>
        </p>
        <p>
          Don&apos;t have an account?{' '}
          <a href={whatsappUrl('Hi, I would like to start a free EstateCore CRM trial.')} target="_blank" rel="noreferrer" className="text-accent">
            Request a trial
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
