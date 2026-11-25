import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Só o subconjunto "latin" (cobre todos os acentos do português).
import '@fontsource/anton/latin-400.css';
import '@fontsource/league-gothic/latin-400.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-700.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
