import { Link } from 'react-router-dom';
import PublicNav from './PublicNav';
import PricingCards from './PricingCards';
import { whatsappUrl } from '../../constants/config';

const FEATURES = [
  { icon: '👥', title: 'Multi-agent workspaces', text: 'Manage your whole team with role-based access and per-agent scoping.' },
  { icon: '🤝', title: 'Visual deal pipeline', text: 'Drag deals across a Kanban board from prospect to closed won.' },
  { icon: '🎨', title: 'White-label your brand', text: 'Your logo, your colors, your name — across the app and emails.' },
  { icon: '🔑', title: 'Client portal', text: 'Give buyers a branded link to track their deal progress live.' },
  { icon: '💬', title: 'WhatsApp templates', text: 'One-tap follow-up messages pre-filled with lead context.' },
  { icon: '📈', title: 'Real-time analytics', text: 'Funnels, win rates, revenue and agent leaderboards.' },
];

const STEPS = [
  { n: 1, title: 'Start your trial', text: 'Message us on WhatsApp and we set up your branded workspace.' },
  { n: 2, title: 'Add your team & leads', text: 'Invite agents, import leads, and start tracking deals instantly.' },
  { n: 3, title: 'Close more deals', text: 'Stay on top of follow-ups with reminders and analytics.' },
];

const TESTIMONIALS = [
  { name: 'Rajesh Kumar', role: 'Principal Broker, Mumbai', text: 'EstateCore replaced three tools. My agents finally log every lead.' },
  { name: 'Sneha Iyer', role: 'Realtor, Bangalore', text: 'The pipeline view alone doubled how fast we move deals forward.' },
  { name: 'Amit Desai', role: 'Agency Owner, Pune', text: 'White-labeling made us look like a national brand overnight.' },
];

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes — we set up a fully-featured trial workspace for you. No card required.' },
  { q: 'Can I use my own branding?', a: 'Absolutely. Pro and Enterprise plans let you fully white-label the CRM.' },
  { q: 'How many agents can I add?', a: 'Starter supports 2, Pro up to 10, and Enterprise up to 50 agents.' },
  { q: 'Do you support Indian currency?', a: 'Yes, all values are in ₹ with Indian number formatting.' },
  { q: 'Can buyers see their deal?', a: 'Enterprise includes a branded client portal accessible via a private link.' },
  { q: 'How do I pay?', a: 'During our launch phase, contact us on WhatsApp to get started.' },
];

export default function Landing() {
  return (
    <div className="bg-base min-h-screen text-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-24 text-center relative z-10">
          <h1 className="font-heading text-4xl sm:text-6xl font-bold leading-tight">
            The CRM Built for <span className="text-accent">Indian Real Estate</span> Agents
          </h1>
          <p className="text-white/60 text-lg mt-6 max-w-2xl mx-auto">
            Capture leads, move deals, and close faster — with a CRM you can brand as your own.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-9">
            <a href={whatsappUrl('Hi, I would like to start a free EstateCore CRM trial.')} target="_blank" rel="noreferrer" className="px-7 py-3 rounded-xl bg-accent text-[#0B0F1A] font-semibold hover:opacity-90">
              Start Free Trial
            </a>
            <Link to="/pricing" className="px-7 py-3 rounded-xl bg-white/10 hover:bg-white/15 font-semibold">
              See Pricing
            </Link>
          </div>
        </div>
        {/* Stats bar */}
        <div className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-3 gap-6 text-center relative z-10">
          {[['500+', 'Leads Managed'], ['50+', 'Agents'], ['₹10Cr+', 'Pipeline']].map(([v, l]) => (
            <div key={l} className="glass rounded-xl py-5">
              <div className="font-heading text-2xl sm:text-3xl text-accent">{v}</div>
              <div className="text-white/50 text-sm mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-heading text-3xl text-center mb-12">Everything you need to sell more</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-heading text-lg mb-2">{f.title}</h3>
              <p className="text-white/55 text-sm">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="font-heading text-3xl text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent text-[#0B0F1A] flex items-center justify-center font-heading text-xl font-bold mb-4">
                {s.n}
              </div>
              <h3 className="font-heading text-lg mb-2">{s.title}</h3>
              <p className="text-white/55 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-heading text-3xl text-center mb-3">Simple, transparent pricing</h2>
        <p className="text-white/50 text-center mb-12">Start with a free trial. Upgrade anytime.</p>
        <PricingCards />
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-heading text-3xl text-center mb-12">Loved by agents across India</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass rounded-xl p-6">
              <p className="text-white/75 text-sm italic">“{t.text}”</p>
              <div className="mt-4">
                <div className="text-white font-medium">{t.name}</div>
                <div className="text-white/40 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="font-heading text-3xl text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="glass rounded-xl p-5 group">
              <summary className="cursor-pointer font-medium text-white list-none flex justify-between items-center">
                {f.q}
                <span className="text-accent group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-white/55 text-sm mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between gap-4 text-sm text-white/40">
          <div>
            <div className="font-heading text-accent text-lg">EstateCore</div>
            <p className="mt-1">The CRM for Indian real estate.</p>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/login" className="hover:text-white">Login</Link>
            <a href={whatsappUrl('Hi, I have a question about EstateCore CRM.')} target="_blank" rel="noreferrer" className="hover:text-white">
              WhatsApp
            </a>
          </div>
        </div>
        <div className="text-center text-white/30 text-xs pb-6">© {new Date().getFullYear()} EstateCore. All rights reserved.</div>
      </footer>
    </div>
  );
}
