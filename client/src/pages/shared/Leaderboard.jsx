import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import LineChartWrapper from '../../components/charts/LineChartWrapper';
import api from '../../utils/api';
import { formatINR, formatINRCompact } from '../../utils/formatINR';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [lb, fc] = await Promise.all([
          api.get('/dashboard/leaderboard'),
          api.get('/dashboard/forecast').catch(() => ({ data: { data: null } })),
        ]);
        setRows(lb.data.data.items);
        setForecast(fc.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // merge actual + projected into one series for the chart
  const forecastData = forecast
    ? [
        ...forecast.actual.map((a) => ({ month: a.month, actual: a.revenue, projected: null })),
        ...forecast.projected.map((p) => ({ month: p.month, actual: null, projected: p.revenue })),
      ]
    : [];

  return (
    <PageWrapper title="Leaderboard">
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <>
          <Card header="Agent Rankings">
            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/50 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2 text-left">Rank</th>
                      <th className="px-3 py-2 text-left">Agent</th>
                      <th className="px-3 py-2 text-left">Deals Closed</th>
                      <th className="px-3 py-2 text-left">Revenue</th>
                      <th className="px-3 py-2 text-left">Win Rate</th>
                      <th className="px-3 py-2 text-left">Avg Deal Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.agentId} className="border-b border-white/5">
                        <td className="px-3 py-2">{r.rank === 1 ? '🏆' : r.rank}</td>
                        <td className="px-3 py-2 text-white font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-white/70">{r.dealsClosed}</td>
                        <td className="px-3 py-2 text-accent">{formatINR(r.revenue)}</td>
                        <td className="px-3 py-2 text-white/70">{r.winRate}%</td>
                        <td className="px-3 py-2 text-white/70">{formatINR(r.avgDealSize)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon="🏆" title="No agents to rank yet" />
            )}
          </Card>

          {forecast && (
            <Card header="Revenue Forecast" className="mt-4">
              <p className="text-xs text-white/40 mb-3">Last 3 months actual vs next 3 months projected (linear regression).</p>
              <LineChartWrapper
                data={forecastData}
                xKey="month"
                valueFormatter={formatINRCompact}
                series={[
                  { key: 'actual', name: 'Actual', color: 'var(--accent)' },
                  { key: 'projected', name: 'Projected', color: '#1E88E5', dashed: true },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </PageWrapper>
  );
}
