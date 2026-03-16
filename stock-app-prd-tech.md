# PRD + Especificação Técnica — Aplicativo de Gestão de Produtos e Estoque

> **Status:** Rascunho — v1.1
> **Data:** 2026-03-16
> **Autor:** Guilherme Augusto
> **Contexto:** Projeto pessoal com potencial de evolução para produto comercial

---

## Sumário

1. [Visão do Produto](#1-visão-do-produto)
2. [Definição do MVP](#2-definição-do-mvp)
3. [Arquitetura Técnica Recomendada](#3-arquitetura-técnica-recomendada)
4. [Modelagem de Dados](#4-modelagem-de-dados)
5. [Fluxos de Uso](#5-fluxos-de-uso)
6. [Decisões Técnicas Importantes](#6-decisões-técnicas-importantes)
7. [Design System](#7-design-system)
8. [Roadmap de Evolução](#8-roadmap-de-evolução)

---

## 1. Visão do Produto

### 1.1 Problema

Pequenos comerciantes gerenciam estoque de forma manual — em cadernos, planilhas ou de memória. Isso gera:

- Falta de visibilidade sobre o que tem e o que precisa repor
- Perdas por vencimento de produtos não rastreados
- Dificuldade em saber o valor total investido em estoque
- Vendas no fiado sem controle: quem deve, quanto e há quanto tempo
- Vendas registradas de forma imprecisa ou não registradas

### 1.2 Solução

Um aplicativo web mobile (PWA) simples e rápido que centraliza o controle de produtos, estoque, vendas e fiado — pensado para quem não tem familiaridade com tecnologia, mas precisa de informação confiável no dia a dia.

Roda no celular como se fosse um app instalado (via "Adicionar à tela inicial"), sem precisar de loja de aplicativos.

### 1.3 Público-Alvo

**Primário (MVP):** Pequenos comerciantes autônomos — revendedores, feirantes, pequenos mercadinhos — com operação individual e sem equipe.

**Futuro:** Pequenos negócios com 2–10 funcionários, operando com necessidade de controle multi-usuário, múltiplos dispositivos e relatórios avançados.

### 1.4 Proposta de Valor

> Controle de estoque e fiado no bolso — rápido de cadastrar, fácil de consultar, acessível de qualquer celular.

| Atributo         | Posicionamento                                                   |
| ---------------- | ---------------------------------------------------------------- |
| Simplicidade     | Interface focada, sem menus complexos ou configurações           |
| Velocidade       | Leitura de código de barras para cadastro e venda em 2 toques   |
| Acessibilidade   | PWA — funciona em Android e iOS sem instalação de loja           |
| Fiado integrado  | Controle de crédito de clientes sem sair do fluxo de venda      |
| Evolução gradual | Começa simples, cresce conforme o negócio cresce                 |

### 1.5 Métricas de Sucesso (MVP)

| Métrica                                 | Meta                            |
| --------------------------------------- | ------------------------------- |
| Produtos cadastrados após 30 dias        | ≥ 20                            |
| Vendas registradas por semana            | ≥ 5                             |
| Fiados registrados após 30 dias          | ≥ 3                             |
| Sessões de uso por semana                | ≥ 3                             |
| Feedback qualitativo                    | "Uso todo dia" ou "ajuda muito" |

---

## 2. Definição do MVP

### 2.1 Critério de Corte

O MVP deve ser **acessível via link no navegador**, **utilizável sem treinamento** e **resolver os três problemas centrais** do usuário: saber o que tem no estoque, registrar uma venda e controlar o fiado dos clientes.

### 2.2 O que ENTRA no MVP

#### Autenticação
- Login com email e senha
- Sessão persistente (não precisa logar a cada acesso)
- Conta única por negócio (sem multi-usuário no MVP)

#### Cadastro de Produtos
- Nome do produto (obrigatório)
- Código de barras (leitura pela câmera ou digitação manual)
- Valor de compra (custo)
- Valor sugerido de venda
- Data de validade (opcional)
- Quantidade inicial em estoque

#### Leitura de Código de Barras
- Leitura via câmera para cadastrar produto
- Leitura via câmera para buscar produto ao registrar venda

#### Gestão de Estoque
- Entrada manual de quantidade (reposição)
- Decremento automático ao registrar venda
- Indicador visual de estoque baixo (quantidade ≤ limiar configurável, padrão: 5)
- Alerta de produto próximo ao vencimento (≤ 7 dias)

#### Registro de Vendas
- Selecionar produto (por busca ou leitura de código de barras)
- Informar quantidade vendida
- Confirmar ou alterar valor de venda (permite desconto/promoção)
- Escolher forma de pagamento: **à vista** ou **fiado**
- Se fiado: selecionar ou cadastrar cliente na hora

#### Controle de Fiado
- Cadastro simples de clientes (nome + telefone opcional)
- Visualizar saldo devedor por cliente
- Registrar pagamento parcial ou total de dívida
- Histórico de compras fiadas por cliente

#### Relatórios Básicos
- Valor total em estoque (soma de `qtd × valor_de_compra`)
- Total de vendas à vista: hoje / semana / mês
- Total de fiado em aberto (quanto está a receber)
- Lista de produtos com estoque baixo
- Lista de produtos próximos ao vencimento
- Histórico de vendas recentes (lista cronológica)

#### Configurações
- Nome do negócio (exibido na tela inicial)
- Limiar de estoque baixo (padrão: 5 unidades)
- Janela de alerta de vencimento (padrão: 7 dias)

### 2.3 O que NÃO ENTRA no MVP

| Funcionalidade                    | Motivo do adiamento                              |
| --------------------------------- | ------------------------------------------------ |
| Multi-usuário                     | Uma conta é suficiente para validar o uso        |
| Gráficos de evolução              | Requer histórico acumulado — faz sentido na v2   |
| Relatório de lucro/margem         | Útil, mas não crítico para validar uso inicial   |
| Categorias de produtos            | Pode ser adicionado sem refatoração na v1.1      |
| Export de relatórios (CSV/PDF)    | Aumenta escopo, baixa prioridade no MVP          |
| Notificações push                 | iOS PWA tem suporte limitado, adia para v1.1     |

### 2.4 Condição de Sucesso do MVP

O MVP está pronto quando for possível:

1. Acessar o app via navegador no celular e adicionar à tela inicial
2. Cadastrar um produto com código de barras em menos de 30 segundos
3. Registrar uma venda à vista em menos de 15 segundos
4. Registrar uma venda no fiado selecionando o cliente em menos de 20 segundos
5. Ver o total de fiado em aberto na tela inicial

---

## 3. Arquitetura Técnica Recomendada

### 3.1 Stack

| Camada              | Tecnologia                          | Justificativa                                                             |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| Plataforma          | **PWA** (Progressive Web App)       | Android e iOS sem App Store; câmera, homescreen e offline via SW          |
| Framework           | **React 18 + TypeScript + Vite**    | Ecossistema maduro, stack familiar, build rápido                          |
| Roteamento          | **React Router v7**                 | Padrão atual do ecossistema React                                         |
| UI                  | **Tailwind CSS + shadcn/ui**        | Componentes acessíveis, customizáveis, responsivos                        |
| Estado global       | **Zustand**                         | Simples, sem boilerplate, fácil de testar                                 |
| Backend / BaaS      | **Supabase**                        | Auth + Postgres + RLS + API auto-gerada. Free tier suficiente para MVP    |
| ORM / Queries       | **Drizzle ORM** (modo Postgres)     | Type-safe, schema-first, suporte a migrations, funciona com Supabase      |
| Barcode scanner     | **@zxing/browser**                  | Biblioteca JS mais madura para leitura de barcode via câmera no browser   |
| Formulários         | **react-hook-form + zod**           | Validação type-safe, boa DX                                               |
| Datas               | **date-fns**                        | Lightweight, tree-shakeable                                               |

### 3.2 Estratégia de Armazenamento

**MVP: Cloud-first com Supabase Postgres.**

Todos os dados são persistidos no Supabase. O aplicativo requer conexão com internet para funcionar.

**Por que cloud-first em vez de offline-first:**

- Supabase elimina a necessidade de construir backend — Auth, banco e API saem do mesmo lugar
- Dados acessíveis de qualquer dispositivo desde o MVP (celular quebrou, troca e continua)
- Backup automático e gratuito
- Trade-off aceito: dependência de internet — aceitável para o perfil de uso (comércio fixo com Wi-Fi ou 4G)

**Caminho para suporte offline parcial (v1.1, se necessário):**

Service Worker com cache de leitura (produtos, clientes) + fila de mutações pendentes (`sync_queue` em IndexedDB). Quando a conexão voltar, a fila é processada contra o Supabase. Conflitos resolvidos por timestamp.

### 3.3 Arquitetura de Camadas

A premissa central é **isolar completamente a lógica de negócio do framework e da plataforma**. Isso permite migrar para React Native no futuro trocando apenas as camadas de UI e infraestrutura, mantendo o domínio intacto.

```
┌──────────────────────────────────────────────────────────┐
│                       UI Layer                            │
│          React Components + React Router                  │
│          Tailwind + shadcn/ui                             │
│          (única camada que muda ao migrar para RN)        │
├──────────────────────────────────────────────────────────┤
│                   Application Layer                       │
│          React Hooks (useProduct, useSale, etc.)          │
│          Conecta Domain ↔ UI, sem lógica de negócio       │
├──────────────────────────────────────────────────────────┤
│                    Domain Layer                           │
│          TypeScript puro — zero dependências externas     │
│          Types, entidades, regras de negócio              │
│          Interfaces de repositório (contratos)            │
│          (100% reutilizável em React Native)              │
├──────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                      │
│          Implementações Supabase dos repositórios         │
│          Drizzle ORM + Supabase client                    │
│          (substituível por expo-sqlite no RN se necessário) │
└──────────────────────────────────────────────────────────┘
```

**O que fica no Domain Layer (puro TypeScript):**

```
domain/
  types.ts              → interfaces de todas as entidades
  repositories/         → interfaces (contratos) de acesso a dados
    IProductRepository.ts
    ISaleRepository.ts
    ICustomerRepository.ts
    ICreditRepository.ts
  rules/                → lógica de negócio pura
    stock.rules.ts      → calcular estoque, alertas, validade
    sale.rules.ts       → validar venda, calcular totais
    credit.rules.ts     → calcular saldo devedor, registrar pagamento
  formatters/           → formatação de moeda, datas (sem dependência de UI)
```

**O que fica na Infrastructure Layer:**

```
infrastructure/
  supabase/
    ProductRepository.ts   → implementa IProductRepository com Supabase
    SaleRepository.ts
    CustomerRepository.ts
    CreditRepository.ts
```

Ao migrar para React Native: cria-se `infrastructure/sqlite/` com as mesmas implementações usando `expo-sqlite`. O domain não toca.

### 3.4 PWA — Instalação como App

O objetivo é que o usuário instale o app no celular como se fosse nativo — com ícone na tela inicial, splash screen e sem barra de navegação do browser. O comportamento difere entre Android e iOS.

#### Android (Chrome / Samsung Internet)

Funciona de forma completa e pode ser automatizado:

- O browser dispara o evento `beforeinstallprompt` quando o PWA atende os critérios (manifest válido, HTTPS, Service Worker, ícones)
- A aplicação captura esse evento e exibe um **botão de instalação customizado** no onboarding
- Ao confirmar, abre o diálogo nativo de instalação do Android
- Resultado: ícone próprio na tela inicial, splash screen, modo standalone (sem chrome do browser)

#### iOS (Safari)

Funciona, mas o fluxo de instalação é **sempre manual** — não existe equivalente ao `beforeinstallprompt` no iOS:

1. Usuário abre o site no Safari
2. Toca o botão **Compartilhar** (ícone de seta para cima)
3. Rola e toca **"Adicionar à Tela de Início"**
4. Confirma o nome e toca **"Adicionar"**
5. App aparece na homescreen com ícone e nome configurados

Quando instalado, roda em **modo standalone** (sem barra do Safari) — visualmente indistinguível de um app nativo.

**Estratégia para iOS no onboarding:** exibir um modal educativo com passo a passo ilustrado (Share → Adicionar à Tela de Início) na primeira visita, com opção de dispensar.

**Configurações essenciais para iOS** (além do manifest padrão, que o Safari ignora parcialmente):

```html
<!-- index.html -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nome do App">
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
```

Splash screens para iOS requerem ~25 imagens (uma por tamanho de tela de iPhone/iPad). A ferramenta `pwa-asset-generator` automatiza a geração a partir de um único ícone.

**Nota:** `vite-plugin-pwa` gera manifest e Service Worker automaticamente, mas **não gera as meta tags iOS** — precisam ser adicionadas manualmente no `index.html`.

#### Limitações relevantes do PWA no iOS

| Aspecto                      | Status      | Impacto para o produto                                   |
| ---------------------------- | ----------- | -------------------------------------------------------- |
| Câmera (`getUserMedia`)      | ✅ Funciona  | Leitura de barcode OK — exige HTTPS (Vercel provê)       |
| Modo standalone              | ✅ Funciona  | App parece nativo quando instalado                       |
| Push notifications           | ⚠️ Parcial  | Requer iOS 16.4+ e app instalado na homescreen. No MVP, alertas in-app são suficientes |
| Storage (IndexedDB / Cache)  | ⚠️ Limitado | ~50MB; Safari pode limpar cache em 7 dias de inatividade. Não é problema com cloud-first |
| Install prompt automático    | ❌ Não existe | Mitigado com modal educativo no onboarding               |

#### Web App Manifest (base para ambas as plataformas)

```json
{
  "name": "Nome Completo do App",
  "short_name": "NomeApp",
  "description": "Controle de estoque e fiado para pequenos negócios",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#16a34a",
  "background_color": "#f9fafb",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ]
}
```

O ícone `maskable` garante que o ícone não fique com bordas brancas no Android (que aplica máscara de forma ao ícone).

### 3.5 Hospedagem — Vercel

**Decisão: Vercel.**

O app é 100% estático (React + Vite gera arquivos em `dist/`). O backend é o Supabase. A Vercel serve apenas os assets.

| Critério                  | Vercel                                                    |
| ------------------------- | --------------------------------------------------------- |
| HTTPS automático          | ✅ Obrigatório para PWA e `getUserMedia` (câmera)         |
| CD do GitHub              | ✅ Deploy automático a cada push na `main`                |
| Preview deployments       | ✅ URL única por PR — facilita testes                     |
| Free tier                 | ✅ Suficiente para MVP e além                             |
| Edge Network              | ✅ Assets servidos próximos ao usuário                    |
| Variáveis de ambiente     | ✅ `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via dashboard |

**Configuração necessária:** apenas um `vercel.json` com rewrite para SPA (React Router):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 3.6 Supabase — Configuração

**Auth:** Email + senha no MVP. Social login (Google) na v2.

**Row Level Security (RLS):** Todas as tabelas têm RLS habilitado desde o início. Política base do MVP: `user_id = auth.uid()` — cada usuário só vê seus próprios dados. Isso prepara multi-tenancy sem refatoração futura.

**Schema:** Gerenciado via Drizzle Migrations — não via dashboard do Supabase. Garante versionamento de schema em código.

---

## 4. Modelagem de Dados

### 4.1 Entidades e Responsabilidades

#### `users` — Usuário / Negócio

Gerenciado pelo Supabase Auth. Extendido com metadados do negócio.

| Campo           | Tipo    | Obrigatório | Descrição                      |
| --------------- | ------- | ----------- | ------------------------------ |
| `id`            | UUID    | Sim         | ID do Supabase Auth            |
| `business_name` | string  | Não         | Nome do negócio                |
| `low_stock_threshold`    | integer | Não | Limiar global de estoque baixo (padrão: 5) |
| `expiration_alert_days`  | integer | Não | Janela de alerta de vencimento (padrão: 7) |
| `created_at`    | timestamp | Sim       | Data de criação                |

---

#### `products` — Produto cadastrado

Representa um item que o negócio vende ou controla.

| Campo                 | Tipo      | Obrigatório | Descrição                                              |
| --------------------- | --------- | ----------- | ------------------------------------------------------ |
| `id`                  | UUID      | Sim         | Identificador único (gen_random_uuid())                |
| `user_id`             | UUID (FK) | Sim         | Dono do produto (RLS)                                  |
| `name`                | string    | Sim         | Nome do produto                                        |
| `barcode`             | string    | Não         | Código de barras EAN-13 ou similar (único por user_id) |
| `purchase_price`      | integer   | Sim         | Custo em centavos (R$ 12,50 → 1250)                   |
| `sale_price`          | integer   | Sim         | Preço sugerido de venda em centavos                    |
| `expiration_date`     | date      | Não         | Data de validade                                       |
| `low_stock_threshold` | integer   | Não         | Limiar individual (sobrescreve o global do usuário)    |
| `created_at`          | timestamp | Sim         | Data de criação                                        |
| `updated_at`          | timestamp | Sim         | Última atualização                                     |

**Nota:** Todos os preços são inteiros em centavos. Evita erros de ponto flutuante. A conversão para exibição (`÷ 100`) fica em `domain/formatters/currency.ts`.

---

#### `stock_entries` — Saldo atual de estoque

Uma entrada por produto. Representa a quantidade disponível agora.

| Campo        | Tipo      | Obrigatório | Descrição                                    |
| ------------ | --------- | ----------- | -------------------------------------------- |
| `id`         | UUID      | Sim         | Identificador único                          |
| `product_id` | UUID (FK) | Sim         | Produto referenciado                         |
| `user_id`    | UUID (FK) | Sim         | Para RLS                                     |
| `quantity`   | integer   | Sim         | Quantidade atual disponível                  |
| `updated_at` | timestamp | Sim         | Última atualização                           |

**Design decision:** Separada de `products` para suportar futura extensão multi-localização (loja A, loja B) sem alterar o esquema do produto.

---

#### `stock_movements` — Histórico de movimentações

Log imutável de cada entrada e saída. Permite auditar e reconstruir o saldo a qualquer momento.

| Campo        | Tipo                                                   | Obrigatório | Descrição                                      |
| ------------ | ------------------------------------------------------ | ----------- | ---------------------------------------------- |
| `id`         | UUID                                                   | Sim         | Identificador único                            |
| `product_id` | UUID (FK)                                              | Sim         | Produto movimentado                            |
| `user_id`    | UUID (FK)                                              | Sim         | Para RLS                                       |
| `type`       | enum: `in` \| `out` \| `adjustment`                   | Sim         | Direção da movimentação                        |
| `quantity`   | integer                                                | Sim         | Quantidade (sempre positivo; `type` define direção) |
| `reason`     | enum: `purchase` \| `sale` \| `loss` \| `correction`  | Não         | Motivo                                         |
| `sale_id`    | UUID (FK, nullable)                                    | Não         | Referência à venda que originou a saída        |
| `note`       | string                                                 | Não         | Observação livre                               |
| `created_at` | timestamp                                              | Sim         | Timestamp da movimentação                      |

---

#### `sales` — Registro de venda

Cada venda, à vista ou fiado.

| Campo                     | Tipo                        | Obrigatório | Descrição                                                     |
| ------------------------- | --------------------------- | ----------- | ------------------------------------------------------------- |
| `id`                      | UUID                        | Sim         | Identificador único                                           |
| `user_id`                 | UUID (FK)                   | Sim         | Para RLS                                                      |
| `product_id`              | UUID (FK)                   | Sim         | Produto vendido                                               |
| `quantity`                | integer                     | Sim         | Quantidade vendida                                            |
| `unit_price`              | integer                     | Sim         | Preço unitário praticado (centavos) — pode diferir do sugerido |
| `total_price`             | integer                     | Sim         | `quantity × unit_price` (calculado e persistido)             |
| `purchase_price_snapshot` | integer                     | Sim         | Custo no momento da venda — garante precisão de relatórios históricos |
| `payment_type`            | enum: `cash` \| `credit`    | Sim         | Forma de pagamento: à vista ou fiado                          |
| `customer_id`             | UUID (FK, nullable)         | Não         | Obrigatório quando `payment_type = credit`                    |
| `created_at`              | timestamp                   | Sim         | Data e hora da venda                                          |

**Notas:**
- `purchase_price_snapshot` garante que relatórios de margem futuras sejam precisos mesmo que o custo do produto seja atualizado depois.
- Vendas são **imutáveis** após criação. Cancelamentos geram uma nova `stock_movement` tipo `in`.

---

#### `customers` — Clientes (para fiado)

Cadastro simples dos clientes que compram no fiado.

| Campo        | Tipo      | Obrigatório | Descrição                             |
| ------------ | --------- | ----------- | ------------------------------------- |
| `id`         | UUID      | Sim         | Identificador único                   |
| `user_id`    | UUID (FK) | Sim         | Para RLS                              |
| `name`       | string    | Sim         | Nome do cliente                       |
| `phone`      | string    | Não         | Telefone (para contato sobre dívida)  |
| `note`       | string    | Não         | Observação livre                      |
| `created_at` | timestamp | Sim         | Data de cadastro                      |

---

#### `credit_payments` — Pagamentos de fiado

Registra cada pagamento (parcial ou total) de um cliente.

| Campo         | Tipo      | Obrigatório | Descrição                              |
| ------------- | --------- | ----------- | -------------------------------------- |
| `id`          | UUID      | Sim         | Identificador único                    |
| `user_id`     | UUID (FK) | Sim         | Para RLS                               |
| `customer_id` | UUID (FK) | Sim         | Cliente que pagou                      |
| `amount`      | integer   | Sim         | Valor pago em centavos                 |
| `note`        | string    | Não         | Observação (ex: "pagou metade")        |
| `created_at`  | timestamp | Sim         | Data do pagamento                      |

**Saldo devedor de um cliente** = Σ `sales.total_price` WHERE `customer_id` AND `payment_type = credit` − Σ `credit_payments.amount` WHERE `customer_id`

Esse cálculo fica em `domain/rules/credit.rules.ts` como função pura — testável sem banco.

---

### 4.2 Diagrama de Relacionamento

```
users
  │
  ├──────────────────────────────────────────────┐
  │                                              │
  │ 1:N                                          │ 1:N
  ▼                                              ▼
products ──── 1:1 ──── stock_entries       customers
  │                                              │
  │ 1:N                                          │ 1:N
  ▼                                              ▼
stock_movements                            credit_payments
  ▲
  │ (sale_id FK)
  │
sales ──── N:1 ──── customers
  │         (customer_id, nullable)
  │
  └── payment_type: cash | credit
```

---

## 5. Fluxos de Uso

### 5.1 Cadastro de Produto

```
Usuário abre "Produtos" → toca "+"
    │
    ├── [Opção A] Digitar manualmente
    │       → Preenche nome, preço de compra, preço de venda, quantidade
    │       → Salva
    │
    └── [Opção B] Ler código de barras
            → Câmera abre via @zxing/browser
            → Lê código EAN
            → Se produto já existe: abre tela de edição
            → Se não existe: preenche campo barcode automaticamente
            → Usuário completa os demais campos
            → Salva
            → stock_entry criado com quantidade informada
            → stock_movement tipo "in", reason "purchase" registrado
```

### 5.2 Registro de Venda — À Vista

```
Usuário abre "Registrar Venda"
    │
    ├── [Opção A] Busca produto por nome ou código digitado
    └── [Opção B] Lê código de barras
            │
            ▼
    Produto encontrado → exibe nome, estoque atual, preço sugerido
            │
            ▼
    Usuário informa quantidade
            │
            ▼
    Usuário confirma ou altera valor de venda
            │
            ▼
    Seleciona: "À Vista"
            │
            ▼
    Confirma
            │
            ├── sale criado (payment_type: cash)
            ├── stock_movement tipo "out", reason "sale" criado
            └── stock_entry.quantity decrementado
            │
            ▼
    Toast de sucesso
    └── Se estoque ≤ limiar → badge de alerta na tela de estoque
```

### 5.3 Registro de Venda — Fiado

```
[... mesmo início do fluxo 5.2 até escolha de pagamento ...]
            │
            ▼
    Seleciona: "Fiado"
            │
            ▼
    Busca cliente por nome
    ├── [Cliente encontrado] → seleciona
    └── [Cliente não cadastrado] → toca "Novo cliente"
            → Modal com nome + telefone
            → Salva e seleciona automaticamente
            │
            ▼
    Confirma venda no fiado
            │
            ├── sale criado (payment_type: credit, customer_id preenchido)
            ├── stock_movement tipo "out", reason "sale" criado
            └── stock_entry.quantity decrementado
            │
            ▼
    Toast: "Venda no fiado registrada para [Nome]"
    └── Saldo do cliente atualizado na tela de fiado
```

### 5.4 Registro de Pagamento de Fiado

```
Usuário abre "Fiado" → seleciona cliente
    │
    ▼
Tela do cliente:
    ├── Saldo devedor total
    ├── Lista de compras no fiado (com data e valor)
    └── Botão "Registrar Pagamento"
            │
            ▼
    Informa valor pago (pode ser parcial)
            │
            ▼
    Confirma
            │
            └── credit_payment criado
                └── Saldo devedor recalculado e exibido
```

### 5.5 Reposição de Estoque

```
Usuário abre produto → toca "Repor Estoque"
    │
    ▼
Informa quantidade a adicionar
    │
    ▼
Confirma
    │
    ├── stock_movement tipo "in", reason "purchase" criado
    └── stock_entry.quantity incrementado
```

### 5.6 Consulta de Estoque

```
Tela "Estoque"
    │
    ├── Lista todos os produtos com quantidade atual
    ├── Indicador visual: verde (ok) / amarelo (baixo) / vermelho (zerado)
    ├── Badge de vencimento próximo
    └── Busca por nome ou código de barras
```

### 5.7 Visualização de Relatórios

```
Tela "Relatórios"
    │
    ├── Card: Valor total em estoque (Σ qtd × custo)
    ├── Card: Total em vendas à vista — hoje / semana / mês
    ├── Card: Total de fiado em aberto (Σ saldos devedores)
    ├── Lista: Clientes com fiado em aberto (ordenado por valor)
    ├── Lista: Produtos com estoque baixo
    ├── Lista: Produtos próximos ao vencimento
    └── Histórico: Vendas recentes (com filtro de data)
```

---

## 6. Decisões Técnicas Importantes

### 6.1 PWA vs React Native

**Decisão: PWA.**

| Critério                | PWA                                            | React Native                              |
| ----------------------- | ---------------------------------------------- | ----------------------------------------- |
| Suporte iOS             | ✅ Safari, sem App Store                       | ✅ Mas exige conta Apple Developer (US$99/ano) |
| Distribuição            | ✅ Link direto                                 | ❌ App Store + review                     |
| Câmera / Barcode        | ✅ getUserMedia funciona bem                   | ✅ expo-camera                            |
| Stack conhecida         | ✅ React/TypeScript/Tailwind                   | Expo/React Native — curva a mais          |
| Migração futura         | ✅ Domain layer reutilizável                   | —                                         |
| Push notifications iOS  | ⚠️ Parcial (iOS 16.4+ / homescreen)           | ✅ Nativo                                 |

Trade-off aceito: notificações push limitadas no iOS. No MVP, alertas in-app (ao abrir o app) são suficientes.

### 6.2 Supabase vs Neon

**Decisão: Supabase.**

Neon é excelente como Postgres serverless, mas é apenas banco de dados. Supabase entrega no free tier o que levaria semanas para construir manualmente:

- **Auth completo** com sessões, refresh tokens e JWT
- **Row Level Security** nativo — segurança por usuário sem middleware
- **API REST auto-gerada** via PostgREST
- **Realtime** via WebSockets (útil na v2 para multi-dispositivo)
- **Edge Functions** para lógica server-side futura
- **Backups automáticos**

Neon seria a escolha certa em um backend customizado com Node.js + próprio middleware de auth. Aqui, Supabase elimina toda essa infraestrutura.

### 6.3 Cloud-First vs Offline-First

**Decisão: Cloud-first no MVP, offline parcial na v1.1.**

Cloud-first no MVP reduz drasticamente a complexidade (sem sincronização, sem conflitos, sem fila de eventos). O perfil de uso — comércio fixo com Wi-Fi ou 4G — torna a dependência de internet aceitável.

Se o uso real mostrar que há problemas de conectividade, a v1.1 adiciona:

1. Service Worker cacheia leituras (produtos, clientes) em IndexedDB
2. Mutações offline vão para uma fila local (`sync_queue` em IndexedDB)
3. Quando online, fila é processada contra o Supabase
4. Conflitos resolvidos por `created_at` (last-write-wins na v1.1)

### 6.4 Isolamento do Domain Layer

O domain layer em TypeScript puro é o principal ativo arquitetural para portabilidade futura. As regras são:

- **Nenhum import de React**, React Native, Supabase ou bibliotecas de terceiros
- Recebe e retorna tipos definidos em `domain/types.ts`
- Interfaces de repositório definem contratos — implementações ficam na infra
- Testável com `vitest` sem precisar de banco ou DOM

Isso garante: se a decisão de plataforma mudar (PWA → React Native), o custo de migração é limitado às camadas de UI e infraestrutura.

### 6.5 Preços em Centavos (Integer)

Preços armazenados como inteiro em centavos (`R$ 12,50` → `1250`). Elimina erros de ponto flutuante em operações financeiras acumuladas. A conversão para exibição (`÷ 100`) fica centralizada em `domain/formatters/currency.ts`.

### 6.6 RLS como Primeira Camada de Segurança

Row Level Security no Supabase garante que nenhum usuário acesse dados de outro, mesmo que haja um bug na aplicação. Todas as tabelas têm a política:

```sql
CREATE POLICY "users can only see their own data"
ON table_name
USING (user_id = auth.uid());
```

Isso também prepara multi-tenancy: na v2, `user_id` pode ser substituído por `tenant_id` sem mudar a lógica de negócio.

### 6.7 Escalabilidade para Produto Comercial

Quando o produto evoluir para SaaS:

1. **Multi-tenancy:** Adicionar `tenant_id` às tabelas. Usuários passam a pertencer a um tenant (negócio). RLS policies atualizadas.
2. **Auth:** Google/Apple social login via Supabase Auth.
3. **Realtime:** Supabase já tem WebSockets — estoque e fiado atualizados em tempo real em múltiplos dispositivos.
4. **Edge Functions:** Lógica sensível (cálculo de relatórios pesados, webhooks) migra para Supabase Edge Functions.
5. **Schema:** Drizzle Migrations garante evolução controlada — sem alterações manuais no banco.

---

## 7. Design System

### 7.1 Benchmarks de Referência

O design não parte do zero — três referências guiam decisões específicas:

| Referência     | O que absorver                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Square POS** | Fluxo de venda: produto → quantidade → pagamento → confirmação. Toques grandes, zero distração   |
| **Nubank**     | Apresentação de valores financeiros: número em destaque, hierarquia clara, cores com significado |
| **SumUp**      | Simplicidade para usuário não-técnico em contexto brasileiro. Feedback visual imediato           |

### 7.2 Princípios de Design

O perfil real do usuário define as regras:

- Usa o app em pé, com cliente esperando → **ações rápidas e óbvias**
- Pode estar com uma mão ocupada → **toques grandes (min. 48×48px)**
- Ambiente com luz variável (loja, mercadinho) → **alto contraste**
- Não lê ícone sem label → **sempre texto + ícone**
- Lida com dinheiro o dia todo → **números precisos em destaque**

### 7.3 Paleta de Cores

Base: shadcn/ui com tema customizado. Tailwind CSS como primitivas.

| Role        | Nome        | Hex       | Tailwind         | Uso                                                          |
| ----------- | ----------- | --------- | ---------------- | ------------------------------------------------------------ |
| Primary     | Verde       | `#16a34a` | `green-600`      | Ações principais, botão de venda, estoque ok                 |
| Danger      | Vermelho    | `#dc2626` | `red-600`        | Estoque zerado, vencimento crítico, erro                     |
| Warning     | Âmbar       | `#d97706` | `amber-600`      | Estoque baixo (não crítico), vencimento próximo              |
| Credit      | Azul        | `#2563eb` | `blue-600`       | Tudo relacionado a fiado — distingue visualmente de dinheiro |
| Background  | Cinza claro | `#f9fafb` | `gray-50`        | Fundo de tela                                                |
| Surface     | Branco      | `#ffffff` | `white`          | Cards, modais, formulários                                   |
| Text        | Cinza escuro| `#111827` | `gray-900`       | Texto principal                                              |
| Text muted  | Cinza médio | `#6b7280` | `gray-500`       | Labels secundários, datas, descrições                        |
| Border      | Cinza leve  | `#e5e7eb` | `gray-200`       | Bordas de cards e separadores                                |

**Rationale do verde como primary:** no contexto brasileiro de pequeno comércio, verde tem associação direta com dinheiro e positivo. Evita o azul corporativo genérico e cria identidade visual mais próxima do contexto de uso.

**Rationale do azul para fiado:** fiado não é perda, é crédito a receber. Usar vermelho para fiado seria semanticamente errado — vermelho = problema. Azul = valor em trânsito, a receber.

### 7.4 Tipografia

Fonte: **Inter** (padrão shadcn/ui — sem mudança).

| Uso                                  | Tamanho | Peso      | Exemplo                          |
| ------------------------------------ | ------- | --------- | -------------------------------- |
| Valores de destaque (estoque, totais) | 28–32px | Semibold  | R$ 1.240,00                      |
| Títulos de página                    | 22px    | Semibold  | Estoque                          |
| Títulos de card / seção              | 18px    | Medium    | Fiado em aberto                  |
| Corpo / labels                       | 16px    | Regular   | Arroz Tipo 1 — 5kg               |
| Texto auxiliar                       | 14px    | Regular   | Atualizado há 2 dias             |

Regra absoluta: **nunca abaixo de 14px**. O usuário pode usar o app com óculos ou em iluminação ruim.

### 7.5 Layout e Navegação

**Navegação inferior com 4 tabs** — padrão mobile consolidado, sem gestual de swipe, imediatamente compreensível:

```
┌─────────────────────────────────────┐
│                                     │
│          Conteúdo da tela           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏠 Início  📦 Estoque  💳 Fiado   │
│                  ╋ Vender           │
└─────────────────────────────────────┘
```

"Vender" é um **FAB (Floating Action Button)** centralizado elevado acima da tab bar — ação mais frequente recebe o maior destaque visual. Obrigatoriamente com label "Vender", não só ícone.

**Tela Inicial (Dashboard):** três cards grandes, nada mais. Informação de primeiro olhar sem scroll:

```
┌─────────────────────────────────────┐
│  Bom dia 👋  Nome do Negócio        │
├──────────────┬──────────────────────┤
│ Em Estoque   │  Vendas hoje         │
│ R$ 4.820,00  │  R$ 340,00           │
├──────────────┴──────────────────────┤
│ Fiado em aberto                     │
│ R$ 185,00  •  3 clientes            │
├─────────────────────────────────────┤
│ ⚠️  2 produtos com estoque baixo    │
│ ⚠️  1 produto vence em 3 dias       │
└─────────────────────────────────────┘
```

### 7.6 Indicadores Visuais de Estoque

Semáforo com **cor + ícone + texto** — nunca só cor (acessibilidade):

| Estado     | Badge                          | Cor              |
| ---------- | ------------------------------ | ---------------- |
| OK         | `● 24 unid.`                   | Verde            |
| Baixo      | `⚠ 3 unid.`                    | Âmbar            |
| Zerado     | `✕ Zerado`                     | Vermelho         |
| Vencendo   | `⏱ Vence em 3 dias`            | Âmbar / Vermelho |

### 7.7 Feedback e Microinterações

- **Toast de sucesso** (Sonner) ao registrar venda ou pagamento de fiado
- **Confirmação antes de ações destrutivas** (cancelar venda, excluir produto)
- **Feedback de carregamento** em operações com Supabase (skeleton ou spinner)
- **Pull-to-refresh** em listas de estoque e fiado
- **Vibração haptica** ao confirmar venda (suportada em Android via Vibration API)

---

## 8. Roadmap de Evolução

### MVP — "Funciona, resolve o problema"

**Foco:** Um usuário, dados na nuvem, simples de usar.

| Funcionalidade                        |
| ------------------------------------- |
| Login com email e senha               |
| Cadastro de produtos                  |
| Leitura de código de barras           |
| Gestão de estoque (entrada/saída)     |
| Registro de vendas (à vista e fiado)  |
| Cadastro de clientes (para fiado)     |
| Registro de pagamento de fiado        |
| Alertas de estoque baixo              |
| Alertas de vencimento próximo         |
| Relatórios: estoque, vendas, fiado    |
| Configurações do negócio              |
| PWA instalável (homescreen)           |

---

### Versão 1.1 — "Mais controle, mesma simplicidade"

**Foco:** Funcionalidades de alto valor sem aumentar complexidade percebida.

| Funcionalidade                          |
| --------------------------------------- |
| Categorias de produtos                  |
| Export de relatórios para CSV           |
| Relatório de lucro/margem por período   |
| Gráfico simples de vendas por semana    |
| Filtro de histórico de vendas por data  |
| Suporte offline parcial (cache + fila)  |
| Google login                            |

---

### Versão 2.0 — "Negócio conectado"

**Foco:** Multi-usuário, múltiplos dispositivos, dashboards.

| Funcionalidade                              |
| ------------------------------------------- |
| Múltiplos usuários com permissões (dono / operador) |
| Atualização em tempo real entre dispositivos (Supabase Realtime) |
| Dashboard web com gráficos de evolução       |
| Histórico detalhado de compras por cliente   |
| Notificações in-app para estoque baixo       |
| Impressão de recibos simples (PDF)           |

---

### Versão 3.0 — "Plataforma SaaS"

**Foco:** Produto comercial para múltiplos negócios.

| Funcionalidade                                |
| --------------------------------------------- |
| Onboarding self-service com planos de assinatura |
| Multi-tenancy (múltiplos negócios na mesma infra) |
| Dashboards avançados e relatórios customizáveis  |
| Integração com WhatsApp (cobrança de fiado)      |
| Impressão de etiquetas com código de barras       |
| Múltiplos pontos de estoque / depósitos           |
| API pública para integrações                     |

---

---

## Apêndice: Bibliotecas Recomendadas

| Função                   | Biblioteca                    | Observação                                             |
| ------------------------ | ----------------------------- | ------------------------------------------------------ |
| Framework                | `react` + `vite`              | —                                                      |
| Roteamento               | `react-router` v7             | —                                                      |
| UI / Componentes         | `tailwindcss` + `shadcn/ui`   | —                                                      |
| Estado global            | `zustand`                     | —                                                      |
| Backend / Auth / DB      | `@supabase/supabase-js`       | —                                                      |
| ORM / Migrations         | `drizzle-orm` + `drizzle-kit` | Modo Postgres                                          |
| Barcode scanner          | `@zxing/browser`              | Mais maduro que html5-qrcode para browsers modernos    |
| Formulários              | `react-hook-form` + `zod`     | —                                                      |
| Datas                    | `date-fns`                    | —                                                      |
| Notificações in-app      | `sonner`                      | Toasts acessíveis                                      |
| PWA                      | `vite-plugin-pwa`             | Gera manifest e service worker automaticamente         |
| Geração de ícones / splash | `pwa-asset-generator`       | Gera ~25 splash screens iOS a partir de 1 ícone fonte  |
| Testes de domínio        | `vitest`                      | Para testar domain/rules sem dependências de framework |
