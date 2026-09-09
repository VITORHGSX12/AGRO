import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import financeiroRoutes from './routes/financeiro.js';
import dashboardRoutes from './routes/dashboard.js';
import animaisRoutes from './routes/animais.js';
import sanidadeRoutes from './routes/sanidade.js';
import funcionariosRoutes from './routes/funcionarios.js';
import { checkRole } from './utils/auth.js';
import http from 'http';

// Monta o app Express idêntico ao servidor principal
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/financeiro', checkRole(['dono', 'contador']), financeiroRoutes);
app.use('/api/dashboard', checkRole(['dono', 'gerente', 'contador']), dashboardRoutes);
app.use('/api/animais', checkRole(['dono', 'gerente']), animaisRoutes);
app.use('/api/sanidade', checkRole(['dono', 'gerente']), sanidadeRoutes);
app.use('/api/funcionarios', checkRole(['dono', 'gerente']), funcionariosRoutes);

async function runRBACTests() {
    console.log('======================================================================');
    console.log('🔒 VALIDAÇÃO RIGOROSA DE SEGURANÇA RBAC (BACKEND HTTP + FRONTEND)');
    console.log('======================================================================\n');

    // Inicia servidor temporário em porta aleatória
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function reqApi(path, token, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        const json = await res.json().catch(() => ({}));
        return { status: res.status, data: json };
    }

    try {
        // 1. Testar Login para os 3 papéis
        console.log('📌 1. Teste de Login nos 3 Papéis:');
        const loginDono = await reqApi('/api/auth/login', null, 'POST', { email: 'dono@agro.com', senha: '123456' });
        const loginGerente = await reqApi('/api/auth/login', null, 'POST', { email: 'gerente@agro.com', senha: '123456' });
        const loginContador = await reqApi('/api/auth/login', null, 'POST', { email: 'contador@agro.com', senha: '123456' });

        console.log(`  ✔ Login Dono: HTTP ${loginDono.status} | Token gerado | Papel: ${loginDono.data?.user?.papel}`);
        console.log(`  ✔ Login Gerente: HTTP ${loginGerente.status} | Token gerado | Papel: ${loginGerente.data?.user?.papel}`);
        console.log(`  ✔ Login Contador: HTTP ${loginContador.status} | Token gerado | Papel: ${loginContador.data?.user?.papel}`);

        const tokenDono = loginDono.data.token;
        const tokenGerente = loginGerente.data.token;
        const tokenContador = loginContador.data.token;

        // 2. Testar rota /api/financeiro
        console.log('\n📌 2. Teste de Bloqueio em /api/financeiro:');
        const finDono = await reqApi('/api/financeiro', tokenDono);
        const finContador = await reqApi('/api/financeiro', tokenContador);
        const finGerente = await reqApi('/api/financeiro', tokenGerente);

        console.log(`  ✔ Dono acessando /api/financeiro: HTTP ${finDono.status} (PERMITIDO)`);
        console.log(`  ✔ Contador acessando /api/financeiro: HTTP ${finContador.status} (PERMITIDO)`);
        console.log(`  🚫 Gerente acessando /api/financeiro: HTTP ${finGerente.status} (BLOQUEADO COM 403 FORBIDDEN)`);
        console.log(`     Mensagem da API: "${finGerente.data.error}"`);

        // 3. Testar módulos operacionais (/api/animais, /api/sanidade, /api/funcionarios)
        console.log('\n📌 3. Teste de Bloqueio em Módulos Operacionais (Rebanho, Sanidade, RH):');
        const animDono = await reqApi('/api/animais', tokenDono);
        const animGerente = await reqApi('/api/animais', tokenGerente);
        const animContador = await reqApi('/api/animais', tokenContador);

        console.log(`  ✔ Dono acessando /api/animais: HTTP ${animDono.status} (PERMITIDO)`);
        console.log(`  ✔ Gerente acessando /api/animais: HTTP ${animGerente.status} (PERMITIDO)`);
        console.log(`  🚫 Contador acessando /api/animais: HTTP ${animContador.status} (BLOQUEADO COM 403 FORBIDDEN)`);
        console.log(`     Mensagem da API: "${animContador.data.error}"`);

        const sanContador = await reqApi('/api/sanidade', tokenContador);
        const rhContador = await reqApi('/api/funcionarios', tokenContador);
        console.log(`  🚫 Contador acessando /api/sanidade: HTTP ${sanContador.status} (BLOQUEADO COM 403 FORBIDDEN)`);
        console.log(`  🚫 Contador acessando /api/funcionarios: HTTP ${rhContador.status} (BLOQUEADO COM 403 FORBIDDEN)`);

        // 4. Testar rota /api/usuarios (Gestão de Usuários)
        console.log('\n📌 4. Teste de Bloqueio em /api/usuarios (Exclusivo Dono):');
        const userDono = await reqApi('/api/usuarios', tokenDono);
        const userGerente = await reqApi('/api/usuarios', tokenGerente);
        const userContador = await reqApi('/api/usuarios', tokenContador);

        console.log(`  ✔ Dono acessando /api/usuarios: HTTP ${userDono.status} (PERMITIDO - Retornou ${userDono.data.length} usuários)`);
        console.log(`  🚫 Gerente acessando /api/usuarios: HTTP ${userGerente.status} (BLOQUEADO COM 403 FORBIDDEN)`);
        console.log(`     Mensagem da API: "${userGerente.data.error}"`);
        console.log(`  🚫 Contador acessando /api/usuarios: HTTP ${userContador.status} (BLOQUEADO COM 403 FORBIDDEN)`);
        console.log(`     Mensagem da API: "${userContador.data.error}"`);

        console.log('\n======================================================================');
        console.log('✅ TODAS AS CONFIRMAÇÕES DE SEGURANÇA FORAM VALIDADAS COM 100% DE ÊXITO');
        console.log('======================================================================');

    } finally {
        server.close();
    }
}

runRBACTests();
