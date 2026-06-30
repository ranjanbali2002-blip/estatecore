import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { daysUntil } from '../../utils/timeAgo';
import { whatsappUrl } from '../../constants/config';

export default function TrialBanner() {
  const { workspace } = useAuth();
  const { brand } = useBrand();

  if (!workspace?.trial?.enabled) return null;
  const days = daysUntil(workspace.trial.expiresAt);
  if (days == null || days < 0) return null;

  const message = `Hi, I'd like to subscribe to ${brand?.name || 'EstateCore'} CRM. My workspace: ${brand?.name}. Please help me get started.`;

  return (
    <div className="sticky top-0 z-30 bg-accent/15 border-b border-accent/30 px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-sm">
      <span className="text-white/90">
        {days === 0
          ? 'Your free trial ends today'
          : `Your free trial ends in ${days} day${days > 1 ? 's' : ''}`}
        {' — '}
        <span className="text-white/60">subscribe to keep your workspace.</span>
      </span>
      <a
        href={whatsappUrl(message)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent text-[#0B0F1A] font-semibold hover:opacity-90 transition-opacity"
      >
        💬 Contact us
      </a>
    </div>
  );
}
