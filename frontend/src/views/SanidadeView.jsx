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
    Search,
    RefreshCw,
    Shield,
    AlertCircle,
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
    const [modalConcluirOpen, setModalConcluirOpen] = useState(false);
    const [itemToConcluir, setItemToConcluir] = useState(null);
    const [concluirData, setConcluirData] = useState({
        data_aplicacao: new Date().toISOString().split('T')[0],
        custo: '',
        gerar_lancamento_financeiro: true
    });

    const [formData, setFormData] = useState({
        tipo: 'vacina',
        nome_produto: '',
        animal_id: '',
        lote_ou_grupo: 'Todo o Rebanho',
        data_aplicacao: new Date().toISOString().split('T')[0],
        data_proxima_dose: '',
        dias_carencia: '0',
        custo: '',
        status: 'pendente',
        gerar_lancamento_financeiro: true,
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
            custo: '',
            status: 'pendente',
            gerar_lancamento_financeiro: true,
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
                dias_carencia: Number(formData.dias_carencia) || 0,
                custo: Number(formData.custo) || 0,
                gerar_lancamento_financeiro: formData.gerar_lancamento_financeiro
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

    const handleOpenConcluirModal = (item) => {
        setItemToConcluir(item);
        setConcluirData({
            data_aplicacao: new Date().toISOString().split('T')[0],
            custo: item.custo > 0 ? String(item.custo) : '',
            gerar_lancamento_financeiro: true
        });
        setModalConcluirOpen(true);
    };

    const handleSaveConcluir = async (e) => {
        e.preventDefault();
        if (!itemToConcluir) return;
        setSaving(true);
        try {
            await api.concluirSanidade(itemToConcluir.id, {
                data_aplicacao: concluirData.data_aplicacao,
                custo: Number(concluirData.custo) || 0,
                gerar_lancamento_financeiro: concluirData.gerar_lancamento_financeiro
            });
            showFeedback(`Aplicação de ${itemToConcluir.nome_produto} confirmada com sucesso!`);
            setModalConcluirOpen(false);
            setItemToConcluir(null);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
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
                <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#087F5B] text-white px-5 py-3 rounded-xl shadow-xl font-medium animate-fade-in">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#087F5B]" strokeWidth={2} />
                        Sanidade Animal & Protocolos
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                        Calendário vacinal, controle de vermífugos, histórico de tratamentos e carência sanitária.
                    </p>
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-[#087F5B] hover:bg-[#159A70] text-white px-4 py-2.5 rounded-xl font-semibold shadow-xs transition text-xs cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    <span>Nova Aplicação / Protocolo</span>
                </button>
            </div>

            {/* Top KPIs */}
            {kpis && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <button
                        onClick={() => setFiltroStatus('')}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            filtroStatus === ''
                                ? 'bg-white border-[#087F5B] shadow-sm ring-1 ring-[#087F5B]'
                                : 'saas-card-static hover:border-[#CBD5E1]'
                        }`}
                    >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">Total Registros</span>
                        <div className="text-2xl font-bold text-[#172033]">{kpis.total}</div>
                        <span className="text-xs text-[#94A3B8] block mt-1">Histórico completo</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('atrasada')}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            filtroStatus === 'atrasada'
                                ? 'bg-[#FEF2F2] border-[#D64545] shadow-sm ring-1 ring-[#D64545]'
                                : 'saas-card-static hover:border-[#FACDCD]'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D64545]">Atrasadas</span>
                            <AlertTriangle className="w-3.5 h-3.5 text-[#D64545]" />
                        </div>
                        <div className="text-2xl font-bold text-[#D64545]">{kpis.atrasadas}</div>
                        <span className="text-xs text-[#D64545]/80 block mt-1">Prazo expirado</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('alerta_vencendo')}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            filtroStatus === 'alerta_vencendo'
                                ? 'bg-[#FEF9E7] border-[#D99A22] shadow-sm ring-1 ring-[#D99A22]'
                                : 'saas-card-static hover:border-[#FDE8B3]'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D99A22]">Vencendo (7d)</span>
                            <Clock className="w-3.5 h-3.5 text-[#D99A22]" />
                        </div>
                        <div className="text-2xl font-bold text-[#D99A22]">{kpis.alerta_vencendo}</div>
                        <span className="text-xs text-[#D99A22]/80 block mt-1">Próximas aplicações</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('sob_carencia')}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            filtroStatus === 'sob_carencia'
                                ? 'bg-[#FAF5FF] border-[#9333EA] shadow-sm ring-1 ring-[#9333EA]'
                                : 'saas-card-static hover:border-[#F3E8FF]'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9333EA]">Sob Carência</span>
                            <ShieldAlert className="w-3.5 h-3.5 text-[#9333EA]" />
                        </div>
                        <div className="text-2xl font-bold text-[#9333EA]">{kpis.sob_carencia}</div>
                        <span className="text-xs text-[#9333EA]/80 block mt-1">Bloqueio p/ abate</span>
                    </button>

                    <button
                        onClick={() => setFiltroStatus('aplicada')}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                            filtroStatus === 'aplicada'
                                ? 'bg-[#E8F5EF] border-[#087F5B] shadow-sm ring-1 ring-[#087F5B]'
                                : 'saas-card-static hover:border-[#C3E6D6]'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#087F5B]">Aplicadas</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#087F5B]" />
                        </div>
                        <div className="text-2xl font-bold text-[#087F5B]">{kpis.aplicadas}</div>
                        <span className="text-xs text-[#087F5B]/80 block mt-1">Doses concluídas</span>
                    </button>
                </div>
            )}

            {/* Filtros e Busca */}
            <div className="bg-white border border-[#E6EBE8] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por produto, brinco ou lote..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#087F5B] transition-all w-56 sm:w-64"
                        />
                    </div>

                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#087F5B]"
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
                        className="bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#087F5B]"
                    >
                        <option value="">Todos os Status</option>
                        <option value="pendente">⏳ Pendente</option>
                        <option value="alerta_vencendo">⚠️ Vencendo em 7 dias</option>
                        <option value="atrasada">🚨 Atrasada</option>
                        <option value="sob_carencia">🛡️ Sob Carência Sanitária</option>
                        <option value="aplicada">✅ Aplicada</option>
                    </select>
                </div>

                <div className="text-xs text-[#64748B]">
                    Total: <strong className="text-[#172033]">{sanidades.length}</strong> registros
                </div>
            </div>

            {/* Tabela de Sanidade */}
            <div className="bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#172033]">
                        <thead className="bg-[#F7F9F8] text-[#64748B] font-bold uppercase tracking-wider text-[10px] border-b border-[#E6EBE8]">
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
                        <tbody className="divide-y divide-[#E6EBE8]">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-[#64748B]">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin text-[#087F5B]" />
                                            <span>Carregando registros sanitários...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-[#64748B]">
                                        Nenhum registro sanitário encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(item => {
                                    const isAtrasada = item.is_atrasada;
                                    const isVencendo = item.is_vencendo_7dias;
                                    const isAplicada = item.status === 'aplicada';

                                    return (
                                        <tr key={item.id} className="hover:bg-[#F7F9F8] transition-all">
                                            {/* Alvo / Animal */}
                                            <td className="py-3 px-4">
                                                {item.animal_brinco ? (
                                                    <div>
                                                        <span className="font-bold text-[#172033] tracking-wide">
                                                            🏷️ {item.animal_brinco}
                                                        </span>
                                                        <span className="text-[10px] text-[#64748B] block">
                                                            {item.animal_categoria || 'Animal'} {item.piquete_nome ? `• ${item.piquete_nome}` : ''}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="font-semibold text-[#D9A441] flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {item.lote_ou_grupo || 'Aplicação Coletiva'}
                                                        </span>
                                                        <span className="text-[10px] text-[#94A3B8] block">Grupo / Rebanho</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Tipo & Produto */}
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-[#172033]">{item.nome_produto}</div>
                                                <span className="text-[10px] uppercase font-bold text-[#64748B]">
                                                    {item.tipo}
                                                </span>
                                            </td>

                                            {/* Data Aplicação */}
                                            <td className="py-3 px-4">
                                                <span className="text-[#172033] font-medium">{item.data_aplicacao}</span>
                                            </td>

                                            {/* Próxima Dose */}
                                            <td className="py-3 px-4">
                                                {item.data_proxima_dose ? (
                                                    <span className={`font-semibold ${
                                                        isAtrasada ? 'text-[#D64545]' : isVencendo ? 'text-[#D99A22]' : 'text-[#172033]'
                                                    }`}>
                                                        {item.data_proxima_dose}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#94A3B8]">—</span>
                                                )}
                                            </td>

                                            {/* Carência */}
                                            <td className="py-3 px-4">
                                                {item.dias_carencia > 0 ? (
                                                    item.sob_carencia ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5FF] text-[#9333EA] border border-[#F3E8FF]">
                                                            <ShieldAlert className="w-3 h-3" />
                                                            {item.dias_restantes_carencia}d restantes (até {item.data_fim_carencia})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#64748B] text-[11px]">
                                                            {item.dias_carencia} dias (liberado)
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[#94A3B8] text-[11px]">Sem carência</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4">
                                                {isAplicada ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5EF] text-[#087F5B] border border-[#C3E6D6]">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Aplicada
                                                    </span>
                                                ) : isAtrasada ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#D64545] border border-[#FACDCD]">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Atrasada
                                                    </span>
                                                ) : isVencendo ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEF9E7] text-[#D99A22] border border-[#FDE8B3]">
                                                        <Clock className="w-3 h-3" />
                                                        Vence em 7 dias
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F7F9F8] text-[#64748B] border border-[#E6EBE8]">
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
                                                            onClick={() => handleOpenConcluirModal(item)}
                                                            className="flex items-center gap-1 bg-[#087F5B] hover:bg-[#159A70] text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
                                                            title="Confirmar Aplicação da Dose"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            Aplicar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.nome_produto)}
                                                        className="p-1.5 text-[#94A3B8] hover:text-[#D64545] hover:bg-[#FEF2F2] rounded-lg transition-all cursor-pointer"
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
                    <div className="border-t border-[#E6EBE8]">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={sanidades.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal Nova Aplicação Sanitária */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[#087F5B]" />
                                <h3 className="text-base font-bold text-[#172033]">Nova Aplicação / Protocolo Sanitário</h3>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            {/* Toggle Individual vs Coletivo */}
                            <div className="flex bg-[#F7F9F8] p-1 rounded-xl border border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setIsColetivo(true)}
                                    className={`flex-1 py-2 font-semibold rounded-lg transition-all cursor-pointer ${
                                        isColetivo ? 'bg-[#087F5B] text-white shadow-xs' : 'text-[#64748B] hover:text-[#172033]'
                                    }`}
                                >
                                    👥 Aplicação Coletiva (Lote)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsColetivo(false)}
                                    className={`flex-1 py-2 font-semibold rounded-lg transition-all cursor-pointer ${
                                        !isColetivo ? 'bg-[#087F5B] text-white shadow-xs' : 'text-[#64748B] hover:text-[#172033]'
                                    }`}
                                >
                                    🏷️ Animal Individual (Brinco)
                                </button>
                            </div>

                            {/* Alvo */}
                            {isColetivo ? (
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Lote / Grupo Alvo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Todo o Rebanho, Bezerros Desmamados, Piquete 01"
                                        value={formData.lote_ou_grupo}
                                        onChange={(e) => setFormData({ ...formData, lote_ou_grupo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Selecione o Animal (Brinco) *</label>
                                    <select
                                        required
                                        value={formData.animal_id}
                                        onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
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
                                    <label className="block text-[#172033] mb-1 font-semibold">Tipo de Procedimento *</label>
                                    <select
                                        required
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="vacina">💉 Vacina</option>
                                        <option value="vermifugo">💊 Vermífugo</option>
                                        <option value="tratamento">🩺 Tratamento / Antibiótico</option>
                                        <option value="outro">📦 Outro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Nome do Produto / Medicamento *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Vacina Febre Aftosa / Ivermectina 1%"
                                        value={formData.nome_produto}
                                        onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            {/* Datas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Data de Aplicação *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data_aplicacao}
                                        onChange={(e) => setFormData({ ...formData, data_aplicacao: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Próxima Dose / Reforço</label>
                                    <input
                                        type="date"
                                        value={formData.data_proxima_dose}
                                        onChange={(e) => setFormData({ ...formData, data_proxima_dose: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            {/* Carência e Status */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Carência Sanitária (Dias)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Ex: 28 dias para abate"
                                        value={formData.dias_carencia}
                                        onChange={(e) => setFormData({ ...formData, dias_carencia: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Status Inicial *</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="pendente">⏳ Pendente / Agendada</option>
                                        <option value="aplicada">✅ Já Aplicada Hoje</option>
                                    </select>
                                </div>
                            </div>

                            {/* Custo Total */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#172033] mb-1 font-semibold">Custo Total dos Medicamentos (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0,00"
                                        value={formData.custo}
                                        onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                                {formData.status === 'aplicada' && (
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="chkFinanceiro"
                                            checked={formData.gerar_lancamento_financeiro}
                                            onChange={(e) => setFormData({ ...formData, gerar_lancamento_financeiro: e.target.checked })}
                                            className="rounded border-[#CBD5E1] text-[#087F5B] focus:ring-[#087F5B] h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="chkFinanceiro" className="text-[#172033] font-medium cursor-pointer">
                                            Lançar despesa no Financeiro
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[#172033] mb-1 font-semibold">Observações & Dosagem</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Dosagem 5ml via subcutânea, lote do frasco #8921..."
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 text-[#64748B] hover:text-[#172033] bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl cursor-pointer font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#087F5B] hover:bg-[#159A70] text-white px-5 py-2.5 rounded-xl font-semibold shadow-xs cursor-pointer"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Conclusão da Aplicação */}
            {modalConcluirOpen && itemToConcluir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[#087F5B]" />
                                <h3 className="text-base font-bold text-[#172033]">Confirmar Aplicação</h3>
                            </div>
                            <button
                                onClick={() => setModalConcluirOpen(false)}
                                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-[#64748B] mb-4">
                            Você está confirmando a aplicação de <strong className="text-[#172033]">{itemToConcluir.nome_produto}</strong> ({itemToConcluir.animal_brinco ? `Brinco ${itemToConcluir.animal_brinco}` : itemToConcluir.lote_ou_grupo}).
                        </p>

                        <form onSubmit={handleSaveConcluir} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[#172033] mb-1 font-semibold">Data Efetiva da Aplicação *</label>
                                <input
                                    type="date"
                                    required
                                    value={concluirData.data_aplicacao}
                                    onChange={(e) => setConcluirData({ ...concluirData, data_aplicacao: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div>
                                <label className="block text-[#172033] mb-1 font-semibold">Custo Total dos Medicamentos (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    value={concluirData.custo}
                                    onChange={(e) => setConcluirData({ ...concluirData, custo: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2.5 text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="chkFinanceiroConcluir"
                                    checked={concluirData.gerar_lancamento_financeiro}
                                    onChange={(e) => setConcluirData({ ...concluirData, gerar_lancamento_financeiro: e.target.checked })}
                                    className="rounded border-[#CBD5E1] text-[#087F5B] focus:ring-[#087F5B] h-4 w-4 cursor-pointer"
                                />
                                <label htmlFor="chkFinanceiroConcluir" className="text-[#172033] font-medium cursor-pointer">
                                    Lançar despesa no Financeiro automaticamente (se valor &gt; 0)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setModalConcluirOpen(false)}
                                    className="px-4 py-2.5 text-[#64748B] hover:text-[#172033] bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-[#087F5B] hover:bg-[#159A70] text-white px-5 py-2.5 rounded-xl font-semibold shadow-xs cursor-pointer"
                                >
                                    {saving ? 'Confirmando...' : 'Confirmar Aplicação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
