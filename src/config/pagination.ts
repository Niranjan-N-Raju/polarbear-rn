import Config from 'react-native-config';
import { resolvePageSize } from './resolvePageSize';

export const pageSize = resolvePageSize(Config.PAGE_SIZE);