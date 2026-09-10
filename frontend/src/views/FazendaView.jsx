import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Fence, 
    Plus, 
    Trash2, 
    Edit, 
    History,
    X,
    FileText,
    DollarSign,
    CheckCircle2,
    Beef,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function FazendaView({ fazenda, onReloadFazenda, piquetes = [], onReloadPiquetes, triggerNewModal, onResetTrigger }) {
    const [activeTab, setActiveTab] = useState('piquetes'); // 'piquetes' | 'rotacao' | 'arrendamentos' | 'propriedade'

    // Form Fazenda
    const [fazendaForm, setFazendaForm] = useState({
        nome: fazenda?.nome || '',
        area_hectares: fazenda?.area_hectares || '',
        localizacao: fazenda?.localizacao || ''
    });
    const [savingFazenda, setSavingFazenda] = useState(false);
    const [msgFazenda, setMsgFazenda] = useState('');

    // Modal Piquete
    const [modalPiqueteOpen, setModalPiqueteOpen] = useState(false);
    const [piqueteForm, setPiqueteForm] = useState({ nome: '', tamanho_hectares: '', capacidade_suporte: '' });
    const [editingPiquete, setEditingPiquete] = useState(null);
    const [savingPiquete, setSavingPiquete] = useState(false);
    const [errorPiquete, setErrorPiquete] = useState('');

    // Modal / Ver Animais do Piquete
    const [selectedPiqueteAnimais, setSelectedPiqueteAnimais] = useState(null);

    // Modal Nova Rotação
    const [modalRotacaoOpen, setModalRotacaoOpen] = useState(false);
    const [rotacaoForm, setRotacaoForm] = useState({
        piquete_id: '',
        data_entrada: new Date().toISOString().split('T')[0],
        data_saida: '',
        quantidade_animais: '1',
        observacao: ''
    });
    const [savingRotacao, setSavingRotacao] = useState(false);
    const [errorRotacao, setErrorRotacao] = useState('');

    // Rotação Histórico Geral
    const [rotacaoTimeline, setRotacaoTimeline] = useState([]);
    const [loadingRotacao, setLoadingRotacao] = useState(false);

    // Arrendamentos State
    const [arrendamentos, setArrendamentos] = useState([]);
    const [loadingArrendamentos, setLoadingArrendamentos] = useState(false);
    const [modalArrendamentoOpen, setModalArrendamentoOpen] = useState(false);
    const [arrendamentoForm, setArrendamentoForm] = useState({
        tipo: 'pago',
        contraparte_nome: '',
        piquete_id: '',
        valor: '',
        unidade_cobranca: 'por_hectare_mes',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
        status: 'ativo',
        observacoes: ''
    });
    const [savingArrendamento, setSavingArrendamento] = useState(false);
    const [errorArrendamento, setErrorArrendamento] = useState('');
    const [feedbackArrendamento, setFeedbackArrendamento] = useState('');

    const loadArrendamentos = async () => {
        try {
            setLoadingArrendamentos(true);
            const data = await api.getArrendamentos();
            setArrendamentos(data || []);
        } catch (err) {
            console.error('Erro ao carregar arrendamentos:', err);
        } finally {
            setLoadingArrendamentos(false);
        }
    };

    const loadRotacaoTimeline = async () => {
        try {
            setLoadingRotacao(true);
            const promessas = piquetes.map(p => api.getPiqueteRotacao(p.id).catch(() => []));
            const resultados = await Promise.all(promessas);
            const merged = [];
            resultados.forEach((list, idx) => {
                const piq = piquetes[idx];
                list.forEach(item => {
                    merged.push({ ...item, piquete_nome: piq?.nome });
                });
            });
            merged.sort((a, b) => (b.data_entrada > a.data_entrada ? 1 : -1));
            setRotacaoTimeline(merged);
        } catch (err) {
            console.error('Erro ao carregar linha do tempo:', err);
        } finally {
            setLoadingRotacao(false);
        }
    };

    useEffect(() => {
        loadArrendamentos();
    }, []);

    useEffect(() => {
        if (activeTab === 'rotacao') {
            loadRotacaoTimeline();
        }
    }, [activeTab, piquetes]);

    useEffect(() => {
        if (triggerNewModal) {
            handleOpenNewPiquete();
            onResetTrigger();
        }
    }, [triggerNewModal]);

    const handleOpenNewPiquete = () => {
        setEditingPiquete(null);
        setPiqueteForm({ nome: '', tamanho_hectares: '', capacidade_suporte: '' });
        setErrorPiquete('');
        setModalPiqueteOpen(true);
    };

    const handleOpenEditPiquete = (p, e) => {
        if (e) e.stopPropagation();
        setEditingPiquete(p);
        setPiqueteForm({
            nome: p.nome,
            tamanho_hectares: p.tamanho_hectares || '',
            capacidade_suporte: p.capacidade_suporte || ''
        });
        setErrorPiquete('');
        setModalPiqueteOpen(true);
    };

    const handleSavePiquete = async (e) => {
        e.preventDefault();
        setErrorPiquete('');
        setSavingPiquete(true);

        try {
            if (!piqueteForm.nome.trim()) throw new Error('Nome do piquete é obrigatório');
            const payload = {
                nome: piqueteForm.nome.trim(),
                tamanho_hectares: Number(piqueteForm.tamanho_hectares) || 0,
                capacidade_suporte: Number(piqueteForm.capacidade_suporte) || 0
            };

            if (editingPiquete) {
                await api.updatePiquete(editingPiquete.id, payload);
            } else {
                await api.createPiquete(payload);
            }

            setModalPiqueteOpen(false);
            if (onReloadPiquetes) onReloadPiquetes();
        } catch (err) {
            setErrorPiquete(err.message || 'Erro ao salvar piquete');
        } finally {
            setSavingPiquete(false);
        }
    };

    const handleDeletePiquete = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este piquete? Os animais alocados ficarão sem pasto.')) return;
        try {
            await api.deletePiquete(id);
            if (onReloadPiquetes) onReloadPiquetes();
            if (selectedPiqueteAnimais && selectedPiqueteAnimais.id === id) {
                setSelectedPiqueteAnimais(null);
            }
        } catch (err) {
            alert(err.message || 'Erro ao excluir piquete');
        }
    };

    // Rotação Modal
    const handleOpenNovaRotacao = (piqueteId = '') => {
        setRotacaoForm({
            piquete_id: piqueteId ? String(piqueteId) : (piquetes[0]?.id ? String(piquetes[0].id) : ''),
            data_entrada: new Date().toISOString().split('T')[0],
            data_saida: '',
            quantidade_animais: '1',
            observacao: ''
        });
        setErrorRotacao('');
        setModalRotacaoOpen(true);
    };

    const handleSaveRotacao = async (e) => {
        e.preventDefault();
        setErrorRotacao('');
        setSavingRotacao(true);

        try {
            if (!rotacaoForm.piquete_id) throw new Error('Selecione um piquete');
            if (!rotacaoForm.data_entrada) throw new Error('Data de entrada é obrigatória');

            await api.createRotacaoPiquete(rotacaoForm.piquete_id, {
                data_entrada: rotacaoForm.data_entrada,
                data_saida: rotacaoForm.data_saida || null,
                quantidade_animais: Number(rotacaoForm.quantidade_animais) || 1,
                observacao: rotacaoForm.observacao
            });

            setModalRotacaoOpen(false);
            loadRotacaoTimeline();
        } catch (err) {
            setErrorRotacao(err.message || 'Erro ao salvar rotação');
        } finally {
            setSavingRotacao(false);
        }
    };

    // Arrendamentos
    const handleSaveArrendamento = async (e) => {
        e.preventDefault();
        setErrorArrendamento('');
        setSavingArrendamento(true);

        try {
            if (!arrendamentoForm.contraparte_nome.trim()) throw new Error('Informe o nome da contraparte');
            if (!arrendamentoForm.valor || Number(arrendamentoForm.valor) <= 0) throw new Error('Informe um valor válido maior que zero');

            await api.createArrendamento({
                ...arrendamentoForm,
                piquete_id: arrendamentoForm.piquete_id ? Number(arrendamentoForm.piquete_id) : null,
                valor: Number(arrendamentoForm.valor)
            });

            setModalArrendamentoOpen(false);
            loadArrendamentos();
        } catch (err) {
            setErrorArrendamento(err.message || 'Erro ao salvar contrato');
        } finally {
            setSavingArrendamento(false);
        }
    };

    const handleLancarPagamentoArrendamento = async (contrato) => {
        if (!window.confirm(`Deseja lançar a quitação do contrato "${contrato.contraparte_nome}" no fluxo financeiro?`)) return;
        try {
            const res = await api.lancarPagamentoArrendamento(contrato.id);
            setFeedbackArrendamento(res.message || 'Lançamento gerado no financeiro com sucesso!');
            setTimeout(() => setFeedbackArrendamento(''), 4000);
            loadArrendamentos();
        } catch (err) {
            alert(err.message || 'Erro ao lançar quitação do arrendamento');
        }
    };

    const handleDeleteArrendamento = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este contrato de arrendamento?')) return;
        try {
            await api.deleteArrendamento(id);
            loadArrendamentos();
        } catch (err) {
            alert(err.message || 'Erro ao excluir contrato');
        }
    };

    // Salvar Fazenda
    const handleSaveFazenda = async (e) => {
        e.preventDefault();
        setSavingFazenda(true);
        setMsgFazenda('');

        try {
            await api.updateFazenda({
                nome: fazendaForm.nome,
                area_hectares: Number(fazendaForm.area_hectares) || 0,
                localizacao: fazendaForm.localizacao
            });
            setMsgFazenda('Informações da fazenda salvas com sucesso!');
            if (onReloadFazenda) onReloadFazenda();
            setTimeout(() => setMsgFazenda(''), 3000);
        } catch (err) {
            alert(err.message || 'Erro ao salvar fazenda');
        } finally {
            setSavingFazenda(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
                        <Fence className="w-5 h-5 text-[#087F5B]" strokeWidth={2} />
                        Pastagens, Manejo & Arrendamentos
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                        Capacidade de suporte, taxa de lotação dos piquetes, rotação de pastos e contratos rurais.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'piquetes' && (
                        <button
                            onClick={handleOpenNewPiquete}
                            className="px-4 py-2.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            <span>Novo Piquete</span>
                        </button>
                    )}
                    {activeTab === 'rotacao' && (
                        <button
                            onClick={() => handleOpenNovaRotacao()}
                            className="px-4 py-2.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            <span>Registrar Rotação</span>
                        </button>
                    )}
                    {activeTab === 'arrendamentos' && (
                        <button
                            onClick={() => setModalArrendamentoOpen(true)}
                            className="px-4 py-2.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            <span>Novo Contrato</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E6EBE8] bg-white rounded-2xl p-1 gap-1 shadow-xs">
                <button
                    onClick={() => setActiveTab('piquetes')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        activeTab === 'piquetes' ? 'bg-[#E8F5EF] text-[#087F5B]' : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8]'
                    }`}
                >
                    <Fence className="w-4 h-4 shrink-0" />
                    <span className="truncate">Piquetes ({piquetes.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('rotacao')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        activeTab === 'rotacao' ? 'bg-[#E8F5EF] text-[#087F5B]' : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8]'
                    }`}
                >
                    <History className="w-4 h-4 shrink-0" />
                    <span className="truncate">Histórico Rotação</span>
                </button>
                <button
                    onClick={() => setActiveTab('arrendamentos')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        activeTab === 'arrendamentos' ? 'bg-[#E8F5EF] text-[#087F5B]' : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8]'
                    }`}
                >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">Arrendamentos ({arrendamentos.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('propriedade')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        activeTab === 'propriedade' ? 'bg-[#E8F5EF] text-[#087F5B]' : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8]'
                    }`}
                >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">Dados da Fazenda</span>
                </button>
            </div>

            {/* ABA 1: PIQUETES & PASTOS */}
            {activeTab === 'piquetes' && (
                <div className="space-y-6">
                    {/* Top KPIs de Pastagens com UA */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="saas-card-static p-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">Total de Pastos</span>
                            <div className="text-2xl font-bold text-[#172033]">{piquetes.length} <span className="text-xs font-normal text-[#64748B]">piquetes</span></div>
                            <span className="text-xs text-[#94A3B8] block mt-1">Divisões ativas</span>
                        </div>

                        <div className="saas-card-static p-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">Área Útil</span>
                            <div className="text-2xl font-bold text-[#087F5B]">
                                {piquetes.reduce((acc, p) => acc + (Number(p.tamanho_hectares) || 0), 0)} <span className="text-xs font-normal text-[#64748B]">ha</span>
                            </div>
                            <span className="text-xs text-[#94A3B8] block mt-1">Área total de pastejo</span>
                        </div>

                        <div className="saas-card-static p-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">Carga Animal Total</span>
                            <div className="text-2xl font-bold text-[#D9A441]">
                                {Number(piquetes.reduce((acc, p) => acc + (Number(p.total_ua_ativas) || 0), 0).toFixed(1))} <span className="text-xs font-normal text-[#64748B]">UA</span>
                            </div>
                            <span className="text-xs text-[#64748B] block mt-1">
                                {piquetes.reduce((acc, p) => acc + (Number(p.total_animais_ativos) || 0), 0)} cabeças no pasto
                            </span>
                        </div>

                        <div className="saas-card-static p-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block mb-1">Lotação Média</span>
                            <div className="text-2xl font-bold text-[#3978C7]">
                                {(() => {
                                    const area = piquetes.reduce((acc, p) => acc + (Number(p.tamanho_hectares) || 0), 0);
                                    const ua = piquetes.reduce((acc, p) => acc + (Number(p.total_ua_ativas) || 0), 0);
                                    return area > 0 ? (ua / area).toFixed(2) : '0.00';
                                })()} <span className="text-xs font-normal text-[#64748B]">UA/ha</span>
                            </div>
                            <span className="text-xs text-[#94A3B8] block mt-1">Padrão Embrapa</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {piquetes.map((p) => {
                            const total = p.total_animais_ativos || 0;
                            const totalUA = p.total_ua_ativas || 0;
                            const cap = p.capacidade_suporte || 0;
                            const taxa = p.taxa_ocupacao_pct || (cap > 0 ? Math.round((total / cap) * 100) : 0);
                            const densidadeCab = p.densidade_cab_ha || (p.tamanho_hectares > 0 ? (total / p.tamanho_hectares).toFixed(2) : 0);
                            const densidadeUA = p.densidade_ua_ha || (p.tamanho_hectares > 0 ? (totalUA / p.tamanho_hectares).toFixed(2) : 0);

                            return (
                                <div 
                                    key={p.id}
                                    onClick={() => setSelectedPiqueteAnimais(p)}
                                    className="saas-card p-5 flex flex-col justify-between cursor-pointer group space-y-4"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="text-sm font-bold text-[#172033] group-hover:text-[#087F5B] transition flex items-center gap-1.5">
                                                    <Fence className="w-4 h-4 text-[#087F5B]" />
                                                    {p.nome}
                                                </h3>
                                                <div className="text-xs text-[#64748B] mt-0.5">
                                                    {p.tamanho_hectares ? `${p.tamanho_hectares} hectares` : 'Área não definida'}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleOpenEditPiquete(p, e)}
                                                    className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-[#F7F9F8] transition cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeletePiquete(p.id, e)}
                                                    className="p-1.5 text-[#64748B] hover:text-[#D64545] rounded-lg hover:bg-[#FEF2F2] transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Indicadores Zootécnicos de Lotação */}
                                        <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8]">
                                            <div>
                                                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Taxa de Lotação</span>
                                                <span className="text-xs font-bold text-[#3978C7]">
                                                    {densidadeUA} <span className="text-[10px] font-normal text-[#64748B]">UA/ha</span>
                                                </span>
                                                <span className="text-[10px] text-[#94A3B8] block">({densidadeCab} cab/ha)</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Carga Presente</span>
                                                <span className="text-xs font-bold text-[#D9A441]">
                                                    {totalUA} <span className="text-[10px] font-normal text-[#64748B]">UA</span>
                                                </span>
                                                <span className="text-[10px] text-[#94A3B8] block">({total} cabeças)</span>
                                            </div>
                                        </div>

                                        {/* Barra de Lotação */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[#64748B] font-medium">Ocupação / Capacidade</span>
                                                <span className="font-bold text-[#172033]">
                                                    {total} / {cap || '-'} cab. ({taxa}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-[#E6EBE8] rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        taxa > 100 ? 'bg-[#D64545]' : taxa >= 80 ? 'bg-[#D99A22]' : 'bg-[#087F5B]'
                                                    }`}
                                                    style={{ width: `${Math.min(taxa, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[#E6EBE8] text-xs">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                            taxa > 100 ? 'bg-[#FEF2F2] text-[#D64545] border-[#FACDCD]' :
                                            taxa >= 80 ? 'bg-[#FEF9E7] text-[#D99A22] border-[#FDE8B3]' :
                                            'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]'
                                        }`}>
                                            {taxa > 100 ? '🚨 Superlotado' : taxa >= 80 ? '⚠️ Alerta Lotação' : '✅ Manejo Adequado'}
                                        </span>

                                        <span className="text-[#087F5B] text-xs font-semibold flex items-center gap-1 group-hover:underline">
                                            <span>Ver animais ({p.animais?.length || total})</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {piquetes.length === 0 && (
                        <div className="p-12 text-center text-[#64748B] bg-white border border-[#E6EBE8] rounded-2xl">
                            Nenhum piquete cadastrado ainda. Clique em "Novo Piquete" para cadastrar os pastos da fazenda.
                        </div>
                    )}
                </div>
            )}

            {/* ABA 2: LINHA DO TEMPO DE ROTAÇÃO */}
            {activeTab === 'rotacao' && (
                <div className="saas-card-static p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-base font-bold text-[#172033]">Linha do Tempo de Rotação de Pastagens</h3>
                            <p className="text-xs text-[#64748B]">Histórico de entrada, saída e dias de descanso de cada piquete</p>
                        </div>
                        <button
                            onClick={() => handleOpenNovaRotacao()}
                            className="px-3.5 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nova Rotação</span>
                        </button>
                    </div>

                    <div className="divide-y divide-[#E6EBE8]">
                        {loadingRotacao ? (
                            <div className="p-8 text-center text-[#64748B]">Carregando histórico de rotação...</div>
                        ) : rotacaoTimeline.length === 0 ? (
                            <div className="p-8 text-center text-[#64748B]">Nenhum evento de rotação de pasto registrado.</div>
                        ) : (
                            rotacaoTimeline.map((item) => (
                                <div key={item.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                            <History className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs text-[#172033]">
                                                {item.piquete_nome || `Piquete #${item.piquete_id}`}
                                            </div>
                                            <div className="text-[11px] text-[#64748B] mt-0.5">
                                                Lote com {item.quantidade_animais} cabeças • Entrada: {item.data_entrada} {item.data_saida ? `• Saída: ${item.data_saida}` : '• Em pastejo ativo'}
                                            </div>
                                            {item.observacao && (
                                                <div className="text-[11px] text-[#94A3B8] italic mt-0.5">{item.observacao}</div>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                        item.data_saida ? 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]' : 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]'
                                    }`}>
                                        {item.data_saida ? 'Concluído' : 'Pastejo Ativo'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ABA 3: CONTRATOS DE ARRENDAMENTO */}
            {activeTab === 'arrendamentos' && (
                <div className="space-y-4">
                    {feedbackArrendamento && (
                        <div className="p-3.5 bg-[#E8F5EF] border border-[#C3E6D6] text-[#087F5B] rounded-2xl text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{feedbackArrendamento}</span>
                        </div>
                    )}

                    <div className="bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[#E6EBE8] text-[11px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F7F9F8]">
                                        <th className="p-4 pl-6">Tipo & Contraparte</th>
                                        <th className="p-4">Pasto / Área</th>
                                        <th className="p-4">Unidade de Cobrança</th>
                                        <th className="p-4">Valor Mensal Estimado</th>
                                        <th className="p-4">Período</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 pr-6 text-right">Quitação & Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6EBE8]">
                                    {loadingArrendamentos ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-[#64748B]">Carregando contratos...</td></tr>
                                    ) : arrendamentos.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-[#64748B]">Nenhum contrato de arrendamento ativo.</td></tr>
                                    ) : (
                                        arrendamentos.map((c) => (
                                            <tr key={c.id} className="hover:bg-[#F7F9F8]">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            c.tipo === 'pago' ? 'bg-[#FEF2F2] text-[#D64545]' : 'bg-[#E8F5EF] text-[#087F5B]'
                                                        }`}>
                                                            {c.tipo === 'pago' ? 'Pago (Despesa)' : 'Recebido (Receita)'}
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-sm text-[#172033] mt-1">
                                                        {c.contraparte_nome}
                                                    </div>
                                                </td>

                                                <td className="p-4 font-medium text-[#172033]">
                                                    {c.piquete_nome ? `${c.piquete_nome} (${c.piquete_tamanho_hectares} ha)` : 'Área Geral / Confinamento'}
                                                </td>

                                                <td className="p-4 text-[#64748B]">
                                                    {c.unidade_cobranca === 'por_hectare_mes' ? `${formatCurrency(c.valor)} / hectare / mês` :
                                                     c.unidade_cobranca === 'por_cabeca_mes' ? `${formatCurrency(c.valor)} / cabeça / mês` :
                                                     'Valor Fixo Mensal'}
                                                </td>

                                                <td className="p-4 font-bold text-[#172033] text-sm">
                                                    {formatCurrency(c.valor_calculado_mes || c.valor)}
                                                </td>

                                                <td className="p-4 text-[#64748B] text-[11px]">
                                                    De {c.data_inicio} {c.data_fim ? `até ${c.data_fim}` : '• Indeterminado'}
                                                </td>

                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                        c.status === 'ativo' ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' : 'bg-[#F1F5F9] text-[#64748B]'
                                                    }`}>
                                                        {c.status?.toUpperCase()}
                                                    </span>
                                                </td>

                                                <td className="p-4 pr-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleLancarPagamentoArrendamento(c)}
                                                            className="px-3 py-1.5 bg-[#E8F5EF] hover:bg-[#C3E6D6] text-[#087F5B] rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <DollarSign className="w-3 h-3" />
                                                            <span>Lançar no Caixa</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteArrendamento(c.id)}
                                                            className="p-1.5 text-[#94A3B8] hover:text-[#D64545] rounded-lg hover:bg-[#FEF2F2] transition cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 4: DADOS DA PROPRIEDADE */}
            {activeTab === 'propriedade' && (
                <div className="max-w-2xl saas-card-static p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-5 h-5 text-[#087F5B]" />
                        <h3 className="text-base font-bold text-[#172033]">Configurações da Propriedade</h3>
                    </div>

                    {msgFazenda && (
                        <div className="p-3 bg-[#E8F5EF] border border-[#C3E6D6] text-[#087F5B] rounded-xl text-xs">
                            {msgFazenda}
                        </div>
                    )}

                    <form onSubmit={handleSaveFazenda} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1">Nome da Fazenda / Propriedade *</label>
                            <input
                                type="text"
                                required
                                value={fazendaForm.nome}
                                onChange={(e) => setFazendaForm({ ...fazendaForm, nome: e.target.value })}
                                className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1">Área Total (Hectares) *</label>
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={fazendaForm.area_hectares}
                                onChange={(e) => setFazendaForm({ ...fazendaForm, area_hectares: e.target.value })}
                                className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1">Localização / Município - UF</label>
                            <input
                                type="text"
                                placeholder="Ex: Rio Verde - GO"
                                value={fazendaForm.localizacao}
                                onChange={(e) => setFazendaForm({ ...fazendaForm, localizacao: e.target.value })}
                                className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={savingFazenda}
                            className="px-5 py-2.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                            {savingFazenda ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </form>
                </div>
            )}

            {/* Modal: Ver Animais no Piquete */}
            {selectedPiqueteAnimais && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-2xl bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                                    <Fence className="w-5 h-5 text-[#087F5B]" />
                                    Animais em {selectedPiqueteAnimais.nome}
                                </h3>
                                <p className="text-xs text-[#64748B]">
                                    {selectedPiqueteAnimais.animais?.length || selectedPiqueteAnimais.total_animais_ativos} cabeças • {selectedPiqueteAnimais.total_ua_ativas || 0} UA total • {selectedPiqueteAnimais.tamanho_hectares || 0} ha
                                </p>
                            </div>
                            <button onClick={() => setSelectedPiqueteAnimais(null)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Badges de Lotação do Pasto */}
                        <div className="grid grid-cols-3 gap-3 bg-[#F7F9F8] p-3.5 rounded-xl border border-[#E6EBE8] text-xs">
                            <div>
                                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Carga Presente</span>
                                <span className="font-bold text-[#D9A441] text-sm">{selectedPiqueteAnimais.total_ua_ativas || 0} UA</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Lotação (UA/ha)</span>
                                <span className="font-bold text-[#3978C7] text-sm">{selectedPiqueteAnimais.densidade_ua_ha || 0} UA/ha</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Capacidade Estimada</span>
                                <span className="font-bold text-[#087F5B] text-sm">{selectedPiqueteAnimais.capacidade_suporte || '-'} cab.</span>
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-[#E6EBE8] bg-white rounded-xl border border-[#E6EBE8]">
                            {selectedPiqueteAnimais.animais && selectedPiqueteAnimais.animais.length > 0 ? (
                                selectedPiqueteAnimais.animais.map((a) => (
                                    <div key={a.id} className="p-3.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-[#E8F5EF] flex items-center justify-center text-[#087F5B] font-bold text-xs">
                                                <Beef className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs text-[#172033] flex items-center gap-2">
                                                    <span>Brinco {a.identificacao}</span>
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#FEF9E7] text-[#D9A441] border border-[#FDE8B3]">
                                                        {a.ua || 1.0} UA
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-[#64748B]">{a.categoria} • {a.raca || 'Nelore'} • {a.sexo === 'M' ? 'Macho' : 'Fêmea'}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-[#172033]">
                                            {a.peso_atual ? `${a.peso_atual} kg` : 's/ peso'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-xs text-[#64748B]">
                                    Nenhum animal alocado neste pasto no momento.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setSelectedPiqueteAnimais(null)}
                                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Voltar aos Pastos</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Novo / Editar Piquete */}
            {modalPiqueteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalPiqueteOpen(false)}
                                    title="Voltar / Cancelar"
                                    className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <h3 className="text-base font-bold text-[#172033]">
                                    {editingPiquete ? 'Editar Piquete' : 'Novo Piquete / Pasto'}
                                </h3>
                            </div>
                            <button onClick={() => setModalPiqueteOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorPiquete && (
                            <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] rounded-xl text-xs">
                                {errorPiquete}
                            </div>
                        )}

                        <form onSubmit={handleSavePiquete} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Nome do Pasto / Piquete *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Pasto 05 - Engorda Mombaça"
                                    value={piqueteForm.nome}
                                    onChange={(e) => setPiqueteForm({ ...piqueteForm, nome: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Tamanho (Hectares)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 45.0"
                                        value={piqueteForm.tamanho_hectares}
                                        onChange={(e) => setPiqueteForm({ ...piqueteForm, tamanho_hectares: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Capacidade (Cabeças)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 80"
                                        value={piqueteForm.capacidade_suporte}
                                        onChange={(e) => setPiqueteForm({ ...piqueteForm, capacidade_suporte: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalPiqueteOpen(false)}
                                    className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] border border-[#E6EBE8] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Voltar / Cancelar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPiquete}
                                    className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                                >
                                    {savingPiquete ? 'Salvando...' : 'Salvar Piquete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Nova Rotação */}
            {modalRotacaoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalRotacaoOpen(false)}
                                    title="Voltar / Cancelar"
                                    className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <h3 className="text-base font-bold text-[#172033]">Registrar Evento de Rotação</h3>
                            </div>
                            <button onClick={() => setModalRotacaoOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorRotacao && (
                            <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] rounded-xl text-xs">
                                {errorRotacao}
                            </div>
                        )}

                        <form onSubmit={handleSaveRotacao} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Pasto / Piquete *</label>
                                <select
                                    value={rotacaoForm.piquete_id}
                                    onChange={(e) => setRotacaoForm({ ...rotacaoForm, piquete_id: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                >
                                    <option value="">Selecione o piquete...</option>
                                    {piquetes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Data de Entrada *</label>
                                    <input
                                        type="date"
                                        required
                                        value={rotacaoForm.data_entrada}
                                        onChange={(e) => setRotacaoForm({ ...rotacaoForm, data_entrada: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Data de Saída</label>
                                    <input
                                        type="date"
                                        value={rotacaoForm.data_saida}
                                        onChange={(e) => setRotacaoForm({ ...rotacaoForm, data_saida: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Quantidade de Animais no Lote</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={rotacaoForm.quantidade_animais}
                                    onChange={(e) => setRotacaoForm({ ...rotacaoForm, quantidade_animais: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Observações do Manejo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Entrada de garrotes após 25 dias de descanso"
                                    value={rotacaoForm.observacao}
                                    onChange={(e) => setRotacaoForm({ ...rotacaoForm, observacao: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalRotacaoOpen(false)}
                                    className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] border border-[#E6EBE8] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Voltar / Cancelar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingRotacao}
                                    className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                                >
                                    {savingRotacao ? 'Salvando...' : 'Salvar Rotação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Novo Arrendamento */}
            {modalArrendamentoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-lg bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalArrendamentoOpen(false)}
                                    title="Voltar / Cancelar"
                                    className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <h3 className="text-base font-bold text-[#172033]">Novo Contrato de Arrendamento Rural</h3>
                            </div>
                            <button onClick={() => setModalArrendamentoOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorArrendamento && (
                            <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] rounded-xl text-xs">
                                {errorArrendamento}
                            </div>
                        )}

                        <form onSubmit={handleSaveArrendamento} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Tipo de Contrato *</label>
                                    <select
                                        value={arrendamentoForm.tipo}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, tipo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="pago">Arrendo Pago (Despesa)</option>
                                        <option value="recebido">Arrendo Recebido (Receita)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Contraparte (Pessoa/Empresa) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Agropecuária Boi Gordo Ltda"
                                        value={arrendamentoForm.contraparte_nome}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, contraparte_nome: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Unidade de Cobrança *</label>
                                    <select
                                        value={arrendamentoForm.unidade_cobranca}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, unidade_cobranca: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="por_hectare_mes">Por Hectare / Mês (R$/ha)</option>
                                        <option value="por_cabeca_mes">Por Cabeça / Mês (R$/cab)</option>
                                        <option value="valor_fixo_mes">Valor Fixo Mensal (R$)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Valor Unitário (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 65.00"
                                        value={arrendamentoForm.valor}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, valor: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Pasto / Piquete Vinculado</label>
                                    <select
                                        value={arrendamentoForm.piquete_id}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, piquete_id: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="">Área Geral / Sem piquete</option>
                                        {piquetes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nome} ({p.tamanho_hectares} ha)</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Data Início *</label>
                                    <input
                                        type="date"
                                        required
                                        value={arrendamentoForm.data_inicio}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, data_inicio: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Observações do Contrato</label>
                                <textarea
                                    rows="2"
                                    placeholder="Cláusulas, vencimento, reajuste..."
                                    value={arrendamentoForm.observacoes}
                                    onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, observacoes: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalArrendamentoOpen(false)}
                                    className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] border border-[#E6EBE8] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Voltar / Cancelar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingArrendamento}
                                    className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                                >
                                    {savingArrendamento ? 'Salvando...' : 'Salvar Contrato'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
