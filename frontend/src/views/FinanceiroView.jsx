import React, { useState, useEffect } from 'react';
import { 
    CircleDollarSign, 
    TrendingUp, 
    TrendingDown, 
    Plus, 
    Trash2, 
    Calendar,
    X,
    Check,
    PieChart as PieIcon,
    Filter,
    Download,
    RefreshCw,
    Layers,
    Beef,
    Sprout,
    Users,
    Wrench
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCSV } from '../utils/csvExporter';
import Pagination from '../components/Pagination';

export const ATIVIDADES_CONFIG = [
    { value: 'pecuaria', label: 'Pecuária', icon: Beef, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { value: 'agricola', label: 'Agrícola', icon: Sprout, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { value: 'rh', label: 'Equipe & RH', icon: Users, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { value: 'geral', label: 'Geral / Infra', icon: Wrench, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
];

export const CATEGORIAS_CONFIG = [
    { value: 'venda_animal', label: 'Venda de Animais / Boi', tipoPadrao: 'receita', atividadePadrao: 'pecuaria' },
    { value: 'compra_animal', label: 'Compra de Animais / Reposição', tipoPadrao: 'despesa', atividadePadrao: 'pecuaria' },
    { value: 'venda_agricola', label: 'Venda Agrícola / Colheita', tipoPadrao: 'receita', atividadePadrao: 'agricola' },
    { value: 'insumo_agricola', label: 'Insumos Agrícolas / Adubo / Semente', tipoPadrao: 'despesa', atividadePadrao: 'agricola' },
    { value: 'vacina_medicamento', label: 'Vacinas & Medicamentos', tipoPadrao: 'despesa', atividadePadrao: 'pecuaria' },
    { value: 'nutricao_racao', label: 'Nutrição & Sal Mineral', tipoPadrao: 'despesa', atividadePadrao: 'pecuaria' },
    { value: 'salario', label: 'Salários & Folha de Pagamento', tipoPadrao: 'despesa', atividadePadrao: 'rh' },
    { value: 'aluguel_pasto', label: 'Aluguel de Pastagem / Arrendamento', tipoPadrao: 'despesa', atividadePadrao: 'pecuaria' },
    { value: 'aluguel_pasto_pago', label: 'Arrendamento Pago (Pastagem)', tipoPadrao: 'despesa', atividadePadrao: 'pecuaria' },
    { value: 'aluguel_pasto_recebido', label: 'Arrendamento Recebido (Pastagem)', tipoPadrao: 'receita', atividadePadrao: 'pecuaria' },
    { value: 'manutencao_infra', label: 'Manutenção de Cercas & Infra', tipoPadrao: 'despesa', atividadePadrao: 'geral' },
    { value: 'manutencao_maquina', label: 'Manutenção de Máquinas & Veículos', tipoPadrao: 'despesa', atividadePadrao: 'geral' },
    { value: 'combustivel', label: 'Combustível & Lubrificantes', tipoPadrao: 'despesa', atividadePadrao: 'geral' },
    { value: 'servicos_terceiros', label: 'Serviços de Terceiros & Frete', tipoPadrao: 'despesa', atividadePadrao: 'geral' },
    { value: 'outros', label: 'Outras Receitas / Despesas', tipoPadrao: 'despesa', atividadePadrao: 'geral' }
];

export default function FinanceiroView({ mesAno, onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [lancamentos, setLancamentos] = useState([]);
    const [resumo, setResumo] = useState({ 
        total_receitas: 0, 
        total_despesas: 0, 
        saldo: 0, 
        detalhe_categorias: [],
        por_atividade: {
            pecuaria: { receitas: 0, despesas: 0, saldo: 0 },
            agricola: { receitas: 0, despesas: 0, saldo: 0 },
            rh: { receitas: 0, despesas: 0, saldo: 0 },
            geral: { receitas: 0, despesas: 0, saldo: 0 }
        }
    });
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroAtividade, setFiltroAtividade] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tipo: 'despesa',
        categoria: 'nutricao_racao',
        atividade: 'pecuaria',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        descricao: ''
    });
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const queryParams = {
                tipo: filtroTipo || undefined,
                categoria: filtroCategoria || undefined,
                atividade: filtroAtividade || undefined,
                data_inicio: dataInicio || undefined,
                data_fim: dataFim || undefined
            };

            // Se não houver filtro de período específico, filtra pelo mês selecionado
            if (!dataInicio && !dataFim && mesAno) {
                queryParams.mes_ano = mesAno;
            }

            const [listData, resData] = await Promise.all([
                api.getFinanceiro(queryParams),
                api.getResumoFinanceiro(queryParams)
            ]);
            setLancamentos(listData);
            setResumo(resData);
            setCurrentPage(1); // Reset page on filter change
        } catch (err) {
            console.error('Erro ao carregar dados financeiros:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [mesAno, filtroTipo, filtroCategoria, filtroAtividade, dataInicio, dataFim]);

    useEffect(() => {
        if (triggerNewModal) {
            handleOpenNew();
            onResetTrigger();
        }
    }, [triggerNewModal]);

    const handleOpenNew = () => {
        setFormData({
            tipo: 'despesa',
            categoria: 'nutricao_racao',
            atividade: 'pecuaria',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            descricao: ''
        });
        setErrorMsg('');
        setModalOpen(true);
    };

    const handleCategoryChange = (catValue) => {
        const catConfig = CATEGORIAS_CONFIG.find(c => c.value === catValue);
        setFormData(prev => ({
            ...prev,
            categoria: catValue,
            tipo: catConfig?.tipoPadrao || prev.tipo,
            atividade: catConfig?.atividadePadrao || prev.atividade
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');

        try {
            await api.createFinanceiro({
                ...formData,
                valor: Number(formData.valor)
            });
            setModalOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja excluir este lançamento financeiro?')) return;
        try {
            await api.deleteFinanceiro(id);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleExportCSV = () => {
        const columns = [
            { header: 'ID', accessor: (row) => row.id },
            { header: 'Data', accessor: (row) => row.data },
            { header: 'Tipo', accessor: (row) => row.tipo === 'receita' ? 'Receita' : 'Despesa' },
            { header: 'Atividade', accessor: (row) => ATIVIDADES_CONFIG.find(a => a.value === row.atividade)?.label || row.atividade || 'Geral' },
            { header: 'Categoria', accessor: (row) => CATEGORIAS_CONFIG.find(c => c.value === row.categoria)?.label || row.categoria },
            { header: 'Descrição', accessor: (row) => row.descricao || '' },
            { header: 'Brinco Animal', accessor: (row) => row.animal_brinco || '' },
            { header: 'Valor (R$)', accessor: (row) => Number(row.valor).toFixed(2) }
        ];

        const filename = `relatorio_financeiro_${mesAno || 'periodo'}_${new Date().toISOString().split('T')[0]}`;
        exportToCSV(lancamentos, columns, filename);
    };

    const handleClearFilters = () => {
        setFiltroTipo('');
        setFiltroCategoria('');
        setFiltroAtividade('');
        setDataInicio('');
        setDataFim('');
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const despesasCategorias = resumo.detalhe_categorias?.filter(c => c.tipo === 'despesa') || [];
    const porAtividade = resumo.por_atividade || {
        pecuaria: { receitas: 0, despesas: 0, saldo: 0 },
        agricola: { receitas: 0, despesas: 0, saldo: 0 },
        rh: { receitas: 0, despesas: 0, saldo: 0 },
        geral: { receitas: 0, despesas: 0, saldo: 0 }
    };

    // Paginação slice
    const totalItems = lancamentos.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLancamentos = lancamentos.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Top Cards: Receitas, Despesas, Saldo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Receitas</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                        {formatCurrency(resumo.total_receitas)}
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Despesas</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-rose-400 tracking-tight">
                        {formatCurrency(resumo.total_despesas)}
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Líquido</span>
                        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-200">
                            <CircleDollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-2xl font-extrabold tracking-tight ${resumo.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(resumo.saldo)}
                    </div>
                </div>
            </div>

            {/* Resultado por Atividade */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ATIVIDADES_CONFIG.map((ativ) => {
                    const dadosAtiv = porAtividade[ativ.value] || { receitas: 0, despesas: 0, saldo: 0 };
                    const Icon = ativ.icon;
                    const isSelected = filtroAtividade === ativ.value;

                    return (
                        <button
                            key={ativ.value}
                            onClick={() => setFiltroAtividade(isSelected ? '' : ativ.value)}
                            className={`text-left p-4 rounded-2xl border transition-all ${
                                isSelected 
                                    ? 'bg-slate-800/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' 
                                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    <Icon className="w-3.5 h-3.5 text-slate-300" />
                                    {ativ.label}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ativ.color}`}>
                                    {dadosAtiv.saldo >= 0 ? '+ ' : ''}{formatCurrency(dadosAtiv.saldo)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                                <span>Rec: <strong className="text-emerald-400">{formatCurrency(dadosAtiv.receitas)}</strong></span>
                                <span>Desp: <strong className="text-rose-400">{formatCurrency(dadosAtiv.despesas)}</strong></span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filter and Action Bar */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Atividade Filter */}
                        <select
                            value={filtroAtividade}
                            onChange={(e) => setFiltroAtividade(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">Todas as Atividades</option>
                            {ATIVIDADES_CONFIG.map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>

                        {/* Tipo Filter */}
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="receita">Apenas Receitas (+)</option>
                            <option value="despesa">Apenas Despesas (-)</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 max-w-[200px]"
                        >
                            <option value="">Todas as Categorias</option>
                            {CATEGORIAS_CONFIG.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>

                        {/* Date Range Filters */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                            <span className="text-slate-400 text-[11px]">De:</span>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="bg-transparent text-slate-200 focus:outline-none text-xs"
                            />
                            <span className="text-slate-400 text-[11px]">Até:</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                className="bg-transparent text-slate-200 focus:outline-none text-xs"
                            />
                        </div>

                        {(filtroTipo || filtroCategoria || filtroAtividade || dataInicio || dataFim) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                            >
                                Limpar Filtros
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Export CSV Button */}
                        <button
                            onClick={handleExportCSV}
                            disabled={lancamentos.length === 0}
                            className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-slate-750 border border-slate-600 text-slate-200 hover:text-white text-xs font-medium px-3 py-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            title="Exportar dados filtrados para arquivo CSV (compatível com Excel)"
                        >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Exportar CSV</span>
                        </button>

                        {/* New Transaction Button */}
                        <button
                            onClick={handleOpenNew}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Lançamento</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content: Table & Breakdown Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table: Lançamentos */}
                <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700/60">
                                <tr>
                                    <th className="px-4 py-3.5">Data</th>
                                    <th className="px-4 py-3.5">Atividade</th>
                                    <th className="px-4 py-3.5">Descrição</th>
                                    <th className="px-4 py-3.5">Categoria</th>
                                    <th className="px-4 py-3.5 text-right">Valor</th>
                                    <th className="px-4 py-3.5 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/40">
                                {currentLancamentos.map((l) => {
                                    const ativObj = ATIVIDADES_CONFIG.find(a => a.value === l.atividade);
                                    return (
                                        <tr key={l.id} className="hover:bg-slate-700/30 transition">
                                            <td className="px-4 py-3.5 text-slate-300 font-medium whitespace-nowrap">
                                                {l.data}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ativObj?.color || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                                                    {ativObj?.label || l.atividade || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-100 font-semibold">
                                                <div>{l.descricao || 'Sem descrição'}</div>
                                                {l.animal_brinco && (
                                                    <div className="text-[11px] text-slate-400 font-normal">Animal: Brinco {l.animal_brinco}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-700">
                                                    {CATEGORIAS_CONFIG.find(c => c.value === l.categoria)?.label || l.categoria}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3.5 text-right font-bold whitespace-nowrap ${
                                                l.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                                {l.tipo === 'receita' ? '+ ' : '- '}
                                                {formatCurrency(l.valor)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleDelete(l.id)}
                                                    className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                                    title="Excluir Lançamento"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {loading && (
                            <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                                <span>Carregando dados financeiros...</span>
                            </div>
                        )}

                        {!loading && lancamentos.length === 0 && (
                            <div className="py-16 text-center text-xs text-slate-500">
                                Nenhum lançamento financeiro encontrado para os filtros selecionados.
                            </div>
                        )}
                    </div>

                    {/* Pagination Bar */}
                    <div className="border-t border-slate-700/60 p-3 bg-slate-900/30">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                </div>

                {/* Breakdown by Category */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <PieIcon className="w-4 h-4 text-emerald-400" />
                            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Despesas por Categoria</h3>
                        </div>

                        <div className="space-y-3">
                            {despesasCategorias.map((cat) => {
                                const label = CATEGORIAS_CONFIG.find(c => c.value === cat.categoria)?.label || cat.categoria;
                                const percent = resumo.total_despesas > 0 ? Math.round((cat.total / resumo.total_despesas) * 100) : 0;
                                return (
                                    <div key={cat.categoria} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-300 font-medium truncate max-w-[170px]">{label}</span>
                                            <span className="text-slate-200 font-bold">{formatCurrency(cat.total)}</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="h-full bg-rose-500 rounded-full"
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {despesasCategorias.length === 0 && (
                                <p className="text-xs text-slate-500 py-6 text-center">Nenhuma despesa no período.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Novo Lançamento Financeiro */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">Novo Lançamento Financeiro</h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Tipo: Receita ou Despesa */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Movimentação *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: 'receita', categoria: 'venda_animal', atividade: 'pecuaria' })}
                                        className={`py-2 rounded-xl border text-xs font-semibold transition ${
                                            formData.tipo === 'receita'
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                        }`}
                                    >
                                        + Receita (Entrada)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: 'despesa', categoria: 'nutricao_racao', atividade: 'pecuaria' })}
                                        className={`py-2 rounded-xl border text-xs font-semibold transition ${
                                            formData.tipo === 'despesa'
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                        }`}
                                    >
                                        - Despesa (Saída)
                                    </button>
                                </div>
                            </div>

                            {/* Atividade e Categoria */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Atividade *</label>
                                    <select
                                        required
                                        value={formData.atividade}
                                        onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {ATIVIDADES_CONFIG.map((a) => (
                                            <option key={a.value} value={a.value}>{a.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria *</label>
                                    <select
                                        required
                                        value={formData.categoria}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {CATEGORIAS_CONFIG.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Valor e Data */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 1250.00"
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data}
                                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Histórico</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pagamento fornecedor AgroSul..."
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{saving ? 'Gravando...' : 'Salvar Lançamento'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
