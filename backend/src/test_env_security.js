import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { signToken, verifyToken } from './utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEnvSecurityTests() {
    console.log('================================================================');
    console.log('🛡️ TESTES DE SEGURANÇA DE VARIÁVEIS DE AMBIENTE (FASE 4 - ETAPA 2)');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(cond, desc) {
        if (cond) {
            console.log(`  [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${desc}`);
            failed++;
        }
    }

    try {
        // 1. Verificar se .env.example existe e não contém segredos reais
        const envExamplePath = path.resolve(__dirname, '../.env.example');
        const envExampleExists = fs.existsSync(envExamplePath);
        assert(envExampleExists, 'Arquivo backend/.env.example existe');

        const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
        assert(envExampleContent.includes('JWT_SECRET=') && !envExampleContent.includes('e4f9b872c6104a3e'), 'backend/.env.example não expõe o segredo real de desenvolvimento/produção');

        // 2. Verificar se .gitignore na raiz bloqueia .env e *.db
        const rootGitignorePath = path.resolve(__dirname, '../../.gitignore');
        const rootGitignoreContent = fs.readFileSync(rootGitignorePath, 'utf8');
        assert(rootGitignoreContent.includes('.env'), 'Raiz .gitignore protege arquivos .env');
        assert(rootGitignoreContent.includes('*.db'), 'Raiz .gitignore protege bancos de dados locais (*.db)');

        // 3. Testar assinatura e validação com o JWT_SECRET do .env
        const testPayload = { id: 99, email: 'admin@agro.com', papel: 'dono' };
        const token = signToken(testPayload, 3600);
        assert(typeof token === 'string' && token.split('.').length === 3, 'Token JWT emitido com sucesso utilizando JWT_SECRET do ambiente');

        const decoded = verifyToken(token);
        assert(decoded && decoded.email === 'admin@agro.com' && decoded.papel === 'dono', 'Token JWT decodificado e validado com sucesso');

        // 4. Testar rejeição de token assinado com chave diferente
        const fakeTokenParts = token.split('.');
        fakeTokenParts[2] = 'assinatura_invalida_gerada_com_outro_segredo';
        const corruptedToken = fakeTokenParts.join('.');
        assert(verifyToken(corruptedToken) === null, 'Token assinado com chave incompatível ou corrompido é sumariamente rejeitado');

    } catch (err) {
        console.error('Erro na execução dos testes de ambiente:', err);
        failed++;
    }

    console.log('\n================================================================');
    console.log(` RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('================================================================\n');
}

runEnvSecurityTests();
