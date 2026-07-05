import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Register() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', brandName: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) return setErrors({ name: 'Full name is required' });
    if (!form.brandName.trim()) return setErrors({ brandName: 'Agency name is required' });
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Request received 🎉">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-white/70 mb-2">
            Thanks, <span className="text-white">{form.name}</span>! Your free 30-day trial request for{' '}
            <span className="text-accent">{form.brandName}</span> is <strong>pending approval</strong>.
          </p>
          <p className="text-white/50 text-sm mb-6">
            We&apos;ll email <span className="text-white/80">{form.email}</span> the moment it&apos;s approved —
            then you can log in with the password you just chose.
          </p>
          <Link to="/">
            <Button variant="secondary" className="w-full">Back to home</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Start your free trial" subtitle="Register your agency — approved within 24 hours">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Your Full Name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="e.g. Ranjan Bali" />
        <Input label="Agency / Brand Name" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} error={errors.brandName} placeholder="e.g. Skyline Realty" />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} placeholder="you@agency.com" />
        <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} placeholder="Min 8 chars, 1 upper, 1 lower, 1 number" />
        <Input label="Phone (optional)" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="+91…" />
        <Button type="submit" loading={loading} className="w-full" size="lg">Request Free Trial</Button>
      </form>
      <p className="mt-6 text-center text-sm text-white/40">
        Already have an account? <Link to="/login" className="text-accent">Log in</Link>
      </p>
    </AuthLayout>
  );
}
