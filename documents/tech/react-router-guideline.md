# Guia React Router v7 — Stock App

Guia prático para desenvolvedores que estão começando com React Router. Explica os conceitos fundamentais, como o roteamento funciona neste projeto e como adicionar novas páginas.

---

## 1. O que é o React Router?

O React Router transforma uma aplicação React em uma **Single Page Application (SPA)** com múltiplas "páginas". Em vez do navegador recarregar a página inteira a cada clique, o React Router:

1. Intercepta a navegação (cliques em links, botão voltar, etc.)
2. Atualiza a URL no navegador
3. Renderiza o componente correspondente à nova URL

Tudo isso sem recarregar a página — o que torna a navegação instantânea.

---

## 2. Modo de uso: Data Mode

O React Router v7 tem três modos. Este projeto usa o **Data Mode**:

| Modo             | Como configura                                    | Quando usar                                                         |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Declarative      | `<BrowserRouter>` + `<Routes>` + `<Route>` no JSX | Apps simples, sem data APIs                                         |
| **Data Mode** ✅ | `createBrowserRouter` + `RouterProvider`          | Apps com rotas configuradas como objetos, suporte a loaders/actions |
| Framework        | Plugin Vite `@react-router/dev`                   | File-based routing, SSR, type-safety automática                     |

> **Atenção:** Este projeto importa de `react-router-dom` (não de `react-router`). Mantenha essa consistência.

---

## 3. Fluxo completo: do `main.tsx` à tela

```
main.tsx → App.tsx → RouterProvider → ProtectedRoute → AppShell → Outlet → Página
```

### 3.1. `main.tsx` — Ponto de entrada

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

### 3.2. `App.tsx` — Inicialização global

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthListener } from '@/application/hooks/useAuth'

function AuthSetup() {
  useAuthListener() // escuta sessão do Supabase uma única vez
  return null
}

export function App() {
  return (
    <>
      <AuthSetup />
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  )
}
```

### 3.3. `src/router/index.tsx` — Definição das rotas

```tsx
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  { path: '/login',  element: <LoginPage /> },
  { path: '/signup', element: <SignUpPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>   // redireciona para /login se sem sessão
        <AppShell />     // layout: BottomNav + <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true,              element: <HomePage /> },
      { path: 'stock',            element: <StockPage /> },
      { path: 'stock/new',        element: <NewProductPage /> },
      { path: 'stock/:productId', element: <ProductDetailPage /> },
      { path: 'sales/new',        element: <NewSalePage /> },
      { path: 'credit',           element: <CreditPage /> },
      { path: 'credit/:customerId', element: <CustomerDetailPage /> },
      { path: 'reports',          element: <ReportsPage /> },
      { path: 'settings',         element: <SettingsPage /> },
    ],
  },
])
```

### 3.4. `AppShell.tsx` — Layout com Outlet

```tsx
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <main className="flex-1 pb-24">
        <Outlet /> {/* ← Aqui entra a página da rota ativa */}
      </main>
      <BottomNav />
    </div>
  )
}
```

O `<Outlet />` é o **ponto de inserção** das rotas filhas. Quando a URL muda, o React Router troca o conteúdo do Outlet — o BottomNav continua na tela.

### 3.5. Páginas renderizadas por URL

| URL                     | Componente            | Protegida? |
| ----------------------- | --------------------- | ---------- |
| `/login`                | `LoginPage`           | Não        |
| `/signup`               | `SignUpPage`          | Não        |
| `/`                     | `HomePage`            | Sim        |
| `/stock`                | `StockPage`           | Sim        |
| `/stock/new`            | `NewProductPage`      | Sim        |
| `/stock/:productId`     | `ProductDetailPage`   | Sim        |
| `/sales/new`            | `NewSalePage`         | Sim        |
| `/credit`               | `CreditPage`          | Sim        |
| `/credit/:customerId`   | `CustomerDetailPage`  | Sim        |
| `/reports`              | `ReportsPage`         | Sim        |
| `/settings`             | `SettingsPage`        | Sim        |

---

## 4. Conceitos-chave

### 4.1. Rotas aninhadas (Nested Routes)

A rota raiz (`path: '/'`) é o **pai**. As rotas em `children` são **filhas**. O componente pai usa `<Outlet />` para definir onde o conteúdo filho aparece.

```
URL: /stock/abc123

Árvore renderizada:
└── ProtectedRoute
    └── AppShell (path: "/")
        ├── <main>
        │   └── <Outlet />
        │       └── ProductDetailPage (path: "stock/:productId")
        └── BottomNav
```

### 4.2. `element` vs `Component`

Este projeto usa `element` (JSX) em todas as rotas:

```tsx
// Este projeto
{ path: 'stock', element: <StockPage /> }

// Alternativa com Component (referência da função, sem JSX)
{ path: 'stock', Component: StockPage }
```

Use `element` quando precisar envolver em providers ou passar props. `Component` é preferível para rotas com `lazy`.

### 4.3. Parâmetros dinâmicos (`:param`)

O `:` antes de um segmento da URL indica um **parâmetro dinâmico**:

```tsx
// Definição da rota
{ path: 'stock/:productId', element: <ProductDetailPage /> }

// URL real: /stock/abc-123
// productId = "abc-123"
```

No componente, leia os parâmetros com `useParams`:

```tsx
import { useParams } from 'react-router-dom'

