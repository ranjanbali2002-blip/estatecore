import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea, Label } from '../ui/Field';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../constants/statuses';

const empty = { title: '', type: 'Apartment', location: '', price: '', bhk: '', areaSqft: '', status: 'Available', description: '', imageUrls: [''] };

export default function PropertyModal({ propertyId, onClose, onSaved }) {
  const toast = useToast();
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user?.role === 'admin';
  const isNew = !propertyId;
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      api.get(`/properties/${propertyId}`).then((r) => {
        const p = r.data.data;
        setForm({ ...p, price: p.price, bhk: p.bhk, areaSqft: p.areaSqft, imageUrls: p.imageUrls?.length ? p.imageUrls : [''] });
        setLoading(false);
      }).catch((err) => { toast.error(errMsg(err)); onClose(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const setImg = (i, v) => setForm((f) => ({ ...f, imageUrls: f.imageUrls.map((u, idx) => (idx === i ? v : u)) }));
  const addImg = () => setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ''] }));
  const removeImg = (i) => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, idx) => idx !== i) }));

  async function save() {
    if (!form.title.trim()) return setErrors({ title: 'Title required' });
    setSaving(true);
    try {
      const payload = {
        title: form.title, type: form.type, location: form.location,
        price: Number(form.price) || 0, bhk: Number(form.bhk) || 0, areaSqft: Number(form.areaSqft) || 0,
        status: form.status, description: form.description,
        imageUrls: form.imageUrls.filter((u) => u && u.trim()),
      };
      if (isNew) await api.post('/properties', payload);
      else await api.put(`/properties/${propertyId}`, payload);
      toast.success(isNew ? 'Property added' : 'Property updated');
      onSaved?.();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirm({ title: 'Delete property', message: 'This cannot be undone.', danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/properties/${propertyId}`);
      toast.success('Property deleted');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  return (
    <Modal
      title={isNew ? 'Add Property' : 'Edit Property'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          {!isNew && isAdmin && <Button variant="danger" onClick={remove} className="mr-auto">Delete</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{isNew ? 'Add' : 'Save'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="text-white/50 text-sm">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Title *" className="sm:col-span-2" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
          <Select label="Type" options={PROPERTY_TYPES} value={form.type} onChange={(e) => set('type', e.target.value)} />
          <Select label="Status" options={PROPERTY_STATUSES} value={form.status} onChange={(e) => set('status', e.target.value)} />
          <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} />
          <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <Input label="BHK" type="number" value={form.bhk} onChange={(e) => set('bhk', e.target.value)} />
          <Input label="Area (sqft)" type="number" value={form.areaSqft} onChange={(e) => set('areaSqft', e.target.value)} />
          <Textarea label="Description" className="sm:col-span-2" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <div className="sm:col-span-2">
            <Label>Image URLs</Label>
            <div className="space-y-2">
              {form.imageUrls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <input value={u} onChange={(e) => setImg(i, e.target.value)} placeholder="https://…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 ring-accent outline-none" />
                  <Button size="sm" variant="ghost" onClick={() => removeImg(i)}>✕</Button>
                </div>
              ))}
            </div>
            <button onClick={addImg} className="text-xs text-accent mt-2">+ Add image URL</button>
            {form.imageUrls.filter((u) => u).length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {form.imageUrls.filter((u) => u).map((u, i) => (
                  <img key={i} src={u} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
