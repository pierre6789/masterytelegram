import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type FlipChartBucket = {
  label: string;
  ts: number;
  sales: number;
  revenue: number;
  profit: number;
};

type FlipMetric = 'profit' | 'revenue' | 'sales';
type Granularity = 'day' | 'week' | 'month';

const METRIC_CONFIG: Record<
  FlipMetric,
  { label: string; color: string; suffix: string; format: (n: number) => string }
> = {
  profit: {
    label: 'Profit',
    color: 'hsl(263.4 70% 65%)',
    suffix: '€',
    format: (n) => `${n.toFixed(2)} €`,
  },
  revenue: {
    label: 'CA',
    color: '#818cf8',
    suffix: '€',
    format: (n) => `${n.toFixed(2)} €`,
  },
  sales: {
    label: 'Ventes',
    color: '#2dd4bf',
    suffix: '',
    format: (n) => `${Math.round(n)} vente(s)`,
  },
};

function FlipChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FlipChartBucket }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium text-foreground">{row.label}</p>
      <p className="text-muted-foreground">
        Profit : <span className="text-primary">{row.profit.toFixed(2)} €</span>
      </p>
      <p className="text-muted-foreground">
        CA : <span className="text-[#818cf8]">{row.revenue.toFixed(2)} €</span>
      </p>
      <p className="text-muted-foreground">
        Ventes : <span className="text-[#2dd4bf]">{row.sales}</span>
      </p>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:border-primary transition-colors';

type Props = {
  series: FlipChartBucket[];
  profit7d: number;
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
};

export function FlipDetailChart({ series, profit7d, granularity, onGranularityChange }: Props) {
  const [activeMetric, setActiveMetric] = useState<FlipMetric>('profit');

  const totals = useMemo(
    () => ({
      profit: series.reduce((a, p) => a + p.profit, 0),
      revenue: series.reduce((a, p) => a + p.revenue, 0),
      sales: series.reduce((a, p) => a + p.sales, 0),
    }),
    [series],
  );

  const profitVals = series.map((p) => p.profit);
  const profitMin = profitVals.length ? Math.min(...profitVals) : 0;
  const profitMax = profitVals.length ? Math.max(...profitVals) : 0;
  const showZeroLine =
    activeMetric === 'profit' && profitMin < 0 && profitMax > 0 && series.length > 0;

  if (series.length === 0) {
    return (
      <div className="bg-secondary rounded-xl border border-border p-5 mb-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-foreground">Graphique détaillé</p>
          <select
            className={inputClass + ' !py-1.5 !text-xs w-32 sm:w-36'}
            value={granularity}
            onChange={(e) => onGranularityChange(e.target.value as Granularity)}
          >
            <option value="day">Jour</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
          </select>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
          Aucune donnée à afficher. Pour voir la courbe, passe au moins un flip en{' '}
          <b className="text-foreground">Vendu</b> et renseigne le prix de vente.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-border bg-secondary">
      {/* En-tête type shadcn : titre + granularité */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="font-semibold text-foreground">Graphique détaillé</p>
        </div>
        <select
          className={inputClass + ' !py-1.5 !text-xs w-full sm:w-36'}
          value={granularity}
          onChange={(e) => onGranularityChange(e.target.value as Granularity)}
        >
          <option value="day">Agrégation : jour</option>
          <option value="week">Agrégation : semaine</option>
          <option value="month">Agrégation : mois</option>
        </select>
      </div>

      {/* Onglets totaux + séries (comme Desktop / Mobile dans l’exemple shadcn) */}
      <div className="flex flex-col border-b border-border sm:flex-row sm:items-stretch sm:overflow-x-auto">
        <div className="flex shrink-0 flex-col justify-center gap-1 border-border px-4 py-3 sm:max-w-[14rem] sm:border-r sm:px-5 sm:py-4 lg:max-w-[16rem]">
          <p className="text-xs text-muted-foreground">
            Totaux sur la période affichée ({series.length} point{series.length > 1 ? 's' : ''})
          </p>
          <p className="text-xs text-muted-foreground">
            Profit 7j :{' '}
            <span className={profit7d >= 0 ? 'text-success' : 'text-danger'}>{profit7d.toFixed(2)} €</span>
          </p>
        </div>
        <div className="grid w-full grid-cols-1 sm:min-w-[35rem] sm:flex-1 sm:grid-cols-[minmax(12.5rem,1.4fr)_minmax(12.5rem,1.4fr)_minmax(7rem,1fr)]">
          {(['profit', 'revenue', 'sales'] as const).map((key) => {
            const cfg = METRIC_CONFIG[key];
            const total = totals[key];
            const display =
              key === 'sales' ? total.toLocaleString('fr-FR') : total.toFixed(2) + ' €';
            return (
              <button
                key={key}
                type="button"
                data-active={activeMetric === key}
                onClick={() => setActiveMetric(key)}
                className="flex w-full min-w-0 flex-col justify-center gap-1 border-t border-border px-5 py-3 text-left transition-colors sm:border-t-0 sm:border-l sm:border-border sm:px-7 sm:py-4 data-[active=true]:bg-accent/50"
              >
                <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
                <span
                  className="break-words text-lg font-bold leading-tight tabular-nums text-foreground sm:text-2xl sm:leading-none"
                  style={{ color: activeMetric === key ? cfg.color : undefined }}
                >
                  {display}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-2 sm:p-5">
        <div className="h-[250px] w-full min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ left: 4, right: 12, top: 8, bottom: 4 }}
            >
              <CartesianGrid stroke="rgba(136,136,160,0.15)" vertical={false} />
              {showZeroLine && <ReferenceLine y={0} stroke="rgba(136,136,160,0.45)" strokeDasharray="4 4" />}
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v) =>
                  activeMetric === 'sales' ? String(v) : `${Number(v).toFixed(0)}`
                }
              />
              <Tooltip content={<FlipChartTooltip />} cursor={{ stroke: 'rgba(162,155,254,0.35)' }} />
              <Line
                type="monotone"
                dataKey={activeMetric}
                stroke={METRIC_CONFIG[activeMetric].color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {series.slice(-4).map((p) => (
            <div key={p.label} className="text-[10px] text-muted-foreground">
              <span className="text-muted-foreground">{p.label}</span>
              <span className="text-foreground">
                {' '}
                — {METRIC_CONFIG[activeMetric].format(p[activeMetric])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
