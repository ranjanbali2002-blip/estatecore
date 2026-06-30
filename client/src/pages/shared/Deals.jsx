import { useCallback, useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import DealKanban from '../../components/deals/DealKanban';
import DealModal from '../../components/deals/DealModal';
import api, { errMsg } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Deals() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';
  const [deals, setDeals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { dealId } | { defaultStage }

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/deals', { params: { page: 1 } });
      setDeals(data.data.items);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load deals'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDeals();
    if (isAdmin) api.get('/agents').then((r) => setAgents(r.data.data.items)).catch(() => {});
  }, [fetchDeals, isAdmin]);

  async function moveDeal(id, stage) {
    setDeals((ds) => ds.map((d) => (d._id === id ? { ...d, stage } : d)));
    try {
      await api.patch(`/deals/${id}/stage`, { stage });
    } catch (err) {
      toast.error(errMsg(err, 'Could not move deal'));
      fetchDeals();
    }
  }

  return (
    <PageWrapper title="Deals">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModal({ defaultStage: 'Prospect' })}>+ Add Deal</Button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : deals.length ? (
        <DealKanban
          deals={deals}
          onMove={moveDeal}
          onOpen={(dealId) => setModal({ dealId })}
          onAdd={(stage) => setModal({ defaultStage: stage })}
        />
      ) : (
        <EmptyState icon="🤝" title="No deals yet" subtext="Create your first deal to start tracking your pipeline." action="+ Add Deal" onAction={() => setModal({ defaultStage: 'Prospect' })} />
      )}

      {modal && (
        <DealModal
          dealId={modal.dealId}
          defaultStage={modal.defaultStage}
          agents={agents}
          onClose={() => setModal(null)}
          onSaved={fetchDeals}
        />
      )}
    </PageWrapper>
  );
}
