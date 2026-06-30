import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import api from '../../utils/api';
import { formatDate } from '../../utils/formatDate';
import { timeAgo } from '../../utils/timeAgo';

export default function AgentDashboard() {
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

  const today = new Date().toDateString();
  const dueToday = upcoming.filter((t) => new Date(t.dueDate).toDateString() === today).length;
  const overdue = upcoming.filter((t) => new Date(t.dueDate) < new Date(today)).length;

  return (
    <PageWrapper title="My Dashboard">
      {loading || !stats ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="👥" label="My Leads" value={stats.kpis.totalLeads} />
            <StatCard icon="🤝" label="My Active Deals" value={stats.kpis.activeDeals} />
            <StatCard icon="📅" label="Tasks Due Today" value={dueToday} />
            <StatCard icon="⏰" label="Tasks Overdue" value={overdue} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <Card header="My Upcoming Follow-ups">
              {upcoming.length ? (
                <ul className="space-y-3">
                  {upcoming.map((t) => (
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

            <Card header="My Recent Activity">
              {activity.length ? (
                <ul className="space-y-3">
                  {activity.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-accent">•</span>
                      <div>
                        <p className="text-white/85">{a.text}</p>
                        <p className="text-white/35 text-xs">{timeAgo(a.at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon="🕒" title="No activity yet" />
              )}
            </Card>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
