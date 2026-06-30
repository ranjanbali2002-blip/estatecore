import PublicNav from './PublicNav';
import PricingCards from './PricingCards';

const FAQS = [
  { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade at any time. Contact us and we adjust your workspace instantly.' },
  { q: 'What happens after my trial?', a: 'Your data stays safe. Reach out on WhatsApp to subscribe and keep working without interruption.' },
  { q: 'Is white-labeling included?', a: 'Brand name and accent color are available on all plans. Custom subdomain requires Pro or higher.' },
  { q: 'Do you offer onboarding?', a: 'Yes — every workspace is set up for you, and we help you import your existing leads.' },
];

export default function Pricing() {
  return (
    <div className="bg-base min-h-screen text-white">
      <PublicNav />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="font-heading text-4xl sm:text-5xl text-center mb-3">Pricing</h1>
        <p className="text-white/55 text-center mb-14 max-w-xl mx-auto">
          Choose the plan that fits your team. Every plan starts with a free trial.
        </p>
        <PricingCards />
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="font-heading text-3xl text-center mb-10">Pricing FAQ</h2>
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
    </div>
  );
}
