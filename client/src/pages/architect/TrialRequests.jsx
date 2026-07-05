import { useCallback, useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Field';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatDate } from '../../utils/formatDate';
import { timeAgo } from '../../utils/timeAgo';

export default function TrialRequests() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveFor, setApproveFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/architect/trial-requests');
      setItems(data.data.items);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load requests'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function reject(req) {
    const ok = await confirm({
      title: `Reject ${req.brandName}?`,
      message: 'The applicant will be emailed that their trial was not activated. You can still find them later.',
      danger: true,
      confirmLabel: 'Reject',
    });
    if (!ok) return;
    try {
      await api.put(`/architect/workspaces/${req.id}/reject`);
      toast.success('Request rejected');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  return (
    <PageWrapper title="Trial Requests">
      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : items.length === 0 ? (
        <EmptyState icon="📥" title="No pending requests" subtext="New self-service trial registrations will appear here for approval." />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-heading text-lg text-white">{r.brandName}</div>
                  <div className="text-sm text-white/60">{r.adminName} · {r.adminEmail}</div>
                  <div className="text-xs text-white/40 mt-1">
                    {r.phone ? `${r.phone} · ` : ''}Requested {timeAgo(r.requestedAt)} ({formatDate(r.requestedAt)})
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => reject(r)}>Reject</Button>
                  <Button onClick={() => setApproveFor(r)}>Approve</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {approveFor && (
        <ApproveModal req={approveFor} onClose={() => setApproveFor(null)} onDone={load} />
      )}
    </PageWrapper>
  );
}

function ApproveModal({ req, onClose, onDone }) {
  const toast = useToast();
  const [plan, setPlan] = useState('pro');
  const [trialDays, setTrialDays] = useState(30);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api.put(`/architect/workspaces/${req.id}/approve`, { plan, trialDays: Number(trialDays) });
      toast.success(`${req.brandName} approved — ${trialDays}-day trial started`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Approval failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Approve ${req.brandName}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Approve &amp; start trial</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          This activates their account and starts the trial. They log in with the password they registered.
        </p>
        <Select label="Trial Plan" options={[{ value: 'starter', label: 'Starter' }, { value: 'pro', label: 'Pro' }, { value: 'enterprise', label: 'Enterprise' }]} value={plan} onChange={(e) => setPlan(e.target.value)} />
        <Select label="Trial Duration" options={[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }, { value: 30, label: '30 days (1 month)' }, { value: 60, label: '60 days' }, { value: 90, label: '90 days' }]} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
      </div>
    </Modal>
  );
}
