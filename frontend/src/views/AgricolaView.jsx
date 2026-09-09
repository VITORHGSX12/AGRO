import React, { useState, useEffect } from 'react';
import { 
    Sprout, 
    Plus, 
    Trash2, 
    Edit, 
    Check, 
    X, 
    DollarSign, 
    TrendingUp, 
    Layers, 
    Calendar,
    Wheat,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info,
    Package,
    ArrowRight,
    Search,
    Filter,
    ChevronRight,
    BarChart3
} from 'lucide-react';
import { api } from '../services/api';

const CULTURAS_COMUNS = [
    { value: 'Soja', label: 'Soja' },
    { value: 'Milho', label: 'Milho (Safrinha / Verão)' },
    { value: 'Algodão', label: 'Algodão' },
    { value: 'Café', label: 'Café' },
    { value: 'Sorgo', label: 'Sorgo' },
    { value: 'Trigo', label: 'Trigo' },
    { value: 'Cana-de-Açúcar', label: 'Cana-de-Açúcar' },
    { value: 'Arroz', label: 'Arroz' },
    { value: 'Feijão', label: 'Feijão' },
    { value: 'Outro', label: 'Outra Cultura' }
];

export default function AgricolaView({ onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [subTab, setSubTab] = useState('safras'); // 'safras' | 'talhoes'

    // Data State
    const [kpis, setKpis] = useState(null);
    const [talhoes, setTalhoes] = useState([]);
    const [safras, setSafras] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filtroStatus, setFiltroStatus] = useState('');
    const [buscaCultura, setBuscaCultura] = useState('');
    const [filtroTalhao, setFiltroTalhao] = useState('');

    // Modal Talhão
    const [modalTalhaoOpen, setModalTalhaoOpen] = useState(false);
    const [editingTalhao, setEditingTalhao] = useState(null);
    const [talhaoForm, setTalhaoForm] = useState({ nome: '', area_hectares: '', tipo_solo: '' });
    const [errorTalhao, setErrorTalhao] = useState('');

    // Modal Safra
    const [modalSafraOpen, setModalSafraOpen] = useState(false);
    const [safraForm, setSafraForm] = useState({
        talhao_id: '',
        cultura: 'Soja',
        data_plantio: new Date().toISOString().split('T')[0],
        data_colheita_prevista: '',
        status: 'plantio',
        observacoes: ''
    });
    const [errorSafra, setErrorSafra] = useState('');

    // Modal Insumo
    const [modalInsumoOpen, setModalInsumoOpen] = useState(false);
    const [selectedSafraParaInsumo, setSelectedSafraParaInsumo] = useState(null);
    const [insumoForm, setInsumoForm] = useState({
        tipo: 'fertilizante',
        descricao: '',
        quantidade: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        gerar_despesa_financeira: true
    });
    const [errorInsumo, setErrorInsumo] = useState('');

    // Modal Colheita / Fechamento
    const [modalColheitaOpen, setModalColheitaOpen] = useState(false);
    const [selectedSafraParaColher, setSelectedSafraParaColher] = useState(null);
    const [colheitaForm, setColheitaForm] = useState({
        data_colheita_real: new Date().toISOString().split('T')[0],
        quantidade_colhida: '',
        unidade_medida: 'sacas',
        valor_venda_total: '',
        gerar_receita_financeira: true
    });
    const [errorColheita, setErrorColheita] = useState('');

    // Drawer de Detalhes da Safra
    const [safraDetalhes, setSafraDetalhes] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    const showFeedback = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 4000);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [kpisData, talhoesData, safrasData] = await Promise.all([
                api.getAgricolaKpis().catch(() => null),
                api.getTalhoes(),
                api.getSafras({
                    status: filtroStatus || undefined,
                    talhao_id: filtroTalhao || undefined,
                    cultura: buscaCultura || undefined
                })
            ]);
            setKpis(kpisData);
            setTalhoes(talhoesData);
            setSafras(safrasData);
            if (talhoesData.length > 0 && !safraForm.talhao_id) {
                setSafraForm(prev => ({ ...prev, talhao_id: String(talhoesData[0].id) }));
            }
        } catch (err) {
            console.error('Erro ao carregar dados agrícolas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filtroStatus, filtroTalhao, buscaCultura]);

    useEffect(() => {
        if (triggerNewModal) {
            handleOpenNewSafra();
            onResetTrigger();
        }
    }, [triggerNewModal]);

    // Talhão handlers
    const handleOpenNewTalhao = () => {
        setEditingTalhao(null);
        setTalhaoForm({ nome: '', area_hectares: '', tipo_solo: '' });
        setErrorTalhao('');
        setModalTalhaoOpen(true);
    };

    const handleOpenEditTalhao = (t) => {
        setEditingTalhao(t);
        setTalhaoForm({
            nome: t.nome,
            area_hectares: String(t.area_hectares),
            tipo_solo: t.tipo_solo || ''
        });
        setErrorTalhao('');
        setModalTalhaoOpen(true);
    };

    const handleSaveTalhao = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorTalhao('');
        try {
            if (editingTalhao) {
                await api.updateTalhao(editingTalhao.id, talhaoForm);
                showFeedback('Talhão atualizado com sucesso!');
            } else {
                await api.createTalhao(talhaoForm);
                showFeedback('Talhão cadastrado com sucesso!');
            }
            setModalTalhaoOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorTalhao(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTalhao = async (id, nome) => {
        if (!window.confirm(`Tem certeza que deseja excluir o talhão "${nome}"? Todas as safras vinculadas também serão removidas.`)) {
            return;
        }
        try {
            await api.deleteTalhao(id);
            showFeedback('Talhão removido com sucesso!');
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };

    // Safra handlers
    const handleOpenNewSafra = () => {
        setSafraForm({
            talhao_id: talhoes.length > 0 ? String(talhoes[0].id) : '',
            cultura: 'Soja',
            data_plantio: new Date().toISOString().split('T')[0],
            data_colheita_prevista: '',
            status: 'plantio',
            observacoes: ''
        });
        setErrorSafra('');
        setModalSafraOpen(true);
    };

    const handleSaveSafra = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorSafra('');
        try {
            await api.createSafra(safraForm);
            showFeedback('Safra iniciada com sucesso!');
            setModalSafraOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorSafra(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatusSafra = async (safraId, novoStatus) => {
        try {
            await api.updateSafraStatus(safraId, { status: novoStatus });
            showFeedback(`Estágio da safra atualizado para "${novoStatus === 'em_desenvolvimento' ? 'Em Desenvolvimento' : novoStatus}"!`);
            loadData();
            if (drawerOpen && safraDetalhes?.id === safraId) {
                openSafraDrawer(safraId);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteSafra = async (id, cultura) => {
        if (!window.confirm(`Tem certeza que deseja excluir a safra de ${cultura}?`)) {
            return;
        }
        try {
            await api.deleteSafra(id);
            showFeedback('Safra excluída com sucesso!');
            if (drawerOpen && safraDetalhes?.id === id) {
                setDrawerOpen(false);
            }
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };

    // Insumo handlers
    const handleOpenLancarInsumo = (safra) => {
        setSelectedSafraParaInsumo(safra);
        setInsumoForm({
            tipo: 'fertilizante',
            descricao: '',
            quantidade: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            gerar_despesa_financeira: true
        });
        setErrorInsumo('');
        setModalInsumoOpen(true);
    };

    const handleSaveInsumo = async (e) => {
        e.preventDefault();
        if (!selectedSafraParaInsumo) return;
        setSaving(true);
        setErrorInsumo('');
        try {
            await api.createInsumo({
                safra_id: selectedSafraParaInsumo.id,
                ...insumoForm
            });
            showFeedback('Insumo lançado e despesa registrada no financeiro!');
            setModalInsumoOpen(false);
            loadData();
            if (drawerOpen && safraDetalhes?.id === selectedSafraParaInsumo.id) {
                openSafraDrawer(selectedSafraParaInsumo.id);
            }
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorInsumo(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInsumo = async (insumoId) => {
        if (!window.confirm('Excluir este insumo?')) return;
        try {
            await api.deleteInsumo(insumoId);
            showFeedback('Insumo removido com sucesso!');
            if (safraDetalhes) {
                openSafraDrawer(safraDetalhes.id);
            }
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };

    // Colheita handlers
    const handleOpenColheita = (safra) => {
        setSelectedSafraParaColher(safra);
        setColheitaForm({
            data_colheita_real: new Date().toISOString().split('T')[0],
            quantidade_colhida: '',
            unidade_medida: 'sacas',
            valor_venda_total: '',
            gerar_receita_financeira: true
        });
        setErrorColheita('');
        setModalColheitaOpen(true);
    };

    const handleSaveColheita = async (e) => {
        e.preventDefault();
        if (!selectedSafraParaColher) return;
        setSaving(true);
        setErrorColheita('');
        try {
            await api.colherSafra(selectedSafraParaColher.id, colheitaForm);
            showFeedback('Colheita registrada com sucesso e receita lançada no fluxo de caixa!');
            setModalColheitaOpen(false);
            loadData();
            if (drawerOpen && safraDetalhes?.id === selectedSafraParaColher.id) {
                openSafraDrawer(selectedSafraParaColher.id);
            }
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorColheita(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Drawer de Detalhes
    const openSafraDrawer = async (safraId) => {
        try {
            const detalhe = await api.getSafraById(safraId);
            setSafraDetalhes(detalhe);
            setDrawerOpen(true);
        } catch (err) {
            console.error('Erro ao abrir detalhes da safra:', err);
        }
    };

    const formatCurrency = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatNumber = (val) => {
        return Number(val || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    };

    return (
        <div className="space-y-6">
            {/* Toast Feedback */}
            {feedback && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Header & Sub-Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <Wheat className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                Gestão Agrícola & Safras
                            </h1>
                            <p className="text-sm text-slate-400">
                                Ciclo de plantio, monitoramento de insumos, produtividade por hectare e fechamento de colheitas
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                        <button
                            onClick={() => setSubTab('safras')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                                subTab === 'safras'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Sprout className="w-4 h-4" />
                            Safras & Ciclos
                        </button>
                        <button
                            onClick={() => setSubTab('talhoes')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                                subTab === 'talhoes'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            Talhões & Áreas
                        </button>
                    </div>

                    {subTab === 'safras' ? (
                        <button
                            onClick={handleOpenNewSafra}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30 transition-all text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Iniciar Safra
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenNewTalhao}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30 transition-all text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Talhão
                        </button>
                    )}
                </div>
            </div>

            {/* Top KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Área Cultivada</span>
                            <Layers className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {formatNumber(kpis.area_plantada_ha)} <span className="text-xs font-normal text-slate-400">ha</span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                            <span>Total: {formatNumber(kpis.area_total_ha)} ha</span>
                            <span className="text-emerald-400 font-medium">
                                {kpis.area_total_ha > 0 ? Math.round((kpis.area_plantada_ha / kpis.area_total_ha) * 100) : 0}% plantado
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${kpis.area_total_ha > 0 ? Math.min(100, (kpis.area_plantada_ha / kpis.area_total_ha) * 100) : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Safras em Andamento</span>
                            <Sprout className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {kpis.safras_ativas}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Em {kpis.total_talhoes} talhões cadastrados
                        </p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Investido em Insumos</span>
                            <Package className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-400">
                            {formatCurrency(kpis.total_investido_insumos)}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Sementes, adubos e defensivos
                        </p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Receita de Colheitas</span>
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {formatCurrency(kpis.total_receita_colheitas)}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Total bruto faturado
                        </p>
                    </div>
                </div>
            )}

            {/* Sub-Tab 1: Safras & Ciclos */}
            {subTab === 'safras' && (
                <div className="space-y-4">
                    {/* Filtros */}
                    <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cultura..."
                                    value={buscaCultura}
                                    onChange={(e) => setBuscaCultura(e.target.value)}
                                    className="bg-slate-800/80 border border-slate-700/80 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500 transition-all w-44 sm:w-56"
                                />
                            </div>

                            <select
                                value={filtroTalhao}
                                onChange={(e) => setFiltroTalhao(e.target.value)}
                                className="bg-slate-800/80 border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Todos os Talhões</option>
                                {talhoes.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome} ({t.area_hectares} ha)</option>
                                ))}
                            </select>

                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                                className="bg-slate-800/80 border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Todos os Status</option>
                                <option value="plantio">🌱 Em Plantio</option>
                                <option value="em_desenvolvimento">🌿 Em Desenvolvimento</option>
                                <option value="colhida">🌾 Colhida / Fechada</option>
                            </select>
                        </div>

                        <div className="text-xs text-slate-400">
                            Exibindo <span className="font-semibold text-white">{safras.length}</span> safras
                        </div>
                    </div>

                    {/* Lista de Safras */}
                    {loading ? (
                        <div className="py-20 text-center text-slate-400">Carregando safras...</div>
                    ) : safras.length === 0 ? (
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
                            <Wheat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-white mb-1">Nenhuma safra encontrada</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                                Cadastre um talhão e inicie o ciclo de uma nova safra para acompanhar insumos, custos e colheita.
                            </p>
                            <button
                                onClick={handleOpenNewSafra}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                            >
                                Iniciar Safra Agora
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {safras.map(safra => {
                                const isColhida = safra.status === 'colhida';
                                const isDesenv = safra.status === 'em_desenvolvimento';
                                const isPlantio = safra.status === 'plantio';

                                return (
                                    <div
                                        key={safra.id}
                                        className={`bg-slate-900/60 border rounded-2xl p-5 relative overflow-hidden transition-all hover:border-slate-700 flex flex-col justify-between ${
                                            isColhida 
                                                ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                                                : isDesenv 
                                                ? 'border-blue-500/30' 
                                                : 'border-amber-500/30'
                                        }`}
                                    >
                                        <div>
                                            {/* Header do Card */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-white tracking-tight">
                                                            {safra.cultura}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                                            isColhida
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                : isDesenv
                                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        }`}>
                                                            {isColhida ? 'Colhida' : isDesenv ? 'Em Desenvolvimento' : 'Em Plantio'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Talhão: <strong className="text-slate-300">{safra.talhao_nome}</strong> ({safra.talhao_area} ha)</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteSafra(safra.id, safra.cultura)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Excluir Safra"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Datas */}
                                            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl text-xs mb-3 border border-slate-800/40">
                                                <div>
                                                    <span className="text-slate-500 block text-[10px] uppercase">Plantio</span>
                                                    <span className="text-slate-300 font-medium">{safra.data_plantio}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block text-[10px] uppercase">
                                                        {isColhida ? 'Colheita Real' : 'Previsão Colheita'}
                                                    </span>
                                                    <span className="text-slate-300 font-medium">
                                                        {isColhida ? safra.data_colheita_real : (safra.data_colheita_prevista || 'Não definida')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Métricas de Produtividade e Custos */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-400">Custo Insumos:</span>
                                                    <div className="text-right">
                                                        <span className="font-semibold text-red-400">{formatCurrency(safra.total_custo_insumos)}</span>
                                                        <span className="text-[10px] text-slate-500 block">({formatCurrency(safra.custo_por_ha)}/ha)</span>
                                                    </div>
                                                </div>

                                                {isColhida ? (
                                                    <>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-400">Produção Total:</span>
                                                            <span className="font-semibold text-white">
                                                                {formatNumber(safra.quantidade_colhida)} {safra.unidade_medida}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-400">Produtividade:</span>
                                                            <span className="font-bold text-amber-400">
                                                                {formatNumber(safra.produtividade_ha)} {safra.unidade_medida}/ha
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                                                            <span className="text-slate-400">Receita Bruta:</span>
                                                            <span className="font-semibold text-emerald-400">{formatCurrency(safra.valor_venda_total)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                            <span className="text-slate-300">Margem Líquida:</span>
                                                            <span className={safra.lucro_bruto >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                                {formatCurrency(safra.lucro_bruto)} ({formatCurrency(safra.lucro_por_ha)}/ha)
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-xs text-slate-400 flex items-center justify-between bg-slate-800/30 p-2 rounded-lg">
                                                        <span>Insumos lançados:</span>
                                                        <span className="font-semibold text-white">{safra.total_insumos_count} itens</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ações do Card */}
                                        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                                            {!isColhida && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenLancarInsumo(safra)}
                                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-700/60"
                                                    >
                                                        <Package className="w-3.5 h-3.5 text-amber-400" />
                                                        Lançar Insumo
                                                    </button>

                                                    {isPlantio && (
                                                        <button
                                                            onClick={() => handleUpdateStatusSafra(safra.id, 'em_desenvolvimento')}
                                                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold py-2 px-2.5 rounded-xl transition-all"
                                                            title="Avançar para Desenvolvimento"
                                                        >
                                                            🌿 Em Desenv.
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleOpenColheita(safra)}
                                                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
                                                    >
                                                        <Wheat className="w-3.5 h-3.5" />
                                                        Colher
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => openSafraDrawer(safra.id)}
                                                className={`text-xs font-medium py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800/80 ${
                                                    isColhida ? 'w-full bg-slate-800/60 border border-slate-700/40 text-slate-200' : ''
                                                }`}
                                            >
                                                <span>Ficha & Insumos</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Sub-Tab 2: Talhões & Áreas */}
            {subTab === 'talhoes' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
                        <div>
                            <h3 className="text-sm font-bold text-white">Talhões de Plantio Registrados</h3>
                            <p className="text-xs text-slate-400">Delimite suas áreas agricultáveis para cálculo de produtividade e rotação de culturas</p>
                        </div>
                        <button
                            onClick={handleOpenNewTalhao}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Talhão
                        </button>
                    </div>

                    {talhoes.length === 0 ? (
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
                            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-white mb-1">Nenhum talhão cadastrado</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                                Comece adicionando seus talhões para gerenciar áreas de lavoura e ciclos de safras.
                            </p>
                            <button
                                onClick={handleOpenNewTalhao}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                            >
                                Cadastrar Primeiro Talhão
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {talhoes.map(t => (
                                <div
                                    key={t.id}
                                    className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-base font-bold text-white">{t.nome}</h4>
                                                <span className="text-xs text-slate-400">Solo: {t.tipo_solo || 'Não informado'}</span>
                                            </div>
                                            <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                                                {formatNumber(t.area_hectares)} ha
                                            </span>
                                        </div>

                                        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/40 mb-4 text-xs space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Cultura Atual:</span>
                                                <span className="font-semibold text-white">
                                                    {t.cultura_atual ? (
                                                        <span className="text-emerald-400">{t.cultura_atual} ({t.status_safra_atual})</span>
                                                    ) : (
                                                        <span className="text-slate-500">Em Pousio / Descanso</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Total de Safras Históricas:</span>
                                                <span className="font-semibold text-slate-300">{t.total_safras}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                                        <button
                                            onClick={() => handleOpenEditTalhao(t)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-xs flex items-center gap-1"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTalhao(t.id, t.nome)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-xs flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Novo / Editar Talhão */}
            {modalTalhaoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white">
                                {editingTalhao ? 'Editar Talhão' : 'Novo Talhão de Plantio'}
                            </h3>
                            <button
                                onClick={() => setModalTalhaoOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorTalhao && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorTalhao}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveTalhao} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Nome / Identificação do Talhão *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Talhão 01 - Baixada"
                                    value={talhaoForm.nome}
                                    onChange={(e) => setTalhaoForm({ ...talhaoForm, nome: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Área (Hectares) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        required
                                        placeholder="Ex: 45.5"
                                        value={talhaoForm.area_hectares}
                                        onChange={(e) => setTalhaoForm({ ...talhaoForm, area_hectares: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Tipo de Solo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Argiloso / Misto"
                                        value={talhaoForm.tipo_solo}
                                        onChange={(e) => setTalhaoForm({ ...talhaoForm, tipo_solo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalTalhaoOpen(false)}
                                    className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-600/20"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Talhão'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Iniciar Nova Safra */}
            {modalSafraOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-amber-400" />
                                <h3 className="text-lg font-bold text-white">Iniciar Novo Ciclo de Safra</h3>
                            </div>
                            <button
                                onClick={() => setModalSafraOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorSafra && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorSafra}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveSafra} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Talhão *</label>
                                    <select
                                        required
                                        value={safraForm.talhao_id}
                                        onChange={(e) => setSafraForm({ ...safraForm, talhao_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    >
                                        {talhoes.map(t => (
                                            <option key={t.id} value={t.id}>{t.nome} ({t.area_hectares} ha)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Cultura *</label>
                                    <select
                                        required
                                        value={safraForm.cultura}
                                        onChange={(e) => setSafraForm({ ...safraForm, cultura: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    >
                                        {CULTURAS_COMUNS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Data de Plantio *</label>
                                    <input
                                        type="date"
                                        required
                                        value={safraForm.data_plantio}
                                        onChange={(e) => setSafraForm({ ...safraForm, data_plantio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Previsão de Colheita</label>
                                    <input
                                        type="date"
                                        value={safraForm.data_colheita_prevista}
                                        onChange={(e) => setSafraForm({ ...safraForm, data_colheita_prevista: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Observações / Variedade de Semente</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Variedade TMG 7062 IPRO, espaçamento 0,45m..."
                                    value={safraForm.observacoes}
                                    onChange={(e) => setSafraForm({ ...safraForm, observacoes: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalSafraOpen(false)}
                                    className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-600/20"
                                >
                                    {saving ? 'Iniciando...' : 'Iniciar Safra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Lançar Insumo */}
            {modalInsumoOpen && selectedSafraParaInsumo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-white">Lançar Insumo Agrícola</h3>
                                <p className="text-xs text-slate-400">
                                    Safra: <strong className="text-amber-400">{selectedSafraParaInsumo.cultura}</strong> ({selectedSafraParaInsumo.talhao_nome})
                                </p>
                            </div>
                            <button
                                onClick={() => setModalInsumoOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorInsumo && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorInsumo}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveInsumo} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Tipo de Insumo *</label>
                                    <select
                                        required
                                        value={insumoForm.tipo}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, tipo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="semente">🌱 Sementes / Mudas</option>
                                        <option value="fertilizante">🧪 Fertilizantes & Adubos</option>
                                        <option value="defensivo">🛡️ Defensivos / Herbicidas</option>
                                        <option value="outro">📦 Outro Insumo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Data da Aplicação *</label>
                                    <input
                                        type="date"
                                        required
                                        value={insumoForm.data}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, data: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Descrição do Produto *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: NPK 04-14-08 (15 toneladas) ou Glifosato 480"
                                    value={insumoForm.descricao}
                                    onChange={(e) => setInsumoForm({ ...insumoForm, descricao: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Quantidade</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Ex: 15"
                                        value={insumoForm.quantidade}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, quantidade: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Valor Total (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        placeholder="Ex: 4500.00"
                                        value={insumoForm.valor}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, valor: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={insumoForm.gerar_despesa_financeira}
                                    onChange={(e) => setInsumoForm({ ...insumoForm, gerar_despesa_financeira: e.target.checked })}
                                    className="rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-amber-500"
                                />
                                <span>Lançar automaticamente como despesa no Financeiro</span>
                            </label>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalInsumoOpen(false)}
                                    className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-amber-600/20"
                                >
                                    {saving ? 'Lançando...' : 'Lançar Insumo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Fechamento de Colheita */}
            {modalColheitaOpen && selectedSafraParaColher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-white">Fechamento & Registro de Colheita</h3>
                                <p className="text-xs text-slate-400">
                                    Safra: <strong className="text-emerald-400">{selectedSafraParaColher.cultura}</strong> ({selectedSafraParaColher.talhao_nome}, {selectedSafraParaColher.talhao_area} ha)
                                </p>
                            </div>
                            <button
                                onClick={() => setModalColheitaOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorColheita && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorColheita}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveColheita} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Data Real da Colheita *</label>
                                    <input
                                        type="date"
                                        required
                                        value={colheitaForm.data_colheita_real}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, data_colheita_real: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Unidade de Medida *</label>
                                    <select
                                        value={colheitaForm.unidade_medida}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, unidade_medida: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="sacas">Sacas (sc)</option>
                                        <option value="toneladas">Toneladas (ton)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Quantidade Total Colhida *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        required
                                        placeholder="Ex: 3500"
                                        value={colheitaForm.quantidade_colhida}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, quantidade_colhida: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                                    />
                                    {colheitaForm.quantidade_colhida && selectedSafraParaColher.talhao_area > 0 && (
                                        <span className="text-[11px] text-amber-400 mt-1 block">
                                            Produtividade: <strong>{(Number(colheitaForm.quantidade_colhida) / selectedSafraParaColher.talhao_area).toFixed(2)}</strong> {colheitaForm.unidade_medida}/ha
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Valor Total da Venda (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Ex: 420000.00"
                                        value={colheitaForm.valor_venda_total}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, valor_venda_total: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold text-emerald-400"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={colheitaForm.gerar_receita_financeira}
                                    onChange={(e) => setColheitaForm({ ...colheitaForm, gerar_receita_financeira: e.target.checked })}
                                    className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Lançar receita de venda automaticamente no Financeiro</span>
                            </label>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalColheitaOpen(false)}
                                    className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    {saving ? 'Fechando...' : 'Concluir Colheita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Drawer Lateral: Detalhes & Insumos da Safra */}
            {drawerOpen && safraDetalhes && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-fade-in flex justify-end">
                    <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
                        <div className="space-y-6">
                            {/* Header Drawer */}
                            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            Safra: {safraDetalhes.cultura}
                                        </h2>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                            safraDetalhes.status === 'colhida'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                            {safraDetalhes.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Talhão: <strong className="text-white">{safraDetalhes.talhao_nome}</strong> ({safraDetalhes.talhao_area} ha)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Resumo Financeiro da Safra */}
                            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-slate-500">Custo Total Insumos</span>
                                    <div className="text-lg font-bold text-red-400">
                                        {formatCurrency(safraDetalhes.total_custo_insumos)}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {formatCurrency(safraDetalhes.custo_por_ha)} / ha
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                                        {safraDetalhes.status === 'colhida' ? 'Receita Bruta' : 'Status'}
                                    </span>
                                    <div className="text-lg font-bold text-emerald-400">
                                        {safraDetalhes.status === 'colhida' 
                                            ? formatCurrency(safraDetalhes.valor_venda_total)
                                            : 'Em Andamento'}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {safraDetalhes.status === 'colhida' 
                                            ? `Lucro: ${formatCurrency(safraDetalhes.lucro_bruto)}`
                                            : 'Aguardando Colheita'}
                                    </span>
                                </div>
                            </div>

                            {/* Lista de Insumos */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Package className="w-4 h-4 text-amber-400" />
                                        Insumos Aplicados ({safraDetalhes.insumos?.length || 0})
                                    </h3>
                                    {safraDetalhes.status !== 'colhida' && (
                                        <button
                                            onClick={() => handleOpenLancarInsumo(safraDetalhes)}
                                            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-xl transition-all"
                                        >
                                            + Lançar Insumo
                                        </button>
                                    )}
                                </div>

                                {safraDetalhes.insumos && safraDetalhes.insumos.length > 0 ? (
                                    <div className="space-y-2">
                                        {safraDetalhes.insumos.map(i => (
                                            <div
                                                key={i.id}
                                                className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-white">{i.descricao}</span>
                                                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                                            {i.tipo}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                                        {i.data} {i.quantidade ? `• ${i.quantidade} un` : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-red-400">{formatCurrency(i.valor)}</span>
                                                    <button
                                                        onClick={() => handleDeleteInsumo(i.id)}
                                                        className="text-slate-500 hover:text-red-400 transition-all p-1"
                                                        title="Remover Insumo"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                                        Nenhum insumo lançado para esta safra.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                            >
                                Fechar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
