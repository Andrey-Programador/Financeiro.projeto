import { FinanceData, MonthSummary } from "@/types/finance";

export function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function addMonths(yyyyMm: string, add: number): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1 + add, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function monthOptions(qtd = 12): string[] {
  const now = currentMonth();
  return Array.from({ length: qtd }, (_, i) => addMonths(now, i));
}

export function cardInstallmentValue(totalValue: number, installments: number): number {
  return installments > 0 ? totalValue / installments : totalValue;
}

export function cardValueForMonth(data: FinanceData, month: string): number {
  return data.cards.reduce((sum, purchase) => {
    const months = Array.from({ length: purchase.installments }, (_, i) => addMonths(purchase.startMonth, i));
    return months.includes(month) ? sum + cardInstallmentValue(purchase.totalValue, purchase.installments) : sum;
  }, 0);
}

export function fixedValueForMonth(data: FinanceData, month: string): number {
  return data.expenses.filter(e => e.type === "fixo" && e.month === month).reduce((s, e) => s + e.value, 0);
}

export function discountValueForMonth(data: FinanceData, month: string): number {
  return data.expenses.filter(e => e.type === "desconto" && e.month === month).reduce((s, e) => s + e.value, 0);
}

export function dailyTransport(data: FinanceData): number {
  const bus = data.transport.bus.reduce((s, item) => s + item.value, 0);
  const train = data.transport.train.reduce((s, item) => s + item.value, 0);
  return bus + train;
}

export function businessDaysInMonth(month: string, weekdays: number[]): number {
  const [year, mm] = month.split("-").map(Number);
  const last = new Date(year, mm, 0).getDate();
  let total = 0;
  for (let day = 1; day <= last; day++) {
    const jsDay = new Date(year, mm - 1, day).getDay();
    const normalized = jsDay === 0 ? 7 : jsDay;
    if (weekdays.includes(normalized)) total++;
  }
  return total;
}

export function transportForMonth(data: FinanceData, month: string): number {
  return dailyTransport(data) * businessDaysInMonth(month, data.transport.weekdays) + data.transport.studentMonthly;
}

export function mealForMonth(data: FinanceData, month: string): number {
  const paidDays = Math.max(0, businessDaysInMonth(month, [1,2,3,4,5]) - data.meal.absences);
  return paidDays * data.meal.valueDay;
}

export function buildMonthSummary(data: FinanceData, month: string): MonthSummary {
  const fixed = fixedValueForMonth(data, month);
  const discounts = discountValueForMonth(data, month);
  const card = cardValueForMonth(data, month);
  const transport = transportForMonth(data, month);
  const mealIncome = mealForMonth(data, month);
  const totalOut = fixed + discounts + card + transport;
  return {
    month,
    salary: data.config.salario,
    fixed,
    discounts,
    card,
    transport,
    mealIncome,
    totalOut,
    projectedBalance: data.config.salario + mealIncome - totalOut
  };
}

export function buildDashboard(data: FinanceData, months = 12): MonthSummary[] {
  return monthOptions(months).map(month => buildMonthSummary(data, month));
}

export function categoryData(data: FinanceData, month: string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  data.expenses.filter(e => e.month === month).forEach(e => map.set(e.category, (map.get(e.category) ?? 0) + e.value));
  data.cards.forEach(c => {
    const months = Array.from({ length: c.installments }, (_, i) => addMonths(c.startMonth, i));
    if (months.includes(month)) map.set(c.category, (map.get(c.category) ?? 0) + cardInstallmentValue(c.totalValue, c.installments));
  });
  map.set("Transporte", (map.get("Transporte") ?? 0) + transportForMonth(data, month));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value })).filter(x => x.value > 0);
}

export function dailyCashflow(data: FinanceData, month: string) {
  const [year, mm] = month.split("-").map(Number);
  const last = new Date(year, mm, 0).getDate();
  const summary = buildMonthSummary(data, month);
  const dailyTransportValue = dailyTransport(data);
  let acc = 0;
  return Array.from({ length: last }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, mm - 1, day);
    const jsDay = date.getDay();
    const normalized = jsDay === 0 ? 7 : jsDay;
    const income = (day === data.config.diaSalario ? data.config.salario : 0) + (day === data.config.diaVr ? summary.mealIncome : 0);
    const out = (data.transport.weekdays.includes(normalized) ? dailyTransportValue : 0) + (day === data.config.diaFatura ? summary.fixed + summary.discounts + summary.card : 0);
    acc += income - out;
    return { day: String(day).padStart(2, "0"), entradas: income, saidas: out, saldoDia: income - out, saldoAcumulado: acc };
  });
}
