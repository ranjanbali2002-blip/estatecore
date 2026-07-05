import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Select, Input } from '../../components/ui/Field';
import { SkeletonCard } from '../../components/ui/Skeleton';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatDate } from '../../utils/formatDate';

export default function Integrations() {
  const toast = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ pageId: '', pageName: '', pageAccessToken: '' });
  const [forms, setForms] = useState(null);
  const [selectedForms, setSelectedForms] = useState([]);
  const [savingForms, setSavingForms] = useState(false);

  async function load() {
    try {
      const [s, a] = await Promise.all([
        api.get('/workspace/meta'),
        api.get('/agents').catch(() => ({ data: { data: { items: [] } } })),
      ]);
      setStatus(s.data.data);
      setAgents(a.data.data.items || []);
      if (s.data.data.connected) loadForms();
    } catch (err) {
      toast.error(errMsg(err, 'Could not load integrations'));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadForms() {
    try {
      const { data } = await api.get('/workspace/meta/forms');
      setForms(data.data.forms);
      setSelectedForms(data.data.selected || []);
    } catch (err) {
      setForms([]); // page may have no forms yet — not fatal
    }
  }

  function toggleForm(id) {
    setSelectedForms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function saveForms() {
    setSavingForms(true);
    try {
      await api.put('/workspace/meta/forms', { formIds: selectedForms });
      toast.success(selectedForms.length ? 'Capturing selected forms only' : 'Capturing all forms');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save form selection'));
    } finally {
      setSavingForms(false);
    }
  }

  async function connectFacebook() {
    setConnecting(true);
    try {
      const { data } = await api.get('/workspace/meta/connect-url');
      window.location.href = data.data.url; // full-page redirect to Facebook OAuth
    } catch (err) {
      toast.error(errMsg(err, 'Could not start Facebook connect'));
      setConnecting(false);
    }
  }

  async function setDefaultAgent(agentId) {
    try {
      await api.put('/workspace/meta/default-agent', { agentId: agentId || null });
      toast.success('Default agent updated');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function disconnect() {
    const ok = await confirm({
      title: 'Disconnect Facebook',
      message: 'New leads from this Page will stop syncing. You can reconnect anytime.',
      danger: true,
      confirmLabel: 'Disconnect',
    });
    if (!ok) return;
    try {
      await api.post('/workspace/meta/disconnect');
      toast.success('Disconnected');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function submitManual() {
    try {
      await api.post('/workspace/meta/manual', manual);
      toast.success('Page connected');
      setShowManual(false);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Manual connect failed'));
    }
  }

  if (loading || !status) {
    return (
      <PageWrapper title="Integrations">
        <SkeletonCard />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Integrations">
      <div className="max-w-3xl space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center text-2xl">f</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg text-white">Meta Lead Ads</h3>
                  {status.connected ? <Badge color="green">Connected</Badge> : <Badge color="gray">Not connected</Badge>}
                </div>
                <p className="text-white/50 text-sm mt-1 max-w-md">
                  Auto-capture leads from your Facebook &amp; Instagram lead form ads. New submissions
                  create a lead in this workspace instantly.
                </p>
              </div>
            </div>
          </div>

          {!status.enabled && (
            <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
              The Meta integration isn&apos;t enabled on the platform yet. Set <code>META_ENABLED=true</code> and the
              Meta app credentials on the server to turn it on.
            </div>
          )}

          {status.connected ? (
            <div className="mt-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info label="Facebook Page" value={status.pageName} />
                <Info label="Leads captured" value={status.leadCount} />
                <Info label="Connected on" value={formatDate(status.connectedAt)} />
                <Info label="Last lead" value={status.lastLeadAt ? formatDate(status.lastLeadAt) : '—'} />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1.5">Auto-assign new leads to</label>
                <Select value={status.defaultAgentId || ''} onChange={(e) => setDefaultAgent(e.target.value)}>
                  <option value="" className="bg-card">Unassigned (Admin reviews)</option>
                  {agents.map((a) => <option key={a.id} value={a.id} className="bg-card">{a.name}</option>)}
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm text-white/70">Lead forms to capture</label>
                  {forms && forms.length > 0 && (
                    <Button size="sm" variant="secondary" onClick={saveForms} loading={savingForms}>Save</Button>
                  )}
                </div>
                {forms === null ? (
                  <p className="text-white/40 text-sm">Loading forms…</p>
                ) : forms.length === 0 ? (
                  <p className="text-white/40 text-sm">No lead forms found on this Page yet.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {forms.map((f) => (
                        <label key={f.id} className="flex items-center gap-3 glass rounded-lg px-3 py-2 cursor-pointer">
                          <input type="checkbox" checked={selectedForms.includes(f.id)} onChange={() => toggleForm(f.id)} />
                          <span className="text-sm text-white/85 flex-1">{f.name}</span>
                          <Badge color={f.status === 'ACTIVE' ? 'green' : 'gray'}>{f.status}</Badge>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 mt-2">Leave all unchecked to capture leads from every form.</p>
                  </>
                )}
              </div>

              <Button variant="danger" onClick={disconnect}>Disconnect</Button>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={connectFacebook} loading={connecting} disabled={!status.enabled}>
                Connect Facebook
              </Button>
              <Button variant="ghost" onClick={() => setShowManual((s) => !s)} disabled={!status.enabled}>
                Advanced: connect with a Page token
              </Button>
            </div>
          )}

          {showManual && !status.connected && (
            <div className="mt-4 glass rounded-xl p-4 space-y-3">
              <p className="text-xs text-white/50">
                For testing: paste a Page ID and a long-lived Page Access Token (with <code>leads_retrieval</code>) from the Graph API Explorer.
              </p>
              <Input label="Page ID" value={manual.pageId} onChange={(e) => setManual((m) => ({ ...m, pageId: e.target.value }))} />
              <Input label="Page Name" value={manual.pageName} onChange={(e) => setManual((m) => ({ ...m, pageName: e.target.value }))} />
              <Input label="Page Access Token" value={manual.pageAccessToken} onChange={(e) => setManual((m) => ({ ...m, pageAccessToken: e.target.value }))} />
              <Button size="sm" onClick={submitManual}>Connect</Button>
            </div>
          )}
        </Card>

        <Card header="Webhook endpoint (for Meta App setup)">
          <p className="text-white/50 text-sm mb-2">In your Meta App → Webhooks → Page → <code>leadgen</code>, use:</p>
          <div className="flex gap-2">
            <input readOnly value={status.webhookUrl} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70" />
            <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(status.webhookUrl); toast.success('Copied'); }}>Copy</Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

function Info({ label, value }) {
  return (
    <div className="glass rounded-lg px-3 py-2">
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white">{value ?? '—'}</div>
    </div>
  );
}
