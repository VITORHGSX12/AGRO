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
    Compass,
    Calendar,
    Filter
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
    const [tipoPeriodo, setTipoPeriodo] = useState('mes'); // 'mes' | 'safra' | 'personalizado'
    const [selectedMesAno, setSelectedMesAno] = useState(() => mesAno || new Date().toISOString().slice(0, 7));
    const [anoSafra, setAnoSafra] = useState('2025/2026');
    const [dataInicioCustom, setDataInicioCustom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [dataFimCustom, setDataFimCustom] = useState(() => new Date().toISOString().split('T')[0]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const params = {
                tipo_periodo: tipoPeriodo
            };
            if (tipoPeriodo === 'mes') {
                params.mes_ano = selectedMesAno;
            } else if (tipoPeriodo === 'safra') {
                params.ano_safra = anoSafra;
            } else if (tipoPeriodo === 'personalizado') {
                params.data_inicio = dataInicioCustom;
                params.data_fim = dataFimCustom;
            }

            const res = await api.getDashboard(params);
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
    }, [tipoPeriodo, selectedMesAno, anoSafra, dataInicioCustom, dataFimCustom]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-medium">Carregando métricas da fazenda...</span>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
                Erro ao carregar dados do painel: {error || 'Sem dados disponíveis'}
            </div>
        );
    }

    const { 
        periodo = { tipo: 'mes', label: 'Mês Atual' },
        rebanho = { total_ativos: 0, total_geral: 0, total_vendidos: 0, total_mortos: 0, peso_medio_ativos: 0, distribuicao_categorias: [], distribuicao_sexo: [] }, 
        financeiro = { saldo_mes: 0, receitas_mes: 0, despesas_mes: 0, custo_medio_por_animal: 0, gasto_folha_mes: 0, despesas_por_categoria: [] }, 
        pastagens = { total_hectares: 0, taxa_lotacao_global_cab_ha: 0, ocupacao_piquetes: [] },
        sanidade = { atrasadas: 0, vencendo_7dias: 0, total_pendentes: 0, total_aplicadas: 0 }, 
        ultimas_movimentacoes: ultimasMovimentacoes = [], 
        proximas_sanidades: proximasSanidades = [], 
        ocupacao_piquetes: ocupacaoPiquetes = [], 
        rh = { total_colaboradores_ativos: 0, total_folha_prevista: 0 }, 
        agricola = { total_talhoes: 0, area_total_hectares: 0, safras_ativas: 0, ultimas_produtividades: [] },
        patrimonio = { total_maquinas_ativas: 0, total_benfeitorias: 0, manutencoes_mes_count: 0, manutencoes_mes_gasto: 0 }
    } = data || {};

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const formatCategoriaNome = (cat) => {
        if (!cat) return '';
        const nomes = {
            vaca: 'Vaca / Matriz',
            novilha: 'Novilha',
            bezerro: 'Bezerro(a)',
            garrote: 'Garrote',
            boi_gordo: 'Boi Gordo',
            touro: 'Touro / Reprodutor'
        };
        return nomes[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ');
    };

    const formatDespesaCategoria = (cat) => {
        const nomes = {
            insumo_agricola: 'Insumos Agrícolas',
            vacina_medicamento: 'Sanidade & Vacinas',
            nutricao_racao: 'Nutrição & Ração',
            salario: 'Folha & Salários',
            aluguel_pasto_pago: 'Arrendamento Pago',
            manutencao_maquina: 'Manutenção Máquinas',
            manutencao_infra: 'Manutenção Infra',
            combustivel: 'Combustível & Lubrif.',
            compra_animal: 'Aquisição de Animais',
            servicos_terceiros: 'Serviços Terceirizados',
            outros: 'Outros Custos'
        };
        return nomes[cat] || cat;
    };

    return (
        <div className="space-y-6">
            {/* Top Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 shadow-xl">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Sistema em Tempo Real
                            </span>
                            <span className="text-xs text-slate-400">• {periodo?.label || 'Safra & Manejo 2025/2026'}</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                            Painel de Controle — Fazenda GD
                        </h2>
                        <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
                            Indicadores consolidados de pecuária, lavouras, custos operacionais e sanidade calculados diretamente do banco de dados.
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

            {/* SELETOR DE PERÍODO UNIFICADO */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/70 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Período de Análise</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {periodo?.label}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                            Todos os cards e relatórios agregados utilizam a mesma base temporal
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Botões de Seleção do Tipo de Período */}
                    <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700/80">
                        <button
                            onClick={() => setTipoPeriodo('mes')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                tipoPeriodo === 'mes'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => setTipoPeriodo('safra')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                tipoPeriodo === 'safra'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Safra
                        </button>
                        <button
                            onClick={() => setTipoPeriodo('personalizado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                tipoPeriodo === 'personalizado'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Personalizado
                        </button>
                    </div>

                    {/* Controles Dinâmicos baseados no tipo selecionado */}
                    {tipoPeriodo === 'mes' && (
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                            <span className="text-slate-400 text-[11px]">Mês:</span>
                            <input
                                type="month"
                                value={selectedMesAno}
                                onChange={(e) => setSelectedMesAno(e.target.value)}
                                className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer text-xs"
                            />
                        </div>
                    )}

                    {tipoPeriodo === 'safra' && (
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                            <span className="text-slate-400 text-[11px]">Ciclo:</span>
                            <select
                                value={anoSafra}
                                onChange={(e) => setAnoSafra(e.target.value)}
                                className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer text-xs"
                            >
                                <option value="2025/2026" className="bg-slate-900 text-white">Safra 2025/2026</option>
                                <option value="2024/2025" className="bg-slate-900 text-white">Safra 2024/2025</option>
                                <option value="2026/2027" className="bg-slate-900 text-white">Safra 2026/2027</option>
                            </select>
                        </div>
                    )}

                    {tipoPeriodo === 'personalizado' && (
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1 text-xs text-slate-200">
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-[10px]">De:</span>
                                <input
                                    type="date"
                                    value={dataInicioCustom}
                                    onChange={(e) => setDataInicioCustom(e.target.value)}
                                    className="bg-transparent text-slate-100 text-xs focus:outline-none cursor-pointer"
                                />
                            </div>
                            <span className="text-slate-600">|</span>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400 text-[10px]">Até:</span>
                                <input
                                    type="date"
                                    value={dataFimCustom}
                                    onChange={(e) => setDataFimCustom(e.target.value)}
                                    className="bg-transparent text-slate-100 text-xs focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top KPI Cards (6 Cards) - 100% Responsivos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {/* 1. Rebanho Ativo */}
                <div 
                    onClick={() => setActiveTab('rebanho')}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ativos</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                            <Beef className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {rebanho.total_ativos} <span className="text-xs font-normal text-slate-400">cab.</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Peso Médio:</span>
                        <span className="text-emerald-400 font-semibold">{rebanho.peso_medio_ativos || 0} kg</span>
                    </div>
                </div>

                {/* 2. Saldo Financeiro do Período */}
                <div 
                    onClick={() => setActiveTab('financeiro')}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                            Saldo {tipoPeriodo === 'mes' ? 'do Mês' : 'do Período'}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-110 ${
                            financeiro.saldo_mes >= 0 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-lg sm:text-xl font-extrabold tracking-tight truncate ${financeiro.saldo_mes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(financeiro.saldo_mes)}
                    </div>
                    <div className="mt-2 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between gap-1">
                        <span className="text-emerald-400/90 font-medium truncate">Rec: {formatCurrency(financeiro.receitas_mes)}</span>
                        <span className="text-rose-400/90 font-medium truncate">Desp: {formatCurrency(financeiro.despesas_mes)}</span>
                    </div>
                </div>

                {/* 3. Custo Médio por Animal */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Custo / Cab.</span>
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                        {formatCurrency(financeiro.custo_medio_por_animal)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 truncate">
                        Desp. ÷ {rebanho.total_ativos} ativos
                    </div>
                </div>

                {/* 4. Total Gasto com Folha */}
                <div 
                    onClick={() => setActiveTab('rh')}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                            Folha {tipoPeriodo === 'mes' ? 'do Mês' : 'Período'}
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold text-purple-400 tracking-tight truncate">
                        {formatCurrency(financeiro.gasto_folha_mes || 0)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 truncate">
                        {rh?.total_colaboradores_ativos || 0} colaboradores ativos
                    </div>
                </div>

                {/* 5. Produtividade Agrícola */}
                <div 
                    onClick={() => setActiveTab('agricola')}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Produtividade</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                            <Sprout className="w-4 h-4" />
                        </div>
                    </div>
                    {agricola?.ultimas_produtividades && agricola.ultimas_produtividades.length > 0 ? (
                        <div>
                            <div className="text-base sm:text-lg font-extrabold text-amber-400 tracking-tight truncate">
                                {agricola.ultimas_produtividades[0].produtividade_ha}{' '}
                                <span className="text-xs font-normal text-slate-400">
                                    {agricola.ultimas_produtividades[0].unidade_medida || 'sc'}/ha
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-300 font-medium truncate">
                                {agricola.ultimas_produtividades[0].cultura}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                                {agricola?.safras_ativas || 0} <span className="text-xs font-normal text-slate-400">ativas</span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-400 truncate">
                                {agricola?.total_talhoes || 0} talhões cadastrados
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Sanidade e Alertas */}
                <div 
                    onClick={() => setActiveTab('sanidade')}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition cursor-pointer group shadow-sm"
                >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Sanidade</span>
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
                    <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                        <span>{sanidade.total_pendentes}</span>
                        <span className="text-xs font-normal text-slate-400">pendentes</span>
                    </div>
                    <div className="mt-2 text-[10px] sm:text-[11px] flex items-center gap-1.5 truncate">
                        {sanidade.atrasadas > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30 truncate">
                                {sanidade.atrasadas} atrasada(s)
                            </span>
                        ) : sanidade.vencendo_7dias > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30 truncate">
                                {sanidade.vencendo_7dias} a vencer
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
                            <p className="text-xs text-slate-400">Animais ativos e peso médio por lote</p>
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            {rebanho.total_ativos} animais ativos
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        {rebanho.distribuicao_categorias && rebanho.distribuicao_categorias.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rebanho.distribuicao_categorias} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <XAxis 
                                        dataKey="categoria" 
                                        stroke="#64748b" 
                                        fontSize={11} 
                                        tickFormatter={formatCategoriaNome}
                                    />
                                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                                        labelFormatter={(label) => `Categoria: ${formatCategoriaNome(label)}`}
                                        formatter={(val, name, item) => [
                                            `${val} animais (${item.payload.peso_medio > 0 ? item.payload.peso_medio + ' kg méd.' : 'sem peso'})`,
                                            'Quantidade'
                                        ]}
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
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-white tracking-tight">Ocupação dos Piquetes</h3>
                            <span className="text-[11px] font-semibold text-slate-400">
                                {pastagens.taxa_lotacao_global_cab_ha || 0} cab/ha
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">Lotação em tempo real por pasto</p>

                        <div className="space-y-3">
                            {ocupacaoPiquetes.slice(0, 4).map((p) => {
                                const taxa = p.taxa_ocupacao_pct || (p.capacidade_suporte > 0 ? Math.round((p.total_animais / p.capacidade_suporte) * 100) : 0);
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
                        className="mt-4 w-full py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <span>Gerenciar Todos os Pastos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Resultado Financeiro por Atividade */}
            {financeiro.resultado_por_atividade && (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white tracking-tight">Resultado por Atividade ({periodo?.label || 'Período'})</h3>
                        </div>
                        <button
                            onClick={() => setActiveTab('financeiro')}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                        >
                            Ver detalhes no Financeiro →
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {[
                            { key: 'pecuaria', label: 'Pecuária', icon: '🐄', border: 'border-amber-500/20 bg-amber-500/5' },
                            { key: 'agricola', label: 'Agrícola', icon: '🌾', border: 'border-emerald-500/20 bg-emerald-500/5' },
                            { key: 'rh', label: 'Equipe & RH', icon: '👥', border: 'border-purple-500/20 bg-purple-500/5' },
                            { key: 'geral', label: 'Geral & Infra', icon: '⚙️', border: 'border-blue-500/20 bg-blue-500/5' },
                        ].map(({ key, label, icon, border }) => {
                            const resAtiv = financeiro.resultado_por_atividade[key] || { receitas: 0, despesas: 0, saldo: 0 };
                            return (
                                <div key={key} className={`p-3.5 rounded-xl border ${border}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                            <span>{icon}</span> {label}
                                        </span>
                                        <span className={`text-[11px] font-bold ${resAtiv.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {resAtiv.saldo >= 0 ? '+ ' : ''}{formatCurrency(resAtiv.saldo)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-700/50">
                                        <span>Rec: <strong className="text-emerald-400">{formatCurrency(resAtiv.receitas)}</strong></span>
                                        <span>Desp: <strong className="text-rose-400">{formatCurrency(resAtiv.despesas)}</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Middle Section: Despesas do Mês & Patrimônio */}
            {financeiro.despesas_por_categoria && financeiro.despesas_por_categoria.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white tracking-tight">Composição das Despesas ({periodo?.label || 'Período'})</h3>
                        </div>
                        <span className="text-xs text-rose-400 font-semibold">
                            Total: {formatCurrency(financeiro.despesas_mes)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                        {financeiro.despesas_por_categoria.map((item, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                                <div className="text-[11px] text-slate-400 truncate">{formatDespesaCategoria(item.categoria)}</div>
                                <div className="text-sm font-bold text-slate-100 mt-0.5">{formatCurrency(item.total)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
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
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
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
