import React, { useState, useEffect } from 'react';
import { 
    Beef, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShieldAlert, 
    ArrowUpRight, 
    AlertTriangle, 
    Clock, 
    CheckCircle2, 
    Layers,
    Users,
    Sprout,
    Wheat,
    ArrowRight,
    PlusCircle,
    Activity,
    Compass
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b'];

export default function DashboardView({ mesAno, setActiveTab }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const res = await api.getDashboard({ mes_ano: mesAno });
            setData(res);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [mesAno]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-medium">Carregando métricas da fazenda...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
                Erro ao carregar dados do painel: {error || 'Sem dados disponíveis'}
            </div>
        );
    }

    const { 
        rebanho = { total_ativos: 0, total_geral: 0, total_vendidos: 0, distribuicao_categorias: [] }, 
        financeiro = { saldo_mes: 0, receitas_mes: 0, despesas_mes: 0, custo_medio_por_animal: 0, gasto_folha_mes: 0 }, 
        sanidade = { atrasadas: 0, vencendo_7dias: 0, total_pendentes: 0 }, 
        ultimas_movimentacoes: ultimasMovimentacoes = [], 
        proximas_sanidades: proximasSanidades = [], 
        ocupacao_piquetes: ocupacaoPiquetes = [], 
        rh = {}, 
        agricola = {} 
    } = data;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            {/* Top Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 shadow-xl">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Sistema Operacional Ativo
                            </span>
                            <span className="text-xs text-slate-400">• Safra & Manejo 2025/2026</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                            Painel de Controle — Fazenda GD
                        </h2>
                        <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
                            Acompanhe em tempo real os indicadores pecuários, agrícolas, sanitários e o fluxo financeiro da propriedade.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setActiveTab('rebanho')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Beef className="w-4 h-4" />
                            <span>Ver Rebanho</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('financeiro')}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <span>Fluxo de Caixa</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('agricola')}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Sprout className="w-4 h-4 text-amber-400" />
                            <span>Lavouras & Safras</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Top KPI Cards (6 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 1. Rebanho Ativo */}
                <div 
                    onClick={() => setActiveTab('rebanho')}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ativos</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                            <Beef className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-white tracking-tight">
                        {rebanho.total_ativos} <span className="text-xs font-normal text-slate-400">cab.</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                        <span>Total: {rebanho.total_geral}</span>
                        <span className="text-slate-600">•</span>
                        <span>{rebanho.total_vendidos} vend.</span>
                    </div>
                </div>

                {/* 2. Saldo Financeiro do Mês */}
                <div 
                    onClick={() => setActiveTab('financeiro')}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo do Mês</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-110 ${
                            financeiro.saldo_mes >= 0 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-xl font-extrabold tracking-tight ${financeiro.saldo_mes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(financeiro.saldo_mes)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="text-emerald-400/90 font-medium">Rec: {formatCurrency(financeiro.receitas_mes)}</span>
                    </div>
                </div>

                {/* 3. Custo Médio por Animal */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo Médio / Cab.</span>
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-extrabold text-white tracking-tight">
                        {formatCurrency(financeiro.custo_medio_por_animal)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        Despesas ÷ {rebanho.total_ativos} ativos
                    </div>
                </div>

                {/* 4. Total Gasto com Folha de Pagamento */}
                <div 
                    onClick={() => setActiveTab('rh')}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Folha do Mês</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-extrabold text-purple-400 tracking-tight">
                        {formatCurrency(financeiro.gasto_folha_mes || 0)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {rh?.total_colaboradores_ativos || 0} colaboradores ativos
                    </div>
                </div>

                {/* 5. Produtividade Agrícola da Última Safra (Card da Etapa 1) */}
                <div 
                    onClick={() => setActiveTab('agricola')}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produtividade Agrícola</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                            <Sprout className="w-4 h-4" />
                        </div>
                    </div>
                    {agricola?.ultimas_produtividades && agricola.ultimas_produtividades.length > 0 ? (
                        <div>
                            <div className="text-lg font-extrabold text-amber-400 tracking-tight">
                                {agricola.ultimas_produtividades[0].produtividade_ha}{' '}
                                <span className="text-xs font-normal text-slate-400">
                                    {agricola.ultimas_produtividades[0].unidade_medida}/ha
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-300 font-medium truncate">
                                Última safra: {agricola.ultimas_produtividades[0].cultura}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-lg font-extrabold text-white tracking-tight">
                                {agricola?.safras_ativas || 0} <span className="text-xs font-normal text-slate-400">ativas</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400">
                                {agricola?.total_talhoes || 0} talhões cadastrados
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Sanidade e Alertas */}
                <div 
                    onClick={() => setActiveTab('sanidade')}
                    className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sanidade</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-110 ${
                            sanidade.atrasadas > 0 
                                ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                                : sanidade.vencendo_7dias > 0 
                                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' 
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        }`}>
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                        <span>{sanidade.total_pendentes}</span>
                        <span className="text-xs font-normal text-slate-400">pendentes</span>
                    </div>
                    <div className="mt-2 text-[11px] flex items-center gap-1.5">
                        {sanidade.atrasadas > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                                {sanidade.atrasadas} atrasada(s)
                            </span>
                        ) : (
                            <span className="text-emerald-400 font-medium">Rebanho em dia</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rebanho por Categoria */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white tracking-tight">Distribuição do Rebanho por Categoria</h3>
                            <p className="text-xs text-slate-400">Animais atualmente ativos na propriedade</p>
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            {rebanho.total_ativos} animais
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        {rebanho.distribuicao_categorias.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rebanho.distribuicao_categorias} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <XAxis 
                                        dataKey="categoria" 
                                        stroke="#64748b" 
                                        fontSize={11} 
                                        tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1).replace('_', ' ')}
                                    />
                                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                                        labelFormatter={(label) => `Categoria: ${label.charAt(0).toUpperCase() + label.slice(1)}`}
                                    />
                                    <Bar dataKey="quantidade" fill="#10b981" radius={[6, 6, 0, 0]} name="Animais" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">
                                Nenhum animal ativo cadastrado
                            </div>
                        )}
                    </div>
                </div>

                {/* Balanço e Pastos */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight mb-1">Ocupação dos Piquetes</h3>
                        <p className="text-xs text-slate-400 mb-4">Lotação atual de cabeças por pasto</p>

                        <div className="space-y-3">
                            {ocupacaoPiquetes.slice(0, 4).map((p) => {
                                const taxa = p.capacidade_suporte > 0 ? Math.round((p.total_animais / p.capacidade_suporte) * 100) : 0;
                                return (
                                    <div key={p.id} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-slate-200 truncate max-w-[150px]">{p.nome}</span>
                                            <span className="text-slate-400 font-semibold">{p.total_animais} / {p.capacidade_suporte || '-'} cab</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    taxa > 100 ? 'bg-rose-500' : taxa > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${Math.min(taxa, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {ocupacaoPiquetes.length === 0 && (
                                <p className="text-xs text-slate-500">Nenhum piquete cadastrado ainda.</p>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setActiveTab('piquetes')}
                        className="mt-4 w-full py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
                    >
                        <span>Gerenciar Todos os Pastos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bottom Tables: Alertas de Sanidade & Últimas Movimentações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximas Ações Sanitárias */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white tracking-tight">Alertas Sanitários</h3>
                        </div>
                        <button 
                            onClick={() => setActiveTab('sanidade')}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            Ver todos
                        </button>
                    </div>

                    <div className="divide-y divide-slate-700/40">
                        {proximasSanidades.map((san) => (
                            <div key={san.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                    <div className="font-semibold text-xs text-slate-200">{san.nome_produto}</div>
                                    <div className="text-[11px] text-slate-400">
                                        {san.animal_brinco ? `Brinco ${san.animal_brinco}` : (san.lote_ou_grupo || 'Geral')} • {san.tipo}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                        san.computed_status === 'atrasada'
                                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                            : san.computed_status === 'alerta_vencendo'
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    }`}>
                                        {san.computed_status === 'atrasada' ? 'Atrasada' : san.computed_status === 'alerta_vencendo' ? 'Vence em 7 dias' : 'Pendente'}
                                    </span>
                                    <div className="text-[10px] text-slate-500 mt-1">Dose: {san.data_proxima_dose || san.data_aplicacao}</div>
                                </div>
                            </div>
                        ))}
                        {proximasSanidades.length === 0 && (
                            <div className="py-8 text-center text-xs text-slate-500">
                                Nenhuma vacina pendente no momento. Rebanho imunizado!
                            </div>
                        )}
                    </div>
                </div>

                {/* Últimas Movimentações */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white tracking-tight">Últimas Movimentações</h3>
                        </div>
                        <button 
                            onClick={() => setActiveTab('movimentacoes')}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            Ver todas
                        </button>
                    </div>

                    <div className="divide-y divide-slate-700/40">
                        {ultimasMovimentacoes.map((mov) => (
                            <div key={mov.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs text-slate-200">Brinco {mov.animal_brinco}</span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                            mov.tipo === 'venda' ? 'bg-emerald-500/20 text-emerald-300' :
                                            mov.tipo === 'compra' ? 'bg-blue-500/20 text-blue-300' :
                                            mov.tipo === 'morte' ? 'bg-rose-500/20 text-rose-300' :
                                            'bg-purple-500/20 text-purple-300'
                                        }`}>
                                            {mov.tipo}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                        {mov.tipo === 'transferencia' 
                                            ? `${mov.piquete_origem_nome || 'Pasto'} ➔ ${mov.piquete_destino_nome || 'Pasto'}`
                                            : mov.observacao || 'Sem observação'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-slate-300">
                                        {mov.valor > 0 ? formatCurrency(mov.valor) : '-'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{mov.data}</div>
                                </div>
                            </div>
                        ))}
                        {ultimasMovimentacoes.length === 0 && (
                            <div className="py-8 text-center text-xs text-slate-500">
                                Nenhuma movimentação recente registrada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
