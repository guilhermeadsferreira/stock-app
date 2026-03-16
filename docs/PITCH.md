# Pitch — StockApp

## O Problema

Pequenos comerciantes (mercearias, farmácias, cosméticos, pet shops) ainda controlam estoque em caderninho ou planilha. O resultado: mercadoria vencida na prateleira, ruptura de estoque sem aviso, fiado que nunca é cobrado e zero visibilidade de quanto dinheiro está parado em produto.

## A Solução

**StockApp** é um sistema de gestão de estoque e vendas 100% mobile, pensado para quem atende balcão. Em menos de 30 segundos, o vendedor registra uma venda passando o código de barras, vê o estoque atualizar em tempo real e ainda controla o fiado do cliente — tudo no celular, sem papel.

## Para Quem

Dono de pequeno comércio que:
- Tem entre 20 e 500 SKUs ativos
- Vende à vista e a prazo (fiado)
- Precisa saber o que está acabando antes de perder a venda
- Não quer (ou não consegue) pagar por um ERP caro

## Diferenciais

| Funcionalidade | StockApp | Caderninho | Planilha |
|---|---|---|---|
| Scanner de código de barras | ✅ | ❌ | ❌ |
| Alerta de estoque baixo | ✅ | ❌ | Manual |
| Alerta de vencimento | ✅ | ❌ | Manual |
| Controle de fiado por cliente | ✅ | ✅ | Difícil |
| Histórico de movimentações | ✅ | ❌ | ❌ |
| Relatório de rentabilidade | ✅ | ❌ | Parcial |
| Funciona no celular | ✅ | ✅ | ❌ |

## Como Funciona

1. **Cadastra o produto** — nome, código de barras, preço de custo e venda, validade
2. **Dá entrada no estoque** — quantidade inicial ou reposição
3. **Registra a venda** — escaneia o código, define a quantidade, escolhe à vista ou fiado
4. **Acompanha** — dashboard mostra estoque crítico, produtos vencendo, vendas do dia e fiado em aberto

## Números do Produto (hoje)

- 10 telas funcionais
- Cadastro completo de produtos com scanner
- Controle de movimentações com log auditável
- Gestão de fiado com histórico por cliente
- Relatórios por dia, semana e mês
- Zero configuração de servidor — cloud-native (Supabase)

## Modelo de Negócio (visão)

SaaS com plano gratuito (até X SKUs) e plano pago com relatórios avançados, exportação e múltiplos usuários. Custo de infraestrutura marginal por usuário — escala horizontal.

## Stack

React 19 + TypeScript + Supabase + PWA — roda direto no navegador mobile, sem instalação.
