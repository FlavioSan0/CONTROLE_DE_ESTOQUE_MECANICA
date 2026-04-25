# Controle de Estoque Mecânica

Sistema web de controle de estoque desenvolvido para operação de oficina mecânica, com foco em cadastro de produtos, entradas, saídas, movimentações, usuários e autenticação com primeiro acesso.

## Objetivo

Organizar o controle de estoque da oficina de forma prática, permitindo:

- cadastro e gerenciamento de produtos
- registro de entradas e saídas
- acompanhamento de movimentações
- controle de usuários do sistema
- fluxo de primeiro acesso com troca obrigatória de senha

---

## Tecnologias utilizadas

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- TypeScript

### Banco de dados / autenticação
- Supabase
- PostgreSQL
- Supabase Auth

---

## Estrutura do projeto

```bash
CONTROLE_DE_ESTOQUE/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
