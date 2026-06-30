import { useCallback, useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Field';
import Dropdown from '../../components/ui/Dropdown';
import CreateTrialModal from './CreateTrialModal';
import WorkspaceDrilldown from './WorkspaceDrilldown';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatDate } from '../../utils/formatDate';

export default function ArchWorkspaces() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planF, setPlanF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [modeF, setModeF] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [drilldown, setDrilldown] = useState(null);
  const [extendFor, setExtendFor] = useState(null);
  const [convertFor, setConvertFor] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (planF) params.plan = planF;
      if (statusF) params.status = statusF;
      if (modeF) params.mode = modeF;
      const { data } = await api.get('/architect/workspaces', { params });
      setRows(data.data.items);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load workspaces'));
    } finally {
      setLoading(false);
    }
  }, [search, planF, statusF, modeF, toast]);

  useEffect(() => {
    const t = setTimeout(fetchRows, 300);
    return () => clearTimeout(t);
  }, [fetchRows]);

  async function toggleActive(w) {
    const next = w.status === 'inactive' ? 'active' : 'inactive';
    const ok = await confirm({
      title: `${next === 'active' ? 'Activate' : 'Deactivate'} workspace`,
      message: `${w.brandName} will be ${next === 'active' ? 'reactivated' : 'deactivated'}.`,
      danger: next === 'inactive',
      confirmLabel: next === 'active' ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    try {
      await api.put(`/architect/workspaces/${w.id}/status`, { status: next });
      toast.success('Status updated');
      fetchRows();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const columns = [
    { key: 'brandName', label: 'Brand', sortable: true, render: (r) => <span className="text-white font-medium">{r.brandName}</span> },
    { key: 'adminName', label: 'Admin', render: (r) => <div><div className="text-white/85">{r.adminName}</div><div className="text-xs text-white/40">{r.adminEmail}</div></div> },
    { key: 'plan', label: 'Plan', render: (r) => <Badge color="amber">{r.plan}</Badge> },
    { key: 'mode', label: 'Mode', render: (r) => <Badge color={r.mode === 'trial' ? 'blue' : 'green'}>{r.mode}</Badge> },
    { key: 'agentsUsed', label: 'Agents', render: (r) => `${r.agentsUsed}/${r.agentLimit}` },
    { key: 'leadsCount', label: 'Leads' },
    { key: 'expiresAt', label: 'Expires/Renews', render: (r) => (r.expiresAt ? `${formatDate(r.expiresAt)}${r.daysLeft != null ? ` (${r.daysLeft}d)` : ''}` : '—') },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={<span className="px-2 py-1 rounded-lg hover:bg-white/10 text-white/60">⋯</span>}
            items={[
              { label: 'View', onClick: () => setDrilldown(r.id) },
              { label: 'Extend Trial', onClick: () => setExtendFor(r) },
              { label: 'Convert to Paid', onClick: () => setConvertFor(r) },
              { label: r.status === 'inactive' ? 'Activate' : 'Deactivate', danger: r.status !== 'inactive', onClick: () => toggleActive(r) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Workspaces">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand or email…" className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 ring-accent outline-none" />
        <Select value={planF} onChange={(e) => setPlanF(e.target.value)}>
          <option value="" className="bg-card">All plans</option>
          <option value="starter" className="bg-card">Starter</option>
          <option value="pro" className="bg-card">Pro</option>
          <option value="enterprise" className="bg-card">Enterprise</option>
        </Select>
        <Select value={modeF} onChange={(e) => setModeF(e.target.value)}>
          <option value="" className="bg-card">All modes</option>
          <option value="trial" className="bg-card">Trial</option>
          <option value="paid" className="bg-card">Paid</option>
        </Select>
        <Select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="" className="bg-card">All statuses</option>
          <option value="active" className="bg-card">Active</option>
          <option value="inactive" className="bg-card">Inactive</option>
          <option value="trial_expired" className="bg-card">Trial expired</option>
          <option value="payment_failed" className="bg-card">Payment failed</option>
        </Select>
        <Button className="ml-auto" onClick={() => setShowCreate(true)}>+ Create Trial Workspace</Button>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : rows.length === 0 ? (
        <EmptyState icon="🏢" title="No workspaces" subtext="Create your first trial workspace." action="+ Create Trial Workspace" onAction={() => setShowCreate(true)} />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setDrilldown(r.id)} pageSize={20} />
      )}

      {showCreate && <CreateTrialModal onClose={() => setShowCreate(false)} onCreated={fetchRows} />}
      {drilldown && <WorkspaceDrilldown workspaceId={drilldown} onClose={() => setDrilldown(null)} />}
      {extendFor && <ExtendModal w={extendFor} onClose={() => setExtendFor(null)} onDone={fetchRows} />}
      {convertFor && <ConvertModal w={convertFor} onClose={() => setConvertFor(null)} onDone={fetchRows} />}
    </PageWrapper>
  );
}

function ExtendModal({ w, onClose, onDone }) {
  const toast = useToast();
  const [days, setDays] = useState(7);
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    try {
      await api.put(`/architect/workspaces/${w.id}/extend-trial`, { days: Number(days) });
      toast.success(`Trial extended by ${days} days`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title={`Extend trial — ${w.brandName}`} size="sm" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>Extend</Button></>}>
      <Select label="Add days" options={[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }, { value: 30, label: '30 days' }]} value={days} onChange={(e) => setDays(e.target.value)} />
    </Modal>
  );
}

function ConvertModal({ w, onClose, onDone }) {
  const toast = useToast();
  const [plan, setPlan] = useState(w.plan || 'pro');
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    try {
      await api.put(`/architect/workspaces/${w.id}/convert-paid`, { plan });
      toast.success('Converted to paid');
      onDone();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title={`Convert to paid — ${w.brandName}`} size="sm" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={saving}>Convert</Button></>}>
      <Select label="Plan" options={[{ value: 'starter', label: 'Starter' }, { value: 'pro', label: 'Pro' }, { value: 'enterprise', label: 'Enterprise' }]} value={plan} onChange={(e) => setPlan(e.target.value)} />
      <p className="text-xs text-white/40 mt-3">This disables the trial and activates the selected plan. Razorpay subscription is created in Phase 3.</p>
    </Modal>
  );
}
