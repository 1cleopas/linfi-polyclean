import { basePrices, formatCedis, pricingNotes } from '../data/content'

export default function PriceTable({ className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-outline/30 bg-white text-primary shadow-[var(--shadow-card)] ${className}`}>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Base polytank cleaning prices per tank</caption>
        <thead className="bg-surface-low text-xs tracking-wider text-muted uppercase">
          <tr>
            <th scope="col" className="px-5 py-3 font-bold">Tank size</th>
            <th scope="col" className="px-5 py-3 text-right font-bold">Price per tank</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/30">
          {basePrices.map(({ range, price }) => (
            <tr key={range} className="hover:bg-surface">
              <td className="px-5 py-3 font-medium text-ink">{range}</td>
              <td className="px-5 py-3 text-right font-headline font-bold text-secondary">{formatCedis(price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 border-t border-outline/30 bg-surface px-5 py-4 text-xs leading-5 text-muted">
        <p>
          <span className="font-semibold text-primary">Note:</span> {pricingNotes.storeySurcharge}
        </p>
        <p>{pricingNotes.variance}</p>
      </div>
    </div>
  )
}
