import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import BarChartWrapper from '../../components/charts/BarChartWrapper';
import PieChartWrapper from '../../components/charts/PieChartWrapper';
import api from '../../utils/api';
import { formatINR, formatINRCompact } from '../../utils/formatINR';
import { timeAgo } from '../../utils/timeAgo';

export default function ArchDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/architect/dashboard').then((r) => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <PageWrapper title="Architect">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </PageWrapper>
    );
  }

  const { kpis, mrrByMonth, planDistribution, recentTrials, expiringSoon } = data;

  return (
    <PageWrapper title="Architect Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🏢" label="Active Workspaces" value={kpis.totalActiveWorkspaces} />
        <StatCard icon="🧪" label="Trial Workspaces" value={kpis.trialWorkspaces} />
        <StatCard icon="⏳" label="Expiring This Week" value={kpis.expiringThisWeek} />
        <StatCard icon="💰" label="MRR" value={formatINR(kpis.mrr)} hint="₹0 in Phase 1" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card header="MRR by Month (last 12)">
          <BarChartWrapper data={mrrByMonth} xKey="month" yKey="mrr" valueFormatter={formatINRCompact} />
        </Card>
        <Card header="Plan Distribution">
          {planDistribution.some((p) => p.count) ? (
            <PieChartWrapper data={planDistribution.map((p) => ({ name: p.plan, value: p.count }))} />
          ) : (
            <EmptyState icon="🥧" title="No workspaces yet" />
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card header="Recent Trial Creations">
          {recentTrials.length ? (
            <ul className="space-y-3">
              {recentTrials.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white">{w.brandName}</p>
                    <p className="text-white/40 text-xs">{w.adminEmail}</p>
                  </div>
                  <Badge color="amber">{w.plan}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="🧪" title="No trials yet" />
          )}
        </Card>

        <Card header="Trials Expiring (next 7 days)">
          {expiringSoon.length ? (
            <ul className="space-y-3">
              {expiringSoon.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white">{w.brandName}</p>
                    <p className="text-white/40 text-xs">{w.adminEmail}</p>
                  </div>
                  <Badge color={w.daysLeft <= 1 ? 'red' : 'amber'}>{w.daysLeft}d left</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="✅" title="Nothing expiring soon" />
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
