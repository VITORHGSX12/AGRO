import http from 'http';

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : null;
                    resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, data: body });
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runAuthSecurityTests() {
    console.log('================================================================');
    console.log('🔒 TESTES DE SEGURANÇA DE AUTENTICAÇÃO (FASE 4 - ETAPA 1)');
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
        // 1. Sem email
        const r1 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { senha: '123' });
        assert(r1.statusCode === 400, 'Tentativa de login sem e-mail rejeitada com 400 Bad Request');

        // 2. Sem senha
        const r2 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'dono@agro.com' });
        assert(r2.statusCode === 400, 'Tentativa de login sem senha rejeitada com 400 Bad Request');

        // 3. E-mail inexistente
        const r3 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'fantasma@agro.com', senha: '123' });
        assert(r3.statusCode === 401, 'Tentativa de login com e-mail inexistente rejeitada com 401 Unauthorized');

        // 4. Senha incorreta (teste timingSafeEqual / hash)
        const r4 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'dono@agro.com', senha: 'SENHA_ERRADA_123' });
        assert(r4.statusCode === 401, 'Tentativa de login com senha incorreta rejeitada com 401 Unauthorized');

        // 5. Tentativa de bypass sem token em rota protegida
        const r5 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/me',
            method: 'GET'
        });
        assert(r5.statusCode === 401, 'Acesso a rota autenticada sem token rejeitado com 401 Unauthorized');

        // 6. Tentativa com token forjado / fake
        const r6 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/me',
            method: 'GET',
            headers: { 'Authorization': 'Bearer token_forjado_fake_jwt_123456' }
        });
        assert(r6.statusCode === 401, 'Acesso com token forjado rejeitado com 401 Unauthorized');

        // 7. Login legítimo com credenciais válidas
        const r7 = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'dono@agro.com', senha: '123456' });
        assert(r7.statusCode === 200 && r7.data?.token, 'Login com credenciais reais autenticado com 200 OK e token emitido');

        // 8. Validação do token emitido em rota protegida
        if (r7.data?.token) {
            const r8 = await makeRequest({
                hostname: 'localhost',
                port: 3001,
                path: '/api/auth/me',
                method: 'GET',
                headers: { 'Authorization': `Bearer ${r7.data.token}` }
            });
            assert(r8.statusCode === 200 && r8.data?.email === 'dono@agro.com', 'Token legítimo validado em /api/auth/me com sucesso');
        }

    } catch (err) {
        console.error('Erro na execução do teste:', err);
        failed++;
    }

    console.log('\n================================================================');
    console.log(` RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('================================================================\n');
}

runAuthSecurityTests();
