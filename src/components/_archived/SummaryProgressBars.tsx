// import { useLedger } from '../hooks/useLedger';
// import { formatCurrency } from '../utilities/calculations';

// type ProgressVariant = 'balance' | 'inflow' | 'outflow';

// interface ProgressBarProps {
//   label: string;
//   value: number;
//   max: number;
//   formatted: string;
//   variant: ProgressVariant;
// }

// const ProgressBar = ({ label, value, max, formatted, variant }: ProgressBarProps) => {
//   const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
//   return (
//     <div className="wl-progress-item">
//       <div className="wl-progress-header">
//         <span className="wl-progress-label">{label}</span>
//         <span className={`wl-progress-value wl-progress-value--${variant}`}>
//           {formatted}
//         </span>
//       </div>
//       <div
//         className="wl-progress-track"
//         role="progressbar"
//         aria-valuenow={Math.round(pct)}
//         aria-valuemin={0}
//         aria-valuemax={100}
//         aria-label={label}
//       >
//         <div
//           className={`wl-progress-fill wl-progress-fill--${variant}`}
//           style={{ width: `${pct}%` }}
//         />
//       </div>
//     </div>
//   );
// };

// export const SummaryProgressBars = () => {
//   const { overallSummary } = useLedger();
//   const { totalBalance, totalInflow, totalOutflow } = overallSummary;

//   return (
//     <section aria-label="Financial summary" className="wl-card wl-progress-section">
//       <ProgressBar
//         label="Total Balance"
//         value={totalBalance}
//         max={totalInflow}
//         formatted={formatCurrency(totalBalance)}
//         variant="balance"
//       />
//       <ProgressBar
//         label="Total Inflow"
//         value={totalInflow}
//         max={totalInflow}
//         formatted={`+${formatCurrency(totalInflow)}`}
//         variant="inflow"
//       />
//       <ProgressBar
//         label="Total Outflow"
//         value={totalOutflow}
//         max={totalInflow}
//         formatted={`-${formatCurrency(totalOutflow)}`}
//         variant="outflow"
//       />
//     </section>
//   );
// };
