import Modal from './Modal';
import Button from './Button';
import { PLANS } from '../../constants/plans';
import { whatsappUrl } from '../../constants/config';
import { useBrand } from '../../context/BrandContext';

export default function PlanGateModal({ feature, requiredPlan = 'pro', onClose }) {
  const { brand } = useBrand();
  const plan = PLANS[requiredPlan] || PLANS.pro;
  const message = `Hi, I'd like to upgrade my ${brand?.name || 'EstateCore'} CRM to the ${plan.name} plan to unlock more features.`;

  return (
    <Modal title="Upgrade required" size="md" onClose={onClose}>
      <div className="text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="font-heading text-xl text-white mb-1">This is a {plan.name} feature</h3>
        <p className="text-white/60 text-sm mb-5">
          Upgrade to <span className="text-accent font-semibold">{plan.name}</span> to unlock this and more.
        </p>

        <div className="glass rounded-xl p-4 text-left mb-5">
          <ul className="space-y-2">
            {plan.featureList.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-accent">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="primary" className="w-full">
              💬 Upgrade via WhatsApp
            </Button>
          </a>
          <Button variant="ghost" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
