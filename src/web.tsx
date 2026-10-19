/// <reference lib="dom" />
/// <reference types="react-dom" />

import { createRoot } from 'react-dom/client';
import App from '../App';
import { t } from './i18n';
import './responsiveDrawer.css';

document.title = t('pageTitle');

const root = document.getElementById('root');
if (!root) throw new Error(t('webRootMissing'));

createRoot(root).render(<App />);