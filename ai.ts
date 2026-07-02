"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FinanceData } from "@/types/finance";
import { brl, buildDashboard, categoryData, currentMonth, dailyCashflow, monthLabel, monthOptions } from "@/lib/finance";
import { KpiCard } from "@/components/KpiCard";

const colors = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#14b8a6", "#ec4899", "#84cc16"];

export default function Home() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [active, setActive] = useState("dashboard");
  const [month, setMonth] = useState(currentMonth());
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMode, setAiMode] = useState("Analisar mês atual");
  const [aiResponse, setAiResponse] = useState("");
  const [ticker, setTicker] = useState("PETR4");
  const [quote, setQuote] = useState<any>(null);

  async function load() {
    const response = await fetch("/api/finance", { cache: "no-store" });
    setData(await response.json());
  }

  async function save(next: FinanceData) {
    setData(next);
    await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
  }

  useEffect(() => { load(); }, []);

  const dashboard = useMemo(() => data ? buildDashboard(data, 12) : [], [data]);
  const selectedSummary = useMemo(() => dashboard.find(x => x.month === month) ?? dashboard[0], [dashboard, month]);
  const categories = useMemo(() => data ? categoryData(data, month) : [], [data, month]);
  const daily = useMemo(() => data ? dailyCashflow(data, month) : [], [data, month]);

  if (!data || !selectedSummary) return <main className="p-8">Carregando...</main>;

  async function askAi() {
    setAiResponse("Analisando...");
    const response = await fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: aiMode, question: aiQuestion }) });
    const json = await response.json();
    setAiResponse(json.text || "Sem resposta.");
  }

  async function fetchTicker() {
    const response = await fetch(`/api/investments/${ticker}`);
    setQuote(await response.json());
  }

  function addExpense(type: "fixo" | "desconto") {
    const title = prompt("Descrição do gasto:") || "Novo gasto";
    const value = Number(prompt("Valor:") || "0");
    const category = prompt("Categoria:") || "Outros";
    save({ ...data, expenses: [...data.expenses, { id: crypto.randomUUID(), type, title, value, category, month }] });
  }

  function addCard() {
    const title = prompt("Compra:") || "Compra";
    const totalValue = Number(prompt("Valor total:") || "0");
    const installments = Number(prompt("Parcelas:") || "1");
    const category = prompt("Categoria:") || "Cartão";
    save({ ...data, cards: [...data.cards, { id: crypto.randomUUID(), title, totalValue, installments, category, startMonth: month }] });
  }

  function updateSalary(value: number) {
    save({ ...data, config: { ...data.config, salario: value } });
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <section className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">Financeiro Pro</h1>
            <p className="text-slate-400">Controle financeiro escalável com dashboards, IA e investimentos.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="text-xs text-slate-400">Mês</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="ml-2 rounded-lg p-2 text-slate-900">
              {monthOptions(18).map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2">
          {[
            ["dashboard", "Dashboard"], ["salario", "Salário"], ["investimentos", "Investimentos"], ["ia", "Assistente IA"], ["dados", "Dados JSON"]
          ].map(([id, label]) => (
            <button key={id} onClick={() => setActive(id)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${active === id ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-white"}`}>{label}</button>
          ))}
        </nav>

        {active === "dashboard" && (
          <section className="space-y-6">
            <div className="grid gap-3 md:grid-cols-5">
              <KpiCard title="Salário" value={brl(selectedSummary.salary)} />
              <KpiCard title="Saídas" value={brl(selectedSummary.totalOut)} />
              <KpiCard title="Cartão" value={brl(selectedSummary.card)} />
              <KpiCard title="VR estimado" value={brl(selectedSummary.mealIncome)} />
              <KpiCard title="Saldo projetado" value={brl(selectedSummary.projectedBalance)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Gastos mensais por tipo">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => brl(Number(v))} />
                    <Legend />
                    <Bar dataKey="fixed" stackId="a" fill="#3b82f6" name="Fixos" />
                    <Bar dataKey="discounts" stackId="a" fill="#f59e0b" name="Descontos" />
                    <Bar dataKey="card" stackId="a" fill="#ef4444" name="Cartão" />
                    <Bar dataKey="transport" stackId="a" fill="#14b8a6" name="Transporte" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Pizza por categoria">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categories} dataKey="value" nameKey="name" outerRadius={105} label>
                      {categories.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => brl(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <Panel title="Fluxo diário: entradas, saídas e saldo acumulado">
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(v: any) => brl(Number(v))} />
                  <Legend />
                  <Line dataKey="entradas" stroke="#22c55e" name="Entradas" />
                  <Line dataKey="saidas" stroke="#ef4444" name="Saídas" />
                  <Line dataKey="saldoAcumulado" stroke="#38bdf8" name="Saldo acumulado" />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </section>
        )}

        {active === "salario" && (
          <section className="space-y-6">
            <Panel title="Base e lançamentos">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="block"><span className="text-sm text-slate-400">Salário</span><input className="mt-1 w-full rounded-lg p-2" type="number" value={data.config.salario} onChange={e => updateSalary(Number(e.target.value))} /></label>
                <button onClick={() => addExpense("fixo")} className="rounded-xl bg-blue-500 p-3 font-bold text-white">Adicionar fixo</button>
                <button onClick={() => addExpense("desconto")} className="rounded-xl bg-amber-500 p-3 font-bold text-slate-950">Adicionar desconto</button>
                <button onClick={addCard} className="rounded-xl bg-red-500 p-3 font-bold text-white">Adicionar compra cartão</button>
              </div>
            </Panel>
            <Panel title="Gastos por categoria"></Panel>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title="Pizza por categoria">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categories} dataKey="value" nameKey="name" outerRadius={105} label>{categories.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie>
                    <Tooltip formatter={(v: any) => brl(Number(v))} /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Projeção mensal">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboard}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => brl(Number(v))} /><Legend />
                    <Area dataKey="projectedBalance" stroke="#22c55e" fill="#14532d" name="Saldo projetado" />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            </div>
            <Panel title="Lançamentos">
              <pre className="max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-xs">{JSON.stringify({ expenses: data.expenses, cards: data.cards }, null, 2)}</pre>
            </Panel>
          </section>
        )}

        {active === "investimentos" && (
          <section className="space-y-6">
            <Panel title="Consultar ativo por API">
              <div className="flex flex-col gap-3 md:flex-row">
                <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} className="rounded-xl p-3 text-slate-900" placeholder="PETR4, VALE3, MXRF11" />
                <button onClick={fetchTicker} className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">Consultar ativo</button>
              </div>
              {quote ? <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-xs">{JSON.stringify(quote, null, 2)}</pre> : null}
            </Panel>
            <Panel title="Carteira cadastrada">
              <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs">{JSON.stringify(data.investments, null, 2)}</pre>
            </Panel>
          </section>
        )}

        {active === "ia" && (
          <section className="space-y-6">
            <Panel title="Assistente IA Financeiro">
              <div className="grid gap-3 md:grid-cols-3">
                <select value={aiMode} onChange={e => setAiMode(e.target.value)} className="rounded-xl p-3 text-slate-900">
                  <option>Analisar mês atual</option><option>Analisar cartão</option><option>Simular compra</option><option>Analisar investimentos</option><option>Pergunta livre</option>
                </select>
                <input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} className="rounded-xl p-3 text-slate-900 md:col-span-2" placeholder="Ex: posso comprar algo de R$ 800 em 8x?" />
              </div>
              <button onClick={askAi} className="mt-4 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">Analisar com IA</button>
              {aiResponse ? <article className="prose prose-invert mt-6 max-w-none whitespace-pre-wrap rounded-xl bg-slate-900 p-5">{aiResponse}</article> : null}
            </Panel>
          </section>
        )}

        {active === "dados" && (
          <Panel title="Dados JSON">
            <pre className="max-h-[600px] overflow-auto rounded-xl bg-slate-900 p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
          </Panel>
        )}
      </section>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold">{title}</h2>{children}</div>;
}
