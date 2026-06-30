import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';
import { LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES } from '../../constants/statuses';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function LeadForm({ initialStatus = 'New', agents = [], onClose, onSaved }) {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', budget: '', propertyType: 'Apartment',
    locationInterest: '', source: 'Website', status: initialStatus, assignedAgentId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: 'Name is required' });
    setLoading(true);
    try {
      const payload = { ...form, budget: Number(form.budget) || 0 };
      if (!payload.assignedAgentId) delete payload.assignedAgentId;
      const { data } = await api.post('/leads', payload);
      toast.success('Lead added');
      onSaved?.(data.data);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Could not add lead'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Add Lead"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading}>Add Lead</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4" noValidate>
        <Input label="Name *" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} placeholder="+91…" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        <Input label="Budget (₹)" type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)} error={errors.budget} />
        <Select label="Property Type" options={PROPERTY_TYPES} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)} />
        <Input label="Location Interest" value={form.locationInterest} onChange={(e) => set('locationInterest', e.target.value)} />
        <Select label="Source" options={LEAD_SOURCES} value={form.source} onChange={(e) => set('source', e.target.value)} />
        <Select label="Status" options={LEAD_STATUSES} value={form.status} onChange={(e) => set('status', e.target.value)} />
        {user?.role === 'admin' && (
          <Select label="Assign Agent" value={form.assignedAgentId} onChange={(e) => set('assignedAgentId', e.target.value)} className="sm:col-span-2">
            <option value="" className="bg-card">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id || a._id} value={a.id || a._id} className="bg-card">{a.name}</option>
            ))}
          </Select>
        )}
      </form>
    </Modal>
  );
}
