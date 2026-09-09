import React, { useState, useEffect } from 'react';
import { 
    Building2, 
    Fence, 
    Plus, 
    Trash2, 
    Check, 
    Edit, 
    History,
    X,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function FazendaView({ fazenda, onReloadFazenda, piquetes, onReloadPiquetes, triggerNewModal, onResetTrigger }) {
    const [subTab, setSubTab] = useState('piquetes'); // 'piquetes' | 'arrendamentos' | 'propriedade'

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

    // Modal Rotação de Pastagem
    const [modalRotacaoOpen, setModalRotacaoOpen] = useState(false);
    const [selectedPiqueteRotacao, setSelectedPiqueteRotacao] = useState(null);
    const [rotacaoHistorico, setRotacaoHistorico] = useState([]);
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
            setArrendamentos(data);
        } catch (err) {
            console.error('Erro ao carregar arrendamentos:', err);
        } finally {
            setLoadingArrendamentos(false);
        }
    };

    useEffect(() => {
        loadArrendamentos();
    }, []);

    useEffect(() => {
        if (triggerNewModal) {
            handleOpenNewPiquete();
            onResetTrigger();
        }
    }, [triggerNewModal]);

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
            setMsgFazenda('Informações da propriedade salvas com sucesso!');
            if (onReloadFazenda) onReloadFazenda();
        } catch (err) {
            setMsgFazenda('Erro ao salvar: ' + err.message);
        } finally {
            setSavingFazenda(false);
        }
    };

    const handleOpenNewPiquete = () => {
        setEditingPiquete(null);
        setPiqueteForm({ nome: '', tamanho_hectares: '', capacidade_suporte: '' });
        setErrorPiquete('');
        setModalPiqueteOpen(true);
    };

    const handleOpenEditPiquete = (p) => {
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
        setSavingPiquete(true);
        setErrorPiquete('');

        try {
            const payload = {
                nome: piqueteForm.nome,
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
            setErrorPiquete(err.message);
        } finally {
            setSavingPiquete(false);
        }
    };

    const handleDeletePiquete = async (id, nome) => {
        if (!confirm(`Deseja excluir o piquete "${nome}"? (Animais associados ficarão marcados como sem pasto)`)) return;
        try {
            await api.deletePiquete(id);
            if (onReloadPiquetes) onReloadPiquetes();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Abre linha do tempo da rotação de um piquete
    const handleVerRotacao = async (p) => {
        setSelectedPiqueteRotacao(p);
        setModalRotacaoOpen(true);
        setLoadingRotacao(true);
        try {
            const historico = await api.getPiqueteRotacao(p.id);
            setRotacaoHistorico(historico);
        } catch (err) {
            console.error('Erro ao buscar rotação:', err);
        } finally {
            setLoadingRotacao(false);
        }
    };

    // Arrendamentos actions
    const handleOpenNewArrendamento = () => {
        setArrendamentoForm({
            tipo: 'pago',
            contraparte_nome: '',
            piquete_id: piquetes.length > 0 ? String(piquetes[0].id) : '',
            valor: '',
            unidade_cobranca: 'por_hectare_mes',
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim: '',
            status: 'ativo',
            observacoes: ''
        });
        setErrorArrendamento('');
        setModalArrendamentoOpen(true);
    };

    const handleSaveArrendamento = async (e) => {
        e.preventDefault();
        setSavingArrendamento(true);
        setErrorArrendamento('');

        try {
            await api.createArrendamento({
                ...arrendamentoForm,
                valor: Number(arrendamentoForm.valor),
                piquete_id: arrendamentoForm.piquete_id ? Number(arrendamentoForm.piquete_id) : null
            });
            setModalArrendamentoOpen(false);
            loadArrendamentos();
        } catch (err) {
            setErrorArrendamento(err.message);
        } finally {
            setSavingArrendamento(false);
        }
    };

    const handleLancarPagamentoArrendamento = async (contrato) => {
        if (!confirm(`Deseja gerar o lançamento financeiro automático para o contrato com "${contrato.contraparte_nome}" no valor de R$ ${contrato.valor_calculado_mes.toFixed(2)}?`)) return;
        try {
            const res = await api.lancarPagamentoArrendamento(contrato.id);
            setFeedbackArrendamento(res.message);
            setTimeout(() => setFeedbackArrendamento(''), 5000);
            loadArrendamentos();
        } catch (err) {
            alert('Erro ao lançar pagamento: ' + err.message);
        }
    };

    const handleDeleteArrendamento = async (id) => {
        if (!confirm('Deseja excluir este contrato de arrendamento?')) return;
        try {
            await api.deleteArrendamento(id);
            loadArrendamentos();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                    onClick={() => setSubTab('piquetes')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        subTab === 'piquetes' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Fence className="w-4 h-4" />
                    <span>Pastos & Piquetes ({piquetes.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('arrendamentos')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        subTab === 'arrendamentos' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>Arrendamentos de Pastagem ({arrendamentos.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('propriedade')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        subTab === 'propriedade' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    <span>Dados da Propriedade</span>
                </button>
            </div>

            {/* TAB 1: PIQUETES & PASTOS */}
            {subTab === 'piquetes' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm text-white">Pastos e Divisões da Fazenda</h3>
                            <p className="text-xs text-slate-400">Controle de taxa de lotação e histórico de rotação</p>
                        </div>
                        <button
                            onClick={handleOpenNewPiquete}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Piquete</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {piquetes.map((p) => {
                            const taxa = p.capacidade_suporte > 0 ? Math.round((p.total_animais_ativos / p.capacidade_suporte) * 100) : 0;
                            return (
                                <div key={p.id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between hover:border-slate-600 transition">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-sm text-white">{p.nome}</h4>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEditPiquete(p)}
                                                    className="p-1 text-slate-400 hover:text-white"
                                                    title="Editar Piquete"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePiquete(p.id, p.nome)}
                                                    className="p-1 text-slate-400 hover:text-rose-400"
                                                    title="Excluir Piquete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-xs text-slate-400 mb-3 flex items-center gap-3">
                                            <span>{p.tamanho_hectares || 0} hectares</span>
                                            <span>•</span>
                                            <span>Capacidade: {p.capacidade_suporte || 0} cab</span>
                                        </div>

                                        {/* Lotação Bar */}
                                        <div className="space-y-1 mb-4">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className="text-slate-300">Ocupação Atual:</span>
                                                <span className={taxa > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                                                    {p.total_animais_ativos || 0} animais ({taxa}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        taxa > 100 ? 'bg-rose-500' : taxa > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${Math.min(taxa, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botão para ver Linha do Tempo da Rotação */}
                                    <button
                                        onClick={() => handleVerRotacao(p)}
                                        className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
                                    >
                                        <History className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Linha do Tempo de Rotação</span>
                                    </button>
                                </div>
                            );
                        })}

                        {piquetes.length === 0 && (
                            <div className="sm:col-span-3 py-16 text-center text-xs text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                                Nenhum piquete cadastrado ainda.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: ARRENDAMENTOS DE PASTAGEM */}
            {subTab === 'arrendamentos' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm text-white">Contratos de Arrendamento de Pastagem</h3>
                            <p className="text-xs text-slate-400">Gerencie pastos arrendados de terceiros (despesa) ou cedidos a parceiros (receita)</p>
                        </div>
                        <button
                            onClick={handleOpenNewArrendamento}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Contrato</span>
                        </button>
                    </div>

                    {feedbackArrendamento && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{feedbackArrendamento}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {arrendamentos.map((c) => (
                            <div key={c.id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                c.tipo === 'pago' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}>
                                                {c.tipo === 'pago' ? <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />}
                                                {c.tipo === 'pago' ? 'Arrendamento Pago (Despesa)' : 'Arrendamento Recebido (Receita)'}
                                            </span>
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                                                {c.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteArrendamento(c.id)}
                                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                                            title="Excluir Contrato"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <h4 className="font-bold text-base text-white mb-1">{c.contraparte_nome}</h4>
                                    <div className="text-xs text-slate-400 mb-3">
                                        Pasto Vinculado: <span className="text-slate-200 font-semibold">{c.piquete_nome || 'Área Externa'}</span>
                                    </div>

                                    <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-1.5 mb-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">Base Contratual:</span>
                                            <span className="font-medium text-slate-200">
                                                {formatCurrency(c.valor)} / {c.unidade_cobranca.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">Vigência:</span>
                                            <span className="text-slate-300">
                                                {c.data_inicio} {c.data_fim ? `até ${c.data_fim}` : '(Indeterminado)'}
                                            </span>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-300">Total Calculado / Mês:</span>
                                            <span className={c.tipo === 'pago' ? 'text-rose-400 text-sm' : 'text-emerald-400 text-sm'}>
                                                {formatCurrency(c.valor_calculado_mes)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleLancarPagamentoArrendamento(c)}
                                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>Lançar Pagamento do Mês no Financeiro</span>
                                </button>
                            </div>
                        ))}

                        {arrendamentos.length === 0 && !loadingArrendamentos && (
                            <div className="lg:col-span-2 py-16 text-center text-xs text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                                Nenhum contrato de arrendamento cadastrado. Clique no botão acima para registrar.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: PROPRIEDADE */}
            {subTab === 'propriedade' && (
                <div className="max-w-xl bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                        <h2 className="font-bold text-sm text-white">Dados Gerais da Propriedade</h2>
                    </div>

                    <form onSubmit={handleSaveFazenda} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Fazenda / Sítio *</label>
                            <input
                                type="text"
                                required
                                value={fazendaForm.nome}
                                onChange={(e) => setFazendaForm({ ...fazendaForm, nome: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Área Total (Hectares)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={fazendaForm.area_hectares}
                                onChange={(e) => setFazendaForm({ ...fazendaForm, area_hectares: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Localização / Município</label>
                            <input
                                type="text"
                                value={fazendaForm.localizacao}
                                onChange={(e) => setFazendaForm({ ...fazendaForm, localizacao: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        {msgFazenda && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                                {msgFazenda}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={savingFazenda}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                        >
                            <Check className="w-4 h-4" />
                            <span>{savingFazenda ? 'Salvando...' : 'Salvar Alterações'}</span>
                        </button>
                    </form>
                </div>
            )}

            {/* Modal: Linha do Tempo da Rotação de Pastagem */}
            {modalRotacaoOpen && selectedPiqueteRotacao && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h3 className="font-bold text-sm text-white">Linha do Tempo de Rotação</h3>
                                    <p className="text-[11px] text-slate-400">{selectedPiqueteRotacao.nome}</p>
                                </div>
                            </div>
                            <button onClick={() => setModalRotacaoOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                            {loadingRotacao ? (
                                <div className="py-8 text-center text-xs text-slate-400">Carregando histórico...</div>
                            ) : rotacaoHistorico.length > 0 ? (
                                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                                    {rotacaoHistorico.map((r) => (
                                        <div key={r.id} className="relative">
                                            <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                                                !r.data_saida ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-600'
                                            }`}></div>
                                            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs space-y-1">
                                                <div className="flex items-center justify-between font-bold">
                                                    <span className={!r.data_saida ? 'text-emerald-400' : 'text-slate-200'}>
                                                        {!r.data_saida ? 'Lote em Pastoreio Ativo' : 'Período Concluído'}
                                                    </span>
                                                    <span className="text-slate-400 text-[11px] font-normal">
                                                        {r.quantidade_animais} cabeças
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-300">
                                                    Entrada: <span className="font-medium text-white">{r.data_entrada}</span>
                                                    {r.data_saida ? ` • Saída: ${r.data_saida}` : ' • Ainda no pasto'}
                                                </div>
                                                {r.observacao && (
                                                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                                                        {r.observacao}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-500">
                                    Nenhum histórico de rotação registrado para este pasto ainda.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Cadastro de Piquete */}
            {modalPiqueteOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Fence className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">
                                    {editingPiquete ? 'Editar Piquete' : 'Novo Piquete / Pasto'}
                                </h3>
                            </div>
                            <button onClick={() => setModalPiqueteOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePiquete} className="p-6 space-y-4">
                            {errorPiquete && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorPiquete}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Pasto *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Pasto 04 - Rotacionado"
                                    value={piqueteForm.nome}
                                    onChange={(e) => setPiqueteForm({ ...piqueteForm, nome: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tamanho (ha)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 40"
                                        value={piqueteForm.tamanho_hectares}
                                        onChange={(e) => setPiqueteForm({ ...piqueteForm, tamanho_hectares: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Capacidade (cab)</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 60"
                                        value={piqueteForm.capacidade_suporte}
                                        onChange={(e) => setPiqueteForm({ ...piqueteForm, capacidade_suporte: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalPiqueteOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPiquete}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{savingPiquete ? 'Salvando...' : 'Salvar Piquete'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Cadastro de Contrato de Arrendamento */}
            {modalArrendamentoOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">Novo Contrato de Arrendamento</h3>
                            </div>
                            <button onClick={() => setModalArrendamentoOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveArrendamento} className="p-6 space-y-4">
                            {errorArrendamento && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorArrendamento}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Arrendamento *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setArrendamentoForm({ ...arrendamentoForm, tipo: 'pago' })}
                                        className={`py-2 rounded-xl border text-xs font-semibold transition ${
                                            arrendamentoForm.tipo === 'pago'
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                        }`}
                                    >
                                        Arrendo de Terceiro (Pago)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setArrendamentoForm({ ...arrendamentoForm, tipo: 'recebido' })}
                                        className={`py-2 rounded-xl border text-xs font-semibold transition ${
                                            arrendamentoForm.tipo === 'recebido'
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                        }`}
                                    >
                                        Cedo Meu Pasto (Recebido)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraparte (Proprietário / Locatário) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: João da Silva (Fazenda Boa Esperança)"
                                    value={arrendamentoForm.contraparte_nome}
                                    onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, contraparte_nome: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Pasto / Piquete Associado</label>
                                <select
                                    value={arrendamentoForm.piquete_id}
                                    onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, piquete_id: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">Área externa / Geral</option>
                                    {piquetes.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nome} ({p.tamanho_hectares} ha)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Unitário (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 85.00"
                                        value={arrendamentoForm.valor}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, valor: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Unidade de Cobrança *</label>
                                    <select
                                        value={arrendamentoForm.unidade_cobranca}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, unidade_cobranca: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="por_hectare_mes">Por Hectare / Mês</option>
                                        <option value="por_cabeca_mes">Por Cabeça / Mês</option>
                                        <option value="valor_fixo_mes">Valor Fixo / Mês</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data Início *</label>
                                    <input
                                        type="date"
                                        required
                                        value={arrendamentoForm.data_inicio}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, data_inicio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data Fim (Opcional)</label>
                                    <input
                                        type="date"
                                        value={arrendamentoForm.data_fim}
                                        onChange={(e) => setArrendamentoForm({ ...arrendamentoForm, data_fim: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalArrendamentoOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingArrendamento}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{savingArrendamento ? 'Salvando...' : 'Criar Contrato'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
