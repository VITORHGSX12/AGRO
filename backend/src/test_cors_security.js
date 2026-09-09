import http from 'http';
import express from 'express';
import cors from 'cors';

async function runCorsSecurityTests() {
    console.log('================================================================');
    console.log('🌐 TESTE DE CORS & SECURITY HEADERS (FASE 4 - ETAPA 4)');
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

    // Inicia app de teste espelhando o servidor
    const allowedOrigins = ['https://agro-app.vercel.app', 'http://localhost:5173'];
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Bloqueado por CORS'));
            }
        }
    };

    const app = express();
    app.use(cors(corsOptions));
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });

    app.get('/api/test-cors', (req, res) => res.json({ ok: true }));

    // Tratador de erro CORS
    app.use((err, req, res, next) => {
        if (err.message.includes('CORS')) {
            return res.status(403).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    });

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;

    function req(originHeader) {
        return new Promise((resolve) => {
            const options = {
                hostname: '127.0.0.1',
                port,
                path: '/api/test-cors',
                method: 'GET',
                headers: originHeader ? { 'Origin': originHeader } : {}
            };
            const request = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
            });
            request.end();
        });
    }

    try {
        // 1. Origem autorizada do Vercel
        const r1 = await req('https://agro-app.vercel.app');
        assert(r1.status === 200, 'Requisição de origem autorizada (Vercel) aceita com 200 OK');
        assert(r1.headers['access-control-allow-origin'] === 'https://agro-app.vercel.app', 'Header Access-Control-Allow-Origin configurado corretamente para o domínio do frontend');

        // 2. Origem autorizada Localhost
        const r2 = await req('http://localhost:5173');
        assert(r2.status === 200, 'Requisição de origem local (localhost:5173) aceita com 200 OK');

        // 3. Origem maliciosa / não cadastrada
        const r3 = await req('https://site-malicioso-hacker.com');
        assert(r3.status === 403, 'Requisição de origem não cadastrada bloqueada pelo CORS com 403');

        // 4. Security Headers
        assert(r1.headers['x-content-type-options'] === 'nosniff', 'Header X-Content-Type-Options: nosniff presente');
        assert(r1.headers['x-frame-options'] === 'DENY', 'Header X-Frame-Options: DENY presente (proteção contra Clickjacking)');
        assert(r1.headers['x-xss-protection'] === '1; mode=block', 'Header X-XSS-Protection presente');

    } catch (err) {
        console.error('Erro nos testes de CORS:', err);
        failed++;
    } finally {
        server.close();
    }

    console.log('\n================================================================');
    console.log(` RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('================================================================\n');
}

runCorsSecurityTests();
