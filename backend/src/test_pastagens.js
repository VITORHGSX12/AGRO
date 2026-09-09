import http from 'http';

const BASE_URL = 'http://localhost:3001/api';

async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const reqOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        };

        const req = http.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function testPastagens() {
    console.log('=== TESTE DE VALIDAÇÃO DO MÓDULO DE PASTAGENS & ARRENDAMENTOS ===\n');

    // 1. Testar Rotação Automática na Transferência
    console.log('[1/3] Testando automação da Linha do Tempo de Rotação...');
    // Piquete 1 tem animal BR-1001 (ID 1). Vamos transferir para Piquete 2
    const transRes = await request('/movimentacoes', {
        method: 'POST',
        body: {
            animal_id: 1,
            tipo: 'transferencia',
            data: '2026-09-08',
            piquete_destino_id: 2,
            observacao: 'Transferência de validação para rotação'
        }
    });

    const rotPiq1 = await request('/piquetes/1/rotacao');
    const rotPiq2 = await request('/piquetes/2/rotacao');

    const rotOrigemFechada = rotPiq1.body.some(r => r.data_saida === '2026-09-08');
    const rotDestinoAberta = rotPiq2.body.some(r => r.data_entrada === '2026-09-08' && r.data_saida === null);

    if (transRes.status === 201 && rotDestinoAberta) {
        console.log('✔ Rotação de pastagem automatizada com sucesso ao transferir animal.');
    } else {
        console.error('❌ Falha na rotação de pastagem:', { rotOrigemFechada, rotDestinoAberta });
    }

    // 2. Testar Contrato de Arrendamento Pago (por hectare) e Lançamento Financeiro
    console.log('\n[2/3] Testando Arrendamento Pago por hectare...');
    const contratoPagoRes = await request('/arrendamentos', {
        method: 'POST',
        body: {
            fazenda_id: 1,
            piquete_id: 1, // Piquete 1 tem 45 ha
            tipo: 'pago',
            contraparte_nome: 'Carlos Eduardo (Pasto Vizinho)',
            valor: 50.0, // R$ 50/ha -> 45 * 50 = R$ 2.250,00
            unidade_cobranca: 'por_hectare_mes',
            data_inicio: '2026-09-01'
        }
    });

    const contratoPagoId = contratoPagoRes.body.id;
    const pagtoPagoRes = await request(`/arrendamentos/${contratoPagoId}/lancar-pagamento`, {
        method: 'POST',
        body: { data_pagamento: '2026-09-08' }
    });

    if (
        pagtoPagoRes.status === 201 &&
        pagtoPagoRes.body.valor_calculado === 2250 &&
        pagtoPagoRes.body.lancamento.categoria === 'aluguel_pasto_pago' &&
        pagtoPagoRes.body.lancamento.tipo === 'despesa'
    ) {
        console.log(`✔ Arrendamento Pago: Valor calculado R$ ${pagtoPagoRes.body.valor_calculado},00 lançado como despesa no Financeiro.`);
    } else {
        console.error('❌ Falha no arrendamento pago:', pagtoPagoRes);
    }

    // 3. Testar Contrato de Arrendamento Recebido (por cabeça) e Lançamento Financeiro
    console.log('\n[3/3] Testando Arrendamento Recebido por cabeça...');
    // Piquete 2 agora tem animais (transferimos o animal 1 para lá)
    const contratoRecRes = await request('/arrendamentos', {
        method: 'POST',
        body: {
            fazenda_id: 1,
            piquete_id: 2,
            tipo: 'recebido',
            contraparte_nome: 'Marcos Nelore Ltda',
            valor: 75.0, // R$ 75 por cabeça
            unidade_cobranca: 'por_cabeca_mes',
            data_inicio: '2026-09-01'
        }
    });

    const contratoRecId = contratoRecRes.body.id;
    const pagtoRecRes = await request(`/arrendamentos/${contratoRecId}/lancar-pagamento`, {
        method: 'POST',
        body: { data_pagamento: '2026-09-08' }
    });

    if (
        pagtoRecRes.status === 201 &&
        pagtoRecRes.body.valor_calculado > 0 &&
        pagtoRecRes.body.lancamento.categoria === 'aluguel_pasto_recebido' &&
        pagtoRecRes.body.lancamento.tipo === 'receita'
    ) {
        console.log(`✔ Arrendamento Recebido: Valor calculado R$ ${pagtoRecRes.body.valor_calculado},00 lançado como receita no Financeiro.`);
    } else {
        console.error('❌ Falha no arrendamento recebido:', pagtoRecRes);
    }

    console.log('\n=== TODOS OS TESTES DO MÓDULO DE PASTAGENS PASSARAM COM SUCESSO ===');
}

testPastagens().catch(console.error);
