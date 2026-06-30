import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Input, Select, Textarea } from '../ui/Field';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { usePlanGate } from '../../context/PlanGateContext';
import { hasFeature } from '../../utils/planGates';
import { DEAL_STAGES } from '../../constants/statuses';
import { formatINR } from '../../utils/formatINR';
import { toDateInput } from '../../utils/formatDate';

const empty = { title: '', value: '', stage: 'Prospect', leadId: '', propertyId: '', assignedAgentId: '', expectedCloseDate: '', notes: '' };

export default function DealModal({ dealId, defaultStage, agents = [], onClose, onSaved }) {
  const toast = useToast();
  const { user, workspace } = useAuth();
  const confirm = useConfirm();
  const { openPlanGate } = usePlanGate();
  const isAdmin = user?.role === 'admin';
  const isNew = !dealId;

  const [form, setForm] = useState({ ...empty, stage: defaultStage || 'Prospect' });
  const [errors, setErrors] = useState({});
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [portal, setPortal] = useState({ enabled: false, url: null });

  useEffect(() => {
    api.get('/leads', { params: { page: 1 } }).then((r) => setLeads(r.data.data.items)).catch(() => {});
    api.get('/properties', { params: { page: 1 } }).then((r) => setProperties(r.data.data.items)).catch(() => {});
    if (!isNew) {
      api.get(`/deals/${dealId}`).then((r) => {
        const d = r.data.data;
        setForm({
          title: d.title, value: d.value, stage: d.stage,
          leadId: d.leadId?._id || d.leadId || '', propertyId: d.propertyId?._id || d.propertyId || '',
          assignedAgentId: d.assignedAgentId?._id || d.assignedAgentId || '',
          expectedCloseDate: toDateInput(d.expectedCloseDate), notes: d.notes || '',
        });
        setPortal({ enabled: d.clientPortalEnabled, url: d.clientPortalToken ? `${window.location.origin}/portal/${d.clientPortalToken}` : null });
        setLoading(false);
      }).catch((err) => { toast.error(errMsg(err)); onClose(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const commission = Math.round((Number(form.value) || 0) * 0.02);

  async function save() {
    if (!form.title.trim()) return setErrors({ title: 'Title is required' });
    setSaving(true);
    try {
      const payload = {
        title: form.title, value: Number(form.value) || 0, stage: form.stage,
        leadId: form.leadId || null, propertyId: form.propertyId || null,
        expectedCloseDate: form.expectedCloseDate || null, notes: form.notes,
      };
      if (isAdmin) payload.assignedAgentId = form.assignedAgentId || null;
      if (isNew) await api.post('/deals', payload);
      else await api.put(`/deals/${dealId}`, payload);
      toast.success(isNew ? 'Deal created' : 'Deal updated');
      onSaved?.();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Could not save deal'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirm({ title: 'Delete deal', message: 'This cannot be undone.', danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/deals/${dealId}`);
      toast.success('Deal deleted');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function togglePortal() {
    if (!hasFeature(workspace, 'client_portal')) return openPlanGate('client_portal', 'enterprise');
    try {
      const { data } = await api.patch(`/deals/${dealId}/portal-toggle`, { enabled: !portal.enabled });
      setPortal({ enabled: data.data.enabled, url: data.data.url });
      toast.success(data.data.enabled ? 'Portal enabled' : 'Portal disabled');
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function generateLink() {
    if (!hasFeature(workspace, 'client_portal')) return openPlanGate('client_portal', 'enterprise');
    try {
      const { data } = await api.post(`/deals/${dealId}/portal-token`);
      setPortal({ enabled: true, url: data.data.url });
      toast.success('Portal link generated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  return (
    <Modal
      title={isNew ? 'New Deal' : 'Edit Deal'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          {!isNew && isAdmin && <Button variant="danger" onClick={remove} className="mr-auto">Delete</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{isNew ? 'Create' : 'Save'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="text-white/50 text-sm">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Title *" className="sm:col-span-2" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
          <div>
            <Input label="Value (₹)" type="number" value={form.value} onChange={(e) => set('value', e.target.value)} error={errors.value} />
            <p className="text-xs text-white/40 mt-1">Commission (2%): {formatINR(commission)}</p>
          </div>
          <Select label="Stage" options={DEAL_STAGES} value={form.stage} onChange={(e) => set('stage', e.target.value)} />
          <Select label="Link Lead" value={form.leadId} onChange={(e) => set('leadId', e.target.value)}>
            <option value="" className="bg-card">None</option>
            {leads.map((l) => <option key={l._id} value={l._id} className="bg-card">{l.name}</option>)}
          </Select>
          <Select label="Link Property" value={form.propertyId} onChange={(e) => set('propertyId', e.target.value)}>
            <option value="" className="bg-card">None</option>
            {properties.map((p) => <option key={p._id} value={p._id} className="bg-card">{p.title}</option>)}
          </Select>
          {isAdmin && (
            <Select label="Assigned Agent" value={form.assignedAgentId} onChange={(e) => set('assignedAgentId', e.target.value)}>
              <option value="" className="bg-card">Unassigned</option>
              {agents.map((a) => <option key={a.id || a._id} value={a.id || a._id} className="bg-card">{a.name}</option>)}
            </Select>
          )}
          <Input label="Expected Close Date" type="date" value={form.expectedCloseDate} onChange={(e) => set('expectedCloseDate', e.target.value)} />
          <Textarea label="Notes" className="sm:col-span-2" value={form.notes} onChange={(e) => set('notes', e.target.value)} />

          {/* Client portal (Enterprise) */}
          {!isNew && (
            <div className="sm:col-span-2 glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white font-medium flex items-center gap-2">Client Portal <Badge color="purple">Enterprise</Badge></div>
                  <p className="text-xs text-white/40 mt-0.5">Share a branded live deal tracker with your client.</p>
                </div>
                <Button size="sm" variant="secondary" onClick={togglePortal}>{portal.enabled ? 'Disable' : 'Enable'}</Button>
              </div>
              {portal.enabled && (
                <div className="mt-3 flex gap-2">
                  <input readOnly value={portal.url || ''} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70" />
                  {portal.url ? (
                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(portal.url); toast.success('Copied'); }}>Copy</Button>
                  ) : (
                    <Button size="sm" onClick={generateLink}>Generate</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
