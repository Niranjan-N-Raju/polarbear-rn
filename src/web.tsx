/// <reference lib="dom" />
/// <reference types="react-dom" />

import { createRoot } from 'react-dom/client';
import App from '../App';

const root = document.getElementById('root');
if (!root) throw new Error('Web root element was not found.');

createRoot(root).render(<App />);