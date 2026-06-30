import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import api from '../../utils/api';
import { formatDate } from '../../utils/formatDate';

export default function ArchBilling() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/architect/billing').then((r) => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <PageWrapper title="Billing">
        <SkeletonCard />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Platform Billing">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg text-white">Payments</h3>
            <p className="text-white/50 text-sm mt-1">
              {data.paymentsEnabled
                ? 'Razorpay billing is active.'
                : 'Payments are not yet enabled. The platform runs on the trial system in Phase 1.'}
            </p>
          </div>
          <Badge color={data.paymentsEnabled ? 'green' : 'amber'}>
            PAYMENTS_ENABLED = {String(data.paymentsEnabled)}
          </Badge>
        </div>
      </Card>

      {data.paymentsEnabled ? (
        <Card header="Billing Events" className="mt-4">
          {data.events?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/50 border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2 text-left">Event</th>
                    <th className="px-3 py-2 text-left">Workspace</th>
                    <th className="px-3 py-2 text-left">Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr key={e._id} className="border-b border-white/5">
                      <td className="px-3 py-2 text-white">{e.event}</td>
                      <td className="px-3 py-2 text-white/60">{e.workspaceId || '—'}</td>
                      <td className="px-3 py-2 text-white/60">{formatDate(e.processedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="💳" title="No billing events yet" />
          )}
        </Card>
      ) : (
        <Card className="mt-4">
          <EmptyState icon="💳" title="Trial mode" subtext="Flip PAYMENTS_ENABLED=true in .env to activate Razorpay billing. Billing events and revenue will appear here." />
        </Card>
      )}
    </PageWrapper>
  );
}
