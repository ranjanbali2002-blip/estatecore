import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { errMsg } from '../../utils/api';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/formatDate';
import { DEAL_STAGES } from '../../constants/statuses';
import Skeleton from '../../components/ui/Skeleton';

export default function ClientPortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/portal/${token}`);
        setData(res.data.data);
        const accent = res.data.data.brand?.accentColor || '#C9A84C';
        document.documentElement.style.setProperty('--accent', accent);
      } catch (err) {
        setError(errMsg(err, 'This link is invalid or has been disabled.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base p-6 flex items-center justify-center">
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="h-10 w-1/2 mx-auto" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6 text-center">
        <div className="glass rounded-xl p-8 max-w-md">
          <div className="text-4xl mb-3">🔗</div>
          <h1 className="font-heading text-2xl text-white mb-2">Link unavailable</h1>
          <p className="text-white/55">{error}</p>
        </div>
      </div>
    );
  }

  const { brand, deal, property, agent } = data;
  const stages = DEAL_STAGES.filter((s) => s !== 'Closed Lost');
  const currentIdx = stages.indexOf(deal.stage);
  const isLost = deal.stage === 'Closed Lost';

  return (
    <div className="min-h-screen bg-base text-white">
      <header className="glass border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-3">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="h-8" />
          ) : (
            <span className="font-heading text-xl font-bold text-accent">{brand.name}</span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="font-heading text-2xl text-white">{deal.title}</h1>
          <p className="text-white/40 text-sm mt-1">Last updated {formatDate(deal.updatedAt)}</p>
        </div>

        {/* Stage stepper */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-sm text-white/50 mb-5">Deal progress</h2>
          {isLost ? (
            <div className="text-red-300">This deal is marked as closed (lost).</div>
          ) : (
            <div className="flex items-center justify-between">
              {stages.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center text-center relative">
                  {i > 0 && (
                    <div
                      className={`absolute left-0 top-3 -translate-x-1/2 w-full h-0.5 ${
                        i <= currentIdx ? 'bg-accent' : 'bg-white/10'
                      }`}
                      style={{ left: '-50%' }}
                    />
                  )}
                  <div
                    className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      i <= currentIdx ? 'bg-accent text-[#0B0F1A]' : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {i < currentIdx ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] mt-2 ${i <= currentIdx ? 'text-white' : 'text-white/40'}`}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property */}
        {property && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-sm text-white/50 mb-3">Property details</h2>
            {property.imageUrls?.[0] && (
              <img src={property.imageUrls[0]} alt={property.title} className="w-full h-48 object-cover rounded-xl mb-4" />
            )}
            <h3 className="font-heading text-lg text-white">{property.title}</h3>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <Detail label="Type" value={property.type} />
              <Detail label="Location" value={property.location} />
              <Detail label="Price" value={formatINR(property.price)} />
              {property.bhk ? <Detail label="Configuration" value={`${property.bhk} BHK`} /> : null}
              {property.areaSqft ? <Detail label="Area" value={`${property.areaSqft} sqft`} /> : null}
            </div>
          </div>
        )}

        {/* Agent contact */}
        {agent && (
          <div className="glass rounded-xl p-6">
            <h2 className="text-sm text-white/50 mb-3">Your agent</h2>
            <div className="text-white font-medium">{agent.name}</div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="text-accent">
                  ✉ {agent.email}
                </a>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-white/25 text-xs pt-4">Powered by EstateCore</p>
      </main>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white">{value || '—'}</div>
    </div>
  );
}
