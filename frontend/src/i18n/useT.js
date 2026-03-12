import { useCallback } from 'react';
import translations from './translations';

/**
 * Returns a `t(key)` function that reads the current `lang` ('EN' | 'RO')
 * and resolves the matching string from the central translations dictionary.
 *
 * Usage:
 *   const t = useT(lang);           // lang comes from useTheme()
 *   <h1>{t('overview.title')}</h1>
 *
 *   // with interpolation:
 *   t('card.lastXMonths', [6])  → "Last 6 months" / "Ultimele 6 luni"
 */
export function useT(lang = 'RO') {
  return useCallback(
    (key, params) => {
      const entry = translations[key];
      if (!entry) return key;                     // fallback = key
      let str = entry[lang] ?? entry.EN ?? key;   // fallback chain
      if (params) {
        params.forEach((v, i) => {
          str = str.replace(`{${i}}`, v);
        });
      }
      return str;
    },
    [lang],
  );
}

export default useT;
