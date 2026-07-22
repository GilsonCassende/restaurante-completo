"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps, TooltipValueType } from "recharts";
import type { NameType } from "recharts/types/component/DefaultTooltipContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentsDashboard } from "@/services/payments";

type PaymentsChartsProps = {
  trends: PaymentsDashboard["trends"];
  currency?: string | null;
};

const DAY_COLUMNS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number, currency = "AOA") {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

const countFormatter = ((value: unknown) => formatNumber(Number(value ?? 0))) as NonNullable<
  TooltipProps<TooltipValueType, NameType>["formatter"]
>;
const radarFormatter = ((value: unknown) => [`${formatNumber(Number(value ?? 0))}%`, "Índice"]) as NonNullable<
  TooltipProps<TooltipValueType, NameType>["formatter"]
>;

function heatmapColor(value: number, max: number) {
  if (max <= 0) return "hsl(var(--muted))";
  const intensity = Math.min(value / max, 1);
  return `rgba(14, 165, 233, ${0.1 + intensity * 0.7})`;
}

export function PaymentsCharts({ trends, currency }: PaymentsChartsProps) {
  const maxHeat = Math.max(...trends.heatmap.map((cell) => cell.value), 0);
  const pieFormatter = ((value: unknown, name: unknown) => [formatCurrency(Number(value ?? 0), currency ?? "AOA"), String(name ?? "")]) as NonNullable<
    TooltipProps<TooltipValueType, NameType>["formatter"]
  >;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Receita</CardTitle>
          <CardDescription>Volume financeiro por dia no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.revenue} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip formatter={((value) => formatCurrency(Number(value ?? 0), currency ?? "AOA")) as NonNullable<TooltipProps<TooltipValueType, NameType>["formatter"]>} contentStyle={{ borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Line type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
          <CardDescription>Saldo acumulado e desempenho do caixa.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends.cashFlow} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip formatter={((value) => formatCurrency(Number(value ?? 0), currency ?? "AOA")) as NonNullable<TooltipProps<TooltipValueType, NameType>["formatter"]>} contentStyle={{ borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="amount" stroke="#10b981" fill="rgba(16,185,129,0.18)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
          <CardDescription>Participação por método usado pelos clientes.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip formatter={pieFormatter} contentStyle={{ borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Pie data={trends.methods} dataKey="value" nameKey="name" innerRadius={64} outerRadius={110} paddingAngle={3}>
                {trends.methods.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Lucro Mensal</CardTitle>
          <CardDescription>Visão resumida de receita e performance do período.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends.profitMonthly} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip formatter={((value) => formatCurrency(Number(value ?? 0), currency ?? "AOA")) as NonNullable<TooltipProps<TooltipValueType, NameType>["formatter"]>} contentStyle={{ borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="amount" stroke="#f59e0b" fill="rgba(245,158,11,0.18)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Pagamentos por Dia</CardTitle>
          <CardDescription>Distribuição da demanda ao longo da semana.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends.paymentsByDay} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.35)" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip formatter={countFormatter} contentStyle={{ borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="count" name="Pagamentos" fill="#6366f1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle>Radar Financeiro</CardTitle>
          <CardDescription>Indicadores normalizados do desempenho financeiro.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={trends.radar}>
              <PolarGrid stroke="hsl(var(--border) / 0.35)" />
              <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
              <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
              <Radar dataKey="value" stroke="#8b5cf6" fill="rgba(139,92,246,0.2)" fillOpacity={0.7} />
              <Tooltip formatter={radarFormatter} contentStyle={{ borderRadius: 20, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)] xl:col-span-2">
        <CardHeader>
          <CardTitle>Heatmap</CardTitle>
          <CardDescription>Estrutura pronta para análise de pico por dia e horário.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="grid grid-cols-[88px_repeat(24,minmax(0,1fr))] gap-1 text-[11px] text-muted-foreground">
              <div />
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="text-center">
                  {String(hour).padStart(2, "0")}
                </div>
              ))}
            </div>
            {DAY_COLUMNS.map((day) => (
              <div key={day} className="grid grid-cols-[88px_repeat(24,minmax(0,1fr))] gap-1">
                <div className="flex items-center pr-2 text-xs font-medium text-muted-foreground">{day}</div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = trends.heatmap.find((entry) => entry.day === day && entry.hour === `${String(hour).padStart(2, "0")}:00`);
                  const value = cell?.value ?? 0;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="flex aspect-square items-center justify-center rounded-md text-[10px] font-semibold text-foreground/80 transition-transform hover:scale-[1.03]"
                      style={{ backgroundColor: heatmapColor(value, maxHeat) }}
                      aria-label={`${day} ${hour}: ${value} registros`}
                    >
                      {value > 0 ? value : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
