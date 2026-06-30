import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { useBrand } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/formatINR';

export default function WhatsAppTemplate({ lead, onClose }) {
  const toast = useToast();
  const { brand } = useBrand();
  const { user } = useAuth();

  const message = `Hi ${lead.name}, this is ${user?.name} from ${brand?.name || 'EstateCore'}. Following up on your interest in a ${lead.propertyType || 'property'} in ${lead.locationInterest || 'your preferred area'} within ${formatINR(lead.budget || 0)}. Would you like to schedule a site visit? 🏡`;

  const phone = (lead.phone || '').replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Message copied');
    } catch {
      toast.error('Could not copy');
    }
  }

  return (
    <Modal
      title="WhatsApp Follow-up"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={copy}>Copy</Button>
          <a href={waUrl} target="_blank" rel="noreferrer">
            <Button disabled={!phone}>Open WhatsApp</Button>
          </a>
        </>
      }
    >
      <div className="glass rounded-xl p-4 text-sm text-white/85 whitespace-pre-wrap">{message}</div>
      {!phone && <p className="text-amber-300 text-xs mt-3">This lead has no phone number — add one to send via WhatsApp.</p>}
    </Modal>
  );
}
