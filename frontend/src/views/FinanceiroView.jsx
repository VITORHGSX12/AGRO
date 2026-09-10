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
    Wrench,
    ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { exportToCSV } from '../utils/csvExporter';
import Pagination from '../components/Pagination';

export const ATIVIDADES_CONFIG = [
    { value: 'pecuaria', label: 'Pecuária', icon: Beef, color: 'text-[#D9A441] bg-[#FEF9E7] border-[#FDE8B3]' },
    { value: 'agricola', label: 'Agrícola', icon: Sprout, color: 'text-[#087F5B] bg-[#E8F5EF] border-[#C3E6D6]' },
    { value: 'rh', label: 'Equipe & RH', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'geral', label: 'Geral / Infra', icon: Wrench, color: 'text-[#3978C7] bg-[#EFF6FF] border-[#DBEAFE]' },
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

            if (!dataInicio && !dataFim && mesAno) {
                queryParams.mes_ano = mesAno;
            }

            const [listData, resData] = await Promise.all([
                api.getFinanceiro(queryParams),
                api.getResumoFinanceiro(queryParams)
            ]);
            setLancamentos(listData);
            setResumo(resData);
            setCurrentPage(1);
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Receitas</span>
                        <div className="w-9 h-9 rounded-xl bg-[#E8F5EF] border border-[#C3E6D6] flex items-center justify-center text-[#087F5B]">
                            <TrendingUp className="w-4 h-4" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-[#087F5B] tracking-tight">
                        {formatCurrency(resumo.total_receitas)}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 font-medium">Entradas consolidadas no período</p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total de Despesas</span>
                        <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] border border-[#FACDCD] flex items-center justify-center text-[#D64545]">
                            <TrendingDown className="w-4 h-4" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-[#D64545] tracking-tight">
                        {formatCurrency(resumo.total_despesas)}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 font-medium">Saídas operacionais e custos</p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Saldo Líquido</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            resumo.saldo >= 0 
                                ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' 
                                : 'bg-[#FEF2F2] text-[#D64545] border-[#FACDCD]'
                        }`}>
                            <CircleDollarSign className="w-4 h-4" strokeWidth={2} />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${resumo.saldo >= 0 ? 'text-[#087F5B]' : 'text-[#D64545]'}`}>
                        {formatCurrency(resumo.saldo)}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 font-medium">Margem líquida da fazenda</p>
                </div>
            </div>

            {/* Resultado por Atividade */}
            <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Filtrar por Atividade Operacional</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {ATIVIDADES_CONFIG.map((ativ) => {
                        const dadosAtiv = porAtividade[ativ.value] || { receitas: 0, despesas: 0, saldo: 0 };
                        const Icon = ativ.icon;
                        const isSelected = filtroAtividade === ativ.value;

                        return (
                            <button
                                key={ativ.value}
                                onClick={() => setFiltroAtividade(isSelected ? '' : ativ.value)}
                                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                                    isSelected 
                                        ? 'bg-[#E8F5EF] border-[#087F5B] ring-2 ring-[#087F5B]/20 shadow-sm' 
                                        : 'bg-white border-[#E6EBE8] hover:border-[#087F5B]/40 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-[#172033] flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-[#087F5B]" strokeWidth={1.75} />
                                        {ativ.label}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ativ.color}`}>
                                        {dadosAtiv.saldo >= 0 ? '+ ' : ''}{formatCurrency(dadosAtiv.saldo)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#E6EBE8]">
                                    <span>Rec: <strong className="text-[#087F5B] font-semibold">{formatCurrency(dadosAtiv.receitas)}</strong></span>
                                    <span>Desp: <strong className="text-[#D64545] font-semibold">{formatCurrency(dadosAtiv.despesas)}</strong></span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.03)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Atividade Filter */}
                        <select
                            value={filtroAtividade}
                            onChange={(e) => setFiltroAtividade(e.target.value)}
                            className="bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
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
                            className="bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="receita">Apenas Receitas (+)</option>
                            <option value="despesa">Apenas Despesas (-)</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white max-w-[200px]"
                        >
                            <option value="">Todas as Categorias</option>
                            {CATEGORIAS_CONFIG.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>

                        {/* Date Range Filters */}
                        <div className="flex items-center gap-1.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1.5 text-xs">
                            <span className="text-[#64748B] text-[11px] font-medium">De:</span>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="bg-transparent text-[#172033] focus:outline-none text-xs font-medium"
                            />
                            <span className="text-[#64748B] text-[11px] font-medium">Até:</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                className="bg-transparent text-[#172033] focus:outline-none text-xs font-medium"
                            />
                        </div>

                        {(filtroTipo || filtroCategoria || filtroAtividade || dataInicio || dataFim) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-[#64748B] transition"
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
                            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-[#E6EBE8] text-[#172033] text-xs font-semibold px-3.5 py-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            title="Exportar dados filtrados para arquivo CSV (compatível com Excel)"
                        >
                            <Download className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={2} />
                            <span>Exportar CSV</span>
                        </button>

                        {/* New Transaction Button */}
                        <button
                            onClick={handleOpenNew}
                            className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                            <span>Novo Lançamento</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content: Table & Breakdown Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table: Lançamentos */}
                <div className="lg:col-span-2 bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(20,60,45,0.04)] flex flex-col justify-between">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#F7F9F8] text-[#64748B] font-semibold border-b border-[#E6EBE8]">
                                <tr>
                                    <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Data</th>
                                    <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Atividade</th>
                                    <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Descrição</th>
                                    <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Categoria</th>
                                    <th className="px-4 py-3.5 text-right uppercase tracking-wider text-[11px]">Valor</th>
                                    <th className="px-5 py-3.5 text-right uppercase tracking-wider text-[11px]">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6EBE8]">
                                {currentLancamentos.map((l) => {
                                    const ativObj = ATIVIDADES_CONFIG.find(a => a.value === l.atividade);
                                    return (
                                        <tr key={l.id} className="hover:bg-[#F7F9F8] transition-colors">
                                            <td className="px-5 py-4 text-[#172033] font-medium whitespace-nowrap">
                                                {l.data}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${ativObj?.color || 'text-[#64748B] bg-slate-50 border-slate-200'}`}>
                                                    {ativObj?.label || l.atividade || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-[#172033] font-semibold">
                                                <div>{l.descricao || 'Sem descrição'}</div>
                                                {l.animal_brinco && (
                                                    <div className="text-[11px] text-[#64748B] font-normal mt-0.5">Animal: Brinco {l.animal_brinco}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8]">
                                                    {CATEGORIAS_CONFIG.find(c => c.value === l.categoria)?.label || l.categoria}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-4 text-right font-bold whitespace-nowrap text-sm ${
                                                l.tipo === 'receita' ? 'text-[#087F5B]' : 'text-[#D64545]'
                                            }`}>
                                                {l.tipo === 'receita' ? '+ ' : '- '}
                                                {formatCurrency(l.valor)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(l.id)}
                                                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#D64545] hover:bg-[#FEF2F2] transition cursor-pointer"
                                                    title="Excluir Lançamento"
                                                >
                                                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {loading && (
                            <div className="py-16 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-[#087F5B]" />
                                <span>Carregando dados financeiros...</span>
                            </div>
                        )}

                        {!loading && lancamentos.length === 0 && (
                            <div className="py-16 text-center text-xs text-[#64748B]">
                                Nenhum lançamento financeiro encontrado para os filtros selecionados.
                            </div>
                        )}
                    </div>

                    {/* Pagination Bar */}
                    <div className="border-t border-[#E6EBE8] p-3.5 bg-[#F7F9F8]">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                </div>

                {/* Breakdown by Category */}
                <div className="p-6 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-7 h-7 rounded-lg bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                <PieIcon className="w-4 h-4" strokeWidth={2} />
                            </div>
                            <h3 className="font-bold text-xs text-[#172033] uppercase tracking-wider">Despesas por Categoria</h3>
                        </div>

                        <div className="space-y-4">
                            {despesasCategorias.map((cat) => {
                                const label = CATEGORIAS_CONFIG.find(c => c.value === cat.categoria)?.label || cat.categoria;
                                const percent = resumo.total_despesas > 0 ? Math.round((cat.total / resumo.total_despesas) * 100) : 0;
                                return (
                                    <div key={cat.categoria} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[#172033] font-medium truncate max-w-[170px]">{label}</span>
                                            <span className="text-[#172033] font-bold">{formatCurrency(cat.total)}</span>
                                        </div>
                                        <div className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-[#D64545] rounded-full"
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            {despesasCategorias.length === 0 && (
                                <p className="text-xs text-[#64748B] py-8 text-center">Nenhuma despesa no período.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Novo Lançamento Financeiro */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    title="Voltar / Cancelar"
                                    className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                    <CircleDollarSign className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <h3 className="font-bold text-sm text-[#172033]">Novo Lançamento Financeiro</h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-[#64748B] hover:text-[#172033] transition cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] rounded-xl text-[#D64545] text-xs font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Tipo: Receita ou Despesa */}
                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1.5">Tipo de Movimentação *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: 'receita', categoria: 'venda_animal', atividade: 'pecuaria' })}
                                        className={`py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                            formData.tipo === 'receita'
                                                ? 'bg-[#E8F5EF] border-[#087F5B] text-[#087F5B]'
                                                : 'bg-white border-[#E6EBE8] text-[#64748B] hover:bg-[#F7F9F8]'
                                        }`}
                                    >
                                        + Receita (Entrada)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: 'despesa', categoria: 'nutricao_racao', atividade: 'pecuaria' })}
                                        className={`py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                            formData.tipo === 'despesa'
                                                ? 'bg-[#FEF2F2] border-[#FACDCD] text-[#D64545]'
                                                : 'bg-white border-[#E6EBE8] text-[#64748B] hover:bg-[#F7F9F8]'
                                        }`}
                                    >
                                        - Despesa (Saída)
                                    </button>
                                </div>
                            </div>

                            {/* Atividade e Categoria */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Atividade *</label>
                                    <select
                                        required
                                        value={formData.atividade}
                                        onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        {ATIVIDADES_CONFIG.map((a) => (
                                            <option key={a.value} value={a.value}>{a.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Categoria *</label>
                                    <select
                                        required
                                        value={formData.categoria}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
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
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Valor (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 1250.00"
                                        value={formData.valor}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Data *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data}
                                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1">Descrição / Histórico</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pagamento fornecedor AgroSul..."
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Voltar / Cancelar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#087F5B] hover:bg-[#159A70] text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
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
