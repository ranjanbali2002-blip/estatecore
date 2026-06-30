import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Select, Input, Textarea } from '../ui/Field';
import { CALL_OUTCOMES } from '../../constants/statuses';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function CallLogModal({ leadId, onClose, onLogged }) {
  const toast = useToast();
  const [form, setForm] = useState({ outcome: 'Interested', duration: '', notes: '' });
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const { data } = await api.post(`/leads/${leadId}/calllog`, {
        outcome: form.outcome,
        duration: Number(form.duration) || 0,
        notes: form.notes,
      });
      toast.success('Call logged');
      onLogged?.(data.data);
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Could not log call'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Log Call"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label="Outcome" options={CALL_OUTCOMES} value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))} />
        <Input label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
        <Textarea label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </div>
    </Modal>
  );
}
