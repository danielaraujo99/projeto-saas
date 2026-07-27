
# Painel Administrativo — Fase 1 (Multi-tenant desde a base)

Escopo desta fase: fundação multi-tenant + autenticação real + papéis + Pedidos (Kanban) + Adicionar Pedido + KDS. Dashboard, PDV, Cardápio, Estoque, Cupons, Clientes, Avaliações, Financeiro, Equipe e Configurações entram em prompts próximos, já sobre esta base.

**Regra inviolável:** nenhuma tela do lado cliente muda. Apenas a URL pública do cardápio ganha um segmento de slug (`/:slug`) e o restaurante "Bistrô Azul" vira o primeiro tenant.

---

## 1. Arquitetura Multi-tenant

Cada restaurante é um **tenant** com isolamento estrito no banco. Todo dado de operação carrega `restaurant_id`, e o RLS garante que uma consulta autenticada só veja linhas do seu próprio tenant — não é filtro de UI, é regra do banco.

**Novas tabelas (Fase 1):**
- `restaurants` — nome, slug único, dados de contato, status. Cada conta que se cadastra pelo onboarding cria um registro aqui.
- `profiles` — perfil do usuário logado (nome, email), 1:1 com `auth.users`.
- `restaurant_members` — vincula `user_id` a `restaurant_id` com `role` (`admin` / `caixa` / `cozinha`). Um usuário pode pertencer a mais de um restaurante no futuro; nesta fase o onboarding cria uma linha admin.
- `app_role` — enum `admin | caixa | cozinha`.
- Função `has_restaurant_role(user, restaurant, role)` (SECURITY DEFINER) para RLS sem recursão.
- Função `current_restaurant_id()` (SECURITY DEFINER, lê de `restaurant_members` do usuário logado) — base das políticas.

**Migração da tabela `orders` existente (sem quebrar o cliente):**
- Adicionar coluna `restaurant_id uuid` (nullable transitoriamente).
- Popular todas as linhas existentes com o `restaurant_id` do "Bistrô Azul".
- Tornar `NOT NULL` e adicionar FK.
- Reescrever RLS: leitura/escrita autenticada exige membership no tenant; leitura anônima (usada hoje pelo cliente para acompanhar pedido) fica restrita a `device_id` + `short_id` já enviados na URL — comportamento atual preservado.

**URL pública do cardápio:**
- Rota nova `/$slug` no lado cliente que resolve o restaurante pelo slug e renderiza a home atual sem alterá-la visualmente.
- `/` continua funcionando redirecionando para `/bistro-azul` (primeiro tenant) até haver seletor.

## 2. Entrada separada do painel

Rotas do painel vivem sob `/admin/*`, com layout, header e navegação próprios — visualmente e conceitualmente isolado do lado cliente, mesma app.

```text
/admin/login
/admin/cadastro
/admin/recuperar-senha
/admin/                → dashboard (placeholder Fase 1)
/admin/pedidos         → Kanban
/admin/pedidos/novo    → Adicionar Pedido
/admin/cozinha         → KDS (login como Cozinha cai direto aqui)
```

Layout do painel: `src/routes/admin/route.tsx` como pathless-ish layout (não, é um layout com prefixo real) — sidebar fixo no desktop, drawer no mobile, topbar com título da seção + menu do usuário. Menu lista apenas itens permitidos ao papel logado (item não aparece se não tem acesso).

## 3. Autenticação real

Supabase Auth email/senha, com sessão persistida.

- Login (`/admin/login`): página cheia, layout dividido no desktop, formulário em tela cheia no mobile. "Manter conectado", mostrar/ocultar senha, erro específico.
- Onboarding (`/admin/cadastro`): cria `auth.users` + `profiles` + `restaurants` (com slug gerado a partir do nome) + `restaurant_members` como `admin`. Trigger `handle_new_user` popula profile automaticamente. Nota explícita: contas de Caixa/Cozinha entram pela aba Equipe (fase futura) — não por auto-cadastro.
- Recuperação de senha: `resetPasswordForEmail` + rota `/admin/redefinir-senha` que trata o `type=recovery`.
- Guarda de rota: layout `admin/` faz `beforeLoad` com `getUser()`; sem sessão → redireciona para `/admin/login`. Papel `cozinha` → redireciona qualquer rota `/admin/*` diferente de `/admin/cozinha` para o KDS.

Contexto React (`useAdminSession`) carrega `user + restaurant + role` uma vez após login e alimenta o guarda de papel + navegação.

## 4. Pedidos (Kanban)

Colunas: `Recebido → Confirmado → Em preparo → Saiu para entrega/Pronto para retirada → Concluído`, coluna auxiliar `Cancelado`.

