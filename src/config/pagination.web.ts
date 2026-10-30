/// <reference types="vite/client" />
import { resolvePageSize } from './resolvePageSize';

export const pageSize = resolvePageSize(import.meta.env.VITE_PAGE_SIZE);