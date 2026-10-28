import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/auth';
import { t } from '../../../i18n';
import { currentMonthValue as currentPeriod } from '../shared/months';
import { type StoreConfigPayload, type StoreConfigSection, type StoreConfigValues, type StoreShift } from './StoreConfigDrawer';
export const initial: StoreConfigValues = { name: '', hasLogo: false, configured: false, cycleType: 'calendar_month', startDay: 1, endDay: 31, positions: [], shifts: [] };
export function bytesToBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    result += alphabet[Math.floor(a / 4)];
    result += alphabet[(a % 4) * 16 + (b === undefined ? 0 : Math.floor(b / 16))];
    result += b === undefined ? '=' : alphabet[(b % 16) * 4 + (c === undefined ? 0 : Math.floor(c / 64))];
    result += c === undefined ? '=' : alphabet[c % 64];
  }
  return result;
}
export function useFranchiseStoreConfig({ storeId }: { storeId: string; }) {
  const [value, setValue] = useState(initial);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<StoreConfigSection | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error'; } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadConfig = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const paths = [
        `/stores/branding?storeId=${encodeURIComponent(storeId)}`,
        `/stores/cycle?storeId=${encodeURIComponent(storeId)}&period=${currentPeriod()}`,
        `/stores/positions?storeId=${encodeURIComponent(storeId)}`,
        `/stores/shifts?storeId=${encodeURIComponent(storeId)}`,
      ];
      const responses = await Promise.all(paths.map((path) => apiRequest(path)));
      const results = await Promise.all(responses.map(async (response) => {
        const data = await response.json() as { message?: string; store?: { name?: string; hasLogo?: boolean; }; cycle?: { configured?: boolean; type?: StoreConfigValues['cycleType']; startDay?: number; endDay?: number; }; positions?: string[]; shifts?: StoreShift[]; };
        if (!response.ok) throw new Error(data.message ?? t('franchiseStoreConfigLoadFailed'));
        return data;
      }));
      const cycle = results[1].cycle ?? {};
      setValue({
        name: results[0].store?.name ?? '',
        hasLogo: Boolean(results[0].store?.hasLogo),
        configured: Boolean(cycle.configured),
        cycleType: cycle.type ?? 'calendar_month',
        startDay: cycle.startDay ?? 1,
        endDay: cycle.endDay ?? 31,
        positions: results[2].positions ?? [],
        shifts: results[3].shifts ?? [],
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : t('franchiseStoreConfigLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [storeId]);
  useEffect(() => { loadConfig(); }, [loadConfig]);
  useEffect(() => {
    let current = true;
    if (!value.hasLogo || !storeId) { setLogoUri(null); return () => { current = false; }; }
    apiRequest(`/stores/logo?storeId=${encodeURIComponent(storeId)}`).then(async (response) => {
      if (!response.ok) return;
      const contentType = response.headers.get('content-type') ?? 'image/png';
      const encoded = bytesToBase64(new Uint8Array(await response.arrayBuffer()));
      if (current) setLogoUri(`data:${contentType};base64,${encoded}`);
    }).catch(() => { if (current) setLogoUri(null); });
    return () => { current = false; };
  }, [storeId, value.hasLogo]);
  const save = useCallback(async (sectionToSave: StoreConfigSection, payload: StoreConfigPayload) => {
    const path = sectionToSave === 'branding' ? '/stores/branding' : `/stores/${sectionToSave}`;
    setBusy(true);
    try {
      const response = await apiRequest(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, ...payload }) });
      const result = await response.json() as { message?: string; };
      if (!response.ok) throw new Error(result.message ?? t('franchiseStoreConfigSaveFailed'));
      setSection(null);
      setToast({ message: result.message ?? t('franchiseStoreConfigSaved'), tone: 'success' });
      await loadConfig();
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : t('franchiseStoreConfigSaveFailed'), tone: 'error' });
    } finally { setBusy(false); }
  }, [loadConfig, storeId]);
  const removeLogo = useCallback(async () => {
    setBusy(true);
    try {
      const response = await apiRequest(`/stores/logo?storeId=${encodeURIComponent(storeId)}`, { method: 'DELETE' });
      const result = await response.json() as { message?: string; };
      if (!response.ok) throw new Error(result.message ?? t('franchiseStoreConfigSaveFailed'));
      setSection(null);
      setValue((current) => ({ ...current, hasLogo: false }));
      setLogoUri(null);
      setToast({ message: result.message ?? t('franchiseStoreConfigSaved'), tone: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : t('franchiseStoreConfigSaveFailed'), tone: 'error' });
    } finally { setBusy(false); }
  }, [storeId]);
  return {
    value,
    logoUri,
    loading,
    busy,
    section,
    setSection,
    toast,
    setToast,
    loadError,
    loadConfig,
    save,
    removeLogo,
  };
}
