# 🌱 AGRO SaaS — Sistema Completo de Gestão de Fazendas

Sistema SaaS completo para gestão agropecuária e pecuária, contemplando controle de rebanho individualizado, histórico de movimentações, rotação e arrendamento de pastagens, controle sanitário preventivo com alertas de vencimento, lavoura e safras agrícolas, patrimônio e maquinários com depreciação linear, gestão de RH e folha de pagamento com quitação automática, controle de permissões de acesso (RBAC), exportação para Excel/CSV e dashboard executivo.

---

## 🛠️ Stack Tecnológica

- **Backend:** Node.js (ES Modules), Express, Better-SQLite3 (Dev Local), pg (PostgreSQL Client para Produção).
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React (Ícones), Recharts (Gráficos).
- **Segurança:** Autenticação JWT (RFC 7519), Hash PBKDF2 com Salt de 16 bytes e comparação por tempo constante (`crypto.timingSafeEqual`), RBAC estrito (`dono`, `gerente`, `contador`).
- **Banco de Dados:**
  - **Desenvolvimento Local:** SQLite (`agro.db`, inicialização automática sem setup de servidor).
  - **Produção (Cloud):** PostgreSQL 14+ via `DATABASE_URL` com pool de conexões e SSL gerenciado.

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Iniciar o Backend
```bash
cd backend
npm install
npm run dev
```
O servidor da API iniciará em `http://localhost:3001` e o banco de dados `agro.db` será criado/atualizado automaticamente.

### 2. Iniciar o Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:5173`

---

## 🐘 Configuração para Produção com PostgreSQL

Para hospedar o backend em serviços gerenciados (como **Railway, Render, Fly.io, Neon ou Supabase**):

1. **Defina a variável `DATABASE_URL` no seu painel de hospedagem:**
   ```env
   DATABASE_URL=postgresql://usuario:senha@seu-host.cloud:5432/agro_db?sslmode=require
   ```
2. **Defina a chave de segurança JWT:**
   ```env
   JWT_SECRET=sua_chave_secreta_longa_com_64_caracteres_gerada_aleatoriamente
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://seu-frontend.vercel.app
   ```
3. **Inicialização do Schema no PostgreSQL:**
   O schema PostgreSQL de produção está pronto em [`backend/src/db/schema_postgres.sql`](file:///c:/Users/Alleg/OneDrive/Área%20de%20Trabalho/AGRO/backend/src/db/schema_postgres.sql) e inclui todas as 17 tabelas, constraints de integridade referencial, regras de autoincremento via `SERIAL` e índices de performance.

---

## 📋 Módulos & Recursos Implementados

1. **Dashboard Geral:**
   - Total de cabeças ativas, saldo financeiro do mês, custo médio por cabeça e total de folha de pagamento.
   - Produtividade agrícola da última safra colhida (sacas/ha) e ocupação dos pastos.
   - Alertas visuais em tempo real de vacinas vencidas ou a vencer em 7 dias.

2. **Rebanho:**
   - Lista detalhada de animais com brinco único por fazenda, sexo, raça, categoria, peso e pasto alocado.
   - Paginação reutilizável e busca textual instantânea.

3. **Movimentações:**
   - Registro de Compra, Venda, Morte e Transferência com snapshot histórico de nomes de piquete.
   - Automações de status e fluxo financeiro integrado.

4. **Pastagens & Arrendamentos:**
   - Piquetes com taxa de lotação e capacidade de suporte em cabeças.
   - Linha do tempo de rotação de pastagem automática.
   - Contratos de arrendamento (pago / recebido) com integração financeira.

5. **Lavoura, Safras & Insumos (Agrícola):**
   - Cadastro de talhões e safras com cálculo automático de produtividade (kg e sc/ha).
   - Insumos agrícolas gerando despesa e venda de safra colhida gerando receita.

6. **Patrimônio, Máquinas & Benfeitorias:**
   - Cadastro de currais, sedes, cercas, tratores e implementos.
   - Cálculo de Depreciação Linear Simples (anual e mensal) por bem e consolidado.
   - Registro de manutenções preventivas/corretivas com despesa financeira automática.

7. **Equipe, RH & Folha de Pagamento:**
   - Cadastro de colaboradores (Fixos e Diaristas) e moradia na fazenda.
   - Folha de pagamento mensal com quitação individual e em lote.

8. **Controle de Acesso & Multiusuário (RBAC):**
   - Papéis estritos: `dono` (acesso irrestrito), `gerente` (operacional liberado, financeiro bloqueado) e `contador` (financeiro liberado, operacional bloqueado).
   - Bloqueio real com **HTTP 403 Forbidden** no middleware do Express.

9. **Polimento & Exportação:**
   - Exportação de lançamentos financeiros para **CSV (compatível com Excel em UTF-8 com BOM)**.
   - Paginação em todas as tabelas e menu drawer mobile para uso no campo.
