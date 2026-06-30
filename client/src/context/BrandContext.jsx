import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const DEFAULT_BRAND = { name: 'EstateCore', accentColor: '#C9A84C', logoUrl: null, supportEmail: null };

const BrandContext = createContext(null);

function applyTheme(brand) {
  const accent = brand?.accentColor || '#C9A84C';
  document.documentElement.style.setProperty('--accent', accent);
  if (brand?.logoUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brand.logoUrl;
  }
  document.title = `${brand?.name || 'EstateCore'} CRM`;
}

export function BrandProvider({ children }) {
  const { user, workspace } = useAuth();
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [loaded, setLoaded] = useState(false);

  const fetchBrand = useCallback(async () => {
    try {
      const { data } = await api.get('/workspace/brand');
      const b = data.data.brand || DEFAULT_BRAND;
      setBrand(b);
      applyTheme(b);
      setLoaded(true);
      return b;
    } catch (e) {
      setBrand(DEFAULT_BRAND);
      applyTheme(DEFAULT_BRAND);
      setLoaded(true);
      return DEFAULT_BRAND;
    }
  }, []);

  const updateBrand = useCallback((next) => {
    setBrand(next);
    applyTheme(next);
  }, []);

  // When an admin/agent logs in, hydrate brand. Architect uses default.
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'agent')) {
      // prime from workspace summary, then fetch authoritative
      if (workspace?.brand) {
        setBrand(workspace.brand);
        applyTheme(workspace.brand);
      }
      fetchBrand();
    } else {
      setBrand(DEFAULT_BRAND);
      applyTheme(DEFAULT_BRAND);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <BrandContext.Provider value={{ brand, loaded, fetchBrand, updateBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}
