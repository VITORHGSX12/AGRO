import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/dashboard - Métricas consolidadas do Dashboard
router.get('/', (req, res) => {
    try {
        const today = new Date();
        const currentYearMonth = req.query.mes_ano || today.toISOString().slice(0, 7); // 'YYYY-MM'
        const todayStr = today.toISOString().split('T')[0];

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

        // 4. Métricas Financeiras do Mês
        const financeiroMes = db.prepare(`
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
                COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas,
                COALESCE(SUM(CASE WHEN categoria = 'salario' THEN valor ELSE 0 END), 0) as gasto_folha
            FROM financeiro
            WHERE data LIKE ?
        `).get(`${currentYearMonth}%`);

        const receitasMes = Number(financeiroMes.receitas || 0);
        const despesasMes = Number(financeiroMes.despesas || 0);
        const gastoFolhaMes = Number(financeiroMes.gasto_folha || 0);
        const saldoMes = Number((receitasMes - despesasMes).toFixed(2));

        // 4.1 Despesas por Categoria no Mês
        const despesasPorCategoria = db.prepare(`
            SELECT 
                categoria,
                SUM(valor) as total
            FROM financeiro
            WHERE tipo = 'despesa' AND data LIKE ?
            GROUP BY categoria
            ORDER BY total DESC
        `).all(`${currentYearMonth}%`);

        // 5. Custo Médio por Animal no Mês = Despesas do Mês / Total de Ativos
        const custoMedioPorAnimal = totalAtivos > 0 ? Number((despesasMes / totalAtivos).toFixed(2)) : 0;

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

        // 8. Próximas Ações Sanitárias Críticas (Atrasadas ou Próximas)
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

        // 11. Métricas de Patrimônio e Maquinários
        const totalMaquinas = db.prepare(`SELECT COUNT(*) as count FROM maquinas_equipamentos WHERE status = 'ativo'`).get()?.count || 0;
        const totalBenfeitorias = db.prepare(`SELECT COUNT(*) as count FROM benfeitorias`).get()?.count || 0;
        const manutencoesMes = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(valor), 0) as total_gasto 
            FROM manutencoes 
            WHERE data LIKE ?
        `).get(`${currentYearMonth}%`);

        res.json({
            mes_referencia: currentYearMonth,
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
                receitas_mes: receitasMes,
                despesas_mes: despesasMes,
                saldo_mes: saldoMes,
                custo_medio_por_animal: custoMedioPorAnimal,
                gasto_folha_mes: gastoFolhaMes,
                despesas_por_categoria: despesasPorCategoria
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
                manutencoes_mes_count: manutencoesMes?.count || 0,
                manutencoes_mes_gasto: manutencoesMes?.total_gasto || 0
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
