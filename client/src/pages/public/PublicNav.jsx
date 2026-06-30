import { Link } from 'react-router-dom';
import { whatsappUrl } from '../../constants/config';

export default function PublicNav() {
  return (
    <nav className="sticky top-0 z-30 glass border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl font-bold text-accent">
          EstateCore
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/pricing" className="text-white/70 hover:text-white text-sm hidden sm:block">
            Pricing
          </Link>
          <Link to="/login" className="text-white/70 hover:text-white text-sm">
            Login
          </Link>
          <a
            href={whatsappUrl('Hi, I would like to start a free EstateCore CRM trial.')}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-accent text-[#0B0F1A] font-semibold text-sm hover:opacity-90"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </nav>
  );
}
