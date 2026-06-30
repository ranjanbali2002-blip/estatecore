import { useCallback, useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import DataTable from '../../components/ui/DataTable';
import { Select } from '../../components/ui/Field';
import { SkeletonCard } from '../../components/ui/Skeleton';
import PropertyCard from '../../components/properties/PropertyCard';
import PropertyModal from '../../components/properties/PropertyModal';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../constants/statuses';
import { formatINR } from '../../utils/formatINR';

export default function Properties() {
  const toast = useToast();
  const [view, setView] = useState('grid');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (status) params.status = status;
      const { data } = await api.get('/properties', { params });
      setItems(data.data.items);
    } catch (err) {
      toast.error(errMsg(err, 'Could not load properties'));
    } finally {
      setLoading(false);
    }
  }, [search, type, status, toast]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const columns = [
    { key: 'title', label: 'Title', sortable: true, render: (r) => <span className="text-white">{r.title}</span> },
    { key: 'type', label: 'Type', render: (r) => <Badge color="blue">{r.type}</Badge> },
    { key: 'location', label: 'Location' },
    { key: 'price', label: 'Price', sortable: true, render: (r) => formatINR(r.price) },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
  ];

  return (
    <PageWrapper title="Properties">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, location…" className="flex-1 min-w-[180px] bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 ring-accent outline-none" />
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="" className="bg-card">All types</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="bg-card">{t}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="" className="bg-card">All statuses</option>
          {PROPERTY_STATUSES.map((s) => <option key={s} value={s} className="bg-card">{s}</option>)}
        </Select>
        <div className="flex gap-2 ml-auto">
          <div className="flex rounded-xl bg-white/5 p-1">
            <button onClick={() => setView('grid')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'grid' ? 'bg-accent text-[#0B0F1A]' : 'text-white/60'}`}>Grid</button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-sm ${view === 'list' ? 'bg-accent text-[#0B0F1A]' : 'text-white/60'}`}>List</button>
          </div>
          <Button onClick={() => setModal({})}>+ Add Property</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="🏠" title="No properties yet" subtext="Add your first property listing." action="+ Add Property" onAction={() => setModal({})} />
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => <PropertyCard key={p._id} property={p} onClick={() => setModal({ propertyId: p._id })} />)}
        </div>
      ) : (
        <DataTable columns={columns} rows={items} onRowClick={(r) => setModal({ propertyId: r._id })} />
      )}

      {modal && <PropertyModal propertyId={modal.propertyId} onClose={() => setModal(null)} onSaved={fetchItems} />}
    </PageWrapper>
  );
}
