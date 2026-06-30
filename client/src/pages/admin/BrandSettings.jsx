import { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import ColorPicker from '../../components/ui/ColorPicker';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useBrand } from '../../context/BrandContext';
import { useAuth } from '../../context/AuthContext';
import { usePlanGate } from '../../context/PlanGateContext';
import { hasFeature } from '../../utils/planGates';

export default function BrandSettings() {
  const toast = useToast();
  const { brand, fetchBrand, updateBrand } = useBrand();
  const { workspace, refreshMe } = useAuth();
  const { openPlanGate } = usePlanGate();
  const canSubdomain = hasFeature(workspace, 'subdomain');

  const [form, setForm] = useState({ name: '', accentColor: '#C9A84C', supportEmail: '', subdomain: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      name: brand?.name || 'EstateCore',
      accentColor: brand?.accentColor || '#C9A84C',
      supportEmail: brand?.supportEmail || '',
      subdomain: brand?.subdomain || '',
    });
  }, [brand]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === 'accentColor') updateBrand({ ...brand, accentColor: v }); // live preview theme
  };

  async function save() {
    setSaving(true);
    try {
      const payload = { name: form.name, accentColor: form.accentColor, supportEmail: form.supportEmail };
      if (canSubdomain) payload.subdomain = form.subdomain;
      await api.put('/workspace/brand', payload);
      await fetchBrand();
      await refreshMe();
      toast.success('Brand updated');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Max file size is 2MB');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await api.post('/workspace/brand/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateBrand({ ...brand, logoUrl: data.data.logoUrl });
      await fetchBrand();
      toast.success('Logo updated');
    } catch (err) {
      toast.error(errMsg(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <PageWrapper title="Brand Settings">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card header="White-label configuration">
          <div className="space-y-5">
            <Input label="Brand Name" value={form.name} onChange={(e) => set('name', e.target.value)} />

            <div>
              <p className="text-sm text-white/70 mb-1.5">Logo</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl glass flex items-center justify-center overflow-hidden">
                  {brand?.logoUrl ? <img src={brand.logoUrl} alt="logo" className="w-full h-full object-contain" /> : <span className="text-accent font-heading">{form.name?.[0] || 'E'}</span>}
                </div>
                <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm cursor-pointer min-h-[40px] inline-flex items-center">
                  {uploading ? 'Uploading…' : 'Upload logo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadLogo} disabled={uploading} />
                </label>
              </div>
              <p className="text-xs text-white/40 mt-2">PNG, JPG or WebP. Max 2MB.</p>
            </div>

            <div>
              <p className="text-sm text-white/70 mb-1.5">Accent Color</p>
              <ColorPicker value={form.accentColor} onChange={(v) => set('accentColor', v)} />
            </div>

            <Input label="Support Email" type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm text-white/70">Subdomain</span>
                {!canSubdomain && <span className="text-xs">🔒</span>}
              </div>
              <input
                value={form.subdomain}
                disabled={!canSubdomain}
                onChange={(e) => set('subdomain', e.target.value)}
                onClick={() => !canSubdomain && openPlanGate('subdomain', 'pro')}
                placeholder={canSubdomain ? 'yourbrand' : 'Pro plan required'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 ring-accent outline-none disabled:opacity-50 disabled:cursor-pointer"
              />
            </div>

            <Button onClick={save} loading={saving}>Save changes</Button>
          </div>
        </Card>

        {/* Live preview */}
        <Card header="Live preview">
          <div className="rounded-xl overflow-hidden border border-white/10">
            {/* sidebar + header mock */}
            <div className="flex h-64">
              <div className="w-40 bg-card border-r border-white/10 p-3">
                <div className="mb-4">
                  {brand?.logoUrl ? <img src={brand.logoUrl} alt="" className="h-7" /> : <span className="font-heading font-bold" style={{ color: form.accentColor }}>{form.name}</span>}
                </div>
                {['Dashboard', 'Leads', 'Deals'].map((it, i) => (
                  <div key={it} className={`text-xs px-2 py-2 rounded-lg mb-1 ${i === 0 ? '' : 'text-white/50'}`} style={i === 0 ? { background: `${form.accentColor}26`, color: form.accentColor } : {}}>
                    {it}
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-base p-4">
                <div className="h-8 flex items-center justify-between mb-4">
                  <span className="font-heading text-white">Dashboard</span>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: `${form.accentColor}33`, color: form.accentColor }}>A</span>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs text-white/50">Pipeline Value</p>
                  <p className="font-heading text-lg" style={{ color: form.accentColor }}>₹1,20,00,000</p>
                </div>
                <button className="mt-3 text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: form.accentColor, color: '#0B0F1A' }}>
                  Primary button
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-3">Changes preview instantly. Click Save to apply for your whole team.</p>
        </Card>
      </div>
    </PageWrapper>
  );
}
