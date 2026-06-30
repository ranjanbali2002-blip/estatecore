import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Field';
import api, { errMsg, fieldErrors } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { usePlanGate } from '../../context/PlanGateContext';
import { formatDate } from '../../utils/formatDate';

export default function AgentManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const { openPlanGate } = usePlanGate();
  const [data, setData] = useState({ items: [], used: 0, limit: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data: res } = await api.get('/agents');
      setData(res.data);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load agents'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    if (data.used >= data.limit) return openPlanGate('more_agents', 'pro');
    setForm({ name: '', email: '', password: '' });
    setErrors({});
    setShowForm(true);
  }

  async function create() {
    if (!form.name.trim()) return setErrors({ name: 'Name required' });
    setSaving(true);
    try {
      await api.post('/agents', form);
      toast.success('Agent added & invited by email');
      setShowForm(false);
      load();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err, 'Could not add agent'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(agent) {
    try {
      await api.put(`/agents/${agent.id}/status`, { isActive: !agent.isActive });
      toast.success(agent.isActive ? 'Agent deactivated' : 'Agent activated');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function remove(agent) {
    const ok = await confirm({
      title: 'Remove agent',
      message: `${agent.name}'s leads, deals and tasks will be reassigned to you. Continue?`,
      danger: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await api.delete(`/agents/${agent.id}`);
      toast.success('Agent removed, records reassigned');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'leadsAssigned', label: 'Leads', sortable: true },
    { key: 'dealsClosed', label: 'Deals Closed', sortable: true },
    { key: 'tasksCompleted', label: 'Tasks Done', sortable: true },
    { key: 'lastLoginAt', label: 'Last Active', render: (r) => (r.lastLoginAt ? formatDate(r.lastLoginAt) : 'Never') },
    { key: 'isActive', label: 'Status', render: (r) => <Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => toggleStatus(r)}>{r.isActive ? 'Deactivate' : 'Activate'}</Button>
          <Button size="sm" variant="danger" onClick={() => remove(r)}>Remove</Button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title={`Agents (${data.used}/${data.limit} used)`}>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}>+ Add Agent</Button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="🧑‍💼" title="No agents yet" subtext="Add agents to delegate leads and deals." action="+ Add Agent" onAction={openAdd} />
      ) : (
        <DataTable columns={columns} rows={data.items} rowKey={(r) => r.id} />
      )}

      {showForm && (
        <Modal
          title="Add Agent"
          size="sm"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={create} loading={saving}>Add Agent</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} />
            <div className="relative">
              <Input label="Password *" type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} error={errors.password} />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-3 top-9 text-white/40 text-xs">{showPwd ? 'Hide' : 'Show'}</button>
            </div>
            <p className="text-xs text-white/40">Min 8 chars with upper, lower & a number. Credentials are emailed to the agent.</p>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
