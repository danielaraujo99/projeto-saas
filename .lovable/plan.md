# Plano: Cardápio Digital — Lado Cliente

Aplicação web responsiva cobrindo todo o fluxo do cliente final, com dados mockados estruturados para futura integração com backend/painel admin. Identidade visual branco + azul, modo claro, acabamento profissional (sem cara de template de IA).

## Stack técnica

- TanStack Start (já configurado) + React 19 + Tailwind v4
- Estado global: Zustand (carrinho, auth mock, endereços, pedidos) com persistência em localStorage
- Mapa: **Leaflet + react-leaflet** com tiles do OpenStreetMap; geocoding via **Nominatim** (gratuito) com debounce
- Formulários: react-hook-form + zod
- Ícones: lucide-react
- Sem backend nesta etapa — tudo mockado

## Design system (tokens em `src/styles.css`)

- Base: branco (#FFFFFF / #F7F9FC surfaces), texto #0F172A, muted #64748B
- Primária azul: #1D63FF (com hover #1652D9), foco anelado, sem gradientes/neon
- Tipografia: Inter (headings semibold/bold, preços em tabular-nums destacados)
- Raio: 12px cards / 8px inputs / 999 chips
- Sombras sutis (1 nível), transições 150–200ms, skeletons

Componentes reaproveitáveis: Button, Input, Chip, Badge (mais pedido / promoção / em falta), Card, Sheet (bottom sheet mobile / modal desktop com mesmo componente adaptativo), Stepper de quantidade, ProductCard, PriceTag, EmptyState, Skeletons.

## Estrutura de dados mockada (`src/data/`)

```
restaurant.ts     — dados do restaurante (nome, capa, logo, nota, tempo, taxa, status)
menu.ts           — categorias + produtos; produto.customizations opcional
customizations.ts — grupos de personalização { id, nome, min, max, options[] }
coupons.ts        — cupons (código, tipo %/fixo, mínimo)
```

Tipos em `src/types/` desenhados para trocar por API depois (sem lógica de UI acoplada).

## Rotas (TanStack file-based)

```
/                          → Home do restaurante (cardápio)
/carrinho                  → Carrinho (mobile: página; desktop: painel lateral já visível na home)
/checkout                  → Checkout em etapas (entrega → pagamento → revisão)
/enderecos                 → Lista de endereços salvos
/enderecos/novo            → Mapa + formulário
/pedido/$id                → Acompanhamento (timeline + progresso do entregador)
/pedido/$id/avaliar        → Avaliação
/auth                      → Login/cadastro (também abre como sheet no gate)
```

Login não bloqueia navegação — gate aparece só ao tocar "Finalizar pedido".

## Telas — pontos-chave

1. **Home/Cardápio**: hero com capa+logo+meta (nota, tempo, taxa, aberto/fechado), busca, abas de categoria sticky com scroll-spy sincronizado (IntersectionObserver), grid de produtos responsivo, barra de carrinho flutuante (mobile) / painel fixo à direita (desktop ≥1024px).
2. **Detalhes do produto**: Sheet adaptativo. Grupos de personalização só renderizam se existirem, com validação min/max, preço recalculado em tempo real, textarea de observação, stepper, CTA fixo com total.
3. **Carrinho**: itens editáveis (quantidade / editar personalização reabrindo o sheet / duplicar / remover), cupom com validação, resumo, CTA checkout.
4. **Auth gate**: sheet/modal com tabs Entrar/Criar conta; mock — qualquer credencial válida entra; persiste sessão.
5. **Endereços + mapa**: Leaflet com pino fixo central visual (overlay), mapa arrasta por baixo, busca com autocomplete Nominatim (debounce 400ms, atribuição OSM discreta no rodapé conforme exigência de licença), reverse geocoding ao soltar. Formulário com tipo (Casa/Trabalho/Outro), padrão, editar/remover.
6. **Checkout**: stepper Entrega → Pagamento → Revisão, resumo sempre visível (sidebar desktop / colapsável mobile). Pix (QR mock), Cartão (form com detecção de bandeira via regex do BIN), Dinheiro (troco). Cupom aplicável aqui também.
7. **Confirmação + acompanhamento**: sucesso elegante, timeline 4 estados progredindo por timers simulados, indicador visual do entregador (mapa ilustrativo simples com marcador animado no trajeto).
8. **Avaliação**: estrelas separadas (comida/entrega), comentário, pular.

## Estados tratados

Skeletons em carregamentos, empty states desenhados (carrinho vazio, sem endereços, pedido não encontrado, busca sem resultado), erros de formulário específicos.

## Responsividade

Breakpoint principal 1024px. Mobile: bottom nav não é necessária (fluxo é linear), mas carrinho FAB fixo. Desktop: layout 2 colunas na home (menu + carrinho sticky) e no checkout (etapas + resumo).

## SEO/metadata

`head()` único por rota (título, description, og). Sem og:image no root.

## Ordem de implementação

1. Tokens de design + componentes base (Button, Input, Sheet, Card, Chip, Badge, EmptyState, Skeleton)
2. Dados mockados + tipos + stores Zustand (cart, auth, addresses, orders)
3. Home + ProductCard + scroll-spy de categorias
4. ProductSheet com personalização
5. Carrinho + cupom
6. Auth gate
7. Endereços com Leaflet + Nominatim
8. Checkout completo
9. Confirmação + acompanhamento + avaliação
10. Polimento, empty states, skeletons, revisão responsiva

Fora do escopo: painel admin, pagamento real, Google Maps.
