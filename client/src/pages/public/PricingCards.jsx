import { Link } from 'react-router-dom';
import { PLANS, PLAN_ORDER } from '../../constants/plans';
import { formatINR } from '../../utils/formatINR';

export default function PricingCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {PLAN_ORDER.map((key) => {
        const plan = PLANS[key];
        return (
          <div
            key={key}
            className={`glass rounded-xl p-6 flex flex-col relative ${
              plan.recommended ? 'border-accent ring-1 ring-accent/40' : ''
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-[#0B0F1A] text-xs font-semibold">
                Recommended
              </span>
            )}
            <h3 className="font-heading text-xl text-white">{plan.name}</h3>
            <p className="text-white/50 text-sm mt-1 h-10">{plan.tagline}</p>
            <div className="my-4">
              <span className="font-heading text-3xl text-white">{formatINR(plan.priceMonthly)}</span>
              <span className="text-white/40 text-sm">/month</span>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {plan.featureList.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/75">
                  <span className="text-accent mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className={`text-center px-4 py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-90 ${
                plan.recommended ? 'bg-accent text-[#0B0F1A]' : 'bg-white/10 text-white'
              }`}
            >
              Start Free Trial
            </Link>
          </div>
        );
      })}
    </div>
  );
}
