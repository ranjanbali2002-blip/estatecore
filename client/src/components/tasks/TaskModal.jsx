import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { TASK_PRIORITIES } from '../../constants/statuses';
import { toDateInput, formatDate } from '../../utils/formatDate';

const empty = { title: '', dueDate: '', priority: 'Medium', leadId: '', assignedAgentId: '', notes: '', status: 'Pending' };

export default function TaskModal({ taskId, agents = [], onClose, onSaved }) {
  const toast = useToast();
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user?.role === 'admin';
  const isNew = !taskId;
  const [form, setForm] = useState(empty);
  const [leads, setLeads] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [completedAt, setCompletedAt] = useState(null);

  useEffect(() => {
    api.get('/leads', { params: { page: 1 } }).then((r) => setLeads(r.data.data.items)).catch(() => {});
    if (!isNew) {
      api.get(`/tasks/${taskId}`).then((r) => {
        const t = r.data.data;
        setForm({
          title: t.title, dueDate: toDateInput(t.dueDate), priority: t.priority,
          leadId: t.leadId?._id || t.leadId || '', assignedAgentId: t.assignedAgentId?._id || t.assignedAgentId || '',
          notes: t.notes || '', status: t.status,
        });
        setCompletedAt(t.completedAt);
      }).catch((err) => { toast.error(errMsg(err)); onClose(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  async function save() {
    if (!form.title.trim()) return setErrors({ title: 'Title required' });
    if (!form.dueDate) return setErrors({ dueDate: 'Due date required' });
    setSaving(true);
    try {
      const payload = {
        title: form.title, dueDate: form.dueDate, priority: form.priority,
        leadId: form.leadId || null, notes: form.notes, status: form.status,
      };
      if (isAdmin) payload.assignedAgentId = form.assignedAgentId || null;
      if (isNew) await api.post('/tasks', payload);
      else await api.put(`/tasks/${taskId}`, payload);
      toast.success(isNew ? 'Task created' : 'Task updated');
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
    const ok = await confirm({ title: 'Delete task', message: 'This cannot be undone.', danger: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  return (
    <Modal
      title={isNew ? 'Add Task' : 'Edit Task'}
      onClose={onClose}
      footer={
        <>
          {!isNew && <Button variant="danger" onClick={remove} className="mr-auto">Delete</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{isNew ? 'Add' : 'Save'}</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Title *" className="sm:col-span-2" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
        <Input label="Due Date *" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={errors.dueDate} />
        <Select label="Priority" options={TASK_PRIORITIES} value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        <Select label="Linked Lead" value={form.leadId} onChange={(e) => set('leadId', e.target.value)}>
          <option value="" className="bg-card">None</option>
          {leads.map((l) => <option key={l._id} value={l._id} className="bg-card">{l.name}</option>)}
        </Select>
        {isAdmin && (
          <Select label="Assigned Agent" value={form.assignedAgentId} onChange={(e) => set('assignedAgentId', e.target.value)}>
            <option value="" className="bg-card">Unassigned</option>
            {agents.map((a) => <option key={a.id || a._id} value={a.id || a._id} className="bg-card">{a.name}</option>)}
          </Select>
        )}
        <Select label="Status" options={['Pending', 'Completed']} value={form.status} onChange={(e) => set('status', e.target.value)} />
        <Textarea label="Notes" className="sm:col-span-2" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        {completedAt && <p className="sm:col-span-2 text-xs text-emerald-300">Completed on {formatDate(completedAt)}</p>}
      </div>
    </Modal>
  );
}
