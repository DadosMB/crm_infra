
# CRM Infra MenuBrands

Sistema inteligente de gestão de Ordens de Serviço (OS), Finanças e Patrimônio, desenvolvido para otimizar a infraestrutura operacional da MenuBrands.

## Tecnologias Utilizadas

- **Frontend Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS (Dark Mode Support)
- **Icons**: Lucide React
- **Charts**: Recharts (Otimizado para performance)
- **Language**: TypeScript (Strict Mode)

## Funcionalidades Principais

1.  **Dashboard Executivo**: KPIs em tempo real, gráficos de volume e financeiros.
2.  **Kanban de OS**: Gestão visual de chamados (Aberta, Em Análise, Em Progresso, Encerrada).
3.  **Gestão Financeira**: Controle de despesas por centro de custo (Unidades), categorias e fluxo de aprovação.
4.  **Patrimônio (Ativos)**: Inventário completo, controle de garantia e histórico de manutenção externa.
5.  **Relatórios**: Exportação de dados (CSV/PDF) e análise histórica.
6.  **Tarefas Pessoais**: Organizador individual integrado às OS.

---

# Guia de Implementação Back-end (AntiGravity)

Este documento serve como especificação técnica para a implementação do back-end utilizando o padrão **AntiGravity** (ou framework equivalente sugerido pela equipe de engenharia).

## 1. Arquitetura de Dados (Schemas Sugeridos)

O sistema opera com 5 entidades principais. Abaixo, a estrutura sugerida para Banco de Dados Relacional (PostgreSQL) ou NoSQL (Mongo/DynamoDB).

### Users (Usuários)
Responsável por autenticação e RBAC (Role-Based Access Control).
```json
{
  "id": "UUID",
  "name": "String",
  "email": "String (Unique)",
  "role": "String", // Ex: 'Gerente', 'Assistente'
  "isAdmin": "Boolean",
  "avatarUrl": "String (URL)",
  "passwordHash": "String" // Nunca salvar plain-text
}
```

### ServiceOrders (Ordens de Serviço)
O núcleo do sistema.
```json
{
  "id": "String (PK - Ex: OS-26001)",
  "title": "String",
  "description": "String (Text)",
  "unit": "Enum (Aldeota, Parquelândia, etc)",
  "status": "Enum (Aberta, Em Andamento, Concluída...)",
  "priority": "Enum (Alta, Media, Baixa)",
  "type": "Enum (Preventiva, Corretiva...)",
  "ownerId": "UUID (FK -> Users)",
  "dateOpened": "Datetime",
  "dateClosed": "Datetime (Nullable)",
  "archived": "Boolean (Default: false)",
  "history": [ // Sub-collection ou Tabela Relacional 1:N
    { "date": "Datetime", "message": "String", "userId": "UUID" }
  ]
}
```

### Expenses (Financeiro)
Transações financeiras vinculadas ou não a uma OS.
```json
{
  "id": "String (PK - Ex: FIN-001)",
  "item": "String",
  "value": "Decimal(10,2)",
  "date": "Date",
  "category": "Enum (Peças, Mão de Obra...)",
  "unit": "Enum",
  "supplier": "String", // Pode ser FK se normalizar Suppliers
  "status": "Enum (Pendente, Programado, Pago)",
  "paymentMethod": "Enum (Pix, Boleto...)",
  "linkedOSId": "String (FK -> ServiceOrders, Nullable)",
  "attachments": ["URL Strings"]
}
```

### Assets (Patrimônio)
Inventário de equipamentos.
```json
{
  "id": "String (PK)",
  "assetTag": "String (Unique - Ex: MB-TI-001)",
  "name": "String",
  "category": "String", // Ex: TI, Cozinha
  "unit": "Enum",
  "status": "Enum (Ativo, Em Manutenção, Baixado)",
  "value": "Decimal(10,2)",
  "warrantyEndDate": "Date",
  "photoUrl": "String (URL)"
}
```

## 2. API Endpoints (RESTful)

### Autenticação
*   `POST /api/auth/login`: Retorna JWT Token + User Object.

### Ordens de Serviço (OS)
*   `GET /api/orders`: Listar todas (Filtrar por `archived=false` por padrão).
    *   *Params*: `unit`, `status`, `ownerId`.
*   `POST /api/orders`: Criar nova OS.
*   `PUT /api/orders/:id`: Atualizar status/detalhes.
    *   *Regra*: Ao mudar status para `CONCLUIDA`, exigir `dateClosed` se não enviado.
*   `POST /api/orders/:id/log`: Adicionar mensagem ao histórico.

### Financeiro
*   `GET /api/expenses`: Listar despesas.
    *   *Params*: `month`, `year`, `unit`.
*   `POST /api/expenses`: Registrar gasto.
*   `DELETE /api/expenses/:id`: (Admin Only).

### Patrimônio
*   `GET /api/assets`: Inventário.
*   `POST /api/assets/maintenance`: Registrar saída de bem (Cria registro em tabela `MaintenanceRecords`).
*   `PUT /api/assets/:id/return`: Registrar retorno de manutenção.

## 3. Regras de Negócio (Backend Implementation)

1.  **Imutabilidade de Histórico**: Registros no array `history` da OS nunca devem ser deletados, apenas anexados.
2.  **Arquivamento**:
    *   OS só pode ser arquivada se `status === 'Concluída' | 'Cancelada'`.
    *   Ao arquivar, a OS sai do Kanban e vai para "Relatórios".
3.  **Segurança**:
    *   `DELETE` em Financeiro e Usuários restrito a `isAdmin: true`.
    *   Usuários normais veem apenas suas OS no Kanban (exceto se `isAdmin`).
4.  **Performance**:
    *   Implementar paginação (`limit`, `offset`) nas rotas `GET /orders` e `GET /expenses` para evitar carga excessiva em mobile.

## 4. Integração AntiGravity

Utilize o padrão **AntiGravity** para abstrair a camada de persistência. Certifique-se de que os *Controllers* recebam os DTOs validados (via Zod/Yup) idênticos às interfaces do `types.ts` do front-end.

---

**Desenvolvido por Vitor Hortêncio** - 2026
