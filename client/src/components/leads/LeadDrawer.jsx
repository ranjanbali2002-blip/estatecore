import { useEffect, useState } from 'react';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Input, Select, Textarea } from '../ui/Field';
import { SkeletonText } from '../ui/Skeleton';
import CallLogModal from './CallLogModal';
import WhatsAppTemplate from './WhatsAppTemplate';
import { LEAD_SOURCES, LEAD_STATUSES, PROPERTY_TYPES } from '../../constants/statuses';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { usePlanGate } from '../../context/PlanGateContext';
import { hasFeature } from '../../utils/planGates';
import { formatINR } from '../../utils/formatINR';
import { timeAgo } from '../../utils/timeAgo';

export default function LeadDrawer({ leadId, agents = [], onClose, onChanged }) {
  const toast = useToast();
  const { user, workspace } = useAuth();
  const confirm = useConfirm();
  const { openPlanGate } = usePlanGate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [noteText, setNoteText] = useState('');
  const [showCall, setShowCall] = useState(false);
  const [showWa, setShowWa] = useState(false);
  const isAdmin = user?.role === 'admin';

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/leads/${leadId}`);
      setLead(data.data);
      setForm(data.data);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load lead'));
      onClose();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function saveDetails() {
    try {
      const payload = {
        name: form.name, phone: form.phone, email: form.email,
        budget: Number(form.budget) || 0, propertyType: form.propertyType,
        locationInterest: form.locationInterest, source: form.source, status: form.status,
      };
      if (isAdmin) payload.assignedAgentId = form.assignedAgentId?._id || form.assignedAgentId || null;
      const { data } = await api.put(`/leads/${leadId}`, payload);
      setLead(data.data);
      setForm(data.data);
      setEditing(false);
      toast.success('Lead updated');
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err, 'Could not update'));
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    try {
      const { data } = await api.post(`/leads/${leadId}/notes`, { text: noteText });
      setLead((l) => ({ ...l, notes: data.data }));
      setNoteText('');
      toast.success('Note added');
    } catch (err) {
      toast.error(errMsg(err, 'Could not add note'));
    }
  }

  async function remove() {
    const ok = await confirm({ title: 'Delete lead', message: 'This cannot be undone.', danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/leads/${leadId}`);
      toast.success('Lead deleted');
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete'));
    }
  }

  function openWhatsApp() {
    if (!hasFeature(workspace, 'whatsapp_templates')) return openPlanGate('whatsapp_templates', 'pro');
    setShowWa(true);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const notes = [...(lead?.notes || [])].reverse();
  const calls = [...(lead?.callLog || [])].reverse();

  return (
    <Drawer
      title={lead?.name || 'Lead'}
      subtitle={lead?.assignedAgentId?.name ? `Assigned to ${lead.assignedAgentId.name}` : 'Unassigned'}
      onClose={onClose}
      headerExtra={lead && <div className="mt-2"><Badge value={lead.status} /></div>}
    >
      {loading ? (
        <SkeletonText lines={8} />
      ) : (
        <div className="space-y-6">
          {/* Details */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-white">Details</h3>
              {!editing ? (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(lead); }}>Cancel</Button>
                  <Button size="sm" onClick={saveDetails}>Save</Button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Name" value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
                <Input label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} />
                <Input label="Email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
                <Input label="Budget (₹)" type="number" value={form.budget || ''} onChange={(e) => set('budget', e.target.value)} />
                <Select label="Type" options={PROPERTY_TYPES} value={form.propertyType || 'Apartment'} onChange={(e) => set('propertyType', e.target.value)} />
                <Input label="Location" value={form.locationInterest || ''} onChange={(e) => set('locationInterest', e.target.value)} />
                <Select label="Source" options={LEAD_SOURCES} value={form.source || 'Other'} onChange={(e) => set('source', e.target.value)} />
                <Select label="Status" options={LEAD_STATUSES} value={form.status || 'New'} onChange={(e) => set('status', e.target.value)} />
                {isAdmin && (
                  <Select label="Agent" className="col-span-2" value={form.assignedAgentId?._id || form.assignedAgentId || ''} onChange={(e) => set('assignedAgentId', e.target.value)}>
                    <option value="" className="bg-card">Unassigned</option>
                    {agents.map((a) => <option key={a.id || a._id} value={a.id || a._id} className="bg-card">{a.name}</option>)}
                  </Select>
                )}
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Phone" value={lead.phone} />
                <Detail label="Email" value={lead.email} />
                <Detail label="Budget" value={formatINR(lead.budget)} />
                <Detail label="Type" value={lead.propertyType} />
                <Detail label="Location" value={lead.locationInterest} />
                <Detail label="Source" value={lead.source} />
              </dl>
            )}
          </section>

          {/* Notes */}
          <section>
            <h3 className="font-heading text-white mb-3">Notes</h3>
            <div className="flex gap-2 mb-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:ring-2 ring-accent outline-none"
              />
              <Button size="sm" onClick={addNote}>Add</Button>
            </div>
            <ul className="space-y-3">
              {notes.length === 0 && <li className="text-white/40 text-sm">No notes yet.</li>}
              {notes.map((n) => (
                <li key={n._id} className="glass rounded-xl p-3">
                  <p className="text-sm text-white/85">{n.text}</p>
                  <p className="text-xs text-white/35 mt-1">{n.createdBy?.name || 'You'} · {timeAgo(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Call log */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-white">Call Log</h3>
              <Button size="sm" variant="secondary" onClick={() => setShowCall(true)}>Log Call</Button>
            </div>
            <ul className="space-y-3">
              {calls.length === 0 && <li className="text-white/40 text-sm">No calls logged.</li>}
              {calls.map((c) => (
                <li key={c._id} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <Badge color="blue">{c.outcome}</Badge>
                    <span className="text-xs text-white/40">{c.duration} min</span>
                  </div>
                  {c.notes && <p className="text-sm text-white/75 mt-2">{c.notes}</p>}
                  <p className="text-xs text-white/35 mt-1">{c.loggedBy?.name || 'You'} · {timeAgo(c.loggedAt)}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Actions */}
          <section className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
            <Button variant="secondary" onClick={openWhatsApp}>💬 WhatsApp Template</Button>
            {isAdmin && <Button variant="danger" onClick={remove}>Delete Lead</Button>}
          </section>
        </div>
      )}

      {showCall && <CallLogModal leadId={leadId} onClose={() => setShowCall(false)} onLogged={(cl) => setLead((l) => ({ ...l, callLog: cl }))} />}
      {showWa && <WhatsAppTemplate lead={lead} onClose={() => setShowWa(false)} />}
    </Drawer>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-white/40 text-xs">{label}</dt>
      <dd className="text-white">{value || '—'}</dd>
    </div>
  );
}
