import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SkeletonText } from '../../components/ui/Skeleton';
import api, { errMsg } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

/**
 * Facebook redirects here after the OAuth dialog with ?code&state.
 * We exchange the code for the user's Pages, let the admin pick one, and connect it.
 */
export default function MetaCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [pages, setPages] = useState(null);
  const [error, setError] = useState(null);
  const [selecting, setSelecting] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against StrictMode double-run
    ran.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const fbError = params.get('error_description') || params.get('error');

    if (fbError) {
      setError(fbError);
      return;
    }
    if (!code) {
      setError('No authorization code returned from Facebook.');
      return;
    }

    api
      .post('/workspace/meta/exchange', { code, state })
      .then((res) => setPages(res.data.data.pages))
      .catch((err) => setError(errMsg(err, 'Could not complete Facebook connection')));
  }, [params]);

  async function choose(pageId) {
    setSelecting(pageId);
    try {
      const { data } = await api.post('/workspace/meta/select-page', { pageId });
      toast.success(`Connected ${data.data.pageName}`);
      navigate('/integrations', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Could not connect page'));
      setSelecting('');
    }
  }

  return (
    <PageWrapper title="Connect Facebook">
      <div className="max-w-lg">
        <Card header="Choose a Facebook Page">
          {error ? (
            <div>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <Button onClick={() => navigate('/integrations', { replace: true })}>Back to Integrations</Button>
            </div>
          ) : !pages ? (
            <div>
              <p className="text-white/60 text-sm mb-4">Finishing connection…</p>
              <SkeletonText lines={3} />
            </div>
          ) : pages.length === 0 ? (
            <p className="text-white/60 text-sm">No Pages found on this account.</p>
          ) : (
            <ul className="space-y-2">
              {pages.map((p) => (
                <li key={p.id} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                  <div>
                    <div className="text-white">{p.name}</div>
                    <div className="text-white/40 text-xs">{p.hasInstagram ? 'Facebook + Instagram' : 'Facebook'}</div>
                  </div>
                  <Button size="sm" loading={selecting === p.id} onClick={() => choose(p.id)}>Connect</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