- Fonte: mesma tabela `orders`, filtrada por `restaurant_id` (RLS cuida). Realtime via `supabase.channel` para novos pedidos e mudanças de status.
- Desktop: **drag and drop** entre colunas (dnd-kit já compatível com React 19).
- Mobile: cada status vira **aba/segmentada**, e cada card tem menu de ação "Mover para → …" — sem dragging em mobile, como pedido.
- Card: número curto, cliente, itens resumidos, tempo desde criação (atualiza em tempo real), forma de pagamento, total.
- Clique no card → modal `OrderDetailsSheet` (adaptive: dialog no desktop, sheet no mobile) com itens completos, endereço/retirada, pagamento, botões "Avançar status" e "Cancelar pedido" (este com confirmação).
- Toast padrão do sistema para sucesso/erro (mesmo `sonner` do cliente).

Refletir no cliente: a mudança de status escrita aqui reaproveita a mesma coluna `status` que o `pedido/$id` do cliente já lê e re-renderiza via polling/realtime existente. Zero mudança no cliente.

## 5. Adicionar Pedido (atendimento manual)

Fluxo dentro do painel para pedidos por telefone/WhatsApp:
- Seleção rápida de cliente (busca ou "cliente avulso" só com nome/telefone).
- Grade do cardápio (reaproveita `menu.ts` mockado por enquanto — item 11 do briefing).
- Personalização reusa `ProductSheet` já existente (importado do lado cliente sem alterar).
- Escolha entrega/retirada, forma de pagamento, observações.
- Ao confirmar: insere em `orders` com `restaurant_id`, `status='received'` já (não `pending_payment`) e cai no Kanban.

## 6. KDS (Cozinha)

Rota `/admin/cozinha`. Login como `cozinha` cai direto aqui, sem sidebar completo — apenas topbar mínimo com nome do restaurante e sair.

- Mostra pedidos em `Confirmado` e `Em preparo`.
- Cards grandes, alto contraste, tipografia pesada para uso à distância.
- Cronômetro por pedido; passa de amarelo (>15 min) para vermelho (>25 min).
- Botão grande "Marcar como pronto" muda status para `delivering` (delivery) ou `ready` (retirada — usará mesmo `delivering` por enquanto, campo `pickup` distingue).
- Tablet-first: grid 2-3 colunas conforme largura, toque generoso.

## 7. Design System do Painel

Reaproveita tokens do cliente (`src/styles.css`) mas com densidade de painel:
- Fundo `--admin-bg`: cinza-neutro muito claro.
- Cards brancos com sombra sutil já existente.
- Componentes shadcn atuais reutilizados. Nenhum novo padrão visual.
- Novo componente: `AdminSidebar`, `AdminTopbar`, `AdminShell` (layout wrapper), `OrderKanban`, `OrderCard`, `KdsCard`, `StatusBadge`.

## 8. Modais desta fase

Todos com o mesmo `AdaptiveSheet` já usado no cliente:
- Detalhes do pedido (Kanban).
- Confirmação de cancelamento de pedido.
- Confirmação de logout.
- Toasts padrão para sucesso/erro.

Demais modais (produto, cupom, caixa, etc.) entram nas fases correspondentes.

## 9. Responsividade

- Desktop ≥ 1024px: sidebar fixo à esquerda, conteúdo ancorado (sem espaço vazio).
- Tablet 640-1023: sidebar colapsa para modo ícone.
- Mobile <640: sidebar vira **drawer** aberto por botão no topbar. KDS e PDV (fase futura) permanecem em layout de tablet quando abertos em telas pequenas mas usáveis.
- Kanban: drag no desktop, abas no mobile (regra global do painel).

## 10. Ordem de execução (esta fase)

1. Migração multi-tenant: tabelas + funções + RLS + backfill do `restaurant_id` em `orders`.
2. Layout do painel + guarda de rota + contexto de sessão.
3. Telas de auth (login, cadastro, recuperar).
4. Rota pública `/$slug` no cliente + redirecionamento de `/`.
5. Kanban de pedidos (desktop drag + mobile abas) + modal de detalhes + realtime.
6. Adicionar pedido.
7. KDS.
8. Verificação: build, criar conta de teste, criar pedido pelo cliente (`/bistro-azul`), ver aparecer no Kanban do admin, avançar status, ver refletir no acompanhamento do cliente.

## 11. Detalhes técnicos (para referência)

- Autenticação usa `supabase.auth` diretamente no cliente (painel é rota client-side, `ssr: false` no layout `/admin`).
- Server functions (`createServerFn`) usadas quando precisar de escrita privilegiada ou consulta agregada; leituras normais usam o client browser + RLS.
- `dnd-kit` para drag no Kanban.
- Realtime via `supabase.channel('orders:{restaurant_id}')` com filtro server-side.
- Slug gerado com `slugify` simples + sufixo numérico em caso de colisão (checado na função de onboarding).
- `useAdminSession` bloqueia render até resolver membership + role para evitar flash de conteúdo do papel errado.

## 12. Fora desta fase

Dashboard com gráficos, PDV completo, Cardápio, Estoque, Cupons, Clientes, Avaliações, Financeiro, Equipe (convites), Configurações do restaurante. Todos entram em prompts seguintes, cada um refinado com o mesmo cuidado dado ao lado cliente.
