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
                <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#087F5B] text-white px-5 py-3 rounded-xl shadow-xl font-medium animate-fade-in text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Header & Sub-Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6EBE8] p-5 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.04)]">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#E8F5EF] text-[#087F5B] rounded-xl border border-[#C3E6D6]">
                            <Wheat className="w-6 h-6" strokeWidth={1.75} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                                Gestão Agrícola & Safras
                            </h1>
                            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                                Ciclo de plantio, monitoramento de insumos, produtividade por hectare e fechamento de colheitas
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-[#F7F9F8] p-1 rounded-xl border border-[#E6EBE8]">
                        <button
                            onClick={() => setSubTab('safras')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'safras'
                                    ? 'bg-[#087F5B] text-white shadow-sm'
                                    : 'text-[#64748B] hover:text-[#172033]'
                            }`}
                        >
                            <Sprout className="w-4 h-4" strokeWidth={1.75} />
                            Safras & Ciclos
                        </button>
                        <button
                            onClick={() => setSubTab('talhoes')}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                                subTab === 'talhoes'
                                    ? 'bg-[#087F5B] text-white shadow-sm'
                                    : 'text-[#64748B] hover:text-[#172033]'
                            }`}
                        >
                            <Layers className="w-4 h-4" strokeWidth={1.75} />
                            Talhões & Áreas
                        </button>
                    </div>

                    {subTab === 'safras' ? (
                        <button
                            onClick={handleOpenNewSafra}
                            className="flex items-center gap-2 bg-[#087F5B] hover:bg-[#159A70] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all text-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                            Iniciar Safra
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenNewTalhao}
                            className="flex items-center gap-2 bg-[#087F5B] hover:bg-[#159A70] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all text-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                            Novo Talhão
                        </button>
                    )}
                </div>
            </div>

            {/* Top KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-[#E6EBE8] p-5 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Área Cultivada</span>
                            <div className="w-8 h-8 rounded-xl bg-[#FEF9E7] border border-[#FDE8B3] flex items-center justify-center text-[#D9A441]">
                                <Layers className="w-4 h-4" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#172033]">
                            {formatNumber(kpis.area_plantada_ha)} <span className="text-xs font-normal text-[#64748B]">ha</span>
                        </div>
                        <div className="mt-2 text-xs text-[#64748B] flex items-center justify-between font-medium">
                            <span>Total: {formatNumber(kpis.area_total_ha)} ha</span>
                            <span className="text-[#087F5B] font-semibold">
                                {kpis.area_total_ha > 0 ? Math.round((kpis.area_plantada_ha / kpis.area_total_ha) * 100) : 0}% plantado
                            </span>
                        </div>
                        <div className="w-full bg-[#F7F9F8] border border-[#E6EBE8] h-2 rounded-full mt-2.5 overflow-hidden">
                            <div 
                                className="bg-[#087F5B] h-full rounded-full transition-all duration-500"
                                style={{ width: `${kpis.area_total_ha > 0 ? Math.min(100, (kpis.area_plantada_ha / kpis.area_total_ha) * 100) : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-[#E6EBE8] p-5 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Safras em Andamento</span>
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] border border-[#C3E6D6] flex items-center justify-center text-[#087F5B]">
                                <Sprout className="w-4 h-4" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#087F5B]">
                            {kpis.safras_ativas}
                        </div>
                        <p className="text-xs text-[#64748B] mt-2 font-medium">
                            Em {kpis.total_talhoes} talhões cadastrados
                        </p>
                    </div>

                    <div className="bg-white border border-[#E6EBE8] p-5 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Investido em Insumos</span>
                            <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] border border-[#FACDCD] flex items-center justify-center text-[#D64545]">
                                <Package className="w-4 h-4" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#D64545]">
                            {formatCurrency(kpis.total_investido_insumos)}
                        </div>
                        <p className="text-xs text-[#64748B] mt-2 font-medium">
                            Sementes, adubos e defensivos
                        </p>
                    </div>

                    <div className="bg-white border border-[#E6EBE8] p-5 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Receita de Colheitas</span>
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] border border-[#C3E6D6] flex items-center justify-center text-[#087F5B]">
                                <DollarSign className="w-4 h-4" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#087F5B]">
                            {formatCurrency(kpis.total_receita_colheitas)}
                        </div>
                        <p className="text-xs text-[#64748B] mt-2 font-medium">
                            Total bruto faturado
                        </p>
                    </div>
                </div>
            )}

            {/* Sub-Tab 1: Safras & Ciclos */}
            {subTab === 'safras' && (
                <div className="space-y-4">
                    {/* Filtros */}
                    <div className="bg-white border border-[#E6EBE8] p-4 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.03)] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cultura..."
                                    value={buscaCultura}
                                    onChange={(e) => setBuscaCultura(e.target.value)}
                                    className="bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] text-xs font-medium rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#087F5B] focus:bg-white transition-all w-44 sm:w-56"
                                />
                            </div>

                            <select
                                value={filtroTalhao}
                                onChange={(e) => setFiltroTalhao(e.target.value)}
                                className="bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#087F5B] focus:bg-white"
                            >
                                <option value="">Todos os Talhões</option>
                                {talhoes.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome} ({t.area_hectares} ha)</option>
                                ))}
                            </select>

                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                                className="bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#087F5B] focus:bg-white"
                            >
                                <option value="">Todos os Status</option>
                                <option value="plantio">🌱 Em Plantio</option>
                                <option value="em_desenvolvimento">🌿 Em Desenvolvimento</option>
                                <option value="colhida">🌾 Colhida / Fechada</option>
                            </select>
                        </div>

                        <div className="text-xs text-[#64748B] font-medium">
                            Exibindo <span className="font-bold text-[#172033]">{safras.length}</span> safras
                        </div>
                    </div>

                    {/* Lista de Safras */}
                    {loading ? (
                        <div className="py-20 text-center text-xs text-[#64748B]">Carregando safras...</div>
                    ) : safras.length === 0 ? (
                        <div className="bg-white border border-[#E6EBE8] rounded-2xl p-12 text-center shadow-sm">
                            <Wheat className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                            <h3 className="text-base font-bold text-[#172033] mb-1">Nenhuma safra encontrada</h3>
                            <p className="text-xs text-[#64748B] max-w-md mx-auto mb-4 font-medium">
                                Cadastre um talhão e inicie o ciclo de uma nova safra para acompanhar insumos, custos e colheita.
                            </p>
                            <button
                                onClick={handleOpenNewSafra}
                                className="bg-[#087F5B] hover:bg-[#159A70] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                                Iniciar Safra Agora
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {safras.map(safra => {
                                const isColhida = safra.status === 'colhida';
                                const isDesenv = safra.status === 'em_desenvolvimento';
                                const isPlantio = safra.status === 'plantio';

                                return (
                                    <div
                                        key={safra.id}
                                        className="bg-white border border-[#E6EBE8] rounded-2xl p-5 shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Header do Card */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-bold text-[#172033] tracking-tight">
                                                            {safra.cultura}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                                            isColhida
                                                                ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]'
                                                                : isDesenv
                                                                ? 'bg-[#EFF6FF] text-[#3978C7] border-[#DBEAFE]'
                                                                : 'bg-[#FEF9E7] text-[#D9A441] border-[#FDE8B3]'
                                                        }`}>
                                                            {isColhida ? 'Colhida' : isDesenv ? 'Em Desenvolvimento' : 'Em Plantio'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-[#64748B] flex items-center gap-1.5 mt-1 font-medium">
                                                        <Layers className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={1.75} />
                                                        <span>Talhão: <strong className="text-[#172033]">{safra.talhao_nome}</strong> ({safra.talhao_area} ha)</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteSafra(safra.id, safra.cultura)}
                                                    className="p-1.5 text-[#64748B] hover:text-[#D64545] hover:bg-[#FEF2F2] rounded-lg transition-all cursor-pointer"
                                                    title="Excluir Safra"
                                                >
                                                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                                                </button>
                                            </div>

                                            {/* Datas */}
                                            <div className="grid grid-cols-2 gap-2 bg-[#F7F9F8] p-3 rounded-xl text-xs mb-3 border border-[#E6EBE8]">
                                                <div>
                                                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Plantio</span>
                                                    <span className="text-[#172033] font-semibold">{safra.data_plantio}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                                                        {isColhida ? 'Colheita Real' : 'Previsão Colheita'}
                                                    </span>
                                                    <span className="text-[#172033] font-semibold">
                                                        {isColhida ? safra.data_colheita_real : (safra.data_colheita_prevista || 'Não definida')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Métricas de Produtividade e Custos */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#64748B] font-medium">Custo Insumos:</span>
                                                    <div className="text-right">
                                                        <span className="font-bold text-[#D64545]">{formatCurrency(safra.total_custo_insumos)}</span>
                                                        <span className="text-[10px] text-[#64748B] block">({formatCurrency(safra.custo_por_ha)}/ha)</span>
                                                    </div>
                                                </div>

                                                {isColhida ? (
                                                    <>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-[#64748B] font-medium">Produção Total:</span>
                                                            <span className="font-bold text-[#172033]">
                                                                {formatNumber(safra.quantidade_colhida)} {safra.unidade_medida}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-[#64748B] font-medium">Produtividade:</span>
                                                            <span className="font-bold text-[#D9A441]">
                                                                {formatNumber(safra.produtividade_ha)} {safra.unidade_medida}/ha
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E6EBE8]">
                                                            <span className="text-[#64748B] font-medium">Receita Bruta:</span>
                                                            <span className="font-bold text-[#087F5B]">{formatCurrency(safra.valor_venda_total)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                            <span className="text-[#172033]">Margem Líquida:</span>
                                                            <span className={safra.lucro_bruto >= 0 ? 'text-[#087F5B]' : 'text-[#D64545]'}>
                                                                {formatCurrency(safra.lucro_bruto)} ({formatCurrency(safra.lucro_por_ha)}/ha)
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-xs text-[#64748B] flex items-center justify-between bg-[#F7F9F8] border border-[#E6EBE8] p-2.5 rounded-xl font-medium">
                                                        <span>Insumos lançados:</span>
                                                        <span className="font-bold text-[#172033]">{safra.total_insumos_count} itens</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ações do Card */}
                                        <div className="pt-3 border-t border-[#E6EBE8] flex flex-wrap gap-2">
                                            {!isColhida && (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenLancarInsumo(safra)}
                                                        className="flex-1 bg-white hover:bg-slate-50 text-[#172033] text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-[#E6EBE8] cursor-pointer shadow-sm"
                                                    >
                                                        <Package className="w-3.5 h-3.5 text-[#D9A441]" strokeWidth={2} />
                                                        Lançar Insumo
                                                    </button>

                                                    {isPlantio && (
                                                        <button
                                                            onClick={() => handleUpdateStatusSafra(safra.id, 'em_desenvolvimento')}
                                                            className="bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#3978C7] border border-[#DBEAFE] text-xs font-semibold py-2 px-2.5 rounded-xl transition-all cursor-pointer"
                                                            title="Avançar para Desenvolvimento"
                                                        >
                                                            🌿 Em Desenv.
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleOpenColheita(safra)}
                                                        className="bg-[#087F5B] hover:bg-[#159A70] text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <Wheat className="w-3.5 h-3.5" strokeWidth={2} />
                                                        Colher
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => openSafraDrawer(safra.id)}
                                                className={`text-xs font-medium py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 text-[#64748B] hover:text-[#172033] hover:bg-slate-100 cursor-pointer ${
                                                    isColhida ? 'w-full bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] font-semibold' : ''
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
                    <div className="flex items-center justify-between bg-white border border-[#E6EBE8] p-4 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.03)]">
                        <div>
                            <h3 className="text-sm font-bold text-[#172033]">Talhões de Plantio Registrados</h3>
                            <p className="text-xs text-[#64748B] font-medium">Delimite suas áreas agricultáveis para cálculo de produtividade e rotação de culturas</p>
                        </div>
                        <button
                            onClick={handleOpenNewTalhao}
                            className="flex items-center gap-2 bg-[#087F5B] hover:bg-[#159A70] text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                            Novo Talhão
                        </button>
                    </div>

                    {talhoes.length === 0 ? (
                        <div className="bg-white border border-[#E6EBE8] rounded-2xl p-12 text-center shadow-sm">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
                            <h3 className="text-base font-bold text-[#172033] mb-1">Nenhum talhão cadastrado</h3>
                            <p className="text-xs text-[#64748B] max-w-md mx-auto mb-4 font-medium">
                                Comece adicionando seus talhões para gerenciar áreas de lavoura e ciclos de safras.
                            </p>
                            <button
                                onClick={handleOpenNewTalhao}
                                className="bg-[#087F5B] hover:bg-[#159A70] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                                Cadastrar Primeiro Talhão
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {talhoes.map(t => (
                                <div
                                    key={t.id}
                                    className="bg-white border border-[#E6EBE8] hover:border-[#087F5B]/30 p-5 rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-base font-bold text-[#172033]">{t.nome}</h4>
                                                <span className="text-xs text-[#64748B] font-medium">Solo: {t.tipo_solo || 'Não informado'}</span>
                                            </div>
                                            <span className="text-xs font-bold px-2.5 py-1 bg-[#E8F5EF] text-[#087F5B] rounded-lg border border-[#C3E6D6]">
                                                {formatNumber(t.area_hectares)} ha
                                            </span>
                                        </div>

                                        <div className="bg-[#F7F9F8] p-3.5 rounded-xl border border-[#E6EBE8] mb-4 text-xs space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#64748B] font-medium">Cultura Atual:</span>
                                                <span className="font-semibold text-[#172033]">
                                                    {t.cultura_atual ? (
                                                        <span className="text-[#087F5B]">{t.cultura_atual} ({t.status_safra_atual})</span>
                                                    ) : (
                                                        <span className="text-[#64748B]">Em Pousio / Descanso</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#64748B] font-medium">Total de Safras Históricas:</span>
                                                <span className="font-bold text-[#172033]">{t.total_safras}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6EBE8]">
                                        <button
                                            onClick={() => handleOpenEditTalhao(t)}
                                            className="p-2 text-[#64748B] hover:text-[#172033] hover:bg-slate-100 rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer font-medium"
                                        >
                                            <Edit className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTalhao(t.id, t.nome)}
                                            className="p-2 text-[#64748B] hover:text-[#D64545] hover:bg-[#FEF2F2] rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer font-medium"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-[#172033]">
                                {editingTalhao ? 'Editar Talhão' : 'Novo Talhão de Plantio'}
                            </h3>
                            <button
                                onClick={() => setModalTalhaoOpen(false)}
                                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorTalhao && (
                            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] text-xs rounded-xl flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorTalhao}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveTalhao} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[#172033] mb-1 font-semibold">Nome / Identificação do Talhão *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Talhão 01 - Baixada"
                                    value={talhaoForm.nome}
                                    onChange={(e) => setTalhaoForm({ ...talhaoForm, nome: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Área (Hectares) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        required
                                        placeholder="Ex: 45.5"
                                        value={talhaoForm.area_hectares}
                                        onChange={(e) => setTalhaoForm({ ...talhaoForm, area_hectares: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Tipo de Solo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Argiloso / Misto"
                                        value={talhaoForm.tipo_solo}
                                        onChange={(e) => setTalhaoForm({ ...talhaoForm, tipo_solo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalTalhaoOpen(false)}
                                    className="px-4 py-2.5 text-[#64748B] hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#087F5B] hover:bg-[#159A70] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                    <Sprout className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <h3 className="text-base font-bold text-[#172033]">Iniciar Novo Ciclo de Safra</h3>
                            </div>
                            <button
                                onClick={() => setModalSafraOpen(false)}
                                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorSafra && (
                            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] text-xs rounded-xl flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorSafra}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveSafra} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Talhão *</label>
                                    <select
                                        required
                                        value={safraForm.talhao_id}
                                        onChange={(e) => setSafraForm({ ...safraForm, talhao_id: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        {talhoes.map(t => (
                                            <option key={t.id} value={t.id}>{t.nome} ({t.area_hectares} ha)</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Cultura *</label>
                                    <select
                                        required
                                        value={safraForm.cultura}
                                        onChange={(e) => setSafraForm({ ...safraForm, cultura: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        {CULTURAS_COMUNS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Data de Plantio *</label>
                                    <input
                                        type="date"
                                        required
                                        value={safraForm.data_plantio}
                                        onChange={(e) => setSafraForm({ ...safraForm, data_plantio: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Previsão de Colheita</label>
                                    <input
                                        type="date"
                                        value={safraForm.data_colheita_prevista}
                                        onChange={(e) => setSafraForm({ ...safraForm, data_colheita_prevista: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[#172033] mb-1 font-semibold">Observações / Variedade de Semente</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Variedade TMG 7062 IPRO, espaçamento 0,45m..."
                                    value={safraForm.observacoes}
                                    onChange={(e) => setSafraForm({ ...safraForm, observacoes: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalSafraOpen(false)}
                                    className="px-4 py-2.5 text-[#64748B] hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#087F5B] hover:bg-[#159A70] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold text-[#172033]">Lançar Insumo Agrícola</h3>
                                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                                    Safra: <strong className="text-[#087F5B]">{selectedSafraParaInsumo.cultura}</strong> ({selectedSafraParaInsumo.talhao_nome})
                                </p>
                            </div>
                            <button
                                onClick={() => setModalInsumoOpen(false)}
                                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorInsumo && (
                            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] text-xs rounded-xl flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorInsumo}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveInsumo} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Tipo de Insumo *</label>
                                    <select
                                        required
                                        value={insumoForm.tipo}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, tipo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        <option value="semente">🌱 Sementes / Mudas</option>
                                        <option value="fertilizante">🧪 Fertilizantes & Adubos</option>
                                        <option value="defensivo">🛡️ Defensivos / Herbicidas</option>
                                        <option value="outro">📦 Outro Insumo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Data da Aplicação *</label>
                                    <input
                                        type="date"
                                        required
                                        value={insumoForm.data}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, data: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[#172033] mb-1 font-semibold">Descrição do Produto *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: NPK 04-14-08 (15 toneladas) ou Glifosato 480"
                                    value={insumoForm.descricao}
                                    onChange={(e) => setInsumoForm({ ...insumoForm, descricao: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Quantidade</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="Ex: 15"
                                        value={insumoForm.quantidade}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, quantidade: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Valor Total (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        placeholder="Ex: 4500.00"
                                        value={insumoForm.valor}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, valor: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-[#172033] cursor-pointer pt-1 font-medium">
                                <input
                                    type="checkbox"
                                    checked={insumoForm.gerar_despesa_financeira}
                                    onChange={(e) => setInsumoForm({ ...insumoForm, gerar_despesa_financeira: e.target.checked })}
                                    className="rounded border-[#E6EBE8] text-[#087F5B] focus:ring-[#087F5B]"
                                />
                                <span>Lançar automaticamente como despesa no Financeiro</span>
                            </label>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalInsumoOpen(false)}
                                    className="px-4 py-2.5 text-[#64748B] hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#087F5B] hover:bg-[#159A70] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold text-[#172033]">Fechamento & Registro de Colheita</h3>
                                <p className="text-xs text-[#64748B] font-medium mt-0.5">
                                    Safra: <strong className="text-[#087F5B]">{selectedSafraParaColher.cultura}</strong> ({selectedSafraParaColher.talhao_nome}, {selectedSafraParaColher.talhao_area} ha)
                                </p>
                            </div>
                            <button
                                onClick={() => setModalColheitaOpen(false)}
                                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorColheita && (
                            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] text-xs rounded-xl flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorColheita}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveColheita} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Data Real da Colheita *</label>
                                    <input
                                        type="date"
                                        required
                                        value={colheitaForm.data_colheita_real}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, data_colheita_real: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Unidade de Medida *</label>
                                    <select
                                        value={colheitaForm.unidade_medida}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, unidade_medida: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        <option value="sacas">Sacas (sc)</option>
                                        <option value="toneladas">Toneladas (ton)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Quantidade Total Colhida *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        required
                                        placeholder="Ex: 3500"
                                        value={colheitaForm.quantidade_colhida}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, quantidade_colhida: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] font-semibold focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                    {colheitaForm.quantidade_colhida && selectedSafraParaColher.talhao_area > 0 && (
                                        <span className="text-[11px] text-[#D9A441] mt-1 block font-semibold">
                                            Produtividade: <strong>{(Number(colheitaForm.quantidade_colhida) / selectedSafraParaColher.talhao_area).toFixed(2)}</strong> {colheitaForm.unidade_medida}/ha
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Valor Total da Venda (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Ex: 420000.00"
                                        value={colheitaForm.valor_venda_total}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, valor_venda_total: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#087F5B] font-bold focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-[#172033] cursor-pointer pt-1 font-medium">
                                <input
                                    type="checkbox"
                                    checked={colheitaForm.gerar_receita_financeira}
                                    onChange={(e) => setColheitaForm({ ...colheitaForm, gerar_receita_financeira: e.target.checked })}
                                    className="rounded border-[#E6EBE8] text-[#087F5B] focus:ring-[#087F5B]"
                                />
                                <span>Lançar receita de venda automaticamente no Financeiro</span>
                            </label>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalColheitaOpen(false)}
                                    className="px-4 py-2.5 text-[#64748B] hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#087F5B] hover:bg-[#159A70] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
                                >
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
                                    {saving ? 'Fechando...' : 'Concluir Colheita'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Drawer Lateral: Detalhes & Insumos da Safra */}
            {drawerOpen && safraDetalhes && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm animate-fade-in flex justify-end">
                    <div className="w-full max-w-xl bg-white border-l border-[#E6EBE8] h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
                        <div className="space-y-6">
                            {/* Header Drawer */}
                            <div className="flex items-start justify-between border-b border-[#E6EBE8] pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#172033] tracking-tight">
                                            Safra: {safraDetalhes.cultura}
                                        </h2>
                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                                            safraDetalhes.status === 'colhida'
                                                ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]'
                                                : 'bg-[#FEF9E7] text-[#D9A441] border-[#FDE8B3]'
                                        }`}>
                                            {safraDetalhes.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-1 font-medium">
                                        Talhão: <strong className="text-[#172033]">{safraDetalhes.talhao_nome}</strong> ({safraDetalhes.talhao_area} ha)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Resumo Financeiro da Safra */}
                            <div className="grid grid-cols-2 gap-3 bg-[#F7F9F8] p-4 rounded-2xl border border-[#E6EBE8]">
                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-[#64748B]">Custo Total Insumos</span>
                                    <div className="text-lg font-bold text-[#D64545]">
                                        {formatCurrency(safraDetalhes.total_custo_insumos)}
                                    </div>
                                    <span className="text-[10px] text-[#64748B] font-medium">
                                        {formatCurrency(safraDetalhes.custo_por_ha)} / ha
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] uppercase font-semibold text-[#64748B]">
                                        {safraDetalhes.status === 'colhida' ? 'Receita Bruta' : 'Status'}
                                    </span>
                                    <div className="text-lg font-bold text-[#087F5B]">
                                        {safraDetalhes.status === 'colhida' 
                                            ? formatCurrency(safraDetalhes.valor_venda_total)
                                            : 'Em Andamento'}
                                    </div>
                                    <span className="text-[10px] text-[#64748B] font-medium">
                                        {safraDetalhes.status === 'colhida' 
                                            ? `Lucro: ${formatCurrency(safraDetalhes.lucro_bruto)}`
                                            : 'Aguardando Colheita'}
                                    </span>
                                </div>
                            </div>

                            {/* Lista de Insumos */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                                        <Package className="w-4 h-4 text-[#087F5B]" strokeWidth={2} />
                                        Insumos Aplicados ({safraDetalhes.insumos?.length || 0})
                                    </h3>
                                    {safraDetalhes.status !== 'colhida' && (
                                        <button
                                            onClick={() => handleOpenLancarInsumo(safraDetalhes)}
                                            className="text-xs bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
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
                                                className="bg-[#F7F9F8] border border-[#E6EBE8] p-3 rounded-xl flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-[#172033]">{i.descricao}</span>
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-[#64748B] border border-[#E6EBE8]">
                                                            {i.tipo}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-[#64748B] block mt-0.5">
                                                        {i.data} {i.quantidade ? `• ${i.quantidade} un` : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-[#D64545]">{formatCurrency(i.valor)}</span>
                                                    <button
                                                        onClick={() => handleDeleteInsumo(i.id)}
                                                        className="text-[#64748B] hover:text-[#D64545] transition-all p-1 cursor-pointer"
                                                        title="Remover Insumo"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-xs text-[#64748B] bg-[#F7F9F8] rounded-xl border border-dashed border-[#E6EBE8]">
                                        Nenhum insumo lançado para esta safra.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#E6EBE8]">
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="w-full bg-[#F7F9F8] hover:bg-slate-100 border border-[#E6EBE8] text-[#172033] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
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
