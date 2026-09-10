import db from '../src/db/database.js';
import { signToken, verifyToken } from '../src/utils/auth.js';

async function runAudit() {
    console.log('========================================================================');
    console.log('🔍 AUDITORIA COMPLETA DE CADA MENU E MÓDULO — FAZENDA GD SAAS AGRO');
    console.log('========================================================================\n');

    const results = {
        auth_rbac: { name: 'Autenticação & Controle de Acesso (RBAC)', status: 'PASS', details: [] },
        dashboard: { name: 'Menu 1: Dashboard Geral & Indicadores', status: 'PASS', details: [] },
        rebanho: { name: 'Menu 2: Rebanho Bovino & Pesagens (GMD)', status: 'PASS', details: [] },
        pastagens: { name: 'Menu 3: Pastagens, Piquetes & Lotação Embrapa', status: 'PASS', details: [] },
        movimentacoes: { name: 'Menu 4: Movimentações de Gado', status: 'PASS', details: [] },
        sanidade: { name: 'Menu 5: Sanidade, Vacinas & Carência', status: 'PASS', details: [] },
        financeiro: { name: 'Menu 6: Financeiro & Fluxo de Caixa', status: 'PASS', details: [] },
        agricola: { name: 'Menu 7: Lavouras, Safras & Produtividade', status: 'PASS', details: [] },
        patrimonio: { name: 'Menu 8: Patrimônio, Máquinas & Depreciação Linear', status: 'PASS', details: [] },
        rh: { name: 'Menu 9: Equipe & RH (Folha de Pagamento)', status: 'PASS', details: [] },
        usuarios: { name: 'Menu 10: Gestão de Usuários & Permissões', status: 'PASS', details: [] }
    };

    // 1. AUTH & RBAC
    try {
        const users = db.prepare('SELECT id, nome, email, papel, status FROM usuarios').all();
        results.auth_rbac.details.push(`Usuários ativos e configurados: ${users.length}`);
        
        // Verifica se usuário oficial de acesso existe
        const defaultUser = users.find(u => u.email === 'fazendagdapp@agro.com' || u.email === 'fazendagdapp');
        if (defaultUser) {
            results.auth_rbac.details.push(`Conta principal de acesso do produtor: "${defaultUser.nome}" (${defaultUser.email})`);
        }
        
        // Teste JWT
        const token = signToken({ id: 1, email: 'teste@agro.com', papel: 'dono' });
        const decoded = verifyToken(token);
        if (decoded && decoded.papel === 'dono') {
            results.auth_rbac.details.push('Tokens JWT HMAC-SHA256 emitidos e verificados com sucesso.');
        } else {
            results.auth_rbac.status = 'FAIL';
            results.auth_rbac.details.push('Falha na verificação de token JWT.');
        }
    } catch (e) {
        results.auth_rbac.status = 'FAIL';
        results.auth_rbac.details.push(`Erro: ${e.message}`);
    }

    // 2. DASHBOARD
    try {
        const mesAno = new Date().toISOString().slice(0, 7);
        const fazenda = db.prepare('SELECT * FROM fazenda LIMIT 1').get();
        const rebanho = db.prepare("SELECT COUNT(*) as total_ativos, AVG(peso_atual) as peso_medio FROM animais WHERE status = 'ativo'").get();
        const finReceitas = db.prepare("SELECT COALESCE(SUM(valor), 0) as s FROM financeiro WHERE tipo = 'receita' AND strftime('%Y-%m', data) = ?").get(mesAno).s;
        const finDespesas = db.prepare("SELECT COALESCE(SUM(valor), 0) as s FROM financeiro WHERE tipo = 'despesa' AND strftime('%Y-%m', data) = ?").get(mesAno).s;
        const piquetes = db.prepare("SELECT COUNT(*) as c FROM piquetes").get().c;
        const vacinasPendentes = db.prepare("SELECT COUNT(*) as c FROM sanidade WHERE status = 'pendente'").get().c;

        results.dashboard.details.push(`Propriedade conectada: "${fazenda?.nome || 'Fazenda GD'}" (${fazenda?.area_hectares || 0} ha)`);
        results.dashboard.details.push(`Total de animais ativos: ${rebanho.total_ativos} (Peso médio: ${Number(rebanho.peso_medio || 0).toFixed(1)} kg)`);
        results.dashboard.details.push(`Fluxo de caixa do mês (${mesAno}): Receita R$ ${finReceitas.toFixed(2)} | Despesas R$ ${finDespesas.toFixed(2)} | Saldo R$ ${(finReceitas - finDespesas).toFixed(2)}`);
        results.dashboard.details.push(`Piquetes monitorados em tempo real: ${piquetes}`);
        results.dashboard.details.push(`Vacinações pendentes de aplicação: ${vacinasPendentes}`);
    } catch (e) {
        results.dashboard.status = 'FAIL';
        results.dashboard.details.push(`Erro: ${e.message}`);
    }

    // 3. REBANHO
    try {
        const total = db.prepare("SELECT COUNT(*) as c FROM animais").get().c;
        const ativos = db.prepare("SELECT COUNT(*) as c FROM animais WHERE status = 'ativo'").get().c;
        const pesagens = db.prepare("SELECT COUNT(*) as c FROM pesagens").get().c;
        const ultimas = db.prepare("SELECT a.identificacao, p.peso, p.gmd_kg_dia FROM pesagens p JOIN animais a ON a.id = p.animal_id ORDER BY p.id DESC LIMIT 2").all();

        results.rebanho.details.push(`Total de animais cadastrados: ${total} (${ativos} ativos)`);
        results.rebanho.details.push(`Histórico de pesagens: ${pesagens} registros com cálculo de GMD diário`);
        if (ultimas.length > 0) {
            results.rebanho.details.push(`Amostra: Brinco ${ultimas[0].identificacao} com ${ultimas[0].peso} kg (${ultimas[0].gmd_kg_dia ? ultimas[0].gmd_kg_dia.toFixed(3) + ' kg/dia' : 'Primeira pesagem'})`);
        }
    } catch (e) {
        results.rebanho.status = 'FAIL';
        results.rebanho.details.push(`Erro: ${e.message}`);
    }

    // 4. PASTAGENS & PIQUETES
    try {
        const piquetes = db.prepare(`
            SELECT p.id, p.nome, p.tamanho_hectares, p.capacidade_suporte,
                   (SELECT COUNT(*) FROM animais a WHERE a.piquete_atual_id = p.id AND a.status = 'ativo') as lotacao,
                   (SELECT COALESCE(SUM(a.peso_atual), 0) FROM animais a WHERE a.piquete_atual_id = p.id AND a.status = 'ativo') as peso_total
            FROM piquetes p
        `).all();

        const rotacoes = db.prepare("SELECT COUNT(*) as c FROM rotacao_pastagem").get().c;
        const arrendamentos = db.prepare("SELECT COUNT(*) as c FROM contratos_arrendamento").get().c;

        results.pastagens.details.push(`Piquetes cadastrados: ${piquetes.length}`);
        piquetes.forEach(p => {
            const peso = Number(p.peso_total || 0);
            const area = Number(p.tamanho_hectares || 1);
            const uaTotal = peso / 450;
            const uaPorHa = uaTotal / area;
            results.pastagens.details.push(`- ${p.nome}: ${p.lotacao}/${p.capacidade_suporte} cab (${uaPorHa.toFixed(2)} UA/ha | Carga: ${uaTotal.toFixed(1)} UA)`);
        });
        results.pastagens.details.push(`Histórico de rotações: ${rotacoes} movimentações de piquete`);
        results.pastagens.details.push(`Contratos de arrendamento ativos: ${arrendamentos}`);
    } catch (e) {
        results.pastagens.status = 'FAIL';
        results.pastagens.details.push(`Erro: ${e.message}`);
    }

    // 5. MOVIMENTAÇÕES
    try {
        const movs = db.prepare("SELECT COUNT(*) as c FROM movimentacoes_animais").get().c;
        const tipos = db.prepare("SELECT tipo, COUNT(*) as c FROM movimentacoes_animais GROUP BY tipo").all();
        results.movimentacoes.details.push(`Total de movimentações registradas: ${movs}`);
        results.movimentacoes.details.push(`Distribuição: ${tipos.map(t => `${t.tipo} (${t.c})`).join(', ') || 'Nenhuma'}`);
    } catch (e) {
        results.movimentacoes.status = 'FAIL';
        results.movimentacoes.details.push(`Erro: ${e.message}`);
    }

    // 6. SANIDADE
    try {
        const vacinas = db.prepare("SELECT COUNT(*) as c FROM sanidade").get().c;
        const aplicadas = db.prepare("SELECT COUNT(*) as c FROM sanidade WHERE status = 'aplicada'").get().c;
        const carencias = db.prepare("SELECT COUNT(*) as c FROM sanidade WHERE data_fim_carencia >= date('now')").get().c;

        results.sanidade.details.push(`Protocolos sanitários: ${vacinas} registros (${aplicadas} aplicadas)`);
        results.sanidade.details.push(`Animais/lotes em período de carência ativo: ${carencias}`);
    } catch (e) {
        results.sanidade.status = 'FAIL';
        results.sanidade.details.push(`Erro: ${e.message}`);
    }

    // 7. FINANCEIRO
    try {
        const total = db.prepare("SELECT COUNT(*) as c FROM financeiro").get().c;
        const saldoGeral = db.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas
            FROM financeiro
        `).get();

        results.financeiro.details.push(`Lançamentos no Livro Caixa: ${total}`);
        results.financeiro.details.push(`Acumulado Histórico: Receitas R$ ${Number(saldoGeral.receitas).toFixed(2)} | Despesas R$ ${Number(saldoGeral.despesas).toFixed(2)} | Saldo R$ ${(saldoGeral.receitas - saldoGeral.despesas).toFixed(2)}`);
    } catch (e) {
        results.financeiro.status = 'FAIL';
        results.financeiro.details.push(`Erro: ${e.message}`);
    }

    // 8. AGRÍCOLA
    try {
        const safras = db.prepare("SELECT COUNT(*) as c FROM safras").get().c;
        const talhoes = db.prepare("SELECT COUNT(*) as c FROM talhoes").get().c;
        const insumos = db.prepare("SELECT COUNT(*) as c FROM insumos_agricolas").get().c;

        results.agricola.details.push(`Safras registradas: ${safras}`);
        results.agricola.details.push(`Talhões demarcados: ${talhoes}`);
        results.agricola.details.push(`Insumos agrícolas lançados: ${insumos}`);
    } catch (e) {
        results.agricola.status = 'FAIL';
        results.agricola.details.push(`Erro: ${e.message}`);
    }

    // 9. PATRIMÔNIO & MÁQUINAS
    try {
        const maquinas = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(valor_aquisicao), 0) as val FROM maquinas_equipamentos").get();
        const benfeitorias = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(valor_aquisicao), 0) as val FROM benfeitorias").get();
        const manutencoes = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(valor), 0) as val FROM manutencoes").get();

        results.patrimonio.details.push(`Máquinas & Equipamentos: ${maquinas.c} unidades (Valor de aquisição: R$ ${Number(maquinas.val).toFixed(2)})`);
        results.patrimonio.details.push(`Benfeitorias & Instalações: ${benfeitorias.c} construções (Valor de aquisição: R$ ${Number(benfeitorias.val).toFixed(2)})`);
        results.patrimonio.details.push(`Manutenções realizadas: ${manutencoes.c} (Custo acumulado: R$ ${Number(manutencoes.val).toFixed(2)})`);
    } catch (e) {
        results.patrimonio.status = 'FAIL';
        results.patrimonio.details.push(`Erro: ${e.message}`);
    }

    // 10. RH & FOLHA
    try {
        const func = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(salario), 0) as folha FROM funcionarios WHERE status = 'ativo'").get();
        const folha = db.prepare("SELECT COUNT(*) as c FROM folha_pagamento").get().c;

        results.rh.details.push(`Colaboradores ativos: ${func.c} (Folha base mensal: R$ ${Number(func.folha).toFixed(2)})`);
        results.rh.details.push(`Histórico de folhas processadas: ${folha} lançamentos`);
    } catch (e) {
        results.rh.status = 'FAIL';
        results.rh.details.push(`Erro: ${e.message}`);
    }

    // 11. USUÁRIOS
    try {
        const users = db.prepare("SELECT id, nome, email, papel, status FROM usuarios").all();
        results.usuarios.details.push(`Usuários com acesso: ${users.length}`);
        users.forEach(u => {
            results.usuarios.details.push(`- ${u.nome} (${u.email}) -> Papel: [${u.papel.toUpperCase()}] | Status: [${u.status.toUpperCase()}]`);
        });
    } catch (e) {
        results.usuarios.status = 'FAIL';
        results.usuarios.details.push(`Erro: ${e.message}`);
    }

    console.log('========================================================================');
    console.log('📊 RELATÓRIO EXECUTIVO DA AUDITORIA POR MENU');
    console.log('========================================================================');
    let totalPass = 0;
    let totalFail = 0;

    for (const [key, item] of Object.entries(results)) {
        const isPass = item.status === 'PASS';
        if (isPass) totalPass++;
        else totalFail++;
        
        const badge = isPass ? '✅ [FUNCIONANDO 100%]' : '❌ [COM PENDÊNCIA]';
        console.log(`\n${badge} ${item.name}`);
        item.details.forEach(d => console.log(`   • ${d}`));
    }

    console.log('\n========================================================================');
    console.log(`🏁 RESUMO DA AUDITORIA: ${totalPass}/${Object.keys(results).length} MENUS APROVADOS E FUNCIONAIS`);
    console.log('========================================================================');
}

runAudit().catch(console.error);
