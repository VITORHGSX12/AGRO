import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import fazendaRoutes from './routes/fazenda.js';
import piquetesRoutes from './routes/piquetes.js';
import animaisRoutes from './routes/animais.js';
import movimentacoesRoutes from './routes/movimentacoes.js';
import sanidadeRoutes from './routes/sanidade.js';
import financeiroRoutes from './routes/financeiro.js';
import dashboardRoutes from './routes/dashboard.js';
import arrendamentosRoutes from './routes/arrendamentos.js';
import funcionariosRoutes from './routes/funcionarios.js';
import folhaRoutes from './routes/folha.js';
import agricolaRoutes from './routes/agricola.js';
import patrimonioRoutes from './routes/patrimonio.js';
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import { checkRole } from './utils/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração estrita de CORS
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        // Permite requisições sem origin (como cURL, mobile apps ou ferramentas internas de teste)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error(`Origem [${origin}] não permitida pela política de CORS`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // Cache preflight por 24h
};

// Middlewares Globais de Segurança
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Headers de Proteção HTTP (Security Headers)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        environment: process.env.NODE_ENV || 'development',
        time: new Date().toISOString() 
    });
});

// 1. Rotas de Autenticação & Usuários
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

// 2. Módulo Financeiro (Restrito a 'dono' e 'contador' - 'gerente' é bloqueado)
app.use('/api/financeiro', checkRole(['dono', 'contador']), financeiroRoutes);

// 3. Dashboard (Acessível a todos os papéis)
app.use('/api/dashboard', checkRole(['dono', 'gerente', 'contador']), dashboardRoutes);

// 4. Módulos Operacionais (Acessíveis a 'dono' e 'gerente' - 'contador' bloqueado)
app.use('/api/fazenda', checkRole(['dono', 'gerente']), fazendaRoutes);
app.use('/api/piquetes', checkRole(['dono', 'gerente']), piquetesRoutes);
app.use('/api/animais', checkRole(['dono', 'gerente']), animaisRoutes);
app.use('/api/movimentacoes', checkRole(['dono', 'gerente']), movimentacoesRoutes);
app.use('/api/sanidade', checkRole(['dono', 'gerente']), sanidadeRoutes);
app.use('/api/arrendamentos', checkRole(['dono', 'gerente']), arrendamentosRoutes);
app.use('/api/funcionarios', checkRole(['dono', 'gerente']), funcionariosRoutes);
app.use('/api/folha', checkRole(['dono', 'gerente', 'contador']), folhaRoutes);
app.use('/api/agricola', checkRole(['dono', 'gerente']), agricolaRoutes);
app.use('/api/patrimonio', checkRole(['dono', 'gerente']), patrimonioRoutes);

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 AGRO Backend rodando na porta: ${PORT}`);
    console.log(`📡 URL da API: http://localhost:${PORT}/api`);
    console.log(`=============================================`);
});
