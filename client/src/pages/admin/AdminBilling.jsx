import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { PLANS, PLAN_ORDER } from '../../constants/plans';
import api from '../../utils/api';
import { useBrand } from '../../context/BrandContext';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/formatDate';
import { daysUntil } from '../../utils/timeAgo';
import { whatsappUrl } from '../../constants/config';

export default function AdminBilling() {
  const { brand } = useBrand();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/billing/status').then((r) => setStatus(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !status) {
    return (
      <PageWrapper title="Billing">
        <SkeletonCard />
      </PageWrapper>
    );
  }

  const isTrial = status.mode === 'trial';
  const days = isTrial ? daysUntil(status.trial?.expiresAt) : null;
  const message = `Hi, I'd like to subscribe to ${brand?.name || 'EstateCore'} CRM. My current plan is ${status.effectivePlan}.`;

  return (
    <PageWrapper title="Billing">
      {/* Current plan / trial */}
      <Card header={isTrial ? 'Your Trial' : 'Current Plan'}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl text-white capitalize">{status.effectivePlan}</span>
              <Badge color={isTrial ? 'amber' : 'green'}>{isTrial ? 'Trial' : 'Active'}</Badge>
            </div>
            {isTrial ? (
              <p className="text-white/50 text-sm mt-1">
                {days >= 0 ? `${days} days remaining · ends ${formatDate(status.trial?.expiresAt)}` : 'Trial ended'}
              </p>
            ) : (
              <p className="text-white/50 text-sm mt-1">
                {status.razorpay?.currentPeriodEnd ? `Renews ${formatDate(status.razorpay.currentPeriodEnd)}` : 'Subscription active'}
              </p>
            )}
          </div>
          {isTrial && (
            <a href={whatsappUrl(message)} target="_blank" rel="noreferrer">
              <Button>💬 Subscribe</Button>
            </a>
          )}
        </div>

        {isTrial && days >= 0 && (
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(5, (days / 30) * 100))}%` }} />
            </div>
          </div>
        )}
      </Card>

      {/* Plan comparison (Phase 1) */}
      {!status.paymentsEnabled && (
        <>
          <div className="mt-6 mb-3">
            <h2 className="font-heading text-xl text-white">Interested in subscribing?</h2>
            <p className="text-white/50 text-sm">Compare plans and reach out to upgrade.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {PLAN_ORDER.map((key) => {
              const plan = PLANS[key];
              const current = status.effectivePlan === key;
              return (
                <Card key={key} className={current ? 'ring-1 ring-accent/40' : ''}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg text-white">{plan.name}</h3>
                    {current && <Badge color="amber">Current</Badge>}
                  </div>
                  <div className="my-3">
                    <span className="font-heading text-2xl text-white">{formatINR(plan.priceMonthly)}</span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.featureList.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-white/70"><span className="text-accent">✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href={whatsappUrl(`Hi, I'd like to move to the ${plan.name} plan on ${brand?.name} CRM.`)} target="_blank" rel="noreferrer" className="block">
                    <Button variant={current ? 'secondary' : 'primary'} className="w-full" disabled={current}>
                      {current ? 'Current plan' : `Choose ${plan.name}`}
                    </Button>
                  </a>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Phase 3 placeholder note */}
      {status.paymentsEnabled && (
        <Card className="mt-6" header="Payment history">
          <p className="text-white/50 text-sm">Billing history will appear here once you have an active subscription.</p>
        </Card>
      )}
    </PageWrapper>
  );
}
