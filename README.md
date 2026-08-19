# TaskFlow

Aplicação de produtividade e gestão de tarefas — Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + Supabase.

## Estado atual: Fase 1 concluída + parte da Fase 2

- ✅ Estrutura do projeto, configuração, Tailwind, tipos
- ✅ Supabase: esquema completo, RLS, triggers
- ✅ Autenticação completa (registo, login, logout, recuperação/alteração de password, proteção de rotas)
- ✅ Layout principal: Sidebar (desktop), navegação inferior (mobile), topbar, dark/light/system mode
- ✅ Dashboard com dados reais (tarefas hoje/atrasadas/próximas, taxa de conclusão, gráfico de produtividade semanal)
- ✅ Inbox com criação rápida de tarefas (parser de linguagem natural: `#etiqueta`, `!prioridade`, "amanhã às 14h")
- ✅ Página "Hoje" com tarefas agrupadas por período do dia
- ✅ Perfil (nome, fuso horário, notificações, tema)
- ✅ **Maturidade da Equipa** — módulo M1–M4: agentes, critérios ponderados, avaliação com plano de desenvolvimento, gráfico de evolução e histórico completo
- 🚧 Projetos, Etiquetas, Calendário, Recorrência, Hábitos, Pomodoro, Estatísticas — placeholders "Chega na Fase X", a implementar nas fases seguintes conforme o plano combinado

## Como correr localmente

1. Cria um projeto em supabase.com
2. No SQL Editor do Supabase, corre **por ordem** o conteúdo de:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_team_maturity.sql`
3. Copia `.env.local.example` para `.env.local` e preenche com o URL e a chave anónima do teu projeto (Project Settings -> API)
4. Instala as dependências e arranca o servidor:

```bash
npm install
npm run dev
```

5. Abre http://localhost:3000 — serás redirecionado para /registo

## Arquitetura

```
/app            Rotas (App Router), agrupadas em (auth) e (app)
/components     Componentes React, organizados por domínio (ui, layout, tasks, auth, dashboard, profile)
/lib            Clientes Supabase, utilitários, navegação, validações Zod
/services       Camada de acesso a dados (isola componentes da API concreta do Supabase)
/types          Tipos TypeScript que espelham o esquema da base de dados
/utils          Funções puras (ex: parser de tarefas rápidas)
/supabase       Migrações SQL
```

## Notas de segurança

- Row Level Security ativo em todas as tabelas — cada utilizador só acede aos seus próprios dados
- A chave anon é pública por natureza (protegida pelo RLS); a service_role nunca é usada no frontend
- Middleware (`middleware.ts`) protege todas as rotas privadas no servidor, não apenas no cliente

## Próximos passos (Fase 2 em diante)

Ver `supabase/migrations/0001_init.sql` para o modelo de dados completo, já preparado para: subtarefas, etiquetas N:N, recorrência (jsonb), lembretes, hábitos com sequência de dias, sessões Pomodoro associadas a tarefas, e notificações — para que as fases seguintes não exijam alterações estruturais à base de dados.
