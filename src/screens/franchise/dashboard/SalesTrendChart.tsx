import { getLocale } from '../../../i18n';
import { DashboardTrendBars, formatMoney } from '../DashboardCharts';
import { datesBetween } from '../dashboardDates';
import type { DailySale } from '../types';

interface SalesTrendChartProps {
  sales: DailySale[];
  dateFrom: string;
  dateTo: string;
}

export function SalesTrendChart({ sales, dateFrom, dateTo }: SalesTrendChartProps) {
  const dates = datesBetween(dateFrom, dateTo);
  const byDate = new Map(sales.map((sale) => [sale.date, sale.totalSale]));
  return <DashboardTrendBars minimumColumnWidth={10} items={dates.map((date, index) => {
    const day = Number(date.slice(-2));
    const showLabel = dates.length <= 8 || day === 1 || day % 5 === 0 || index === dates.length - 1;
    return {
      label: new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`)),
      axisLabel: showLabel ? String(day) : ' ',
      values: [byDate.get(date) ?? 0],
      description: formatMoney(byDate.get(date) ?? 0),
    };
  })} />;
}