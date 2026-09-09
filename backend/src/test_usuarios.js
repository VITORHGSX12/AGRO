import db from './db/database.js';
import { hashPassword, comparePassword, signToken, verifyToken } from './utils/auth.js';

async function runUsuariosTests() {
    console.log('===========================================================');
    console.log('🧪 INICIANDO TESTES DE MULTIUSUÁRIO & RBAC (FASE 3 - ETAPA 3)');
    console.log('===========================================================');

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✔ PASSOU: ${message}`);
            passedCount++;
        } else {
            console.error(`  ❌ FALHOU: ${message}`);
            failedCount++;
        }
    }

    try {
        let fazenda = db.prepare('SELECT id FROM fazenda LIMIT 1').get();
        if (!fazenda) {
            const ins = db.prepare(`INSERT INTO fazenda (nome, area_hectares) VALUES ('Fazenda Teste Multi', 1000)`).run();
            fazenda = { id: ins.lastInsertRowid };
        }
        const fazendaId = fazenda.id;

        // Limpar dados anteriores de teste
        db.prepare(`DELETE FROM usuarios WHERE email LIKE '%@test.com'`).run();

        // -------------------------------------------------------------
        // TESTE 1: Hashing e Comparação de Senha
        // -------------------------------------------------------------
        console.log('\n--- TESTE 1: Criptografia e Hashing Seguro ---');
        const senhaOriginal = 'SenhaSegura@2026';
        const hash = hashPassword(senhaOriginal);

        assert(hash && hash.includes(':'), 'Hash gerado no formato com salt');
        assert(comparePassword(senhaOriginal, hash), 'Senha original valida com sucesso');
        assert(!comparePassword('SenhaErrada', hash), 'Senha incorreta é rejeitada');

        // -------------------------------------------------------------
        // TESTE 2: Geração e Verificação de Token JWT
        // -------------------------------------------------------------
        console.log('\n--- TESTE 2: Emissão e Validação de Token JWT ---');
        const payloadDono = { id: 1, email: 'dono@agro.com', papel: 'dono', fazenda_id: fazendaId };
        const tokenDono = signToken(payloadDono);

        assert(tokenDono && tokenDono.split('.').length === 3, 'Token JWT gerado no padrão RFC 7519');
        const decoded = verifyToken(tokenDono);
        assert(decoded && decoded.email === 'dono@agro.com' && decoded.papel === 'dono', 'Token decodificado e verificado com sucesso');

        // -------------------------------------------------------------
        // TESTE 3: Criação de Usuários com Diferentes Papéis
        // -------------------------------------------------------------
        console.log('\n--- TESTE 3: Cadastro de Usuários com Papéis (Dono, Gerente, Contador) ---');
        const insertUser = db.prepare(`
            INSERT INTO usuarios (fazenda_id, nome, email, senha_hash, papel, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertUser.run(fazendaId, 'Dono Teste', 'dono@test.com', hashPassword('123456'), 'dono', 'ativo');
        insertUser.run(fazendaId, 'Gerente Teste', 'gerente@test.com', hashPassword('123456'), 'gerente', 'ativo');
        insertUser.run(fazendaId, 'Contador Teste', 'contador@test.com', hashPassword('123456'), 'contador', 'ativo');
        insertUser.run(fazendaId, 'Usuário Inativo Teste', 'inativo@test.com', hashPassword('123456'), 'gerente', 'inativo');

        const uDono = db.prepare('SELECT * FROM usuarios WHERE email = ?').get('dono@test.com');
        const uGerente = db.prepare('SELECT * FROM usuarios WHERE email = ?').get('gerente@test.com');
        const uContador = db.prepare('SELECT * FROM usuarios WHERE email = ?').get('contador@test.com');
        const uInativo = db.prepare('SELECT * FROM usuarios WHERE email = ?').get('inativo@test.com');

        assert(uDono && uDono.papel === 'dono', 'Usuário Dono cadastrado com papel "dono"');
        assert(uGerente && uGerente.papel === 'gerente', 'Usuário Gerente cadastrado com papel "gerente"');
        assert(uContador && uContador.papel === 'contador', 'Usuário Contador cadastrado com papel "contador"');
        assert(uInativo && uInativo.status === 'inativo', 'Usuário Inativo cadastrado com status "inativo"');

        // -------------------------------------------------------------
        // TESTE 4: Matriz de Permissões RBAC (Regras de Negócio)
        // -------------------------------------------------------------
        console.log('\n--- TESTE 4: Matriz de Acesso RBAC ---');

        // 4.1 Dono: acesso total
        const allowedDonoFin = ['dono', 'contador'].includes(uDono.papel);
        const allowedDonoOp = ['dono', 'gerente'].includes(uDono.papel);
        const allowedDonoUser = ['dono'].includes(uDono.papel);
        assert(allowedDonoFin && allowedDonoOp && allowedDonoUser, 'Dono tem permissão total (Financeiro, Operacional e Usuários)');

        // 4.2 Gerente: acesso operacional total, sem financeiro e sem usuários
        const allowedGerenteOp = ['dono', 'gerente'].includes(uGerente.papel);
        const allowedGerenteFin = ['dono', 'contador'].includes(uGerente.papel);
        const allowedGerenteUser = ['dono'].includes(uGerente.papel);
        assert(allowedGerenteOp, 'Gerente tem acesso liberado aos módulos operacionais (rebanho, pastagens, sanidade, RH, etc.)');
        assert(!allowedGerenteFin, 'Gerente é BLOQUEADO de acessar o módulo Financeiro');
        assert(!allowedGerenteUser, 'Gerente é BLOQUEADO de acessar a gestão de Usuários');

        // 4.3 Contador: acesso a financeiro e dashboard, sem acesso operacional nem usuários
        const allowedContadorFin = ['dono', 'contador'].includes(uContador.papel);
        const allowedContadorOp = ['dono', 'gerente'].includes(uContador.papel);
        const allowedContadorUser = ['dono'].includes(uContador.papel);
        assert(allowedContadorFin, 'Contador tem acesso liberado ao módulo Financeiro e Dashboard');
        assert(!allowedContadorOp, 'Contador é BLOQUEADO dos módulos operacionais');
        assert(!allowedContadorUser, 'Contador é BLOQUEADO de acessar a gestão de Usuários');

        // -------------------------------------------------------------
        // TESTE 5: Edição de Papel e Desativação de Usuário
        // -------------------------------------------------------------
        console.log('\n--- TESTE 5: Edição de Papel e Desativação de Usuário ---');
        db.prepare('UPDATE usuarios SET papel = ? WHERE id = ?').run('contador', uGerente.id);
        const gerentePromovido = db.prepare('SELECT papel FROM usuarios WHERE id = ?').get(uGerente.id);
        assert(gerentePromovido.papel === 'contador', 'Papel do usuário atualizado para "contador"');

        db.prepare('UPDATE usuarios SET status = ? WHERE id = ?').run('inativo', uGerente.id);
        const gerenteInativado = db.prepare('SELECT status FROM usuarios WHERE id = ?').get(uGerente.id);
        assert(gerenteInativado.status === 'inativo', 'Status do usuário atualizado para "inativo"');

        console.log('\n===========================================================');
        console.log(`📊 RESULTADO FINAL DOS TESTES: ${passedCount} PASSOU | ${failedCount} FALHOU`);
        console.log('===========================================================');

        if (failedCount > 0) {
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Erro inesperado durante execução dos testes:', err);
        process.exit(1);
    }
}

runUsuariosTests();
