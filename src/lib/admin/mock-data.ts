// Mock data shared across admin screens. Realistic-looking, deterministic.

export const REVENUE_7D = [
  { date: "15/05", value: 980 },
  { date: "16/05", value: 1240 },
  { date: "17/05", value: 1520 },
  { date: "18/05", value: 1780 },
  { date: "19/05", value: 1420 },
  { date: "20/05", value: 1310 },
  { date: "21/05", value: 402.5 },
];

export function makeSpark(base: number, variance = 0.25, points = 14) {
  const out: { i: number; v: number }[] = [];
  let cur = base;
  for (let i = 0; i < points; i++) {
    const drift = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * variance * base * 0.15;
    cur = base + drift + (i % 3) * (base * 0.02);
    out.push({ i, v: Math.max(0, Math.round(cur * 100) / 100) });
  }
  return out;
}

export const METRICS = [
  {
    key: "revenue",
    label: "Faturamento",
    value: "R$ 8.652,50",
    delta: 12.5,
    color: "#10b981",
    tint: "bg-emerald-50 text-emerald-600",
    icon: "dollar",
    spark: makeSpark(1200),
  },
  {
    key: "orders",
    label: "Pedidos",
    value: "128",
    delta: 8.1,
    color: "#3b82f6",
    tint: "bg-blue-50 text-blue-600",
    icon: "bag",
    spark: makeSpark(18),
  },
  {
    key: "ticket",
    label: "Ticket médio",
    value: "R$ 67,59",
    delta: 4.3,
    color: "#8b5cf6",
    tint: "bg-violet-50 text-violet-600",
    icon: "receipt",
    spark: makeSpark(65),
  },
  {
    key: "prep",
    label: "Tempo médio preparo",
    value: "28 min",
    delta: -5,
    deltaSuffix: " min",
    inverse: true,
    color: "#f59e0b",
    tint: "bg-amber-50 text-amber-600",
    icon: "clock",
    spark: makeSpark(30, 0.15),
  },
] as const;

export const ORDER_STATUS_BREAKDOWN = [
  { key: "received", label: "Recebido", count: 32, pct: 25, color: "#3b82f6" },
  { key: "confirmed", label: "Confirmado", count: 28, pct: 22, color: "#10b981" },
  { key: "preparing", label: "Em preparo", count: 24, pct: 19, color: "#f59e0b" },
  { key: "delivering", label: "Saiu / Pronto", count: 20, pct: 16, color: "#8b5cf6" },
  { key: "delivered", label: "Concluído", count: 18, pct: 14, color: "#14b8a6" },
  { key: "canceled", label: "Cancelado", count: 6, pct: 5, color: "#ef4444" },
];

// 7 days x 6 time slots heatmap intensity 0-1
export const HEATMAP: number[][] = [
  [0.05, 0.05, 0.05, 0.08, 0.1, 0.15, 0.2],
  [0.1, 0.12, 0.1, 0.15, 0.2, 0.35, 0.4],
  [0.3, 0.35, 0.4, 0.5, 0.55, 0.7, 0.75],
  [0.55, 0.6, 0.62, 0.7, 0.85, 0.95, 0.9],
  [0.7, 0.75, 0.78, 0.85, 0.95, 1.0, 0.92],
  [0.25, 0.28, 0.3, 0.35, 0.55, 0.65, 0.55],
];
export const HEATMAP_ROWS = ["00h", "06h", "12h", "18h", "23h"];
export const HEATMAP_COLS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const TOP_PRODUCTS = [
  { name: "X-Burger", sales: 312, emoji: "🍔" },
  { name: "Pizza Calabresa", sales: 278, emoji: "🍕" },
  { name: "Coca-Cola 350ml", sales: 254, emoji: "🥤" },
  { name: "Batata Frita", sales: 210, emoji: "🍟" },
  { name: "X-Bacon", sales: 198, emoji: "🥓" },
];

