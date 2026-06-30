import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import BarChartWrapper from '../../components/charts/BarChartWrapper';
import PieChartWrapper from '../../components/charts/PieChartWrapper';
import FunnelChartWrapper from '../../components/charts/FunnelChartWrapper';
import PlanGateModal from '../../components/ui/PlanGateModal';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { hasFeature } from '../../utils/planGates';
import { formatINR, formatINRCompact } from '../../utils/formatINR';

export default function Analytics() {
  const { workspace } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState(false);
  const advanced = hasFeature(workspace, 'advanced_analytics');

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/analytics')]);
        setStats(s.data.data);
        setAnalytics(a.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Analytics">
        <div className="grid lg:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Analytics">
      {/* Basic — all plans */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card header="Lead Source">
          {stats.leadSource.length ? <BarChartWrapper data={stats.leadSource} xKey="source" yKey="count" multiColor /> : <EmptyState icon="📊" title="No data" />}
        </Card>
        <Card header="Deal Stage">
          {stats.dealStage.length ? <PieChartWrapper data={stats.dealStage.map((d) => ({ name: d.stage, value: d.count }))} /> : <EmptyState icon="🥧" title="No data" />}
        </Card>
      </div>

      {/* Advanced — Pro+ */}
      <div className="mt-6 flex items-center gap-3">
        <h2 className="font-heading text-xl text-white">Advanced analytics</h2>
        {!advanced && <Badge color="amber">Pro</Badge>}
      </div>

      <div className="relative mt-3">
        <div className={!advanced ? 'blur-sm pointer-events-none select-none' : ''}>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card header="Lead Conversion Funnel">
              <FunnelChartWrapper data={analytics.funnel} />
            </Card>
            <Card header="Revenue by Month (Closed Won)">
              <BarChartWrapper data={analytics.revenueByMonth} xKey="month" yKey="revenue" valueFormatter={formatINRCompact} />
            </Card>
          </div>

          <Card header="Agent Performance" className="mt-4">
            {analytics.agentPerformance?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/50 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2 text-left">Agent</th>
                      <th className="px-3 py-2 text-left">Leads</th>
                      <th className="px-3 py-2 text-left">Deals Closed</th>
                      <th className="px-3 py-2 text-left">Win Rate</th>
                      <th className="px-3 py-2 text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.agentPerformance.map((a) => (
                      <tr key={a.agentId} className="border-b border-white/5">
                        <td className="px-3 py-2 text-white">{a.name}</td>
                        <td className="px-3 py-2 text-white/70">{a.leads}</td>
                        <td className="px-3 py-2 text-white/70">{a.dealsClosed}</td>
                        <td className="px-3 py-2 text-white/70">{a.winRate}%</td>
                        <td className="px-3 py-2 text-accent">{formatINR(a.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="🧑‍💼" title="No agents yet" />
            )}
          </Card>
        </div>

        {!advanced && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={() => setGate(true)} className="px-5 py-2.5 rounded-xl bg-accent text-[#0B0F1A] font-semibold">
              Unlock advanced analytics
            </button>
          </div>
        )}
      </div>

      {gate && <PlanGateModal feature="advanced_analytics" requiredPlan="pro" onClose={() => setGate(false)} />}
    </PageWrapper>
  );
}
