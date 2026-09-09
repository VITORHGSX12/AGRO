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
    Package
} from 'lucide-react';
import { api } from '../services/api';

const CULTURAS_COMUNS = [
    { value: 'Soja', label: 'Soja' },
    { value: 'Milho', label: 'Milho Safrinha / Verão' },
    { value: 'Algodão', label: 'Algodão' },
    { value: 'Café', label: 'Café' },
    { value: 'Sorgo', label: 'Sorgo' },
    { value: 'Trigo', label: 'Trigo' },
    { value: 'Cana-de-Açúcar', label: 'Cana-de-Açúcar' },
    { value: 'Outro', label: 'Outra Cultura' }
];

export default function AgricolaView({ onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [subTab, setSubTab] = useState('safras'); // 'safras' | 'talhoes'

    // Data State
    const [talhoes, setTalhoes] = useState([]);
    const [safras, setSafras] = useState([]);
    const [loading, setLoading] = useState(true);

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
        data: new Date().toISOString().split('T')[0]
    });
    const [errorInsumo, setErrorInsumo] = useState('');

    // Modal Colheita
    const [modalColheitaOpen, setModalColheitaOpen] = useState(false);
    const [selectedSafraParaColher, setSelectedSafraParaColher] = useState(null);
    const [colheitaForm, setColheitaForm] = useState({
        data_colheita_real: new Date().toISOString().split('T')[0],
        quantidade_colhida: '',
        unidade_medida: 'sacas',
        valor_venda_total: ''
    });
    const [errorColheita, setErrorColheita] = useState('');

    const [feedback, setFeedback] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [talhoesData, safrasData] = await Promise.all([
                api.getTalhoes(),
                api.getSafras()
            ]);
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
    }, []);

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

    const handleSaveTalhao = async (e) => {
        e.preventDefault();
        setErrorTalhao('');
        try {
            const payload = {
                nome: talhaoForm.nome,
                area_hectares: Number(talhaoForm.area_hectares),
                tipo_solo: talhaoForm.tipo_solo
            };
            if (editingTalhao) {
                await api.updateTalhao(editingTalhao.id, payload);
            } else {
                await api.createTalhao(payload);
            }
            setModalTalhaoOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorTalhao(err.message);
        }
    };

    const handleDeleteTalhao = async (id, nome) => {
        if (!confirm(`Deseja excluir o talhão "${nome}" e todo o histórico de safras associado?`)) return;
        try {
            await api.deleteTalhao(id);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
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
        setErrorSafra('');
        try {
            await api.createSafra({
                ...safraForm,
                talhao_id: Number(safraForm.talhao_id)
            });
            setModalSafraOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorSafra(err.message);
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
            data: new Date().toISOString().split('T')[0]
        });
        setErrorInsumo('');
        setModalInsumoOpen(true);
    };

    const handleSaveInsumo = async (e) => {
        e.preventDefault();
        setErrorInsumo('');
        try {
            const res = await api.createInsumo({
                safra_id: selectedSafraParaInsumo.id,
                tipo: insumoForm.tipo,
                descricao: insumoForm.descricao,
                quantidade: Number(insumoForm.quantidade) || 1,
                valor: Number(insumoForm.valor),
                data: insumoForm.data
            });
            setModalInsumoOpen(false);
            setFeedback(res.message);
            setTimeout(() => setFeedback(''), 5000);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorInsumo(err.message);
        }
    };

    // Colheita handlers
    const handleOpenColher = (safra) => {
        setSelectedSafraParaColher(safra);
        setColheitaForm({
            data_colheita_real: new Date().toISOString().split('T')[0],
            quantidade_colhida: '',
            unidade_medida: 'sacas',
            valor_venda_total: ''
        });
        setErrorColheita('');
        setModalColheitaOpen(true);
    };

    const handleSaveColheita = async (e) => {
        e.preventDefault();
        setErrorColheita('');
        try {
            const res = await api.colherSafra(selectedSafraParaColher.id, {
                data_colheita_real: colheitaForm.data_colheita_real,
                quantidade_colhida: Number(colheitaForm.quantidade_colhida),
                unidade_medida: colheitaForm.unidade_medida,
                valor_venda_total: Number(colheitaForm.valor_venda_total) || 0
            });
            setModalColheitaOpen(false);
            setFeedback(res.message);
            setTimeout(() => setFeedback(''), 5000);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorColheita(err.message);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    return (
        <div className="space-y-6">
            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                    onClick={() => setSubTab('safras')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        subTab === 'safras' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Sprout className="w-4 h-4" />
                    <span>Safras & Lavouras ({safras.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('talhoes')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        subTab === 'talhoes' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Talhões ({talhoes.length})</span>
                </button>
            </div>

            {feedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{feedback}</span>
                </div>
            )}

            {/* TAB 1: SAFRAS & LAVOURAS */}
            {subTab === 'safras' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm text-white">Gestão de Safras e Culturas</h3>
                            <p className="text-xs text-slate-400">Acompanhamento de plantio, insumos, colheita e produtividade por hectare</p>
                        </div>
                        <button
                            onClick={handleOpenNewSafra}
                            disabled={talhoes.length === 0}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Safra / Plantio</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {safras.map((s) => {
                            const isColhida = s.status === 'colhida';
                            return (
                                <div key={s.id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between hover:border-slate-600 transition">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                                                    <Wheat className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-base text-white">{s.cultura}</h4>
                                                    <div className="text-[11px] text-slate-400">Talhão: <span className="text-slate-200 font-semibold">{s.talhao_nome}</span> ({s.talhao_area} ha)</div>
                                                </div>
                                            </div>

                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                                s.status === 'colhida' 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                                    : s.status === 'em_desenvolvimento' 
                                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                            }`}>
                                                {s.status === 'colhida' ? 'Colhida' : s.status === 'em_desenvolvimento' ? 'Em Desenvolvimento' : 'Plantio'}
                                            </span>
                                        </div>

                                        {/* Detalhes de Plantio e Produtividade */}
                                        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs mb-3">
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Plantio:</span>
                                                <span className="font-medium text-slate-200">{s.data_plantio}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Colheita:</span>
                                                <span className="font-medium text-slate-200">
                                                    {s.data_colheita_real ? `${s.data_colheita_real} (Real)` : s.data_colheita_prevista ? `${s.data_colheita_prevista} (Prev)` : 'Não prevista'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Custo em Insumos:</span>
                                                <span className="font-bold text-rose-400">{formatCurrency(s.total_custo_insumos)}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Produtividade:</span>
                                                <span className="font-extrabold text-emerald-400">
                                                    {s.produtividade_ha ? `${s.produtividade_ha} ${s.unidade_medida}/ha` : 'Aguardando colheita'}
                                                </span>
                                            </div>
                                        </div>

                                        {isColhida && s.valor_venda_total > 0 && (
                                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-3 flex items-center justify-between text-xs">
                                                <span className="text-slate-300 font-medium">Venda Total da Safra:</span>
                                                <span className="font-bold text-emerald-400">{formatCurrency(s.valor_venda_total)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                        <button
                                            onClick={() => handleOpenLancarInsumo(s)}
                                            className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1"
                                        >
                                            <Package className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Lançar Insumo</span>
                                        </button>

                                        {!isColhida ? (
                                            <button
                                                onClick={() => handleOpenColher(s)}
                                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Registrar Colheita</span>
                                            </button>
                                        ) : (
                                            <span className="flex-1 py-2 text-center text-xs text-slate-500 font-medium bg-slate-900/50 rounded-xl border border-slate-800">
                                                Safra Encerrada
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {safras.length === 0 && !loading && (
                            <div className="lg:col-span-2 py-16 text-center text-xs text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                                Nenhuma safra cadastrada. Cadastre um talhão primeiro e lance o plantio.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: TALHÕES */}
            {subTab === 'talhoes' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm text-white">Talhões & Áreas Agrícolas</h3>
                            <p className="text-xs text-slate-400">Divisões de área para lavoura da fazenda</p>
                        </div>
                        <button
                            onClick={handleOpenNewTalhao}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Talhão</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {talhoes.map((t) => (
                            <div key={t.id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-base text-white">{t.nome}</h4>
                                        <button
                                            onClick={() => handleDeleteTalhao(t.id, t.nome)}
                                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                                            title="Excluir Talhão"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                                        <span>{t.area_hectares} hectares</span>
                                        {t.tipo_solo && (
                                            <>
                                                <span>•</span>
                                                <span>Solo: {t.tipo_solo}</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-1 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Cultura Atual:</span>
                                            <span className="font-bold text-emerald-400">{t.cultura_atual || 'Em pousio / Sem safra'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Histórico de Safras:</span>
                                            <span className="text-slate-300 font-medium">{t.total_safras} safras</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {talhoes.length === 0 && (
                            <div className="sm:col-span-3 py-16 text-center text-xs text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                                Nenhum talhão cadastrado ainda. Clique em "Novo Talhão" para começar.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Novo Talhão */}
            {modalTalhaoOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">
                                    {editingTalhao ? 'Editar Talhão' : 'Cadastrar Novo Talhão'}
                                </h3>
                            </div>
                            <button onClick={() => setModalTalhaoOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTalhao} className="p-6 space-y-4">
                            {errorTalhao && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorTalhao}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome / Identificação *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Talhão 01 - Sede"
                                    value={talhaoForm.nome}
                                    onChange={(e) => setTalhaoForm({ ...talhaoForm, nome: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Área (Hectares) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="Ex: 80"
                                        value={talhaoForm.area_hectares}
                                        onChange={(e) => setTalhaoForm({ ...talhaoForm, area_hectares: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Solo</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Argiloso, Misto"
                                        value={talhaoForm.tipo_solo}
                                        onChange={(e) => setTalhaoForm({ ...talhaoForm, tipo_solo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalTalhaoOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Salvar Talhão</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Nova Safra */}
            {modalSafraOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">Cadastrar Nova Safra / Plantio</h3>
                            </div>
                            <button onClick={() => setModalSafraOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSafra} className="p-6 space-y-4">
                            {errorSafra && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorSafra}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Talhão de Plantio *</label>
                                <select
                                    required
                                    value={safraForm.talhao_id}
                                    onChange={(e) => setSafraForm({ ...safraForm, talhao_id: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">Selecione o talhão...</option>
                                    {talhoes.map((t) => (
                                        <option key={t.id} value={t.id}>{t.nome} ({t.area_hectares} ha)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cultura *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Soja, Milho, Algodão"
                                        value={safraForm.cultura}
                                        onChange={(e) => setSafraForm({ ...safraForm, cultura: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status Inicial</label>
                                    <select
                                        value={safraForm.status}
                                        onChange={(e) => setSafraForm({ ...safraForm, status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="plantio">Plantio</option>
                                        <option value="em_desenvolvimento">Em Desenvolvimento</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data do Plantio *</label>
                                    <input
                                        type="date"
                                        required
                                        value={safraForm.data_plantio}
                                        onChange={(e) => setSafraForm({ ...safraForm, data_plantio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Colheita Prevista</label>
                                    <input
                                        type="date"
                                        value={safraForm.data_colheita_prevista}
                                        onChange={(e) => setSafraForm({ ...safraForm, data_colheita_prevista: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Variedade da semente, adubação inicial..."
                                    value={safraForm.observacoes}
                                    onChange={(e) => setSafraForm({ ...safraForm, observacoes: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalSafraOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Salvar Safra</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Lançar Insumo Agrícola */}
            {modalInsumoOpen && selectedSafraParaInsumo && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-amber-400" />
                                <div>
                                    <h3 className="font-bold text-sm text-white">Lançar Insumo Agrícola</h3>
                                    <p className="text-[11px] text-slate-400">Safra {selectedSafraParaInsumo.cultura} ({selectedSafraParaInsumo.talhao_nome})</p>
                                </div>
                            </div>
                            <button onClick={() => setModalInsumoOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveInsumo} className="p-6 space-y-4">
                            {errorInsumo && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorInsumo}
                                </div>
                            )}

                            <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Este lançamento gerará automaticamente uma despesa no Financeiro (categoria: Insumo Agrícola).</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Insumo *</label>
                                    <select
                                        value={insumoForm.tipo}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, tipo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="semente">Sementes</option>
                                        <option value="fertilizante">Fertilizante / Adubo</option>
                                        <option value="defensivo">Defensivo / Herbicida</option>
                                        <option value="outro">Outro Insumo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data da Aplicação *</label>
                                    <input
                                        type="date"
                                        required
                                        value={insumoForm.data}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, data: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Produto *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: NPK 04-14-08 (50 sacos), Glifosato..."
                                    value={insumoForm.descricao}
                                    onChange={(e) => setInsumoForm({ ...insumoForm, descricao: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 50"
                                        value={insumoForm.quantidade}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, quantidade: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Total (R$) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="Ex: 4800.00"
                                        value={insumoForm.valor}
                                        onChange={(e) => setInsumoForm({ ...insumoForm, valor: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalInsumoOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Lançar no Financeiro</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Registrar Colheita & Venda */}
            {modalColheitaOpen && selectedSafraParaColher && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wheat className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <h3 className="font-bold text-sm text-white">Registrar Colheita & Venda</h3>
                                    <p className="text-[11px] text-slate-400">Safra {selectedSafraParaColher.cultura} ({selectedSafraParaColher.talhao_nome}, {selectedSafraParaColher.talhao_area} ha)</p>
                                </div>
                            </div>
                            <button onClick={() => setModalColheitaOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveColheita} className="p-6 space-y-4">
                            {errorColheita && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorColheita}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Data Real da Colheita *</label>
                                <input
                                    type="date"
                                    required
                                    value={colheitaForm.data_colheita_real}
                                    onChange={(e) => setColheitaForm({ ...colheitaForm, data_colheita_real: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade Colhida *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        placeholder="Ex: 5400"
                                        value={colheitaForm.quantidade_colhida}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, quantidade_colhida: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Unidade *</label>
                                    <select
                                        value={colheitaForm.unidade_medida}
                                        onChange={(e) => setColheitaForm({ ...colheitaForm, unidade_medida: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="sacas">Sacas (60 kg)</option>
                                        <option value="toneladas">Toneladas</option>
                                    </select>
                                </div>
                            </div>

                            {/* Prévia da Produtividade */}
                            {colheitaForm.quantidade_colhida && selectedSafraParaColher.talhao_area > 0 && (
                                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs flex items-center justify-between">
                                    <span className="text-slate-300 font-medium">Produtividade Estimada:</span>
                                    <span className="font-extrabold text-emerald-400">
                                        {(Number(colheitaForm.quantidade_colhida) / selectedSafraParaColher.talhao_area).toFixed(2)} {colheitaForm.unidade_medida}/ha
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Total da Venda (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 650000.00 (opcional se ainda for estocar)"
                                    value={colheitaForm.valor_venda_total}
                                    onChange={(e) => setColheitaForm({ ...colheitaForm, valor_venda_total: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Se preenchido, lançará automaticamente a receita no Financeiro (categoria: Venda Agrícola).
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalColheitaOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Confirmar Colheita</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
