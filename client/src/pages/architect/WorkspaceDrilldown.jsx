import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { SkeletonText } from '../../components/ui/Skeleton';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatDate';
import { timeAgo } from '../../utils/timeAgo';

export default function WorkspaceDrilldown({ workspaceId, onClose }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get(`/architect/workspaces/${workspaceId}`)
      .then((r) => setData(r.data.data))
      .catch((err) => { toast.error(errMsg(err)); onClose(); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'data', label: 'Data' },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <Modal title={data?.workspace?.brandName || 'Workspace'} size="lg" onClose={onClose}>
      {loading || !data ? (
        <SkeletonText lines={8} />
      ) : (
        <div>
          <div className="flex gap-2 mb-5 border-b border-white/10">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-white/50'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-heading text-xl text-white">{data.workspace.brandName}</span>
                <Badge color={data.workspace.mode === 'trial' ? 'amber' : 'green'}>{data.workspace.mode}</Badge>
                <Badge value={data.workspace.status}>{data.workspace.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Admin" value={data.admin?.name} />
                <Info label="Email" value={data.admin?.email} />
                <Info label="Plan" value={data.workspace.plan} />
                <Info label="Accent" value={data.workspace.brand?.accentColor} />
                {data.workspace.mode === 'trial' && <Info label="Trial ends" value={formatDate(data.workspace.expiresAt)} />}
                <Info label="Agent limit" value={data.workspace.agentLimit} />
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(data.counts).map(([k, v]) => (
                  <div key={k} className="glass rounded-xl p-3 text-center">
                    <div className="font-heading text-2xl text-white">{v}</div>
                    <div className="text-xs text-white/40 capitalize">{k}</div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm text-white/60 mb-2">Agents</h4>
                <ul className="space-y-2">
                  {data.agents.length === 0 && <li className="text-white/40 text-sm">No agents.</li>}
                  {data.agents.map((a) => (
                    <li key={a._id} className="flex items-center justify-between glass rounded-lg px-3 py-2 text-sm">
                      <span className="text-white">{a.name}</span>
                      <Badge color={a.isActive ? 'green' : 'gray'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <ul className="space-y-3">
              {data.activity.length === 0 && <li className="text-white/40 text-sm">No recent activity.</li>}
              {data.activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-accent">•</span>
                  <div>
                    <p className="text-white/85">{a.text}</p>
                    <p className="text-white/35 text-xs">{timeAgo(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white">{value || '—'}</div>
    </div>
  );
}
