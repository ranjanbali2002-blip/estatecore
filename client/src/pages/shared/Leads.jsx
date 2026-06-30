import { useCallback, useEffect, useRef, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Field';
import LeadForm from '../../components/leads/LeadForm';
import LeadDrawer from '../../components/leads/LeadDrawer';
import LeadKanban from '../../components/leads/LeadKanban';
import CSVImport from '../../components/leads/CSVImport';
import api, { errMsg } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePlanGate } from '../../context/PlanGateContext';
import { hasFeature } from '../../utils/planGates';
import { LEAD_STATUSES, LEAD_SOURCES } from '../../constants/statuses';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/formatDate';

export default function Leads() {
  const { user, workspace } = useAuth();
  const toast = useToast();
  const { openPlanGate } = usePlanGate();
  const isAdmin = user?.role === 'admin';

  const [view, setView] = useState('list');
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [openLead, setOpenLead] = useState(null);
  const debRef = useRef();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (agentFilter) params.agent = agentFilter;
      params.page = 1;
      const { data } = await api.get('/leads', { params });
      setLeads(data.data.items);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load leads'));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, agentFilter, toast]);

  // debounced search + filter refetch
  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(fetchLeads, 300);
    return () => clearTimeout(debRef.current);
  }, [fetchLeads]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/agents').then((r) => setAgents(r.data.data.items)).catch(() => {});
    }
  }, [isAdmin]);

  async function moveLead(id, status) {
    setLeads((ls) => ls.map((l) => (l._id === id ? { ...l, status } : l)));
    try {
      await api.patch(`/leads/${id}`, { status });
    } catch (err) {
      toast.error(errMsg(err, 'Could not update'));
      fetchLeads();
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    if (agentFilter) params.set('agent', agentFilter);
    // Use authorized API with blob
    api
      .get(`/leads/export/csv?${params.toString()}`, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${workspace?.brand?.name || 'EstateCore'}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export ready');
      })
      .catch((err) => toast.error(errMsg(err, 'Export failed')));
  }

  function openImport() {
    if (!hasFeature(workspace, 'csv_import')) return openPlanGate('csv_import', 'pro');
    setShowImport(true);
  }

  async function bulkStatus(status) {
    if (!selected.length) return;
    try {
      await Promise.all(selected.map((id) => api.patch(`/leads/${id}`, { status })));
      toast.success(`Updated ${selected.length} leads`);
      setSelected([]);
      fetchLeads();
    } catch (err) {
      toast.error(errMsg(err, 'Bulk update failed'));
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: (r) => <span className="text-white font-medium">{r.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'budget', label: 'Budget', sortable: true, render: (r) => formatINR(r.budget) },
    { key: 'propertyType', label: 'Type' },
    { key: 'source', label: 'Source', render: (r) => <Badge color="blue">{r.source}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'agent', label: 'Agent', render: (r) => r.assignedAgentId?.name || '—' },
    { key: 'createdAt', label: 'Added', sortable: true, render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <PageWrapper title="Leads">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email…"
          className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 ring-accent outline-none"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="" className="bg-card">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s} className="bg-card">{s}</option>)}
        </Select>
        <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="" className="bg-card">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s} value={s} className="bg-card">{s}</option>)}
        </Select>
        {isAdmin && (
          <Select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
            <option value="" className="bg-card">All agents</option>
            {agents.map((a) => <option key={a.id} value={a.id} className="bg-card">{a.name}</option>)}
          </Select>
        )}
        <div className="flex gap-2 ml-auto">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'list' ? 'bg-accent text-[#0B0F1A]' : 'text-white/60'}`}>List</button>
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'kanban' ? 'bg-accent text-[#0B0F1A]' : 'text-white/60'}`}>Kanban</button>
          </div>
          <Button variant="secondary" onClick={exportCsv}>Export</Button>
          <Button variant="secondary" onClick={openImport}>Import</Button>
          <Button onClick={() => setShowForm(true)}>+ Add Lead</Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="glass rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/70">{selected.length} selected</span>
          <Select onChange={(e) => e.target.value && bulkStatus(e.target.value)} value="">
            <option value="" className="bg-card">Change status…</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s} className="bg-card">{s}</option>)}
          </Select>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {loading ? (
        <SkeletonTable />
      ) : view === 'kanban' ? (
        leads.length ? (
          <LeadKanban leads={leads} onMove={moveLead} onOpen={(l) => setOpenLead(l._id)} />
        ) : (
          <EmptyState icon="👥" title="No leads yet" subtext="Add your first lead to get started." action="+ Add Lead" onAction={() => setShowForm(true)} />
        )
      ) : (
        <DataTable
          columns={columns}
          rows={leads}
          selectable
          selectedIds={selected}
          onSelectChange={setSelected}
          onRowClick={(r) => setOpenLead(r._id)}
          emptyState={<EmptyState icon="👥" title="No leads found" subtext="Try adjusting filters or add a new lead." action="+ Add Lead" onAction={() => setShowForm(true)} />}
        />
      )}

      {showForm && <LeadForm agents={agents} onClose={() => setShowForm(false)} onSaved={fetchLeads} />}
      {showImport && <CSVImport onClose={() => setShowImport(false)} onImported={fetchLeads} />}
      {openLead && <LeadDrawer leadId={openLead} agents={agents} onClose={() => setOpenLead(null)} onChanged={fetchLeads} />}
    </PageWrapper>
  );
}
