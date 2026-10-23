import { act } from 'react-test-renderer';
import { t } from '../src/i18n';
import { ProfileIdentityCard } from '../src/screens/admin/ProfileIdentityCard';
import type { AuthenticatedUser } from '../src/api/types';
import { render } from './testUtils';

describe('ProfileIdentityCard', () => {
  it('renders profile identity with optional avatar', () => {
      const identity: Pick<AuthenticatedUser, 'name' | 'email' | 'role'> = {
        name: 'Alex Admin',
        email: 'alex@example.com',
        role: 'admin',
      };
      const renderer = render(<ProfileIdentityCard user={identity} showAvatar />);
      expect(renderer.root.findAllByProps({ children: 'A' }).length).toBeGreaterThan(0);
      expect(renderer.root.findAllByProps({ children: t('roleAdmin') }).length).toBeGreaterThan(0);
      act(() => renderer.update(<ProfileIdentityCard user={identity} showAvatar={false} />));
      expect(renderer.root.findAllByProps({ children: 'A' })).toHaveLength(0);
      act(() => renderer.unmount());
    })
});
