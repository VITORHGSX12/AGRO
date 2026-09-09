import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, 
    Plus, 
    Check, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    Trash2, 
    Calendar,
    X,
    Filter,
    Search,
    RefreshCw,
    Shield,
    AlertCircle,
    Activity,
    FileText,
    Users
} from 'lucide-react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

export default function SanidadeView({ onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [kpis, setKpis] = useState(null);
    const [sanidades, setSanidades] = useState([]);
    const [animais, setAnimais] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [busca, setBusca] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tipo: 'vacina',
        nome_produto: '',
        animal_id: '',
        lote_ou_grupo: 'Todo o Rebanho',
        data_aplicacao: new Date().toISOString().split('T')[0],
        data_proxima_dose: '',
        dias_carencia: '0',
        status: 'pendente',
        observacoes: ''
    });
    const [isColetivo, setIsColetivo] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [feedback, setFeedback] = useState('');

    const showFeedback = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 4000);
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const queryParams = {
                status_filtro: filtroStatus || undefined,
                tipo: filtroTipo || undefined,
                busca: busca || undefined
            };

            const [kpisData, sanData, animData] = await Promise.all([
                api.getSanidadeKpis().catch(() => null),
                api.getSanidade(queryParams),
                api.getAnimais({ status: 'ativo' })
            ]);
            setKpis(kpisData);
            setSanidades(sanData);
            setAnimais(animData);
            setCurrentPage(1);
        } catch (err) {
            console.error('Erro ao carregar sanidade:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filtroStatus, filtroTipo, busca]);

    useEffect(() => {
        if (triggerNewModal) {
            handleOpenNew();
            onResetTrigger();
        }
    }, [triggerNewModal]);

    const handleOpenNew = () => {
        setFormData({
            tipo: 'vacina',
            nome_produto: '',
            animal_id: animais.length > 0 ? String(animais[0].id) : '',
            lote_ou_grupo: 'Todo o Rebanho',
            data_aplicacao: new Date().toISOString().split('T')[0],
            data_proxima_dose: '',
            dias_carencia: '0',
            status: 'pendente',
            observacoes: ''
        });
        setIsColetivo(true);
        setErrorMsg('');
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');

        try {
            await api.createSanidade({
                ...formData,
                animal_id: isColetivo ? null : (formData.animal_id ? Number(formData.animal_id) : null),
                lote_ou_grupo: isColetivo ? formData.lote_ou_grupo : null,
                dias_carencia: Number(formData.dias_carencia) || 0
            });
            showFeedback('Protocolo sanitário registrado com sucesso!');
            setModalOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleConcluir = async (id, produto) => {
        try {
            await api.concluirSanidade(id, {
                data_aplicacao: new Date().toISOString().split('T')[0]
            });
            showFeedback(`Aplicação de ${produto} confirmada com sucesso!`);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id, produto) => {
        if (!window.confirm(`Tem certeza que deseja excluir o registro de ${produto}?`)) {
            return;
        }
        try {
            await api.deleteSanidade(id);
            showFeedback('Registro sanitário excluído!');
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert(err.message);
        }
    };

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sanidades.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sanidades.length / itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Toast Feedback */}
            {feedback && (
                <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Sanidade Animal & Protocolos
                        </h1>
                        <p className="text-sm text-slate-400">
                            Calendário vacinal, controle de vermífugos, histórico de tratamentos e períodos de carência
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all text-sm self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    Nova Aplicação / Protocolo
                </button>
            </div>

            {/* Top KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button
                        onClick={() => setFiltroStatus('')}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                            filtroStatus === ''
                                ? 'bg-slate-800/90 border-slate-600 shadow-lg'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Registros</span>
                        <div className="text-2xl font-bold text-white">{kpis.total}</div>
                        <span className="text-[11px] text-slate-500 block mt-1">Histórico completo</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('atrasada')}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                            filtroStatus === 'atrasada'
                                ? 'bg-red-500/20 border-red-500/50 shadow-lg'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-red-500/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Atrasadas</span>
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div className="text-2xl font-bold text-red-400">{kpis.atrasadas}</div>
                        <span className="text-[11px] text-red-300/60 block mt-1">Prazo expirado</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('alerta_vencendo')}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                            filtroStatus === 'alerta_vencendo'
                                ? 'bg-amber-500/20 border-amber-500/50 shadow-lg'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-amber-500/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Vencendo (7d)</span>
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-amber-400">{kpis.alerta_vencendo}</div>
                        <span className="text-[11px] text-amber-300/60 block mt-1">Próximas aplicações</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('sob_carencia')}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                            filtroStatus === 'sob_carencia'
                                ? 'bg-purple-500/20 border-purple-500/50 shadow-lg'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Sob Carência</span>
                            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold text-purple-400">{kpis.sob_carencia}</div>
                        <span className="text-[11px] text-purple-300/60 block mt-1">Bloqueio p/ abate</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('aplicada')}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                            filtroStatus === 'aplicada'
                                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Aplicadas</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{kpis.aplicadas}</div>
                        <span className="text-[11px] text-emerald-300/60 block mt-1">Doses concluídas</span>
                    </button>
                </div>
            )}

            {/* Filtros e Busca */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por produto, brinco ou lote..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="bg-slate-800/80 border border-slate-700/80 text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500 transition-all w-56 sm:w-64"
                        />
                    </div>

                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="bg-slate-800/80 border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="vacina">💉 Vacina</option>
                        <option value="vermifugo">💊 Vermífugo</option>
                        <option value="tratamento">🩺 Tratamento / Antibiótico</option>
                        <option value="outro">📦 Outro</option>
                    </select>

                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="bg-slate-800/80 border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Status</option>
                        <option value="pendente">⏳ Pendente</option>
                        <option value="alerta_vencendo">⚠️ Vencendo em 7 dias</option>
                        <option value="atrasada">🚨 Atrasada</option>
                        <option value="sob_carencia">🛡️ Sob Carência Sanitária</option>
                        <option value="aplicada">✅ Aplicada</option>
                    </select>
                </div>

                <div className="text-xs text-slate-400">
                    Total: <strong className="text-white">{sanidades.length}</strong> registros
                </div>
            </div>

            {/* Tabela de Sanidade */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                            <tr>
                                <th className="py-3.5 px-4">Alvo / Animal</th>
                                <th className="py-3.5 px-4">Tipo & Produto</th>
                                <th className="py-3.5 px-4">Data Aplicação</th>
                                <th className="py-3.5 px-4">Próxima Dose</th>
                                <th className="py-3.5 px-4">Carência Sanitária</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500">
                                        Carregando registros sanitários...
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500">
                                        Nenhum registro sanitário encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(item => {
                                    const isAtrasada = item.is_atrasada;
                                    const isVencendo = item.is_vencendo_7dias;
                                    const isAplicada = item.status === 'aplicada';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/30 transition-all">
                                            {/* Alvo / Animal */}
                                            <td className="py-3 px-4">
                                                {item.animal_brinco ? (
                                                    <div>
                                                        <span className="font-bold text-white tracking-wide">
                                                            🏷️ {item.animal_brinco}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">
                                                            {item.animal_categoria || 'Animal'} {item.piquete_nome ? `• ${item.piquete_nome}` : ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="font-semibold text-amber-400 flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {item.lote_ou_grupo || 'Aplicação Coletiva'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 block">Grupo / Rebanho</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Tipo & Produto */}
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-white">{item.nome_produto}</div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                                    {item.tipo}
                                                </span>
                                            </td>

                                            {/* Data Aplicação */}
                                            <td className="py-3 px-4">
                                                <span className="text-slate-300 font-medium">{item.data_aplicacao}</span>
                                            </td>

                                            {/* Próxima Dose */}
                                            <td className="py-3 px-4">
                                                {item.data_proxima_dose ? (
                                                    <span className={`font-semibold ${
                                                        isAtrasada ? 'text-red-400' : isVencendo ? 'text-amber-400' : 'text-slate-300'
                                                    }`}>
                                                        {item.data_proxima_dose}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-500">—</span>
                                                )}
                                            </td>

                                            {/* Carência */}
                                            <td className="py-3 px-4">
                                                {item.dias_carencia > 0 ? (
                                                    item.sob_carencia ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                            <ShieldAlert className="w-3 h-3" />
                                                            {item.dias_restantes_carencia}d restantes (até {item.data_fim_carencia})
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">
                                                            {item.dias_carencia} dias (liberado)
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-500 text-[11px]">Sem carência</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4">
                                                {isAplicada ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Aplicada
                                                    </span>
                                                ) : isAtrasada ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Atrasada
                                                    </span>
                                                ) : isVencendo ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        <Clock className="w-3 h-3" />
                                                        Vence em breve
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                                        <Calendar className="w-3 h-3" />
                                                        Agendada
                                                    </span>
                                                )}
                                            </td>

                                            {/* Ações */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {!isAplicada && (
                                                        <button
                                                            onClick={() => handleConcluir(item.id, item.nome_produto)}
                                                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shadow-md shadow-emerald-600/20"
                                                            title="Confirmar Aplicação da Dose"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            Aplicar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.nome_produto)}
                                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Excluir Registro"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-800">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal Nova Aplicação Sanitária */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-bold text-white">Nova Aplicação / Protocolo Sanitário</h3>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            {/* Toggle Individual vs Coletivo */}
                            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                                <button
                                    type="button"
                                    onClick={() => setIsColetivo(true)}
                                    className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                                        isColetivo ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    👥 Aplicação Coletiva (Lote / Rebanho)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsColetivo(false)}
                                    className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                                        !isColetivo ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    🏷️ Animal Individual (Brinco)
                                </button>
                            </div>

                            {/* Alvo */}
                            {isColetivo ? (
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Lote / Grupo Alvo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Todo o Rebanho, Bezerros Desmamados, Piquete 01"
                                        value={formData.lote_ou_grupo}
                                        onChange={(e) => setFormData({ ...formData, lote_ou_grupo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Selecione o Animal (Brinco) *</label>
                                    <select
                                        required
                                        value={formData.animal_id}
                                        onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">Selecione o animal...</option>
                                        {animais.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.identificacao} - {a.raca || 'S/R'} ({a.categoria}, {a.peso_atual ? `${a.peso_atual} kg` : 's/ peso'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Tipo e Produto */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Tipo de Procedimento *</label>
                                    <select
                                        required
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="vacina">💉 Vacina</option>
                                        <option value="vermifugo">💊 Vermífugo</option>
                                        <option value="tratamento">🩺 Tratamento / Antibiótico</option>
                                        <option value="outro">📦 Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Nome do Produto / Medicamento *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Vacina Febre Aftosa / Ivermectina 1%"
                                        value={formData.nome_produto}
                                        onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Datas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Data de Aplicação / Agendada *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data_aplicacao}
                                        onChange={(e) => setFormData({ ...formData, data_aplicacao: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Próxima Dose / Reforço</label>
                                    <input
                                        type="date"
                                        value={formData.data_proxima_dose}
                                        onChange={(e) => setFormData({ ...formData, data_proxima_dose: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Carência e Status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Carência Sanitária (Dias)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Ex: 28 dias para abate"
                                        value={formData.dias_carencia}
                                        onChange={(e) => setFormData({ ...formData, dias_carencia: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-medium">Status Inicial *</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="pendente">⏳ Pendente / Agendada</option>
                                        <option value="aplicada">✅ Já Aplicada Hoje</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-medium">Observações & Dosagem</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Dosagem 5ml via subcutânea, lote do frasco #8921..."
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
