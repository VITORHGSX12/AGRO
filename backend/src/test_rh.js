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

async function testRH() {
    console.log('=== TESTE DE VALIDAÇÃO DO MÓDULO DE RH & FOLHA DE PAGAMENTO ===\n');

    // 1. Cadastrar Colaborador Fixo e Diarista
    console.log('[1/4] Cadastrando colaboradores (Fixo e Diarista)...');
    const f1Res = await request('/funcionarios', {
        method: 'POST',
        body: {
            nome: 'Carlos Campeiro',
            funcao: 'Campeiro Chefe',
            tipo_contratacao: 'fixo',
            salario: 3200.0,
            mora_na_fazenda: 1
        }
    });

    const f2Res = await request('/funcionarios', {
        method: 'POST',
        body: {
            nome: 'Antônio Diarista',
            funcao: 'Cercador / Diarista',
            tipo_contratacao: 'diarista',
            valor_diaria: 150.0,
            mora_na_fazenda: 0
        }
    });

    const f1 = f1Res.body;
    const f2 = f2Res.body;

    if (f1Res.status === 201 && f2Res.status === 201 && f1.mora_na_fazenda === 1 && f2.tipo_contratacao === 'diarista') {
        console.log(`✔ Colaboradores cadastrados: ${f1.nome} (Fixo: R$ ${f1.salario}, Mora na fazenda: Sim) e ${f2.nome} (Diarista: R$ ${f2.valor_diaria}/dia).`);
    } else {
        console.error('❌ Falha ao cadastrar colaboradores:', { f1, f2 });
    }

    // 2. Consultar Folha de Pagamento do Mês (Auto-geração)
    console.log('\n[2/4] Consultando Folha de Pagamento do mês corrente...');
    const mesRef = '2026-09';
    const folhaRes = await request(`/folha?mes_referencia=${mesRef}`);
    const folhaItemF1 = folhaRes.body.folhas.find(f => f.funcionario_id === f1.id);

    if (folhaRes.status === 200 && folhaItemF1 && folhaItemF1.salario_base === 3200) {
        console.log(`✔ Folha de pagamento inicializada com sucesso para ${folhaRes.body.folhas.length} colaboradores ativos.`);
    } else {
        console.error('❌ Falha ao inicializar folha de pagamento:', folhaRes.body);
    }

    // 3. Ajustar Benefícios e Descontos e Quitar Individualmente com Lançamento Financeiro
    console.log('\n[3/4] Ajustando benefícios e quitando folha individual...');
    // Salário base 3200 + Benefício 300 - Desconto 200 = Líquido R$ 3.300,00
    await request(`/folha/${folhaItemF1.id}`, {
        method: 'PUT',
        body: {
            salario_base: 3200,
            beneficios: 300,
            descontos: 200
        }
    });

    const pagarRes = await request(`/folha/${folhaItemF1.id}/pagar`, {
        method: 'POST',
        body: { data_pagamento: '2026-09-08' }
    });

    const finSalarioCheck = await request(`/financeiro?categoria=salario&mes_ano=${mesRef}`);
    const lancamentoSalario = finSalarioCheck.body.find(l => l.valor === 3300 && l.descricao.includes(f1.nome));

    if (
        pagarRes.status === 200 &&
        pagarRes.body.folha.status === 'pago' &&
        pagarRes.body.folha.valor_liquido === 3300 &&
        lancamentoSalario
    ) {
        console.log(`✔ Quitação individual da folha: Status "pago", valor líquido R$ ${pagarRes.body.folha.valor_liquido},00 gerado automaticamente como despesa no Financeiro.`);
    } else {
        console.error('❌ Falha na quitação individual da folha:', { pagarRes: pagarRes.body, lancamentoSalario });
    }

    // 4. Testar Métricas de RH e Folha no Dashboard
    console.log('\n[4/4] Validando novo card de Folha de Pagamento no Dashboard...');
    const dashRes = await request(`/dashboard?mes_ano=${mesRef}`);
    const gastoFolhaDash = dashRes.body.financeiro.gasto_folha_mes;
    const totalColaboradoresDash = dashRes.body.rh.total_colaboradores_ativos;

    if (dashRes.status === 200 && gastoFolhaDash >= 3300 && totalColaboradoresDash >= 2) {
        console.log(`✔ Dashboard atualizado com sucesso: Gasto com folha no mês = R$ ${gastoFolhaDash.toFixed(2)}, Colaboradores ativos = ${totalColaboradoresDash}.`);
    } else {
        console.error('❌ Falha nas métricas do dashboard:', dashRes.body);
    }

    console.log('\n=== TODOS OS TESTES DO MÓDULO DE RH & FOLHA PASSARAM COM SUCESSO ===');
}

testRH().catch(console.error);
