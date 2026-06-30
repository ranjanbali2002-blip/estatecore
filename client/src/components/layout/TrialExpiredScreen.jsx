import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { whatsappUrl } from '../../constants/config';
import Button from '../ui/Button';

export default function TrialExpiredScreen() {
  const { logout } = useAuth();
  const { brand } = useBrand();
  const name = brand?.name || 'EstateCore';
  const message = `Hi, I'm interested in subscribing to EstateCore. My workspace: ${name}. Please help me get started.`;

  return (
    <div className="fixed inset-0 z-[200] bg-base flex items-center justify-center p-6">
      <div className="glass rounded-xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="font-heading text-3xl text-white mb-3">Your Free Trial Has Ended</h1>
        <p className="text-white/60 mb-7">
          Thank you for trying {name} CRM. Contact us to continue using the platform — your data is
          safe and ready when you are.
        </p>
        <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="block mb-3">
          <Button variant="primary" size="lg" className="w-full">
            💬 Contact us on WhatsApp
          </Button>
        </a>
        <button onClick={logout} className="text-white/40 hover:text-white text-sm">
          Log out
        </button>
      </div>
    </div>
  );
}
