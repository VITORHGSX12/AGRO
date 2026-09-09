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

        // 1. Contagem de Rebanho
        const animaisCount = db.prepare(`
            SELECT 
                COUNT(CASE WHEN status = 'ativo' THEN 1 END) as total_ativos,
                COUNT(CASE WHEN status = 'vendido' THEN 1 END) as total_vendidos,
                COUNT(CASE WHEN status = 'morto' THEN 1 END) as total_mortos,
                COUNT(*) as total_geral
            FROM animais
        `).get();

        const totalAtivos = animaisCount.total_ativos || 0;

        // 2. Distribuição por Categoria (Apenas Ativos)
        const distribuicaoCategorias = db.prepare(`
            SELECT 
                categoria,
                COUNT(*) as quantidade
            FROM animais
            WHERE status = 'ativo'
            GROUP BY categoria
            ORDER BY quantidade DESC
        `).all();

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

        const receitasMes = financeiroMes.receitas || 0;
        const despesasMes = financeiroMes.despesas || 0;
        const gastoFolhaMes = financeiroMes.gasto_folha || 0;
        const saldoMes = receitasMes - despesasMes;

        // 5. Custo Médio por Animal no Mês = Despesas do Mês / Total de Ativos
        const custoMedioPorAnimal = totalAtivos > 0 ? (despesasMes / totalAtivos) : 0;

        // 5.1 Contagem de Colaboradores Ativos
        const totalColaboradores = db.prepare(`SELECT COUNT(*) as count FROM funcionarios WHERE status = 'ativo'`).get()?.count || 0;

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
                END) as total_pendentes
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

        // 9. Dados de Ocupação dos Piquetes
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
        `).all();

        // 10. Métricas Agrícolas (Produtividade da última safra colhida por cultura)
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

        res.json({
            mes_referencia: currentYearMonth,
            rebanho: {
                total_ativos: totalAtivos,
                total_vendidos: animaisCount.total_vendidos || 0,
                total_mortos: animaisCount.total_mortos || 0,
                total_geral: animaisCount.total_geral || 0,
                distribuicao_categorias: distribuicaoCategorias,
                distribuicao_sexo: distribuicaoSexo
            },
            financeiro: {
                receitas_mes: receitasMes,
                despesas_mes: despesasMes,
                saldo_mes: saldoMes,
                custo_medio_por_animal: custoMedioPorAnimal,
                gasto_folha_mes: gastoFolhaMes
            },
            rh: {
                total_colaboradores_ativos: totalColaboradores
            },
            agricola: {
                total_talhoes: totalTalhoes,
                safras_ativas: safrasAtivas,
                ultimas_produtividades: ultimasColheitas
            },
            sanidade: {
                atrasadas: sanidadeAlertas.atrasadas || 0,
                vencendo_7dias: sanidadeAlertas.vencendo_7dias || 0,
                total_pendentes: sanidadeAlertas.total_pendentes || 0
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
