import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/dashboard - Métricas consolidadas do Dashboard
router.get('/', (req, res) => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const currentYear = today.getFullYear();

        // 0. Resolução central de limites de data (Mês, Safra ou Personalizado)
        const tipoPeriodo = req.query.tipo_periodo || 'mes'; // 'mes' | 'safra' | 'personalizado'
        let dataInicio = '';
        let dataFim = '';
        let labelPeriodo = '';

        if (tipoPeriodo === 'safra') {
            const anoSafra = req.query.ano_safra || (today.getMonth() >= 6 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`);
            const partes = anoSafra.split('/');
            const ano1 = parseInt(partes[0], 10) || (currentYear - 1);
            const ano2 = parseInt(partes[1], 10) || currentYear;
            dataInicio = `${ano1}-07-01`;
            dataFim = `${ano2}-06-30`;
            labelPeriodo = `Safra ${anoSafra} (01/07/${ano1} a 30/06/${ano2})`;
        } else if (tipoPeriodo === 'personalizado') {
            dataInicio = req.query.data_inicio || `${currentYear}-01-01`;
            dataFim = req.query.data_fim || todayStr;
            labelPeriodo = `Personalizado (${dataInicio} a ${dataFim})`;
        } else {
            // Mês (padrão)
            const currentYearMonth = req.query.mes_ano || todayStr.slice(0, 7); // 'YYYY-MM'
            const [anoStr, mesStr] = currentYearMonth.split('-');
            const anoNum = parseInt(anoStr, 10) || currentYear;
            const mesNum = parseInt(mesStr, 10) || (today.getMonth() + 1);
            const ultimoDia = new Date(anoNum, mesNum, 0).getDate();
            const mesFormatado = String(mesNum).padStart(2, '0');
            dataInicio = `${anoNum}-${mesFormatado}-01`;
            dataFim = `${anoNum}-${mesFormatado}-${String(ultimoDia).padStart(2, '0')}`;
            labelPeriodo = `Mês ${mesFormatado}/${anoNum}`;
        }

        const in7DaysDate = new Date(today);
        in7DaysDate.setDate(today.getDate() + 7);
        const in7DaysStr = in7DaysDate.toISOString().split('T')[0];

        // 1. Contagem e Métricas do Rebanho
        const animaisStats = db.prepare(`
            SELECT 
                COUNT(CASE WHEN status = 'ativo' THEN 1 END) as total_ativos,
                COUNT(CASE WHEN status = 'vendido' THEN 1 END) as total_vendidos,
                COUNT(CASE WHEN status = 'morto' THEN 1 END) as total_mortos,
                COUNT(*) as total_geral,
                COALESCE(AVG(CASE WHEN status = 'ativo' AND peso_atual > 0 THEN peso_atual END), 0) as peso_medio_ativos
            FROM animais
        `).get();

        const totalAtivos = animaisStats.total_ativos || 0;
        const pesoMedioAtivos = Number((animaisStats.peso_medio_ativos || 0).toFixed(1));

        // 2. Distribuição por Categoria (Apenas Ativos)
        const distribuicaoCategorias = db.prepare(`
            SELECT 
                categoria,
                COUNT(*) as quantidade,
                COALESCE(AVG(CASE WHEN peso_atual > 0 THEN peso_atual END), 0) as peso_medio
            FROM animais
            WHERE status = 'ativo'
            GROUP BY categoria
            ORDER BY quantidade DESC
        `).all().map(c => ({
            ...c,
            peso_medio: Number(c.peso_medio.toFixed(1))
        }));

        // 3. Distribuição por Sexo (Ativos)
        const distribuicaoSexo = db.prepare(`
            SELECT 
                sexo,
                COUNT(*) as quantidade
            FROM animais
            WHERE status = 'ativo'
            GROUP BY sexo
        `).all();

        // 4. Métricas Financeiras Centrais Calculadas pelo Período Unificado
        const financeiroPeriodo = db.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas,
                COALESCE(SUM(CASE WHEN categoria = 'salario' THEN valor ELSE 0 END), 0) as gasto_folha
            FROM financeiro
            WHERE data >= ? AND data <= ?
        `).get(dataInicio, dataFim);

        const receitasPeriodo = Number(financeiroPeriodo.receitas || 0);
        const despesasPeriodo = Number(financeiroPeriodo.despesas || 0);
        const gastoFolhaPeriodo = Number(financeiroPeriodo.gasto_folha || 0);
        const saldoPeriodo = Number((receitasPeriodo - despesasPeriodo).toFixed(2));

        // 4.1 Despesas por Categoria no Período
        const despesasPorCategoria = db.prepare(`
            SELECT 
                categoria,
                SUM(valor) as total
            FROM financeiro
            WHERE tipo = 'despesa' AND data >= ? AND data <= ?
            GROUP BY categoria
            ORDER BY total DESC
        `).all(dataInicio, dataFim);

        // 4.2 Resultado Consolidado por Atividade no Período
        const resultadoPorAtividadeRaw = db.prepare(`
            SELECT 
                COALESCE(atividade, 'geral') as atividade,
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas
            FROM financeiro
            WHERE data >= ? AND data <= ?
            GROUP BY atividade
        `).all(dataInicio, dataFim);

        const resultadoPorAtividade = {
            pecuaria: { receitas: 0, despesas: 0, saldo: 0 },
            agricola: { receitas: 0, despesas: 0, saldo: 0 },
            rh: { receitas: 0, despesas: 0, saldo: 0 },
            geral: { receitas: 0, despesas: 0, saldo: 0 }
        };

        resultadoPorAtividadeRaw.forEach(r => {
            const ativ = r.atividade || 'geral';
            if (resultadoPorAtividade[ativ]) {
                resultadoPorAtividade[ativ].receitas = Number(r.receitas.toFixed(2));
                resultadoPorAtividade[ativ].despesas = Number(r.despesas.toFixed(2));
                resultadoPorAtividade[ativ].saldo = Number((r.receitas - r.despesas).toFixed(2));
            }
        });

        // 5. Custo Médio por Animal no Período = Despesas do Período / Total de Ativos
        const custoMedioPorAnimal = totalAtivos > 0 ? Number((despesasPeriodo / totalAtivos).toFixed(2)) : 0;

        // 5.1 RH e Colaboradores
        const totalColaboradores = db.prepare(`SELECT COUNT(*) as count FROM funcionarios WHERE status = 'ativo'`).get()?.count || 0;
        const totalSalariosFixos = db.prepare(`SELECT COALESCE(SUM(salario), 0) as total FROM funcionarios WHERE status = 'ativo'`).get()?.total || 0;

        // 6. Alertas de Sanidade
        const sanidadeAlertas = db.prepare(`
            SELECT
                COUNT(CASE 
                    WHEN status != 'aplicada' AND data_proxima_dose < ? THEN 1 
                END) as atrasadas,
                COUNT(CASE 
                    WHEN status != 'aplicada' AND data_proxima_dose >= ? AND data_proxima_dose <= ? THEN 1 
                END) as vencendo_7dias,
                COUNT(CASE 
                    WHEN status != 'aplicada' THEN 1 
                END) as total_pendentes,
                COUNT(CASE 
                    WHEN status = 'aplicada' THEN 1 
                END) as total_aplicadas
            FROM sanidade
        `).get(todayStr, todayStr, in7DaysStr);

        // 7. Últimas 5 Movimentações
        const ultimasMovimentacoes = db.prepare(`
            SELECT 
                m.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria,
                po.nome as piquete_origem_nome,
                pd.nome as piquete_destino_nome
            FROM movimentacoes_animais m
            JOIN animais a ON m.animal_id = a.id
            LEFT JOIN piquetes po ON m.piquete_origem_id = po.id
            LEFT JOIN piquetes pd ON m.piquete_destino_id = pd.id
            ORDER BY m.data DESC, m.created_at DESC
            LIMIT 5
        `).all();

        // 8. Próximas Ações Sanitárias Críticas
        const proximasSanidades = db.prepare(`
            SELECT 
                s.*,
                a.identificacao as animal_brinco,
                a.categoria as animal_categoria
            FROM sanidade s
            LEFT JOIN animais a ON s.animal_id = a.id
            WHERE s.status != 'aplicada'
            ORDER BY s.data_proxima_dose ASC
            LIMIT 5
        `).all().map(item => {
            let statusCalculado = 'pendente';
            if (item.data_proxima_dose) {
                if (item.data_proxima_dose < todayStr) statusCalculado = 'atrasada';
                else if (item.data_proxima_dose <= in7DaysStr) statusCalculado = 'alerta_vencendo';
            }
            return {
                ...item,
                computed_status: statusCalculado
            };
        });

        // 9. Dados de Ocupação e Lotação dos Piquetes
        const ocupacaoPiquetes = db.prepare(`
            SELECT 
                p.id,
                p.nome,
                p.capacidade_suporte,
                p.tamanho_hectares,
                COUNT(CASE WHEN a.status = 'ativo' THEN 1 END) as total_animais
            FROM piquetes p
            LEFT JOIN animais a ON a.piquete_atual_id = p.id
            GROUP BY p.id
            ORDER BY total_animais DESC
        `).all().map(p => {
            const cap = p.capacidade_suporte || 0;
            const taxa = cap > 0 ? Number(((p.total_animais / cap) * 100).toFixed(1)) : 0;
            const densidade = p.tamanho_hectares > 0 ? Number((p.total_animais / p.tamanho_hectares).toFixed(2)) : 0;
            return {
                ...p,
                taxa_ocupacao_pct: taxa,
                densidade_cab_ha: densidade
            };
        });

        const totalHectaresPastos = ocupacaoPiquetes.reduce((acc, p) => acc + (p.tamanho_hectares || 0), 0);
        const taxaLotacaoGlobal = totalHectaresPastos > 0 ? Number((totalAtivos / totalHectaresPastos).toFixed(2)) : 0;

        // 10. Métricas Agrícolas (Produtividade e Safras)
        const ultimasColheitas = db.prepare(`
            SELECT 
                s.cultura,
                s.quantidade_colhida,
                s.unidade_medida,
                t.area_hectares,
                (s.quantidade_colhida / t.area_hectares) as produtividade_ha,
                s.data_colheita_real
            FROM safras s
            JOIN talhoes t ON s.talhao_id = t.id
            WHERE s.status = 'colhida' AND s.quantidade_colhida > 0 AND t.area_hectares > 0
            GROUP BY s.cultura
            ORDER BY s.data_colheita_real DESC
        `).all().map(c => ({
            ...c,
            produtividade_ha: Number(c.produtividade_ha.toFixed(2))
        }));

        const totalTalhoes = db.prepare(`SELECT COUNT(*) as count FROM talhoes`).get()?.count || 0;
        const safrasAtivas = db.prepare(`SELECT COUNT(*) as count FROM safras WHERE status != 'colhida'`).get()?.count || 0;
        const areaTotalTalhoes = db.prepare(`SELECT COALESCE(SUM(area_hectares), 0) as total FROM talhoes`).get()?.total || 0;

        // 11. Métricas de Patrimônio e Maquinários no Período
        const totalMaquinas = db.prepare(`SELECT COUNT(*) as count FROM maquinas_equipamentos WHERE status = 'ativo'`).get()?.count || 0;
        const totalBenfeitorias = db.prepare(`SELECT COUNT(*) as count FROM benfeitorias`).get()?.count || 0;
        const manutencoesPeriodo = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(valor), 0) as total_gasto 
            FROM manutencoes 
            WHERE data >= ? AND data <= ?
        `).get(dataInicio, dataFim);

        res.json({
            periodo: {
                tipo: tipoPeriodo,
                data_inicio: dataInicio,
                data_fim: dataFim,
                label: labelPeriodo
            },
            mes_referencia: dataInicio.slice(0, 7),
            rebanho: {
                total_ativos: totalAtivos,
                total_vendidos: animaisStats.total_vendidos || 0,
                total_mortos: animaisStats.total_mortos || 0,
                total_geral: animaisStats.total_geral || 0,
                peso_medio_ativos: pesoMedioAtivos,
                distribuicao_categorias: distribuicaoCategorias,
                distribuicao_sexo: distribuicaoSexo
            },
            financeiro: {
                receitas_mes: receitasPeriodo,
                despesas_mes: despesasPeriodo,
                saldo_mes: saldoPeriodo,
                custo_medio_por_animal: custoMedioPorAnimal,
                gasto_folha_mes: gastoFolhaPeriodo,
                despesas_por_categoria: despesasPorCategoria,
                resultado_por_atividade: resultadoPorAtividade
            },
            pastagens: {
                total_hectares: totalHectaresPastos,
                taxa_lotacao_global_cab_ha: taxaLotacaoGlobal,
                ocupacao_piquetes: ocupacaoPiquetes
            },
            rh: {
                total_colaboradores_ativos: totalColaboradores,
                total_folha_prevista: totalSalariosFixos
            },
            agricola: {
                total_talhoes: totalTalhoes,
                area_total_hectares: areaTotalTalhoes,
                safras_ativas: safrasAtivas,
                ultimas_produtividades: ultimasColheitas
            },
            patrimonio: {
                total_maquinas_ativas: totalMaquinas,
                total_benfeitorias: totalBenfeitorias,
                manutencoes_mes_count: manutencoesPeriodo?.count || 0,
                manutencoes_mes_gasto: manutencoesPeriodo?.total_gasto || 0
            },
            sanidade: {
                atrasadas: sanidadeAlertas.atrasadas || 0,
                vencendo_7dias: sanidadeAlertas.vencendo_7dias || 0,
                total_pendentes: sanidadeAlertas.total_pendentes || 0,
                total_aplicadas: sanidadeAlertas.total_aplicadas || 0
            },
            ultimas_movimentacoes: ultimasMovimentacoes,
            proximas_sanidades: proximasSanidades,
            ocupacao_piquetes: ocupacaoPiquetes
        });
    } catch (error) {
        console.error('Erro ao gerar dados do dashboard:', error);
        res.status(500).json({ error: 'Erro ao gerar dados do dashboard' });
    }
});

export default router;
