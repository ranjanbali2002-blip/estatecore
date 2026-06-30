import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import BarChartWrapper from '../../components/charts/BarChartWrapper';
import PieChartWrapper from '../../components/charts/PieChartWrapper';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { formatINRCompact } from '../../utils/formatINR';
import { formatDate } from '../../utils/formatDate';
import { timeAgo, daysUntil } from '../../utils/timeAgo';
import { whatsappUrl } from '../../constants/config';

export default function AdminDashboard() {
  const { workspace } = useAuth();
  const { brand } = useBrand();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a, u] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activity'),
          api.get('/dashboard/upcoming'),
        ]);
        setStats(s.data.data);
        setActivity(a.data.data.items);
        setUpcoming(u.data.data.items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trialDays = workspace?.trial?.enabled ? daysUntil(workspace.trial.expiresAt) : null;

  return (
    <PageWrapper title="Dashboard">
      {loading || !stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Total Leads" value={stats.kpis.totalLeads} />
            <StatCard icon="🤝" label="Active Deals" value={stats.kpis.activeDeals} />
            <StatCard icon="💰" label="Pipeline Value" value={formatINRCompact(stats.kpis.pipelineValue)} />
            <StatCard icon="🎯" label="Win Rate" value={`${stats.kpis.winRate}%`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Card header="Leads by Source">
              {stats.leadSource.length ? (
                <BarChartWrapper data={stats.leadSource} xKey="source" yKey="count" multiColor />
              ) : (
                <EmptyState icon="📊" title="No lead data yet" subtext="Add leads to see source breakdown." />
              )}
            </Card>
            <Card header="Deals by Stage">
              {stats.dealStage.length ? (
                <PieChartWrapper data={stats.dealStage.map((d) => ({ name: d.stage, value: d.count }))} />
              ) : (
                <EmptyState icon="🥧" title="No deals yet" subtext="Create deals to see the distribution." />
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            {/* Subscription card */}
            <Card header="Subscription">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Plan</span>
                  <Badge color="amber">{(workspace?.effectivePlan || workspace?.plan || 'starter').toUpperCase()}</Badge>
                </div>
                {workspace?.trial?.enabled ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Trial ends</span>
                      <span className="text-white text-sm">{formatDate(workspace.trial.expiresAt)}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-white/50 mb-1">
                        <span>{trialDays} days left</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(5, (trialDays / 30) * 100))}%` }} />
                      </div>
                    </div>
                    <a
                      href={whatsappUrl(`Hi, I'd like to subscribe to ${brand?.name || 'EstateCore'} CRM.`)}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center px-4 py-2 rounded-xl bg-accent text-[#0B0F1A] font-semibold text-sm"
                    >
                      Subscribe now
                    </a>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Status</span>
                    <Badge color="green">{workspace?.status}</Badge>
                  </div>
                )}
                <Link to="/billing" className="block text-center text-sm text-accent">
                  Manage billing →
                </Link>
              </div>
            </Card>

            {/* Recent activity */}
            <Card header="Recent Activity">
              {activity.length ? (
                <ul className="space-y-3">
                  {activity.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-accent">•</span>
                      <div>
                        <p className="text-white/85">{a.text}</p>
                        <p className="text-white/35 text-xs">
                          {a.agent ? `${a.agent} · ` : ''}
                          {timeAgo(a.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon="🕒" title="No activity yet" />
              )}
            </Card>

            {/* Upcoming follow-ups */}
            <Card header="Upcoming Follow-ups">
              {upcoming.length ? (
                <ul className="space-y-3">
                  {upcoming.slice(0, 6).map((t) => (
                    <li key={t._id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-white/85">{t.title}</p>
                        <p className="text-white/35 text-xs">{t.leadId?.name || '—'} · {formatDate(t.dueDate)}</p>
                      </div>
                      <Badge value={t.priority} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon="📅" title="Nothing due soon" />
              )}
            </Card>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
