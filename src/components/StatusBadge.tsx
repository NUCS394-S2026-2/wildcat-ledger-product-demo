import { TransactionStatus } from '../types';

interface StatusBadgeProps {
  status: TransactionStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`wl-badge wl-badge--${status.toLowerCase()}`}>{status}</span>
);
