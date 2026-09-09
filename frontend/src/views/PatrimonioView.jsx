import React, { useState, useEffect } from 'react';
import { 
    Tractor, 
    Home, 
    Wrench, 
    Plus, 
    Trash2, 
    Edit, 
    Check, 
    X, 
    DollarSign, 
    TrendingDown, 
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info,
    Layers,
    Search,
    Filter,
    Shield,
    History
} from 'lucide-react';
import { api } from '../services/api';

const TIPOS_BENFEITORIA = [
    { value: 'casa_sede', label: 'Casa Sede' },
    { value: 'casa_caseiro', label: 'Casa de Caseiro / Moradia' },
    { value: 'curral', label: 'Curral / Centro de Manejo' },
    { value: 'galpao', label: 'Galpão / Armazém' },
    { value: 'cerca', label: 'Cercas e Divisórias' },
    { value: 'poco', label: 'Poço Artesiano / Reservatório' },
    { value: 'outro', label: 'Outra Benfeitoria' }
];

const TIPOS_MAQUINA = [
    { value: 'trator', label: 'Trator' },
    { value: 'implemento', label: 'Implemento / Grade / Plantadeira' },
    { value: 'veiculo', label: 'Veículo / Caminhonete / Caminhão' },
    { value: 'outro', label: 'Outro Equipamento' }
];