function ProductDetailPage() {
  const { productId } = useParams()
}
```

### 4.4. Index Route

Uma rota com `index: true` é renderizada quando a URL bate **exatamente** com o path do pai:

```tsx
children: [
  { index: true, element: <HomePage /> },  // renderiza em "/"
  { path: 'stock', element: <StockPage /> }, // renderiza em "/stock"
]
```

### 4.5. ProtectedRoute

Toda rota autenticada passa por `ProtectedRoute`, que lê a sessão do Zustand (`authStore`) e redireciona para `/login` se não houver sessão ativa:

```tsx
// src/components/layout/ProtectedRoute.tsx
function ProtectedRoute({ children }) {
  const session = useAuthStore(s => s.session)
  if (!session) return <Navigate to="/login" replace />
  return children
}
```

---

## 5. Navegação

### 5.1. `Link` — Links declarativos

```tsx
import { Link } from 'react-router-dom'

<Link to="/stock">Ver estoque</Link>
<Link to={`/stock/${productId}`}>Detalhes</Link>
```

### 5.2. `useNavigate` — Navegação programática

Para navegar após uma ação (submit de formulário, sucesso em operação):

```tsx
import { useNavigate } from 'react-router-dom'

function NewProductPage() {
  const navigate = useNavigate()

  async function handleSubmit(data) {
    await createProduct(data)
    navigate('/stock') // volta para o estoque após salvar
  }
}
```

### 5.3. `Navigate` — Redirecionamento no render

```tsx
import { Navigate } from 'react-router-dom'

if (!session) return <Navigate to="/login" replace />
```

O `replace` evita que o redirecionamento entre no histórico.

### 5.4. `useMatch` — Detectar rota ativa

Para verificar se a URL atual corresponde a um padrão (usado no BottomNav):

```tsx
import { useMatch } from 'react-router-dom'

const stockMatch = useMatch('/stock/*')
const isActive = !!stockMatch
```

Prefira `useMatch` em vez de `location.pathname.includes(...)`.

---

## 6. Lazy Loading (code splitting)

O projeto ainda não usa lazy loading — todas as páginas são importadas diretamente. Para adicionar, use a propriedade `lazy` do Data Mode:

```tsx
{
  path: 'reports',
  lazy: async () => {
    const { ReportsPage } = await import('./pages/reports/ReportsPage')
    return { Component: ReportsPage }
  },
}
```

Candidatos naturais a lazy loading: `ReportsPage` (se tiver gráficos pesados).

---

## 7. Como adicionar uma nova página

### Passo 1: Criar o componente da página

```tsx
// src/pages/purchases/PurchasesPage.tsx
import { Link } from 'react-router-dom'

export function PurchasesPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-bold">Compras</h1>
      <Link to="/">Voltar</Link>
    </div>
  )
}
```

### Passo 2: Registrar a rota em `src/router/index.tsx`

```tsx
import { PurchasesPage } from '@/pages/purchases/PurchasesPage'

// Adicionar em children da rota raiz:
{ path: 'purchases', element: <PurchasesPage /> }
```

### Passo 3: Navegar para a nova página

```tsx
<Link to="/purchases">Compras</Link>
```

---

## 8. Estrutura de arquivos

```
src/
├── main.tsx                          # Ponto de entrada — renderiza <App />
├── App.tsx                           # AuthSetup + RouterProvider + Toaster
├── router/
│   └── index.tsx                     # createBrowserRouter com todas as rotas
├── pages/
│   ├── home/HomePage.tsx             # /
│   ├── stock/StockPage.tsx           # /stock
│   ├── stock/NewProductPage.tsx      # /stock/new
│   ├── stock/ProductDetailPage.tsx   # /stock/:productId
│   ├── sales/NewSalePage.tsx         # /sales/new
│   ├── credit/CreditPage.tsx         # /credit
│   ├── credit/CustomerDetailPage.tsx # /credit/:customerId
│   ├── reports/ReportsPage.tsx       # /reports
│   ├── settings/SettingsPage.tsx     # /settings
│   └── auth/LoginPage.tsx            # /login
│   └── auth/SignUpPage.tsx           # /signup
└── components/layout/
    ├── AppShell.tsx                  # Layout raiz — <Outlet /> + BottomNav
    ├── BottomNav.tsx                 # Navegação inferior (mobile-first)
    └── ProtectedRoute.tsx            # Guard de autenticação
```

---

## 9. Resumo rápido

| Conceito              | O que faz                       | Onde usar                         |
| --------------------- | ------------------------------- | --------------------------------- |
| `createBrowserRouter` | Cria o router com as rotas      | `src/router/index.tsx` (uma vez)  |
| `RouterProvider`      | Conecta o router ao React       | `App.tsx` (uma vez)               |
| `Outlet`              | Renderiza a rota filha ativa    | `AppShell.tsx`                    |
| `ProtectedRoute`      | Guard de autenticação           | Rota raiz `/`                     |
| `element`             | Associa JSX à rota              | Todas as rotas do projeto         |
| `Link`                | Link declarativo (sem reload)   | Qualquer componente               |
| `useNavigate`         | Navegação programática          | Handlers de evento                |
| `Navigate`            | Redirect durante render         | `ProtectedRoute`, guards          |
| `useParams`           | Lê parâmetros da URL            | `ProductDetailPage`, `CustomerDetailPage` |
| `useMatch`            | Verifica se URL bate com padrão | `BottomNav` (item ativo)          |

---

## Referências

- [React Router — Modos (Data Mode)](https://reactrouter.com/start/modes)
- [React Router — Roteamento](https://reactrouter.com/start/data/routing)
- [React Router — Navigating](https://reactrouter.com/start/data/navigating)
- Boas práticas do projeto: `documents/tech/react-router-best-practices.md`
