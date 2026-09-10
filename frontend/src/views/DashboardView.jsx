import React, { useState, useEffect } from 'react';
import { 
    Beef, 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShieldAlert, 
    Clock, 
    CheckCircle2, 
    Layers,
    Users,
    Sprout,
    ArrowRight,
    Calendar,
    ArrowLeftRight,
    Activity,
    ChevronRight,
    AlertCircle
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

const GREEN_PALETTE = ['#087F5B', '#159A70', '#20C997', '#D9A441', '#3978C7', '#64748B', '#845EC2', '#FF9671'];

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
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-[#64748B] font-medium">Carregando métricas da operação...</span>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-6 bg-[#FEF2F2] border border-[#FACDCD] rounded-2xl text-[#D64545] text-sm">
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
            vacina_medicamento: 'Sanidade & Medicamentos',
            nutricao_racao: 'Nutrição & Ração',
            salario: 'Folha de Pagamento',
            aluguel_pasto_pago: 'Arrendamento Pastos',
            manutencao_maquina: 'Manutenção Máquinas',
            manutencao_infra: 'Manutenção Infraestrutura',
            combustivel: 'Combustível & Lubrif.',
            compra_animal: 'Aquisição de Animais',
            servicos_terceiros: 'Serviços Terceirizados',
            outros: 'Outros Custos'
        };
        return nomes[cat] || cat;
    };

    // Formatação de data em português
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());

    return (
        <div className="space-y-6">
            {/* 1. Header de Boas-Vindas */}
            <div className="bg-white border border-[#E6EBE8] rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl md:text-2xl font-bold text-[#172033] tracking-tight">
                                Bom dia, Fazenda GD 👋
                            </span>
                        </div>
                        <p className="text-sm text-[#64748B]">
                            Aqui está o resumo da sua operação hoje.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5EF] border border-[#C3E6D6] text-xs font-semibold text-[#087F5B]">
                            <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse"></span>
                            <span>Operação em tempo real</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F9F8] border border-[#E6EBE8] text-xs font-medium text-[#64748B]">
                            <Calendar className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                            <span>{dataFormatada}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="mt-5 pt-4 border-t border-[#E6EBE8] flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setActiveTab('rebanho')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F5EF] hover:text-[#087F5B] text-[#172033] border border-[#E6EBE8] font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Beef className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span>Ver Rebanho</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F5EF] hover:text-[#087F5B] text-[#172033] border border-[#E6EBE8] font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <DollarSign className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span>Fluxo de Caixa</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('piquetes')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F5EF] hover:text-[#087F5B] text-[#172033] border border-[#E6EBE8] font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Layers className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span>Pastagens & Lotação</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('agricola')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F5EF] hover:text-[#087F5B] text-[#172033] border border-[#E6EBE8] font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Sprout className="w-3.5 h-3.5 text-[#D9A441]" strokeWidth={1.75} />
                        <span>Lavouras & Safras</span>
                    </button>
                </div>
            </div>

            {/* 2. Seletor de Período Unificado */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B] shrink-0">
                        <Calendar className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[#172033] flex items-center gap-2">
                            <span>Período de Análise:</span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#E8F5EF] text-[#087F5B]">
                                {periodo?.label}
                            </span>
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                            Todos os indicadores consolidados abaixo utilizam este intervalo temporal
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Segmented Control */}
                    <div className="flex rounded-xl bg-[#F7F9F8] p-1 border border-[#E6EBE8]">
                        <button
                            onClick={() => setTipoPeriodo('mes')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                tipoPeriodo === 'mes'
                                    ? 'bg-[#087F5B] text-white shadow-xs'
                                    : 'text-[#64748B] hover:text-[#172033]'
                            }`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => setTipoPeriodo('safra')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                tipoPeriodo === 'safra'
                                    ? 'bg-[#087F5B] text-white shadow-xs'
                                    : 'text-[#64748B] hover:text-[#172033]'
                            }`}
                        >
                            Safra
                        </button>
                        <button
                            onClick={() => setTipoPeriodo('personalizado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                tipoPeriodo === 'personalizado'
                                    ? 'bg-[#087F5B] text-white shadow-xs'
                                    : 'text-[#64748B] hover:text-[#172033]'
                            }`}
                        >
                            Personalizado
                        </button>
                    </div>

                    {/* Dynamic Inputs */}
                    {tipoPeriodo === 'mes' && (
                        <div className="flex items-center gap-1.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1.5 text-xs text-[#172033]">
                            <span className="text-[#64748B] text-[11px]">Mês:</span>
                            <input
                                type="month"
                                value={selectedMesAno}
                                onChange={(e) => setSelectedMesAno(e.target.value)}
                                className="bg-transparent text-[#172033] font-semibold focus:outline-none cursor-pointer text-xs"
                            />
                        </div>
                    )}

                    {tipoPeriodo === 'safra' && (
                        <div className="flex items-center gap-1.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1.5 text-xs text-[#172033]">
                            <span className="text-[#64748B] text-[11px]">Ciclo:</span>
                            <select
                                value={anoSafra}
                                onChange={(e) => setAnoSafra(e.target.value)}
                                className="bg-transparent text-[#087F5B] font-semibold focus:outline-none cursor-pointer text-xs"
                            >
                                <option value="2025/2026">Safra 2025/2026</option>
                                <option value="2024/2025">Safra 2024/2025</option>
                                <option value="2026/2027">Safra 2026/2027</option>
                            </select>
                        </div>
                    )}

                    {tipoPeriodo === 'personalizado' && (
                        <div className="flex items-center gap-2 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1 text-xs text-[#172033]">
                            <div className="flex items-center gap-1">
                                <span className="text-[#64748B] text-[10px]">De:</span>
                                <input
                                    type="date"
                                    value={dataInicioCustom}
                                    onChange={(e) => setDataInicioCustom(e.target.value)}
                                    className="bg-transparent text-[#172033] text-xs focus:outline-none cursor-pointer"
                                />
                            </div>
                            <span className="text-[#CBD5E1]">|</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[#64748B] text-[10px]">Até:</span>
                                <input
                                    type="date"
                                    value={dataFimCustom}
                                    onChange={(e) => setDataFimCustom(e.target.value)}
                                    className="bg-transparent text-[#172033] text-xs focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Cards Flutuantes Principais (6 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* 1. Total de Animais */}
                <div 
                    onClick={() => setActiveTab('rebanho')}
                    className="saas-card p-5 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Animais</span>
                        <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B] group-hover:scale-105 transition">
                            <Beef className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-[#172033] tracking-tight">
                        {rebanho.total_ativos} <span className="text-xs font-normal text-[#64748B]">cab.</span>
                    </div>
                    <div className="mt-2 text-xs text-[#64748B] flex items-center justify-between">
                        <span>Peso Médio:</span>
                        <span className="text-[#087F5B] font-semibold">{rebanho.peso_medio_ativos || 0} kg</span>
                    </div>
                </div>

                {/* 2. Saldo Financeiro */}
                <div 
                    onClick={() => setActiveTab('financeiro')}
                    className="saas-card p-5 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">
                            Saldo {tipoPeriodo === 'mes' ? 'do Mês' : 'do Período'}
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-105 ${
                            financeiro.saldo_mes >= 0 
                                ? 'bg-[#E8F5EF] text-[#087F5B]' 
                                : 'bg-[#FEF2F2] text-[#D64545]'
                        }`}>
                            <DollarSign className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className={`text-xl font-bold tracking-tight truncate ${financeiro.saldo_mes >= 0 ? 'text-[#087F5B]' : 'text-[#D64545]'}`}>
                        {formatCurrency(financeiro.saldo_mes)}
                    </div>
                    <div className="mt-2 text-[11px] text-[#64748B] flex items-center justify-between gap-1">
                        <span className="text-[#087F5B] font-medium truncate">Rec: {formatCurrency(financeiro.receitas_mes)}</span>
                        <span className="text-[#D64545] font-medium truncate">Desp: {formatCurrency(financeiro.despesas_mes)}</span>
                    </div>
                </div>

                {/* 3. Custo Médio por Animal */}
                <div className="saas-card-static p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">Custo / Cabeça</span>
                        <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#3978C7] flex items-center justify-center">
                            <TrendingDown className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-[#172033] tracking-tight truncate">
                        {formatCurrency(financeiro.custo_medio_por_animal)}
                    </div>
                    <div className="mt-2 text-xs text-[#64748B] truncate">
                        Despesas ÷ {rebanho.total_ativos} ativos
                    </div>
                </div>

                {/* 4. Folha de Pagamento */}
                <div 
                    onClick={() => setActiveTab('rh')}
                    className="saas-card p-5 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">Folha & Salários</span>
                        <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center group-hover:scale-105 transition">
                            <Users className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-[#172033] tracking-tight truncate">
                        {formatCurrency(financeiro.gasto_folha_mes || 0)}
                    </div>
                    <div className="mt-2 text-xs text-[#64748B] truncate">
                        {rh?.total_colaboradores_ativos || 0} colaboradores ativos
                    </div>
                </div>

                {/* 5. Lavouras & Safras */}
                <div 
                    onClick={() => setActiveTab('agricola')}
                    className="saas-card p-5 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">Lavouras & Safras</span>
                        <div className="w-8 h-8 rounded-xl bg-[#FEF9E7] text-[#D9A441] flex items-center justify-center group-hover:scale-105 transition">
                            <Sprout className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                    </div>
                    {agricola?.ultimas_produtividades && agricola.ultimas_produtividades.length > 0 ? (
                        <div>
                            <div className="text-lg font-bold text-[#D9A441] tracking-tight truncate">
                                {agricola.ultimas_produtividades[0].produtividade_ha}{' '}
                                <span className="text-xs font-normal text-[#64748B]">
                                    {agricola.ultimas_produtividades[0].unidade_medida || 'sc'}/ha
                                </span>
                            </div>
                            <div className="mt-1 text-xs text-[#64748B] font-medium truncate">
                                {agricola.ultimas_produtividades[0].cultura}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-xl font-bold text-[#172033] tracking-tight">
                                {agricola?.safras_ativas || 0} <span className="text-xs font-normal text-[#64748B]">ativas</span>
                            </div>
                            <div className="mt-1 text-xs text-[#64748B] truncate">
                                {agricola?.total_talhoes || 0} talhões cadastrados
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Sanidade & Alertas */}
                <div 
                    onClick={() => setActiveTab('sanidade')}
                    className="saas-card p-5 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">Sanidade</span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition group-hover:scale-105 ${
                            sanidade.atrasadas > 0 
                                ? 'bg-[#FEF2F2] text-[#D64545]' 
                                : sanidade.vencendo_7dias > 0 
                                ? 'bg-[#FEF9E7] text-[#D99A22]' 
                                : 'bg-[#E8F5EF] text-[#087F5B]'
                        }`}>
                            <ShieldAlert className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-[#172033] tracking-tight flex items-baseline gap-1.5">
                        <span>{sanidade.total_pendentes}</span>
                        <span className="text-xs font-normal text-[#64748B]">pendentes</span>
                    </div>
                    <div className="mt-2 text-xs truncate">
                        {sanidade.atrasadas > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#D64545] font-semibold">
                                {sanidade.atrasadas} atrasada(s)
                            </span>
                        ) : sanidade.vencendo_7dias > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#FEF9E7] text-[#D99A22] font-semibold">
                                {sanidade.vencendo_7dias} a vencer
                            </span>
                        ) : (
                            <span className="text-[#087F5B] font-medium">Rebanho 100% em dia</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. ÁREA PRINCIPAL: Resumo do Rebanho + Ocupação dos Pastos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resumo do Rebanho (BarChart & Categorias) */}
                <div className="lg:col-span-2 saas-card-static p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold text-[#172033] tracking-tight">Resumo do Rebanho</h3>
                            <p className="text-xs text-[#64748B]">Distribuição de animais ativos por categoria zootécnica</p>
                        </div>
                        <span className="text-xs text-[#087F5B] font-semibold bg-[#E8F5EF] px-3 py-1 rounded-full border border-[#C3E6D6]">
                            {rebanho.total_ativos} animais ativos
                        </span>
                    </div>

                    <div className="h-68 w-full">
                        {rebanho.distribuicao_categorias && rebanho.distribuicao_categorias.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rebanho.distribuicao_categorias} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <XAxis 
                                        dataKey="categoria" 
                                        stroke="#64748b" 
                                        fontSize={12} 
                                        tickFormatter={formatCategoriaNome}
                                        tickLine={false}
                                        axisLine={{ stroke: '#E6EBE8' }}
                                    />
                                    <YAxis 
                                        stroke="#64748b" 
                                        fontSize={12} 
                                        allowDecimals={false} 
                                        tickLine={false}
                                        axisLine={{ stroke: '#E6EBE8' }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#F7F9F8' }}
                                        contentStyle={{ 
                                            backgroundColor: '#FFFFFF', 
                                            borderColor: '#E6EBE8', 
                                            borderRadius: '12px', 
                                            fontSize: '12px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                                        }}
                                        labelFormatter={(label) => `Categoria: ${formatCategoriaNome(label)}`}
                                        formatter={(val, name, item) => [
                                            `${val} animais (${item.payload.peso_medio > 0 ? item.payload.peso_medio + ' kg méd.' : 'sem peso'})`,
                                            'Quantidade'
                                        ]}
                                    />
                                    <Bar dataKey="quantidade" fill="#087F5B" radius={[6, 6, 0, 0]} name="Animais" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
                                Nenhum animal ativo cadastrado
                            </div>
                        )}
                    </div>
                </div>

                {/* Ocupação dos Pastos */}
                <div className="saas-card-static p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-bold text-[#172033] tracking-tight">Ocupação dos Pastos</h3>
                            <span className="text-xs font-semibold text-[#087F5B] bg-[#E8F5EF] px-2 py-0.5 rounded">
                                {pastagens.taxa_lotacao_global_cab_ha || 0} cab/ha
                            </span>
                        </div>
                        <p className="text-xs text-[#64748B] mb-5">Capacidade e lotação por piquete</p>

                        <div className="space-y-3.5">
                            {ocupacaoPiquetes.slice(0, 4).map((p) => {
                                const taxa = p.taxa_ocupacao_pct || (p.capacidade_suporte > 0 ? Math.round((p.total_animais / p.capacidade_suporte) * 100) : 0);
                                const statusColor = taxa > 100 ? 'bg-[#D64545]' : taxa > 80 ? 'bg-[#D99A22]' : 'bg-[#087F5B]';
                                const statusLabel = taxa > 100 ? 'Lotado' : taxa > 80 ? 'Atenção' : 'Normal';
                                return (
                                    <div key={p.id} className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8]">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-semibold text-[#172033] truncate max-w-[140px]">{p.nome}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[#64748B] font-medium">{p.total_animais} / {p.capacidade_suporte || '-'} cab</span>
                                                <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-[#E6EBE8] rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
                                                style={{ width: `${Math.min(taxa, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {ocupacaoPiquetes.length === 0 && (
                                <p className="text-xs text-[#64748B] text-center py-6">Nenhum pasto cadastrado ainda.</p>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setActiveTab('piquetes')}
                        className="mt-5 w-full py-2.5 bg-white hover:bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl text-xs font-semibold text-[#172033] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <span>Gerenciar Todos os Pastos</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#087F5B]" />
                    </button>
                </div>
            </div>

            {/* 5. ÁREA SECUNDÁRIA: Resultado por Atividade & Composição de Despesas */}
            {financeiro.resultado_por_atividade && (
                <div className="saas-card-static p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                <DollarSign className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#172033] tracking-tight">
                                    Desempenho Financeiro por Atividade
                                </h3>
                                <p className="text-xs text-[#64748B]">Resultado operacional segregado ({periodo?.label})</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('financeiro')}
                            className="text-xs text-[#087F5B] hover:underline font-semibold cursor-pointer"
                        >
                            Ver detalhes no Financeiro →
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                        {[
                            { key: 'pecuaria', label: 'Pecuária', icon: '🐄', badgeColor: 'text-[#D9A441] bg-[#FEF9E7]' },
                            { key: 'agricola', label: 'Agrícola', icon: '🌾', badgeColor: 'text-[#087F5B] bg-[#E8F5EF]' },
                            { key: 'rh', label: 'Equipe & RH', icon: '👥', badgeColor: 'text-[#9333EA] bg-[#FAF5FF]' },
                            { key: 'geral', label: 'Geral & Infra', icon: '⚙️', badgeColor: 'text-[#3978C7] bg-[#EFF6FF]' },
                        ].map(({ key, label, icon, badgeColor }) => {
                            const resAtiv = financeiro.resultado_por_atividade[key] || { receitas: 0, despesas: 0, saldo: 0 };
                            return (
                                <div key={key} className="p-4 rounded-xl bg-white border border-[#E6EBE8] hover:border-[#087F5B]/40 transition shadow-2xs">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${badgeColor}`}>{icon}</span>
                                            {label}
                                        </span>
                                        <span className={`text-xs font-bold ${resAtiv.saldo >= 0 ? 'text-[#087F5B]' : 'text-[#D64545]'}`}>
                                            {resAtiv.saldo >= 0 ? '+ ' : ''}{formatCurrency(resAtiv.saldo)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#E6EBE8]">
                                        <span>Rec: <strong className="text-[#087F5B]">{formatCurrency(resAtiv.receitas)}</strong></span>
                                        <span>Desp: <strong className="text-[#D64545]">{formatCurrency(resAtiv.despesas)}</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 6. ALERTAS & PRÓXIMAS ATIVIDADES */}
            {sanidade.atrasadas > 0 && (
                <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FACDCD] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#D64545]/10 text-[#D64545] flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-[#D64545]">Atenção Sanitária</div>
                            <div className="text-xs text-[#9B1C1C]">
                                Existem {sanidade.atrasadas} dose(s) de vacinas/medicamentos atrasadas no rebanho.
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveTab('sanidade')}
                        className="px-3.5 py-1.5 bg-[#D64545] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
                    >
                        Ver detalhes →
                    </button>
                </div>
            )}

            {/* 7. TABELAS: Próximas Ações & Últimas Movimentações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximas Atividades Sanitárias */}
                <div className="saas-card-static p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                <ShieldAlert className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#172033] tracking-tight">Próximas Atividades</h3>
                                <p className="text-xs text-[#64748B]">Cronograma e aplicações agendadas</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveTab('sanidade')}
                            className="text-xs text-[#087F5B] hover:underline font-semibold cursor-pointer"
                        >
                            Ver todas
                        </button>
                    </div>

                    <div className="divide-y divide-[#E6EBE8]">
                        {proximasSanidades.map((san) => (
                            <div key={san.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                    <div className="font-semibold text-xs text-[#172033]">{san.nome_produto}</div>
                                    <div className="text-[11px] text-[#64748B] mt-0.5">
                                        {san.animal_brinco ? `Brinco ${san.animal_brinco}` : (san.lote_ou_grupo || 'Geral')} • {san.tipo}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                        san.computed_status === 'atrasada'
                                            ? 'bg-[#FEF2F2] text-[#D64545] border-[#FACDCD]'
                                            : san.computed_status === 'alerta_vencendo'
                                            ? 'bg-[#FEF9E7] text-[#D99A22] border-[#FDE8B3]'
                                            : 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]'
                                    }`}>
                                        {san.computed_status === 'atrasada' ? 'Atrasada' : san.computed_status === 'alerta_vencendo' ? 'Vence em 7 dias' : 'Pendente'}
                                    </span>
                                    <div className="text-[10px] text-[#64748B] mt-1">
                                        Dose: {san.data_proxima_dose || san.data_aplicacao}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {proximasSanidades.length === 0 && (
                            <div className="py-10 text-center text-xs text-[#64748B]">
                                Nenhuma vacina pendente no momento. Rebanho 100% imunizado!
                            </div>
                        )}
                    </div>
                </div>

                {/* Últimas Movimentações */}
                <div className="saas-card-static p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                <ArrowLeftRight className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#172033] tracking-tight">Últimas Movimentações</h3>
                                <p className="text-xs text-[#64748B]">Histórico recente de campo</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveTab('movimentacoes')}
                            className="text-xs text-[#087F5B] hover:underline font-semibold cursor-pointer"
                        >
                            Ver todas
                        </button>
                    </div>

                    <div className="divide-y divide-[#E6EBE8]">
                        {ultimasMovimentacoes.map((mov) => (
                            <div key={mov.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs text-[#172033]">Brinco {mov.animal_brinco}</span>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            mov.tipo === 'venda' ? 'bg-[#E8F5EF] text-[#087F5B]' :
                                            mov.tipo === 'compra' ? 'bg-[#EFF6FF] text-[#3978C7]' :
                                            mov.tipo === 'morte' ? 'bg-[#FEF2F2] text-[#D64545]' :
                                            'bg-[#FAF5FF] text-[#9333EA]'
                                        }`}>
                                            {mov.tipo}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-[#64748B] mt-1">
                                        {mov.tipo === 'transferencia' 
                                            ? `${mov.piquete_origem_nome || 'Pasto'} ➔ ${mov.piquete_destino_nome || 'Pasto'}`
                                            : mov.observacao || 'Sem observação'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-semibold text-[#172033]">
                                        {mov.valor > 0 ? formatCurrency(mov.valor) : '-'}
                                    </div>
                                    <div className="text-[10px] text-[#64748B] mt-0.5">{mov.data}</div>
                                </div>
                            </div>
                        ))}
                        {ultimasMovimentacoes.length === 0 && (
                            <div className="py-10 text-center text-xs text-[#64748B]">
                                Nenhuma movimentação recente registrada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
