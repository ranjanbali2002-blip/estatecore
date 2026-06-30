import { useState } from 'react';
import Papa from 'papaparse';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const TEMPLATE_HEADERS = ['name', 'phone', 'email', 'budget', 'propertyType', 'source', 'status', 'locationInterest'];

export default function CSVImport({ onClose, onImported }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  function downloadTemplate() {
    const csv = TEMPLATE_HEADERS.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data.slice(0, 500).map((r) => {
          const valid = !!(r.name || r.Name);
          return { ...r, __valid: valid, __reason: valid ? '' : 'Missing name' };
        });
        setRows(parsed);
      },
      error: () => toast.error('Could not parse CSV'),
    });
  }

  const validRows = rows.filter((r) => r.__valid);

  async function doImport() {
    if (!validRows.length) return toast.error('No valid rows to import');
    setLoading(true);
    try {
      const payload = validRows.map(({ __valid, __reason, ...r }) => r);
      const { data } = await api.post('/leads/import/csv', { rows: payload });
      toast.success(`Imported ${data.data.imported} leads, skipped ${data.data.skipped}`);
      onImported?.();
      onClose();
    } catch (err) {
      toast.error(errMsg(err, 'Import failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Import Leads (CSV)"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={doImport} loading={loading} disabled={!validRows.length}>
            Import {validRows.length} valid
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={downloadTemplate}>Download template</Button>
          <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm cursor-pointer min-h-[36px] inline-flex items-center">
            {fileName || 'Choose CSV file'}
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
          <span className="text-xs text-white/40">Max 500 rows</span>
        </div>

        {rows.length > 0 && (
          <>
            <div className="text-sm text-white/60">
              {rows.length} rows · <span className="text-emerald-300">{validRows.length} valid</span> ·{' '}
              <span className="text-red-300">{rows.length - validRows.length} invalid</span>
            </div>
            <div className="glass rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-white/50 border-b border-white/10">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className={`border-b border-white/5 ${!r.__valid ? 'bg-red-500/10' : ''}`}>
                      <td className="px-3 py-2 text-white/85">{r.name || r.Name || <span className="text-red-300">{r.__reason}</span>}</td>
                      <td className="px-3 py-2 text-white/70">{r.phone || r.Phone}</td>
                      <td className="px-3 py-2 text-white/70">{r.email || r.Email}</td>
                      <td className="px-3 py-2">{r.__valid ? <Badge color="green">OK</Badge> : <Badge color="red">Skip</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && <p className="text-xs text-white/40">Showing first 5 of {rows.length} rows.</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