export const PAYMENT_METHODS = [
  { name: "PIX", pct: 45, value: 3894.63, color: "#10b981" },
  { name: "Cartão crédito", pct: 35, value: 3028.38, color: "#3b82f6" },
  { name: "Cartão débito", pct: 10, value: 865.25, color: "#8b5cf6" },
  { name: "Dinheiro", pct: 7, value: 606.68, color: "#f59e0b" },
  { name: "Outros", pct: 3, value: 257.56, color: "#94a3b8" },
];

export const COMPARISON = [
  { label: "Faturamento", value: "R$ 8.652,50", delta: 12.5 },
  { label: "Pedidos", value: "128", delta: 8.1 },
  { label: "Ticket médio", value: "R$ 67,59", delta: 4.3 },
  { label: "Tempo médio preparo", value: "28 min", delta: -5, inverse: true },
];

// ------- Cardápio / Menu -------
export const MENU_CATEGORIES = [
  { id: "burgers", name: "Hambúrgueres", items: 8, active: true },
  { id: "pizzas", name: "Pizzas", items: 12, active: true },
  { id: "drinks", name: "Bebidas", items: 14, active: true },
  { id: "sides", name: "Acompanhamentos", items: 6, active: true },
  { id: "desserts", name: "Sobremesas", items: 5, active: false },
];

export const MENU_ITEMS = [
  { id: "1", name: "X-Burger", cat: "Hambúrgueres", price: 28.9, stock: 42, active: true, emoji: "🍔" },
  { id: "2", name: "X-Bacon", cat: "Hambúrgueres", price: 32.9, stock: 30, active: true, emoji: "🥓" },
  { id: "3", name: "Pizza Calabresa", cat: "Pizzas", price: 54.9, stock: 18, active: true, emoji: "🍕" },
  { id: "4", name: "Pizza Marguerita", cat: "Pizzas", price: 49.9, stock: 12, active: true, emoji: "🍕" },
  { id: "5", name: "Coca-Cola 350ml", cat: "Bebidas", price: 7.5, stock: 120, active: true, emoji: "🥤" },
  { id: "6", name: "Suco Laranja 500ml", cat: "Bebidas", price: 12.9, stock: 24, active: true, emoji: "🧃" },
  { id: "7", name: "Batata Frita G", cat: "Acompanhamentos", price: 22.9, stock: 60, active: true, emoji: "🍟" },
  { id: "8", name: "Petit Gateau", cat: "Sobremesas", price: 24.9, stock: 8, active: false, emoji: "🍰" },
];

// ------- Estoque -------
export const STOCK_ITEMS = [
  { id: "s1", name: "Pão de hambúrguer", unit: "un", qty: 240, min: 100, cost: 1.2 },
  { id: "s2", name: "Carne 150g", unit: "un", qty: 82, min: 100, cost: 6.5 },
  { id: "s3", name: "Queijo cheddar fatia", unit: "un", qty: 45, min: 80, cost: 0.9 },
  { id: "s4", name: "Bacon (kg)", unit: "kg", qty: 12.4, min: 5, cost: 42 },
  { id: "s5", name: "Batata palito (kg)", unit: "kg", qty: 3.2, min: 8, cost: 12 },
  { id: "s6", name: "Massa de pizza", unit: "un", qty: 60, min: 40, cost: 3.5 },
  { id: "s7", name: "Molho de tomate (L)", unit: "L", qty: 18, min: 10, cost: 8 },
  { id: "s8", name: "Coca-Cola 350ml", unit: "un", qty: 96, min: 60, cost: 3.2 },
];

export const STOCK_MOVEMENTS = [
  { id: "m1", when: "Hoje 09:12", item: "Pão de hambúrguer", type: "entrada", qty: 120, user: "Admin Demo" },
  { id: "m2", when: "Hoje 08:40", item: "Carne 150g", type: "saída", qty: 22, user: "Sistema" },
  { id: "m3", when: "Ontem 19:05", item: "Bacon (kg)", type: "entrada", qty: 5, user: "Admin Demo" },
  { id: "m4", when: "Ontem 12:30", item: "Batata palito (kg)", type: "saída", qty: 4.8, user: "Sistema" },
  { id: "m5", when: "20/05 10:00", item: "Molho de tomate (L)", type: "entrada", qty: 10, user: "Admin Demo" },
];

