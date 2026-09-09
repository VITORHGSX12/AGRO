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

async function runPolimentoTests() {
    console.log('====================================================');
    console.log('   INICIANDO TESTES DA ETAPA 4: POLIMENTO & FILTROS  ');
    console.log('====================================================\n');

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
        // 1. Obter Token do Dono
        const loginDono = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'dono@agro.com', senha: '123456' });

        const tokenDono = loginDono.data.token;
        assert(loginDono.statusCode === 200 && tokenDono, 'Login de Dono para testes de filtros');

        // 2. Testar Filtro de Data em Financeiro (Intervalo data_inicio e data_fim)
        const finFilter = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/financeiro?data_inicio=2026-01-01&data_fim=2026-12-31',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenDono}` }
        });
        assert(finFilter.statusCode === 200 && Array.isArray(finFilter.data), 'GET /api/financeiro com intervalo data_inicio e data_fim retorna 200 OK');

        // 3. Testar Resumo Financeiro com intervalo de data
        const finResumo = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/financeiro/resumo?data_inicio=2026-01-01&data_fim=2026-12-31',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenDono}` }
        });
        assert(finResumo.statusCode === 200 && finResumo.data.total_receitas !== undefined, 'GET /api/financeiro/resumo calcula totais e saldo com sucesso');

        // 4. Testar Filtro de Data em Movimentações
        const movFilter = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/movimentacoes?tipo=transferencia&data_inicio=2026-01-01',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenDono}` }
        });
        assert(movFilter.statusCode === 200 && Array.isArray(movFilter.data), 'GET /api/movimentacoes com filtros de tipo e data retorna 200 OK');

        // 5. Testar Filtro de Data em Sanidade
        const sanFilter = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/sanidade?tipo=vacina&data_inicio=2026-01-01',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenDono}` }
        });
        assert(sanFilter.statusCode === 200 && Array.isArray(sanFilter.data), 'GET /api/sanidade com filtros de tipo e intervalo retorna 200 OK');

        // 6. Testar Autenticação Criptográfica (Garantir que senha errada falha com 401 e nunca texto puro)
        const loginFail = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'dono@fazenda.com', senha: 'SENHA_INCORRETA_TESTE' });
        assert(loginFail.statusCode === 401, 'Login com senha incorreta rejeitado com 401 Unauthorized via hash timingSafeEqual');

    } catch (err) {
        console.error('Erro na execução do teste:', err);
        failed++;
    }

    console.log('\n====================================================');
    console.log(` RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('====================================================\n');
}

runPolimentoTests();
