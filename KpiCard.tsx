export type ExpenseType = "fixo" | "desconto" | "variavel";

export type Expense = {
  id: string;
  type: ExpenseType;
  title: string;
  category: string;
  value: number;
  month: string;
};

export type CardPurchase = {
  id: string;
  title: string;
  category: string;
  totalValue: number;
  installments: number;
  startMonth: string;
};

export type TransportItem = {
  id: string;
  title: string;
  value: number;
};

export type Investment = {
  id: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  manualDividendPerShare: number;
  risk: number;
};

export type Goal = {
  id: string;
  title: string;
  target: number;
  current: number;
};

export type FinanceData = {
  config: {
    salario: number;
    diaSalario: number;
    diaFatura: number;
    diaVr: number;
  };
  expenses: Expense[];
  cards: CardPurchase[];
  transport: {
    bus: TransportItem[];
    train: TransportItem[];
    studentMonthly: number;
    discountPct: number;
    weekdays: number[];
  };
  meal: {
    valueDay: number;
    absences: number;
  };
  investments: Investment[];
  goals: Goal[];
};

export type MonthSummary = {
  month: string;
  salary: number;
  fixed: number;
  discounts: number;
  card: number;
  transport: number;
  mealIncome: number;
  totalOut: number;
  projectedBalance: number;
};
