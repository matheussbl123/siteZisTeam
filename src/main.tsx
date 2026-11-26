import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
// Só o subconjunto "latin" (cobre todos os acentos do português).
import '@fontsource/anton/latin-400.css';
import '@fontsource/league-gothic/latin-400.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-700.css';
import './styles.css';
import App from './App';
import { EnvBanner } from './EnvBanner';

// A página /admin é carregada à parte, para não pesar o site para os visitantes.
const AdminApp = lazy(() => import('./admin/AdminApp'));
const isAdmin = /^\/admin(\/|$)/.test(location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EnvBanner />
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