export default function PatrimonioView({ onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [subTab, setSubTab] = useState('maquinas'); // 'maquinas' | 'benfeitorias' | 'manutencoes'

    // Data State
    const [resumo, setResumo] = useState(null);
    const [maquinas, setMaquinas] = useState([]);
    const [benfeitorias, setBenfeitorias] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');

    // Modal Máquina
    const [modalMaquinaOpen, setModalMaquinaOpen] = useState(false);
    const [editingMaquina, setEditingMaquina] = useState(null);
    const [maquinaForm, setMaquinaForm] = useState({
        nome: '',
        tipo: 'trator',
        valor_aquisicao: '',
        data_aquisicao: new Date().toISOString().split('T')[0],
        vida_util_anos: '10',
        status: 'ativo',
        observacoes: ''
    });
    const [errorMaquina, setErrorMaquina] = useState('');

    // Modal Benfeitoria
    const [modalBenfeitoriaOpen, setModalBenfeitoriaOpen] = useState(false);
    const [editingBenfeitoria, setEditingBenfeitoria] = useState(null);
    const [benfeitoriaForm, setBenfeitoriaForm] = useState({
        tipo: 'curral',
        descricao: '',
        valor_aquisicao: '',
        data_aquisicao: new Date().toISOString().split('T')[0],
        vida_util_anos: '20',
        observacoes: ''
    });
    const [errorBenfeitoria, setErrorBenfeitoria] = useState('');

    // Modal Manutenção
    const [modalManutencaoOpen, setModalManutencaoOpen] = useState(false);
    const [selectedMaquinaParaMt, setSelectedMaquinaParaMt] = useState(null);
    const [manutencaoForm, setManutencaoForm] = useState({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: ''
    });
    const [errorManutencao, setErrorManutencao] = useState('');

    // Modal Histórico de Máquina
    const [modalHistoricoOpen, setModalHistoricoOpen] = useState(false);
    const [maquinaHistorico, setMaquinaHistorico] = useState(null);

    const [feedback, setFeedback] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [resumoData, maquinasData, benfeitoriasData, manutencoesData] = await Promise.all([
                api.getPatrimonioResumo(),
                api.getMaquinas(),
                api.getBenfeitorias(),
                api.getManutencoes()
            ]);
            setResumo(resumoData);
            setMaquinas(maquinasData);
            setBenfeitorias(benfeitoriasData);
            setManutencoes(manutencoesData);
        } catch (err) {
            console.error('Erro ao carregar dados do patrimônio:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (triggerNewModal === 'nova_maquina') {
            handleOpenNewMaquina();
            onResetTrigger?.();
        } else if (triggerNewModal === 'nova_benfeitoria') {
            handleOpenNewBenfeitoria();
            onResetTrigger?.();
        }
    }, [triggerNewModal]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    // Handlers Máquinas
    const handleOpenNewMaquina = () => {
        setEditingMaquina(null);
        setMaquinaForm({
            nome: '',
            tipo: 'trator',
            valor_aquisicao: '',
            data_aquisicao: new Date().toISOString().split('T')[0],
            vida_util_anos: '10',
            status: 'ativo',
            observacoes: ''
        });
        setErrorMaquina('');
        setModalMaquinaOpen(true);
    };

    const handleOpenEditMaquina = (m) => {
        setEditingMaquina(m);
        setMaquinaForm({
            nome: m.nome,
            tipo: m.tipo,
            valor_aquisicao: String(m.valor_aquisicao),
            data_aquisicao: m.data_aquisicao,
            vida_util_anos: String(m.vida_util_anos),
            status: m.status,
            observacoes: m.observacoes || ''
        });
        setErrorMaquina('');
        setModalMaquinaOpen(true);
    };

    const handleSaveMaquina = async (e) => {
        e.preventDefault();
        setErrorMaquina('');
        try {
            if (editingMaquina) {
                await api.updateMaquina(editingMaquina.id, maquinaForm);
                setFeedback('Máquina/equipamento atualizado com sucesso!');
            } else {
                await api.createMaquina(maquinaForm);
                setFeedback('Máquina/equipamento cadastrado com sucesso!');
            }
            setModalMaquinaOpen(false);
            loadData();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            setErrorMaquina(err.message);
        }
    };

    const handleDeleteMaquina = async (id, nome) => {
        if (!window.confirm(`Deseja realmente excluir a máquina "${nome}" e todo o histórico de manutenções dela?`)) return;
        try {
            await api.deleteMaquina(id);
            setFeedback('Máquina excluída com sucesso!');
            loadData();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            alert(err.message);
        }
    };

    // Handlers Benfeitorias
    const handleOpenNewBenfeitoria = () => {
        setEditingBenfeitoria(null);
        setBenfeitoriaForm({
            tipo: 'curral',
            descricao: '',
            valor_aquisicao: '',
            data_aquisicao: new Date().toISOString().split('T')[0],
            vida_util_anos: '20',
            observacoes: ''
        });
        setErrorBenfeitoria('');
        setModalBenfeitoriaOpen(true);
    };

    const handleOpenEditBenfeitoria = (b) => {
        setEditingBenfeitoria(b);
        setBenfeitoriaForm({
            tipo: b.tipo,
            descricao: b.descricao,
            valor_aquisicao: String(b.valor_aquisicao),
            data_aquisicao: b.data_aquisicao,
            vida_util_anos: String(b.vida_util_anos),
            observacoes: b.observacoes || ''
        });
        setErrorBenfeitoria('');
        setModalBenfeitoriaOpen(true);
    };

    const handleSaveBenfeitoria = async (e) => {
        e.preventDefault();
        setErrorBenfeitoria('');
        try {
            if (editingBenfeitoria) {
                await api.updateBenfeitoria(editingBenfeitoria.id, benfeitoriaForm);
                setFeedback('Benfeitoria atualizada com sucesso!');
            } else {
                await api.createBenfeitoria(benfeitoriaForm);
                setFeedback('Benfeitoria cadastrada com sucesso!');
            }
            setModalBenfeitoriaOpen(false);
            loadData();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            setErrorBenfeitoria(err.message);
        }
    };

    const handleDeleteBenfeitoria = async (id, desc) => {
        if (!window.confirm(`Deseja realmente excluir a benfeitoria "${desc}"?`)) return;
        try {
            await api.deleteBenfeitoria(id);
            setFeedback('Benfeitoria excluída com sucesso!');
            loadData();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            alert(err.message);
        }
    };

    // Handlers Manutenção
    const handleOpenNovaManutencao = (maquina) => {
        setSelectedMaquinaParaMt(maquina);
        setManutencaoForm({
            data: new Date().toISOString().split('T')[0],
            descricao: '',
            valor: ''
        });
        setErrorManutencao('');
        setModalManutencaoOpen(true);
    };

    const handleSaveManutencao = async (e) => {
        e.preventDefault();
        setErrorManutencao('');
        try {
            await api.createManutencao({
                maquina_id: selectedMaquinaParaMt.id,
                ...manutencaoForm
            });
            setFeedback(`Manutenção registrada e despesa financeira gerada automaticamente!`);
            setModalManutencaoOpen(false);
            if (modalHistoricoOpen && maquinaHistorico?.id === selectedMaquinaParaMt.id) {
                handleVerHistorico(selectedMaquinaParaMt.id);
            }
            loadData();
            onReloadDashboard?.();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            setErrorManutencao(err.message);
        }
    };

    const handleVerHistorico = async (maquinaId) => {
        try {
            const data = await api.getMaquinaById(maquinaId);
            setMaquinaHistorico(data);
            setModalHistoricoOpen(true);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteManutencao = async (id) => {
        if (!window.confirm('Excluir este registro de manutenção?')) return;
        try {
            await api.deleteManutencao(id);
            setFeedback('Manutenção excluída!');
            if (maquinaHistorico) {
                handleVerHistorico(maquinaHistorico.id);
            }
            loadData();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            alert(err.message);
        }
    };

    // Filtros de listagem
    const maquinasFiltradas = maquinas.filter(m => {
        const matchesBusca = m.nome.toLowerCase().includes(busca.toLowerCase()) || (m.observacoes || '').toLowerCase().includes(busca.toLowerCase());
        const matchesTipo = filtroTipo ? m.tipo === filtroTipo : true;
        const matchesStatus = filtroStatus ? m.status === filtroStatus : true;
        return matchesBusca && matchesTipo && matchesStatus;
    });

    const benfeitoriasFiltradas = benfeitorias.filter(b => {
        const matchesBusca = b.descricao.toLowerCase().includes(busca.toLowerCase()) || (b.observacoes || '').toLowerCase().includes(busca.toLowerCase());
        const matchesTipo = filtroTipo ? b.tipo === filtroTipo : true;
        return matchesBusca && matchesTipo;
    });

    return (
        <div className="space-y-6">
            {/* Feedback Alert */}
            {feedback && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-sm font-medium">{feedback}</span>
                    </div>
                    <button onClick={() => setFeedback('')} className="text-emerald-400 hover:text-emerald-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* KPI Cards Consolidado do Patrimônio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Valor Patrimonial Atual (Destaque Principal) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Patrimônio Atual Líquido</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-400 tracking-tight">
                        {formatCurrency(resumo?.total_patrimonial_atual || 0)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-300 font-medium">
                        Soma após depreciação linear acumulada
                    </div>
                </div>

                {/* 2. Total de Aquisição Original */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo de Aquisição</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-white tracking-tight">
                        {formatCurrency(resumo?.total_aquisicao || 0)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {resumo?.maquinas?.total_itens || 0} máquinas + {resumo?.benfeitorias?.total_itens || 0} benfeitorias
                    </div>
                </div>

                {/* 3. Depreciação Acumulada */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Depreciação Acumulada</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <TrendingDown className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
                        {formatCurrency(resumo?.total_depreciacao_acumulada || 0)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {resumo?.total_aquisicao > 0 
                            ? `${((resumo.total_depreciacao_acumulada / resumo.total_aquisicao) * 100).toFixed(1)}% do valor original consumido`
                            : '0% consumido'}
                    </div>
                </div>

                {/* 4. Total Gasto com Manutenções */}
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gasto com Manutenções</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <Wrench className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-purple-400 tracking-tight">
                        {formatCurrency(resumo?.manutencoes?.total_gasto || 0)}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                        {resumo?.manutencoes?.total_registros || 0} manutenções registradas
                    </div>
                </div>
            </div>

            {/* Navigation Tabs and Top Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => { setSubTab('maquinas'); setFiltroTipo(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition ${
                            subTab === 'maquinas'
                                ? 'bg-emerald-500 text-white shadow-md font-semibold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Tractor className="w-4 h-4" />
                        <span>Máquinas & Equipamentos ({maquinas.length})</span>
                    </button>

                    <button
                        onClick={() => { setSubTab('benfeitorias'); setFiltroTipo(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition ${
                            subTab === 'benfeitorias'
                                ? 'bg-emerald-500 text-white shadow-md font-semibold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Home className="w-4 h-4" />
                        <span>Benfeitorias & Instalações ({benfeitorias.length})</span>
                    </button>

                    <button
                        onClick={() => setSubTab('manutencoes')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition ${
                            subTab === 'manutencoes'
                                ? 'bg-emerald-500 text-white shadow-md font-semibold'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Todas as Manutenções ({manutencoes.length})</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {subTab === 'maquinas' && (
                        <button
                            onClick={handleOpenNewMaquina}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Máquina / Veículo</span>
                        </button>
                    )}

                    {subTab === 'benfeitorias' && (
                        <button
                            onClick={handleOpenNewBenfeitoria}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Benfeitoria</span>
                        </button>
                    )}
                </div>
            </div>

            {/* TAB 1: MÁQUINAS & EQUIPAMENTOS */}
            {subTab === 'maquinas' && (
                <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar máquinas por nome ou modelo..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">Todos os Tipos</option>
                            {TIPOS_MAQUINA.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>

                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">Todos os Status</option>
                            <option value="ativo">Ativos</option>
                            <option value="em_manutencao">Em Manutenção</option>
                            <option value="vendido">Vendidos</option>
                        </select>
                    </div>

                    {/* Cards Grid de Máquinas */}
                    {maquinasFiltradas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {maquinasFiltradas.map((m) => (
                                <div
                                    key={m.id}
                                    className={`rounded-2xl bg-slate-900/90 border p-5 flex flex-col justify-between transition relative overflow-hidden shadow-sm hover:border-slate-700 ${
                                        m.status === 'em_manutencao' ? 'border-amber-500/30' : 'border-slate-800'
                                    }`}
                                >
                                    <div>
                                        {/* Header do Card */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                                    {m.tipo}
                                                </span>
                                                <h3 className="text-base font-bold text-white tracking-tight mt-1.5">{m.nome}</h3>
                                            </div>

                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                                                m.status === 'ativo'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : m.status === 'em_manutencao'
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    : 'bg-slate-700 border-slate-600 text-slate-300'
                                            }`}>
                                                {m.status === 'em_manutencao' ? 'Em Manutenção' : m.status}
                                            </span>
                                        </div>

                                        {/* Financial & Depreciation Specs */}
                                        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-medium">Valor Atual (Líquido)</span>
                                                <span className="text-base font-black text-emerald-400">{formatCurrency(m.valor_atual)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-medium">Aquisição Original</span>
                                                <span className="text-xs font-semibold text-slate-300">{formatCurrency(m.valor_aquisicao)}</span>
                                            </div>
                                        </div>

                                        {/* Depreciation Progress Bar */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-400 font-medium">Vida Útil ({m.vida_util_anos} anos)</span>
                                                <span className="text-amber-400 font-bold">{m.percentual_depreciado}% depreciado</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${m.percentual_depreciado}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span>Adquirido em: {m.data_aquisicao}</span>
                                                <span>Deprec. Anual: {formatCurrency(m.depreciacao_anual)}/ano</span>
                                            </div>
                                        </div>

                                        {/* Maintenance Info */}
                                        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                                            <span className="flex items-center gap-1.5">
                                                <Wrench className="w-3.5 h-3.5 text-purple-400" />
                                                <span>{m.total_manutencoes_count || 0} manutenções</span>
                                            </span>
                                            <span className="text-purple-400 font-semibold">{formatCurrency(m.total_gasto_manutencoes || 0)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3 mt-4">
                                        <button
                                            onClick={() => handleOpenNovaManutencao(m)}
                                            className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium text-xs px-3 py-1.5 rounded-lg transition"
                                        >
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>Lançar Manutenção</span>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleVerHistorico(m.id)}
                                                title="Histórico de Manutenções"
                                                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditMaquina(m)}
                                                title="Editar Máquina"
                                                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMaquina(m.id, m.nome)}
                                                title="Excluir Máquina"
                                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
                            <Tractor className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-slate-300">Nenhuma máquina ou equipamento cadastrado</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Cadastre tratores, implementos e veículos para acompanhar a depreciação e custos de oficina.</p>
                            <button
                                onClick={handleOpenNewMaquina}
                                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Cadastrar Máquina</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: BENFEITORIAS & INSTALAÇÕES */}
            {subTab === 'benfeitorias' && (
                <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar benfeitoria por descrição..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="">Todos os Tipos de Benfeitoria</option>
                            {TIPOS_BENFEITORIA.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cards Grid de Benfeitorias */}
                    {benfeitoriasFiltradas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {benfeitoriasFiltradas.map((b) => (
                                <div
                                    key={b.id}
                                    className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col justify-between transition shadow-sm hover:border-slate-700"
                                >
                                    <div>
                                        {/* Header do Card */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                                    {TIPOS_BENFEITORIA.find(t => t.value === b.tipo)?.label || b.tipo}
                                                </span>
                                                <h3 className="text-base font-bold text-white tracking-tight mt-1.5">{b.descricao}</h3>
                                            </div>
                                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                                                <Home className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Values */}
                                        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-medium">Valor Atual (Líquido)</span>
                                                <span className="text-base font-black text-emerald-400">{formatCurrency(b.valor_atual)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block font-medium">Aquisição / Construção</span>
                                                <span className="text-xs font-semibold text-slate-300">{formatCurrency(b.valor_aquisicao)}</span>
                                            </div>
                                        </div>

                                        {/* Depreciation Progress Bar */}
                                        <div className="space-y-1.5 mb-4">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-400 font-medium">Vida Útil Estimada ({b.vida_util_anos} anos)</span>
                                                <span className="text-amber-400 font-bold">{b.percentual_depreciado}% depreciado</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${b.percentual_depreciado}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span>Data: {b.data_aquisicao}</span>
                                                <span>Deprec. Anual: {formatCurrency(b.depreciacao_anual)}/ano</span>
                                            </div>
                                        </div>

                                        {b.observacoes && (
                                            <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
                                                {b.observacoes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-1.5 border-t border-slate-800/80 pt-3 mt-4">
                                        <button
                                            onClick={() => handleOpenEditBenfeitoria(b)}
                                            title="Editar Benfeitoria"
                                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBenfeitoria(b.id, b.descricao)}
                                            title="Excluir Benfeitoria"
                                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
                            <Home className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-slate-300">Nenhuma benfeitoria cadastrada</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">Cadastre currais, galpões, casas, poços e cercas para valorizar o patrimônio da fazenda.</p>
                            <button
                                onClick={handleOpenNewBenfeitoria}
                                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-4 py-2 rounded-xl transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Cadastrar Benfeitoria</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: TODAS AS MANUTENÇÕES */}
            {subTab === 'manutencoes' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">Histórico Geral de Manutenções</h3>
                            <p className="text-xs text-slate-400">Todas as ordens de serviço e despesas de oficina registradas na propriedade</p>
                        </div>
                        <div className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                            Total Gasto: {formatCurrency(resumo?.manutencoes?.total_gasto || 0)}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Máquina / Equipamento</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Descrição do Serviço</th>
                                    <th className="p-4 text-right">Valor</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {manutencoes.map((mt) => (
                                    <tr key={mt.id} className="hover:bg-slate-800/40 transition">
                                        <td className="p-4 font-medium text-slate-200 whitespace-nowrap">{mt.data}</td>
                                        <td className="p-4 font-bold text-white whitespace-nowrap">{mt.maquina_nome}</td>
                                        <td className="p-4 text-slate-400 uppercase text-[11px] font-medium">{mt.maquina_tipo}</td>
                                        <td className="p-4 text-slate-300">{mt.descricao}</td>
                                        <td className="p-4 text-right font-black text-rose-400">{formatCurrency(mt.valor)}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDeleteManutencao(mt.id)}
                                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                                                title="Excluir Manutenção"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {manutencoes.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-slate-500">
                                            Nenhum registro de manutenção encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL CADASTRAR / EDITAR MÁQUINA */}
            {modalMaquinaOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Tractor className="w-5 h-5 text-emerald-400" />
                                <span>{editingMaquina ? 'Editar Máquina / Equipamento' : 'Nova Máquina / Equipamento'}</span>
                            </h3>
                            <button onClick={() => setModalMaquinaOpen(false)} className="text-slate-400 hover:text-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMaquina} className="p-6 space-y-4">
                            {errorMaquina && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMaquina}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome / Modelo do Equipamento *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Trator John Deere 6110M 4x4"
                                    value={maquinaForm.nome}
                                    onChange={(e) => setMaquinaForm({ ...maquinaForm, nome: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo *</label>
                                    <select
                                        value={maquinaForm.tipo}
                                        onChange={(e) => setMaquinaForm({ ...maquinaForm, tipo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        {TIPOS_MAQUINA.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status *</label>
                                    <select
                                        value={maquinaForm.status}
                                        onChange={(e) => setMaquinaForm({ ...maquinaForm, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ativo">Ativo / Operacional</option>
                                        <option value="em_manutencao">Em Manutenção</option>
                                        <option value="vendido">Vendido</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valor de Aquisição (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 350000"
                                        value={maquinaForm.valor_aquisicao}
                                        onChange={(e) => setMaquinaForm({ ...maquinaForm, valor_aquisicao: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vida Útil (Anos) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Ex: 10"
                                        value={maquinaForm.vida_util_anos}
                                        onChange={(e) => setMaquinaForm({ ...maquinaForm, vida_util_anos: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data de Aquisição *</label>
                                <input
                                    type="date"
                                    required
                                    value={maquinaForm.data_aquisicao}
                                    onChange={(e) => setMaquinaForm({ ...maquinaForm, data_aquisicao: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observações (Opcional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Chassi, horímetro inicial, nota fiscal..."
                                    value={maquinaForm.observacoes}
                                    onChange={(e) => setMaquinaForm({ ...maquinaForm, observacoes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalMaquinaOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
                                >
                                    {editingMaquina ? 'Salvar Alterações' : 'Cadastrar Máquina'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL CADASTRAR / EDITAR BENFEITORIA */}
            {modalBenfeitoriaOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Home className="w-5 h-5 text-emerald-400" />
                                <span>{editingBenfeitoria ? 'Editar Benfeitoria' : 'Nova Benfeitoria'}</span>
                            </h3>
                            <button onClick={() => setModalBenfeitoriaOpen(false)} className="text-slate-400 hover:text-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBenfeitoria} className="p-6 space-y-4">
                            {errorBenfeitoria && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorBenfeitoria}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Benfeitoria *</label>
                                <select
                                    value={benfeitoriaForm.tipo}
                                    onChange={(e) => setBenfeitoriaForm({ ...benfeitoriaForm, tipo: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                >
                                    {TIPOS_BENFEITORIA.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição / Identificação *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Curral Anti-estresse com Balança e Tronco"
                                    value={benfeitoriaForm.descricao}
                                    onChange={(e) => setBenfeitoriaForm({ ...benfeitoriaForm, descricao: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valor de Aquisição / Obra (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 85000"
                                        value={benfeitoriaForm.valor_aquisicao}
                                        onChange={(e) => setBenfeitoriaForm({ ...benfeitoriaForm, valor_aquisicao: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vida Útil (Anos) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Ex: 20"
                                        value={benfeitoriaForm.vida_util_anos}
                                        onChange={(e) => setBenfeitoriaForm({ ...benfeitoriaForm, vida_util_anos: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data de Conclusão / Aquisição *</label>
                                <input
                                    type="date"
                                    required
                                    value={benfeitoriaForm.data_aquisicao}
                                    onChange={(e) => setBenfeitoriaForm({ ...benfeitoriaForm, data_aquisicao: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observações (Opcional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Material utilizado, localização, capacidade..."
                                    value={benfeitoriaForm.observacoes}
                                    onChange={(e) => setBenfeitoriaForm({ ...benfeitoriaForm, observacoes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalBenfeitoriaOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
                                >
                                    {editingBenfeitoria ? 'Salvar Alterações' : 'Cadastrar Benfeitoria'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL LANÇAR MANUTENÇÃO (AUTOMATIZA FINANCEIRO) */}
            {modalManutencaoOpen && selectedMaquinaParaMt && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-purple-400" />
                                    <span>Lançar Manutenção</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">{selectedMaquinaParaMt.nome} ({selectedMaquinaParaMt.tipo})</p>
                            </div>
                            <button onClick={() => setModalManutencaoOpen(false)} className="text-slate-400 hover:text-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveManutencao} className="p-6 space-y-4">
                            {errorManutencao && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorManutencao}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição do Serviço / Peça *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Troca de óleo do motor, filtro e embuchamento"
                                    value={manutencaoForm.descricao}
                                    onChange={(e) => setManutencaoForm({ ...manutencaoForm, descricao: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valor Total (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 1850.00"
                                        value={manutencaoForm.valor}
                                        onChange={(e) => setManutencaoForm({ ...manutencaoForm, valor: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data do Serviço *</label>
                                    <input
                                        type="date"
                                        required
                                        value={manutencaoForm.data}
                                        onChange={(e) => setManutencaoForm({ ...manutencaoForm, data: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-2.5">
                                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <span className="text-[11px] text-purple-300 leading-relaxed">
                                    Ao confirmar, uma <strong>despesa</strong> de categoria <code>manutencao_maquina</code> será lançada automaticamente no Financeiro.
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalManutencaoOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-xs transition shadow-lg shadow-purple-500/20"
                                >
                                    Registrar Manutenção
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HISTÓRICO DE MANUTENÇÃO POR MÁQUINA */}
            {modalHistoricoOpen && maquinaHistorico && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-purple-400" />
                                    <span>Histórico de Manutenções</span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">{maquinaHistorico.nome} ({maquinaHistorico.tipo})</p>
                            </div>
                            <button onClick={() => setModalHistoricoOpen(false)} className="text-slate-400 hover:text-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                            <div className="text-xs text-slate-300">
                                Total Acumulado em Oficina: <span className="font-bold text-purple-400">{formatCurrency(maquinaHistorico.total_gasto_manutencoes)}</span>
                            </div>
                            <button
                                onClick={() => handleOpenNovaManutencao(maquinaHistorico)}
                                className="flex items-center gap-1.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Nova Manutenção</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-800">
                            {maquinaHistorico.manutencoes?.length > 0 ? (
                                maquinaHistorico.manutencoes.map(mt => (
                                    <div key={mt.id} className="py-3.5 flex items-center justify-between gap-4">
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 block">{mt.data}</span>
                                            <p className="text-sm font-semibold text-slate-100 mt-0.5">{mt.descricao}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-rose-400">{formatCurrency(mt.valor)}</span>
                                            <button
                                                onClick={() => handleDeleteManutencao(mt.id)}
                                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-xs text-slate-500">
                                    Nenhuma manutenção registrada para esta máquina.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
