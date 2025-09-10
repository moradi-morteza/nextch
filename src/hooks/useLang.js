import { fa } from '../lang/fa.js';

export function useLang() {
  const t = (key, defaultText = key) => {
    return fa[key] || defaultText;
  };

  return { t };
}

// Static function for use outside React components
export function getLangText(key, defaultText = key) {
  return fa[key] || defaultText;
}