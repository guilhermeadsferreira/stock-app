# Boas Práticas React Router v7

Documento de referência técnica para uso do React Router no Stock App. Baseado na documentação oficial (reactrouter.com) e nas convenções do React Router v7.

---

## 1. Pacote e imports

### Pacote canônico

Este projeto usa `react-router-dom`. Mantenha essa consistência — não misture com `react-router`.

```tsx
// Correto — use sempre este pacote neste projeto
import { createBrowserRouter, RouterProvider, Link, useParams, Outlet } from 'react-router-dom'

// Evitar — não misturar pacotes
import { Link } from 'react-router'
```

---

## 2. Data Mode (createBrowserRouter)

O Data Mode usa `createBrowserRouter` e `RouterProvider`, com configuração de rotas fora da árvore React.

```tsx
// src/router/index.tsx
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'stock', element: <StockPage /> },
      { path: 'stock/:productId', element: <ProductDetailPage /> },
      // ...
    ],
  },
])
```

### `element` vs `Component`

O projeto usa `element` (JSX) por padrão. Use `Component` (referência da função) quando adotar `lazy`:

```tsx
// Padrão do projeto — use element
{ path: 'stock', element: <StockPage /> }

// Com lazy loading — use Component
{
  path: 'reports',
  lazy: async () => {
    const { ReportsPage } = await import('./pages/reports/ReportsPage')
    return { Component: ReportsPage }
  },
}
```

---

## 3. ProtectedRoute

Toda rota autenticada deve estar sob `ProtectedRoute`. Nunca adicione uma nova página autenticada fora do bloco `children` da rota raiz:

```tsx
// Correto — dentro do ProtectedRoute via children
{ path: 'nova-pagina', element: <NovaPagina /> }

// Errado — rota solta sem proteção
{ path: '/nova-pagina', element: <NovaPagina /> }
```

---

## 4. Error handling

### errorElement

Defina `errorElement` na rota raiz para capturar erros de renderização:

```tsx
{
  path: '/',
  element: <ProtectedRoute><AppShell /></ProtectedRoute>,
  errorElement: <ErrorPage />,
  children: [...]
}
```

### useRouteError

```tsx
import { useRouteError } from 'react-router-dom'

function ErrorPage() {
  const error = useRouteError() as Error | undefined
  return <p>{error?.message ?? 'Algo deu errado'}</p>
}
```

---

## 5. Lazy loading

Use a propriedade `lazy` do Data Mode para code splitting. Não precisa de `React.lazy` nem `Suspense`:

```tsx
{
  path: 'reports',
  lazy: async () => {
    const { ReportsPage } = await import('./pages/reports/ReportsPage')
    return { Component: ReportsPage }
  },
}
```

O router aguarda o módulo carregar antes de transicionar — a página anterior continua visível durante o carregamento.

---

## 6. Layout routes e Outlet

O `AppShell` usa `Outlet` para renderizar o conteúdo filho:

```tsx
import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

---

## 7. Navegação

### Link

```tsx
<Link to="/stock">Estoque</Link>
<Link to={`/stock/${productId}`}>Detalhes</Link>
```

### useNavigate

Para navegação após ações (submit, exclusão, etc.):

```tsx
const navigate = useNavigate()
navigate('/stock')       // ir para estoque
navigate(-1)             // voltar uma página
```

### Navigate

Para redirecionamentos condicionais durante o render:

```tsx
if (!session) return <Navigate to="/login" replace />
```

### useMatch

Para verificar rota ativa (ex: BottomNav):

```tsx
const stockMatch = useMatch('/stock/*')
const showSidebar = !!stockMatch
```

Prefira `useMatch` em vez de `location.pathname.includes(...)`.

---

## 8. Parâmetros e dados

### useParams

```tsx
const { productId } = useParams<{ productId: string }>()
const { customerId } = useParams<{ customerId: string }>()
```

### Loaders (não utilizados atualmente)

O projeto busca dados via hooks Zustand/Supabase nos próprios componentes. Loaders do React Router são opcionais e podem ser adotados no futuro para prefetch.

---

## 9. Checklist

| Item            | Descrição                                                              |
| --------------- | ---------------------------------------------------------------------- |
| Imports         | Usar `react-router-dom` (não `react-router`)                           |
| Rotas protegidas | Sempre dentro de `children` da rota raiz com `ProtectedRoute`         |
| errorElement    | Definido na rota raiz                                                  |
| useMatch        | Em vez de `pathname.includes` para detecção de rota ativa (BottomNav) |
| Link + Button   | Usar `Button asChild` com `Link` dentro                                |
| useParams type  | Sempre tipar: `useParams<{ id: string }>()`                            |

---

## Referências

- [React Router — Start](https://reactrouter.com/start)
- [React Router — Data Mode](https://reactrouter.com/start/modes)
- [React Router — Error Handling](https://reactrouter.com/route/error-element)
- Guia para iniciantes: `documents/tech/react-router-guideline.md`
