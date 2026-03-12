import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, lang: 'RO', toggleLang: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chain-theme') === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  });

  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chain-lang') || 'RO';
    }
    return 'RO';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('chain-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const toggleLang = () => setLang((prev) => {
    const next = prev === 'RO' ? 'EN' : 'RO';
    localStorage.setItem('chain-lang', next);
    return next;
  });

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, lang, toggleLang }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
