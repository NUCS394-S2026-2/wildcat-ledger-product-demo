// import { useState } from 'react';

// import { useLedger } from '../hooks/useLedger';
// import { Transaction } from '../types';
// import { formatCurrency, isTransactionFlagged } from '../utilities/calculations';

// const ActivityItem = ({ transaction: t }: { transaction: Transaction }) => {
//   const isInflow = t.direction === 'Inflow';
//   const flagged = isTransactionFlagged(t);

//   return (
//     <div className={`wl-activity-item${flagged ? ' wl-activity-item--flagged' : ''}`}>
//       <div
//         className={`wl-activity-arrow${isInflow ? ' wl-activity-arrow--in' : ' wl-activity-arrow--out'}`}
//         aria-hidden="true"
//       >
//         {isInflow ? '↑' : '↓'}
//       </div>
//       <div className="wl-activity-info">
//         <span className="wl-activity-title">{t.title}</span>
//         <span className="wl-activity-meta">
//           {t.date} · {t.budgetLine} · {t.person}
//         </span>
//       </div>
//       <div className="wl-activity-right">
//         <span
//           className={`wl-activity-amount${isInflow ? ' wl-amount-positive' : ' wl-amount-negative'}`}
//         >
//           {isInflow ? '+' : '-'}
//           {formatCurrency(t.amount)}
//         </span>
//         {flagged && (
//           <span className="wl-flag-dot" aria-label="Incomplete">
//             !
//           </span>
//         )}
//       </div>
//     </div>
//   );
// };

// interface ActivityFeedProps {
//   onViewAll: () => void;
// }

// export const ActivityFeed = ({ onViewAll }: ActivityFeedProps) => {
//   const { transactions } = useLedger();
//   const [expanded, setExpanded] = useState(false);

//   const recent = [...transactions]
//     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//     .slice(0, 5);

//   const handleViewAll = () => {
//     setExpanded(true);
//     onViewAll();
//   };

//   return (
//     <div className="wl-card">
//       <div className="wl-card-title-row">
//         <h2 className="wl-card-title">Recent Activity</h2>
//         <span className="wl-activity-count">
//           {recent.length} of {transactions.length}
//         </span>
//       </div>
//       <div className="wl-activity-list">
//         {recent.map((t) => (
//           <ActivityItem key={t.id} transaction={t} />
//         ))}
//       </div>
//       {transactions.length > 5 && (
//         <button
//           type="button"
//           className="wl-btn-view-all"
//           onClick={handleViewAll}
//           aria-expanded={expanded}
//         >
//           View all transactions →
//         </button>
//       )}
//     </div>
//   );
// };
