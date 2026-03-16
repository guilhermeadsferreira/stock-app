# Boas Práticas React

Documento de referência técnica para desenvolvimento com React no Stock App. Baseado na documentação oficial (react.dev) e em padrões consolidados da comunidade.

---

## 1. Componentes

### Single Responsibility

Cada componente deve ter uma responsabilidade clara e única. Se um componente cresce demais (>200 linhas ou múltiplas responsabilidades), extraia lógica para custom hooks ou subcomponentes.

```tsx
// Ruim: componente fazendo tudo
function StockPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  // ... 20+ estados e handlers
  return <div>...</div>
}

// Bom: lógica extraída em hooks
function StockPage() {
  const { products, loading } = useProducts()
  const { search, filtered } = useProductSearch(products)
  return <StockLayout>...</StockLayout>
}
```

### Composição sobre herança

Prefira composição (children, render props, slots) em vez de herança de classes ou HOCs complexos.

```tsx
// Bom: composição
function PageLayout({ children, footer }) {
  return (
    <div>
      <main>{children}</main>
      {footer && <footer>{footer}</footer>}
    </div>
  )
}
```

### Named exports

Use named exports para componentes e hooks. Facilita tree-shaking e refatoração.

```tsx
export function StockPage() { ... }
export function useProducts() { ... }
```

---

## 2. Hooks

### Rules of Hooks

- Chame hooks apenas no nível superior (não dentro de loops, condições ou funções aninhadas).
- Chame hooks apenas em componentes React ou custom hooks.

```tsx
// Ruim
if (condition) {
  const [state, setState] = useState(0)
}

// Bom
const [state, setState] = useState(0)
if (!condition) return null
```

### Custom hooks para lógica reutilizável

Extraia lógica com estado e efeitos para custom hooks. Nomes devem começar com `use`.

```tsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}
```

### useCallback e useMemo

Use para estabilidade referencial quando necessário:

- **useCallback**: funções passadas como props para filhos memoizados, ou em dependências de useEffect.
- **useMemo**: cálculos custosos ou objetos/arrays passados como props para filhos memoizados.

Não use por padrão em todo lugar — otimize apenas onde há re-renders desnecessários.

```tsx
const handleSave = useCallback(() => {
  createSale(cart, customerId)
}, [createSale, cart, customerId])

const summary = useMemo(
  () => ({ total: items.length, subtotal: calcTotal(items), hasCredit: !!customerId }),
  [items, customerId]
)
```

---

## 3. Estado

### Estado local vs global

- **Local**: estado que pertence a um único componente ou fluxo (ex: formulário, modal aberto).
- **Global**: estado compartilhado entre múltiplas telas (ex: progresso do usuário, autenticação).

Levante estado apenas quando necessário. Evite prop drilling excessivo — considere Context ou estado no router.

### useReducer para estado complexo

Quando há múltiplos subvalores ou transições interdependentes, `useReducer` pode ser mais legível que vários `useState`.

```tsx
function reducer(state, action) {
  switch (action.type) {
    case 'add_item':
      return { ...state, items: [...state.items, action.product] }
    case 'remove_item':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    default:
      return state
  }
}
const [cart, dispatch] = useReducer(reducer, { items: [] })
```

---

## 4. Performance

### Memoização seletiva

- `React.memo`: para componentes que recebem props estáveis e re-renderizam com frequência.
- Não memoize por padrão — meça antes de otimizar.

### Keys estáveis

Use IDs estáveis como `key`, nunca o índice do array (exceto em listas estáticas que não reordenam).

```tsx
// Ruim
{
  items.map((item, i) => <Row key={i} {...item} />)
}

// Bom
{
  items.map((item) => <Row key={item.id} {...item} />)
}
```

### Lazy loading de componentes

Use `React.lazy` e `Suspense` para rotas ou seções pesadas, reduzindo o bundle inicial.

```tsx
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
<Suspense fallback={<Loading />}>
  <ReportsPage />
</Suspense>
```

---

## 5. Padrões

### Error Boundaries

Envolva partes da árvore que podem falhar (ex: editor de código, integrações externas) em Error Boundaries para evitar que um erro quebre toda a aplicação.

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <BarcodeScannerPanel />
</ErrorBoundary>
```

### Render props vs hooks

Para lógica reutilizável, prefira custom hooks. Render props ainda são válidos para flexibilidade de UI.

### Compound Components

Componentes que funcionam em conjunto (ex: `Tabs`, `TabsList`, `Tab`, `TabPanel`) — use Context para compartilhar estado entre eles.

---

## 6. Anti-patterns

| Anti-pattern                   | Problema                                     | Solução                            |
| ------------------------------ | -------------------------------------------- | ---------------------------------- |
| Prop drilling excessivo        | Muitos níveis passando props                 | Context ou estado no router        |
| useEffect para estado derivado | Sincronização desnecessária                  | Calcule durante o render           |
| Index como key                 | Re-renders e bugs em listas dinâmicas        | Use ID estável                     |
| Link envolvendo Button         | Dois elementos focáveis, acessibilidade ruim | `Button asChild` com `Link` dentro |
| God component                  | Difícil de manter e testar                   | Extrair hooks e subcomponentes     |

---

## Referências

- [React.dev — Learn React](https://react.dev/learn)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
