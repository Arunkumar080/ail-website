import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/schibsted-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '../site.css';
import { Privacy } from './Privacy.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Privacy />
  </StrictMode>,
);
