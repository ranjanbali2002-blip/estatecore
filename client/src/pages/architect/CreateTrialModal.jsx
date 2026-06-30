import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Field';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatDate';

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let p = 'Aa1';
  for (let i = 0; i < 7; i += 1) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export default function CreateTrialModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    adminName: '', adminEmail: '', adminPassword: genPassword(),
    brandName: '', trialPlan: 'pro', trialDays: 14, phone: '',
  });
  const [autoPwd, setAutoPwd] = useState(true);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  async function submit() {
    setSaving(true);
    try {
      const { data } = await api.post('/architect/workspaces/trial', { ...form, trialDays: Number(form.trialDays) });
      setCreated(data.data);
      onCreated?.();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Could not create workspace'));
    } finally {
      setSaving(false);
    }
  }

  function copyCreds() {
    const text = `Login: ${window.location.origin}/login\nEmail: ${created.adminEmail}\nPassword: ${created.adminPassword}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied');
  }

  if (created) {
    return (
      <Modal title="Workspace created" size="sm" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
        <div className="space-y-3">
          <p className="text-emerald-300 text-sm">✓ {created.brandName} is ready ({created.trialPlan} trial).</p>
          <div className="glass rounded-xl p-4 text-sm space-y-1">
            <p><span className="text-white/40">Email:</span> <span className="text-white">{created.adminEmail}</span></p>
            <p><span className="text-white/40">Password:</span> <span className="text-white font-mono">{created.adminPassword}</span></p>
            <p><span className="text-white/40">Trial ends:</span> <span className="text-white">{formatDate(created.expiresAt)}</span></p>
          </div>
          <Button variant="secondary" onClick={copyCreds} className="w-full">Copy credentials</Button>
          <p className="text-xs text-white/40">A welcome email with these details has been sent to the admin.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Create Trial Workspace"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Create</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Admin Full Name *" value={form.adminName} onChange={(e) => set('adminName', e.target.value)} error={errors.adminName} />
        <Input label="Admin Email *" type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} error={errors.adminEmail} />
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-white/70">Admin Password *</span>
            <label className="text-xs text-white/50 flex items-center gap-1">
              <input type="checkbox" checked={autoPwd} onChange={(e) => { setAutoPwd(e.target.checked); if (e.target.checked) set('adminPassword', genPassword()); }} />
              Auto-generate
            </label>
          </div>
          <Input value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} disabled={autoPwd} error={errors.adminPassword} />
        </div>
        <Input label="Brand Name *" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} error={errors.brandName} />
        <Select label="Trial Plan" options={[{ value: 'starter', label: 'Starter' }, { value: 'pro', label: 'Pro' }, { value: 'enterprise', label: 'Enterprise' }]} value={form.trialPlan} onChange={(e) => set('trialPlan', e.target.value)} />
        <Select label="Trial Duration" options={[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }, { value: 30, label: '30 days' }]} value={form.trialDays} onChange={(e) => set('trialDays', e.target.value)} />
        <Input label="Phone (optional)" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </div>
    </Modal>
  );
}