// ------- Cupons -------
export const COUPONS = [
  { code: "BEMVINDO10", type: "%", value: 10, uses: 142, limit: 500, expires: "31/12/2025", active: true },
  { code: "FRETEGRATIS", type: "R$", value: 12, uses: 87, limit: 200, expires: "30/06/2025", active: true },
  { code: "COMBO20", type: "%", value: 20, uses: 34, limit: 100, expires: "15/06/2025", active: true },
  { code: "NATAL24", type: "%", value: 15, uses: 210, limit: 210, expires: "25/12/2024", active: false },
];

// ------- Clientes -------
export const CUSTOMERS = [
  { id: "c1", name: "Marina Souza", phone: "(11) 98765-4321", orders: 24, spent: 1892.4, last: "Hoje" },
  { id: "c2", name: "Rafael Lima", phone: "(11) 99123-8877", orders: 18, spent: 1210.9, last: "Ontem" },
  { id: "c3", name: "Ana Costa", phone: "(11) 98800-1122", orders: 15, spent: 990.3, last: "20/05" },
  { id: "c4", name: "Bruno Alves", phone: "(11) 97654-3210", orders: 12, spent: 812.1, last: "18/05" },
  { id: "c5", name: "Camila Rocha", phone: "(11) 98111-2233", orders: 9, spent: 640.8, last: "17/05" },
  { id: "c6", name: "Diego Martins", phone: "(11) 99988-7766", orders: 7, spent: 480.5, last: "15/05" },
];

// ------- Avaliações -------
export const REVIEWS = [
  { id: "r1", customer: "Marina Souza", rating: 5, comment: "Chegou rápido e o hambúrguer estava incrível!", when: "Hoje 13:20", replied: true },
  { id: "r2", customer: "Rafael Lima", rating: 4, comment: "Muito bom, só a batata veio um pouco murcha.", when: "Ontem 20:10", replied: false },
  { id: "r3", customer: "Ana Costa", rating: 5, comment: "Melhor pizza do bairro, entrega rápida.", when: "20/05 21:44", replied: true },
  { id: "r4", customer: "Bruno Alves", rating: 3, comment: "Demorou um pouco mais que o previsto.", when: "18/05 19:12", replied: false },
  { id: "r5", customer: "Camila Rocha", rating: 5, comment: "Atendimento no WhatsApp foi ótimo!", when: "17/05 12:30", replied: true },
];

// ------- Financeiro -------
export const AP = [
  { id: "ap1", desc: "Fornecedor de carnes", due: "28/05/2025", value: 2450, status: "aberto" },
  { id: "ap2", desc: "Aluguel", due: "05/06/2025", value: 3800, status: "aberto" },
  { id: "ap3", desc: "Energia elétrica", due: "10/06/2025", value: 890, status: "aberto" },
  { id: "ap4", desc: "Internet", due: "15/05/2025", value: 199, status: "pago" },
];
export const AR = [
  { id: "ar1", desc: "iFood — repasse semanal", due: "26/05/2025", value: 4120, status: "aberto" },
  { id: "ar2", desc: "Rappi — repasse semanal", due: "27/05/2025", value: 1890, status: "aberto" },
  { id: "ar3", desc: "Corporativo — Empresa X", due: "01/06/2025", value: 2400, status: "aberto" },
];

// ------- Equipe -------
export const TEAM = [
  { id: "t1", name: "Admin Demo", email: "adminres@painel.com", role: "admin", status: "ativo" },
  { id: "t2", name: "Julia Caixa", email: "julia@demo.com", role: "caixa", status: "ativo" },
  { id: "t3", name: "Pedro Cozinha", email: "pedro@demo.com", role: "cozinha", status: "ativo" },
  { id: "t4", name: "Lucas Cozinha", email: "lucas@demo.com", role: "cozinha", status: "convidado" },
];
