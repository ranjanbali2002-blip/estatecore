import { useAuth } from '../../context/AuthContext';
import { useBrand } from '../../context/BrandContext';
import { whatsappUrl } from '../../constants/config';
import Button from '../ui/Button';

export default function WorkspaceInactiveScreen() {
  const { logout } = useAuth();
  const { brand } = useBrand();
  const name = brand?.name || 'EstateCore';
  const message = `Hi, my ${name} CRM workspace is inactive. Please help me reactivate it.`;

  return (
    <div className="fixed inset-0 z-[200] bg-base flex items-center justify-center p-6">
      <div className="glass rounded-xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-heading text-3xl text-white mb-3">Workspace Inactive</h1>
        <p className="text-white/60 mb-7">
          Your {name} CRM workspace is currently inactive. This usually means a billing
          issue. Contact us to restore access — your data is safe.
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
