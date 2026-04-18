import { UserRole } from '../types';
import { useAuth } from './useAuth';
import { useLedger } from './useLedger';

export const useRole = (): UserRole | null => {
  const { user } = useAuth();
  const { activeOrganization } = useLedger();

  if (!user?.email || !activeOrganization) return null;

  const email = user.email;
  if (activeOrganization.treasurer === email) return 'treasurer';
  if (activeOrganization.president === email) return 'president';
  if (activeOrganization.execs?.includes(email)) return 'exec';

  // Backwards compat: existing orgs only have admins[] — treat them as treasurer
  if (activeOrganization.admins?.includes(email)) return 'treasurer';

  return null;
};
