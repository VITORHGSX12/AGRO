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

async function runValidation() {
    console.log('=== INICIANDO ROTEIRO DE VALIDAÇÃO FUNCIONAL END-TO-END ===\n');
    const results = {};

    // -------------------------------------------------------------
    // TESTE 1: Cadastro básico de Fazenda e 2 Piquetes
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 1]...');
        // 1.1 Atualizar Fazenda
        const fazendaRes = await request('/fazenda', {
            method: 'PUT',
            body: { nome: 'Fazenda Vale Verde', area_hectares: 850.5, localizacao: 'Rio Verde - GO' }
        });

        // 1.2 Criar Piquete A e Piquete B
        const piqARes = await request('/piquetes', {
            method: 'POST',
            body: { nome: 'Piquete Alfa (Maternidade)', tamanho_hectares: 30, capacidade_suporte: 40 }
        });
        const piqBRes = await request('/piquetes', {
            method: 'POST',
            body: { nome: 'Piquete Beta (Engorda)', tamanho_hectares: 60, capacidade_suporte: 80 }
        });

        // 1.3 Listar Piquetes
        const listPiqRes = await request('/piquetes');
        const piqA = listPiqRes.body.find(p => p.id === piqARes.body.id);
        const piqB = listPiqRes.body.find(p => p.id === piqBRes.body.id);

        if (
            fazendaRes.status === 200 &&
            fazendaRes.body.nome === 'Fazenda Vale Verde' &&
            piqA && piqB &&
            piqA.nome === 'Piquete Alfa (Maternidade)' &&
            piqB.nome === 'Piquete Beta (Engorda)'
        ) {
            results.t1 = {
                status: 'PASSOU',
                expected: 'Fazenda "Fazenda Vale Verde" e piquetes "Piquete Alfa" e "Piquete Beta" cadastrados e retornados corretamente na listagem.',
                obtained: `Fazenda cadastrada (ID: ${fazendaRes.body.id}, Nome: ${fazendaRes.body.nome}). Piquetes criados com sucesso: Piquete Alfa (ID: ${piqA.id}, 30 ha, cap: 40), Piquete Beta (ID: ${piqB.id}, 60 ha, cap: 80).`,
                piqAId: piqA.id,
                piqBId: piqB.id
            };
        } else {
            results.t1 = {
                status: 'FALHOU',
                expected: 'Fazenda e 2 piquetes retornados com status 200/201.',
                obtained: `Status Fazenda: ${fazendaRes.status}, Listagem Piquetes: ${JSON.stringify(listPiqRes.body)}`
            };
        }
    } catch (err) {
        results.t1 = { status: 'FALHOU', expected: 'Cadastro com sucesso', obtained: err.message };
    }

    // -------------------------------------------------------------
    // TESTE 2: Integridade de brinco único
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 2]...');
        const piqAId = results.t1.piqAId;
        const piqBId = results.t1.piqBId;

        // Cadastrar animais válidos
        const a1 = await request('/animais', {
            method: 'POST',
            body: { identificacao: 'VAL-01', sexo: 'M', categoria: 'garrote', raca: 'Nelore', piquete_atual_id: piqAId, peso_atual: 320 }
        });
        const a2 = await request('/animais', {
            method: 'POST',
            body: { identificacao: 'VAL-02', sexo: 'F', categoria: 'novilha', raca: 'Nelore', piquete_atual_id: piqAId, peso_atual: 290 }
        });
        const a3 = await request('/animais', {
            method: 'POST',
            body: { identificacao: 'VAL-03', sexo: 'M', categoria: 'boi_gordo', raca: 'Angus', piquete_atual_id: piqBId, peso_atual: 510 }
        });

        // Tentar cadastrar animal duplicado com brinco 'VAL-01'
        const dupRes = await request('/animais', {
            method: 'POST',
            body: { identificacao: 'VAL-01', sexo: 'F', categoria: 'vaca', piquete_atual_id: piqBId }
        });

        if (
            a1.status === 201 && a2.status === 201 && a3.status === 201 &&
            dupRes.status === 400 &&
            dupRes.body.error &&
            dupRes.body.error.includes('Já existe um animal com o brinco "VAL-01"')
        ) {
            results.t2 = {
                status: 'PASSOU',
                expected: 'Recusa de cadastro duplicado com código HTTP 400 e mensagem explicativa de brinco já existente.',
                obtained: `HTTP ${dupRes.status}: "${dupRes.body.error}". Os 3 animais válidos foram criados com sucesso (IDs: ${a1.body.id}, ${a2.body.id}, ${a3.body.id}).`,
                a1Id: a1.body.id,
                a2Id: a2.body.id,
                a3Id: a3.body.id
            };
        } else {
            results.t2 = {
                status: 'FALHOU',
                expected: 'HTTP 400 com mensagem amigável de duplicidade.',
                obtained: `HTTP ${dupRes.status}: ${JSON.stringify(dupRes.body)}`
            };
        }
    } catch (err) {
        results.t2 = { status: 'FALHOU', expected: 'Bloqueio de duplicado', obtained: err.message };
    }

    // -------------------------------------------------------------
    // TESTE 3: Venda de animal e impacto automático no financeiro
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 3]...');
        const animalIdParaVender = results.t2.a3Id; // Animal VAL-03 (Boi Gordo)
        const valorVenda = 5800.00;
        const dataVenda = '2026-09-08';

        // 3.1 Registrar Venda na tela de Movimentações
        const movRes = await request('/movimentacoes', {
            method: 'POST',
            body: {
                animal_id: animalIdParaVender,
                tipo: 'venda',
                data: dataVenda,
                valor: valorVenda,
                observacao: 'Venda para Frigorífico Parceiro',
                gerar_lancamento_financeiro: true
            }
        });

        // 3.2 Verificar status do animal
        const animalCheck = await request(`/animais/${animalIdParaVender}`);

        // 3.3 Verificar lançamento financeiro
        const finCheck = await request(`/financeiro?tipo=receita&mes_ano=2026-09`);
        const lancamento = finCheck.body.find(f => f.animal_id === animalIdParaVender && f.tipo === 'receita');

        const animalVendidoOk = animalCheck.body.status === 'vendido' && animalCheck.body.piquete_atual_id === null;
        const lancamentoOk = lancamento && lancamento.valor === valorVenda && lancamento.categoria === 'venda_animal';

        if (movRes.status === 201 && animalVendidoOk && lancamentoOk) {
            results.t3 = {
                status: 'PASSOU',
                expected: '(a) Status do animal alterado para "vendido" e desvinculado do piquete; (b) Lançamento de receita gerado automaticamente no Financeiro com categoria "venda_animal" e valor R$ 5.800,00.',
                obtained: `Status do animal: "${animalCheck.body.status}", Piquete Atual: ${animalCheck.body.piquete_atual_id} (nulo). Lançamento ID ${lancamento.id} encontrado: Tipo "${lancamento.tipo}", Categoria "${lancamento.categoria}", Valor: R$ ${lancamento.valor}, Descrição: "${lancamento.descricao}".`
            };
        } else {
            results.t3 = {
                status: 'FALHOU',
                expected: 'Status vendido e receita lançada.',
                obtained: `Animal status: ${animalCheck.body.status}, Lançamento: ${JSON.stringify(lancamento)}`
            };
        }
    } catch (err) {
        results.t3 = { status: 'FALHOU', expected: 'Venda com sucesso', obtained: err.message };
    }

    // -------------------------------------------------------------
    // TESTE 4: Transferência entre piquetes e contagem de lotação
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 4]...');
        const animalId = results.t2.a1Id; // Animal VAL-01 que está no Piquete Alfa
        const piqAId = results.t1.piqAId;
        const piqBId = results.t1.piqBId;

        // Contagem antes
        const piqAntes = await request('/piquetes');
        const countAAntes = piqAntes.body.find(p => p.id === piqAId)?.total_animais_ativos || 0;
        const countBAntes = piqAntes.body.find(p => p.id === piqBId)?.total_animais_ativos || 0;

        // Registrar Transferência de Alfa para Beta
        const transRes = await request('/movimentacoes', {
            method: 'POST',
            body: {
                animal_id: animalId,
                tipo: 'transferencia',
                data: '2026-09-08',
                piquete_destino_id: piqBId,
                observacao: 'Mudança de lote para engorda'
            }
        });

        // Verificar animal
        const animalDepois = await request(`/animais/${animalId}`);

        // Contagem depois
        const piqDepois = await request('/piquetes');
        const countADepois = piqDepois.body.find(p => p.id === piqAId)?.total_animais_ativos || 0;
        const countBDepois = piqDepois.body.find(p => p.id === piqBId)?.total_animais_ativos || 0;

        const animalAtualizadoOk = animalDepois.body.piquete_atual_id === piqBId;
        const contagemOk = (countADepois === countAAntes - 1) && (countBDepois === countBAntes + 1);

        if (transRes.status === 201 && animalAtualizadoOk && contagemOk) {
            results.t4 = {
                status: 'PASSOU',
                expected: 'piquete_atual_id do animal atualizado para Piquete Beta; contagem do Piquete Alfa diminui em 1 e do Piquete Beta aumenta em 1.',
                obtained: `Animal VAL-01 agora está no Piquete Beta (ID: ${animalDepois.body.piquete_atual_id}). Lotação Piquete Alfa: ${countAAntes} ➔ ${countADepois}. Lotação Piquete Beta: ${countBAntes} ➔ ${countBDepois}.`
            };
        } else {
            results.t4 = {
                status: 'FALHOU',
                expected: 'Transferência e contagem dinâmica corretas.',
                obtained: `Piquete Atual: ${animalDepois.body.piquete_atual_id}, Lotação A: ${countAAntes} -> ${countADepois}, Lotação B: ${countBAntes} -> ${countBDepois}`
            };
        }
    } catch (err) {
        results.t4 = { status: 'FALHOU', expected: 'Transferência com sucesso', obtained: err.message };
    }

    // -------------------------------------------------------------
    // TESTE 5: Sanidade com data vencida e próxima do vencimento
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 5]...');
        const today = new Date();
        const dMinus7 = new Date(today);
        dMinus7.setDate(today.getDate() - 7);
        const dPlus3 = new Date(today);
        dPlus3.setDate(today.getDate() + 3);

        const strMinus7 = dMinus7.toISOString().split('T')[0];
        const strPlus3 = dPlus3.toISOString().split('T')[0];

        // 5.1 Cadastrar vacina atrasada
        const vacAtrasada = await request('/sanidade', {
            method: 'POST',
            body: {
                tipo: 'vacina',
                nome_produto: 'Vacina Raiva Herbívoros',
                lote_ou_grupo: 'Lote Teste 01',
                data_aplicacao: '2026-01-10',
                data_proxima_dose: strMinus7,
                status: 'pendente'
            }
        });

        // 5.2 Cadastrar vacina próxima (3 dias)
        const vacProxima = await request('/sanidade', {
            method: 'POST',
            body: {
                tipo: 'vacina',
                nome_produto: 'Vacina Carbúnculo Sintomático',
                lote_ou_grupo: 'Lote Teste 02',
                data_aplicacao: '2026-03-15',
                data_proxima_dose: strPlus3,
                status: 'pendente'
            }
        });

        // 5.3 Consultar lista de sanidade e dashboard
        const listSan = await request('/sanidade');
        const itemAtrasado = listSan.body.find(s => s.id === vacAtrasada.body.id);
        const itemProximo = listSan.body.find(s => s.id === vacProxima.body.id);

        const dashRes = await request('/dashboard?mes_ano=2026-09');

        const atrasadaOk = itemAtrasado && itemAtrasado.computed_status === 'atrasada' && itemAtrasado.is_atrasada === true;
        const proximaOk = itemProximo && itemProximo.computed_status === 'alerta_vencendo' && itemProximo.is_vencendo_7dias === true;
        const dashOk = dashRes.body.sanidade.atrasadas >= 1 && dashRes.body.sanidade.vencendo_7dias >= 1;

        if (atrasadaOk && proximaOk && dashOk) {
            results.t5 = {
                status: 'PASSOU',
                expected: 'Vacina com dose no passado classificada como "atrasada" e vacina em 3 dias classificada como "alerta_vencendo" (em 7 dias) tanto na listagem quanto nos contadores do Dashboard.',
                obtained: `Vacina Raiva (dose: ${strMinus7}) -> status: "${itemAtrasado.computed_status}" (is_atrasada: true). Vacina Carbúnculo (dose: ${strPlus3}) -> status: "${itemProximo.computed_status}" (is_vencendo_7dias: true). Dashboard reflete: ${dashRes.body.sanidade.atrasadas} atrasada(s) e ${dashRes.body.sanidade.vencendo_7dias} vencendo em 7 dias.`
            };
        } else {
            results.t5 = {
                status: 'FALHOU',
                expected: 'Status dinâmicos calculados corretamente.',
                obtained: `Atrasada: ${itemAtrasado?.computed_status}, Próxima: ${itemProximo?.computed_status}, Dash: ${JSON.stringify(dashRes.body.sanidade)}`
            };
        }
    } catch (err) {
        results.t5 = { status: 'FALHOU', expected: 'Cálculo de sanidade correto', obtained: err.message };
    }

    // -------------------------------------------------------------
    // TESTE 6: Consistência do Dashboard (Saldo e Custo Médio / Cabeça)
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 6]...');
        const currentMesAno = '2026-09';

        // Lançar mais uma despesa controlada para validação precisa
        await request('/financeiro', {
            method: 'POST',
            body: {
                tipo: 'despesa',
                categoria: 'nutricao_racao',
                valor: 2400.00,
                data: '2026-09-08',
                descricao: 'Compra de sal mineral e farelo de soja'
            }
        });

        // 6.1 Obter todos os lançamentos do mês
        const finMesRes = await request(`/financeiro?mes_ano=${currentMesAno}`);
        let totalReceitasManual = 0;
        let totalDespesasManual = 0;

        for (const l of finMesRes.body) {
            if (l.tipo === 'receita') totalReceitasManual += l.valor;
            if (l.tipo === 'despesa') totalDespesasManual += l.valor;
        }
        const saldoManual = totalReceitasManual - totalDespesasManual;

        // 6.2 Obter contagem de animais ativos
        const animaisAtivosRes = await request('/animais?status=ativo');
        const totalAtivosManual = animaisAtivosRes.body.length;
        const custoMedioManual = totalAtivosManual > 0 ? (totalDespesasManual / totalAtivosManual) : 0;

        // 6.3 Obter Dashboard da API
        const dashRes = await request(`/dashboard?mes_ano=${currentMesAno}`);
        const dashFin = dashRes.body.financeiro;
        const dashRebanho = dashRes.body.rebanho;

        const saldoBate = Math.abs(dashFin.saldo_mes - saldoManual) < 0.01;
        const receitasBate = Math.abs(dashFin.receitas_mes - totalReceitasManual) < 0.01;
        const despesasBate = Math.abs(dashFin.despesas_mes - totalDespesasManual) < 0.01;
        const ativosBate = dashRebanho.total_ativos === totalAtivosManual;
        const custoBate = Math.abs(dashFin.custo_medio_por_animal - custoMedioManual) < 0.01;

        if (saldoBate && receitasBate && despesasBate && ativosBate && custoBate) {
            results.t6 = {
                status: 'PASSOU',
                expected: 'Números do Dashboard batem exatamente com o cálculo manual de Receitas, Despesas, Saldo Líquido, Animais Ativos e Custo Médio por Cabeça.',
                obtained: `Cálculo Manual: Receitas = R$ ${totalReceitasManual.toFixed(2)}, Despesas = R$ ${totalDespesasManual.toFixed(2)}, Saldo = R$ ${saldoManual.toFixed(2)}, Ativos = ${totalAtivosManual}, Custo Médio = R$ ${custoMedioManual.toFixed(2)}/cab. Dashboard retornado: Receitas = R$ ${dashFin.receitas_mes.toFixed(2)}, Despesas = R$ ${dashFin.despesas_mes.toFixed(2)}, Saldo = R$ ${dashFin.saldo_mes.toFixed(2)}, Ativos = ${dashRebanho.total_ativos}, Custo Médio = R$ ${dashFin.custo_medio_por_animal.toFixed(2)}/cab. 100% idêntico.`
            };
        } else {
            results.t6 = {
                status: 'FALHOU',
                expected: 'Valores idênticos entre cálculo manual e API.',
                obtained: `Manual: {saldo: ${saldoManual}, custo: ${custoMedioManual}}, Dashboard: ${JSON.stringify(dashFin)}`
            };
        }
    } catch (err) {
        results.t6 = { status: 'FALHOU', expected: 'Consistência de dados', obtained: err.message };
    }

    // -------------------------------------------------------------
    // TESTE 7: Exclusão de piquete com animal vinculado (ON DELETE SET NULL)
    // -------------------------------------------------------------
    try {
        console.log('[Executando Teste 7]...');
        const piqBId = results.t1.piqBId;
        const animalIdNoPiqB = results.t2.a1Id; // Animal VAL-01 que transferimos para Beta

        // 7.1 Confirmar que o animal está no Piquete Beta
        const animalAntes = await request(`/animais/${animalIdNoPiqB}`);
        const estavaNoPiqB = animalAntes.body.piquete_atual_id === piqBId;

        // 7.2 Excluir o Piquete Beta
        const deletePiqRes = await request(`/piquetes/${piqBId}`, { method: 'DELETE' });

        // 7.3 Verificar se o piquete foi excluído da listagem
        const piqListDepois = await request('/piquetes');
        const piqueteExisteAinda = piqListDepois.body.some(p => p.id === piqBId);

        // 7.4 Verificar se o animal AINDA EXISTE e se piquete_atual_id ficou NULL
        const animalDepois = await request(`/animais/${animalIdNoPiqB}`);

        const piqueteExcluidoOk = deletePiqRes.status === 200 && !piqueteExisteAinda;
        const animalPreservadoOk = animalDepois.status === 200 && animalDepois.body.id === animalIdNoPiqB;
        const piqueteNullOk = animalDepois.body.piquete_atual_id === null;

        if (estavaNoPiqB && piqueteExcluidoOk && animalPreservadoOk && piqueteNullOk) {
            results.t7 = {
                status: 'PASSOU',
                expected: 'Piquete é excluído, o animal NÃO é apagado, e o piquete_atual_id desse animal fica nulo (ON DELETE SET NULL).',
                obtained: `Piquete Beta (ID: ${piqBId}) excluído com sucesso. Animal VAL-01 (ID: ${animalIdNoPiqB}) permanece cadastrado no rebanho com status "${animalDepois.body.status}" e piquete_atual_id: ${animalDepois.body.piquete_atual_id} (null).`
            };
        } else {
            results.t7 = {
                status: 'FALHOU',
                expected: 'Piquete deletado e animal preservado com piquete_atual_id = null.',
                obtained: `Piquete existe? ${piqueteExisteAinda}, Animal existe? ${animalDepois.status === 200}, piquete_atual_id: ${animalDepois.body?.piquete_atual_id}`
            };
        }
    } catch (err) {
        results.t7 = { status: 'FALHOU', expected: 'Exclusão com integridade', obtained: err.message };
    }

    console.log('\n=== RESULTADOS DETALHADOS ===\n');
    console.log(JSON.stringify(results, null, 2));
}

runValidation().catch(console.error);
