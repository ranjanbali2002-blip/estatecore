import Badge from '../ui/Badge';
import { formatINR } from '../../utils/formatINR';

export default function PropertyCard({ property, onClick }) {
  return (
    <button onClick={onClick} className="glass rounded-xl overflow-hidden text-left hover:ring-1 ring-accent/30 transition-all">
      <div className="h-40 bg-gradient-to-br from-accent/20 to-blue-500/10 relative">
        {property.imageUrls?.[0] && (
          <img src={property.imageUrls[0]} alt={property.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        )}
        <div className="absolute top-2 right-2">
          <Badge value={property.status} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge color="blue">{property.type}</Badge>
        </div>
        <h3 className="font-medium text-white leading-snug">{property.title}</h3>
        <p className="text-xs text-white/40 mt-0.5">{property.location || '—'}</p>
        <div className="font-heading text-xl text-accent mt-2">{formatINR(property.price)}</div>
        <div className="text-xs text-white/50 mt-1">
          {property.bhk ? `${property.bhk} BHK · ` : ''}{property.areaSqft ? `${property.areaSqft} sqft` : ''}
        </div>
      </div>
    </button>
  );
}
