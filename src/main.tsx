/**
 * نقطة تشغيل Vite: تسجل جذر React، تحمل CSS، وتعرض App داخل StrictMode.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
