import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    Banknote, 
    Check, 
    Trash2, 
    Edit, 
    Home, 
    Briefcase, 
    Calendar,
    DollarSign,
    CheckCircle2,
    Clock,
    X,
    TrendingUp,
    TrendingDown,
    Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function RHView({ mesAno, onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [tab, setTab] = useState('folha'); // 'folha' | 'colaboradores'
    
    // Colaboradores State
    const [funcionarios, setFuncionarios] = useState([]);
    const [loadingFunc, setLoadingFunc] = useState(false);
    const [modalFuncOpen, setModalFuncOpen] = useState(false);
    const [editingFunc, setEditingFunc] = useState(null);
    const [funcForm, setFuncForm] = useState({
        nome: '',
        funcao: '',
        tipo_contratacao: 'fixo',
        salario: '',
        valor_diaria: '',
        mora_na_fazenda: false,
        data_admissao: new Date().toISOString().split('T')[0],
        status: 'ativo'
    });
    const [errorFunc, setErrorFunc] = useState('');

    // Folha State
    const [folhaData, setFolhaData] = useState({ resumo: {}, folhas: [] });
    const [loadingFolha, setLoadingFolha] = useState(false);
    const [feedbackFolha, setFeedbackFolha] = useState('');

    const loadFuncionarios = async () => {
        try {
            setLoadingFunc(true);
            const data = await api.getFuncionarios();
            setFuncionarios(data);
        } catch (err) {
            console.error('Erro ao listar funcionários:', err);
        } finally {
            setLoadingFunc(false);
        }
    };

    const loadFolha = async () => {
        try {
            setLoadingFolha(true);
            const data = await api.getFolha(mesAno);
            setFolhaData(data);
        } catch (err) {
            console.error('Erro ao carregar folha:', err);
        } finally {
            setLoadingFolha(false);
        }
    };

    useEffect(() => {
        loadFuncionarios();
    }, []);

    useEffect(() => {
        loadFolha();
    }, [mesAno]);

    useEffect(() => {
        if (triggerNewModal) {
            setTab('colaboradores');
            handleOpenNewFunc();
            onResetTrigger();
        }
    }, [triggerNewModal]);

    const handleOpenNewFunc = () => {
        setEditingFunc(null);
        setFuncForm({
            nome: '',
            funcao: '',
            tipo_contratacao: 'fixo',
            salario: '',
            valor_diaria: '',
            mora_na_fazenda: false,
            data_admissao: new Date().toISOString().split('T')[0],
            status: 'ativo'
        });
        setErrorFunc('');
        setModalFuncOpen(true);
    };

    const handleOpenEditFunc = (f) => {
        setEditingFunc(f);
        setFuncForm({
            nome: f.nome,
            funcao: f.funcao || '',
            tipo_contratacao: f.tipo_contratacao || 'fixo',
            salario: f.salario !== null ? String(f.salario) : '',
            valor_diaria: f.valor_diaria !== null ? String(f.valor_diaria) : '',
            mora_na_fazenda: f.mora_na_fazenda === 1,
            data_admissao: f.data_admissao || '',
            status: f.status || 'ativo'
        });
        setErrorFunc('');
        setModalFuncOpen(true);
    };

    const handleSaveFunc = async (e) => {
        e.preventDefault();
        setErrorFunc('');

        try {
            const payload = {
                ...funcForm,
                salario: Number(funcForm.salario) || 0,
                valor_diaria: Number(funcForm.valor_diaria) || 0,
                mora_na_fazenda: funcForm.mora_na_fazenda ? 1 : 0
            };

            if (editingFunc) {
                await api.updateFuncionario(editingFunc.id, payload);
            } else {
                await api.createFuncionario(payload);
            }

            setModalFuncOpen(false);
            loadFuncionarios();
            loadFolha();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorFunc(err.message);
        }
    };

    const handleDeleteFunc = async (id, nome) => {
        if (!confirm(`Deseja excluir o registro do colaborador "${nome}"?`)) return;
        try {
            await api.deleteFuncionario(id);
            loadFuncionarios();
            loadFolha();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    // Folha actions
    const handleUpdateFolhaItem = async (id, field, value) => {
        const item = folhaData.folhas.find(f => f.id === id);
        if (!item) return;

        const payload = {
            salario_base: field === 'salario_base' ? Number(value) : item.salario_base,
            beneficios: field === 'beneficios' ? Number(value) : item.beneficios,
            descontos: field === 'descontos' ? Number(value) : item.descontos
        };

        try {
            await api.updateFolhaItem(id, payload);
            loadFolha();
        } catch (err) {
            console.error('Erro ao atualizar folha:', err);
        }
    };

    const handlePagarItem = async (item) => {
        if (!confirm(`Confirmar quitação do salário de "${item.funcionario_nome}" no valor de R$ ${item.valor_liquido.toFixed(2)}? O lançamento será gerado automaticamente no Financeiro.`)) return;
        try {
            const res = await api.pagarFolhaItem(item.id);
            setFeedbackFolha(res.message);
            setTimeout(() => setFeedbackFolha(''), 5000);
            loadFolha();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao pagar: ' + err.message);
        }
    };

    const handlePagarTodas = async () => {
        if (!confirm(`Confirmar a quitação de TODAS as folhas pendentes de ${mesAno}? Serão lançadas no fluxo financeiro.`)) return;
        try {
            const res = await api.pagarTodasFolhas({ mes_referencia: mesAno });
            setFeedbackFolha(res.message);
            setTimeout(() => setFeedbackFolha(''), 5000);
            loadFolha();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao pagar em lote: ' + err.message);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const resumo = folhaData.resumo || {};

    return (
        <div className="space-y-6">
            {/* Sub Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                    onClick={() => setTab('folha')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        tab === 'folha' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Banknote className="w-4 h-4" />
                    <span>Folha de Pagamento Mensal ({mesAno})</span>
                </button>

                <button
                    onClick={() => setTab('colaboradores')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                        tab === 'colaboradores' 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Equipe & Colaboradores ({funcionarios.length})</span>
                </button>
            </div>

            {/* TAB 1: FOLHA DE PAGAMENTO MENSAL */}
            {tab === 'folha' && (
                <div className="space-y-6">
                    {/* Top KPI Cards da Folha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Líquido do Mês</span>
                            <div className="text-2xl font-extrabold text-white mt-1">
                                {formatCurrency(resumo.total_liquido)}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                                {resumo.qtd_colaboradores || 0} colaboradores ativos
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salários Já Quitados</span>
                            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                                {formatCurrency(resumo.total_pago)}
                            </div>
                            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Lançados no Financeiro
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salários Pendentes</span>
                            <div className="text-2xl font-extrabold text-amber-400 mt-1">
                                {formatCurrency(resumo.total_pendente)}
                            </div>
                            <div className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Aguardando pagamento
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ação em Lote</span>
                            <button
                                onClick={handlePagarTodas}
                                disabled={resumo.total_pendente === 0}
                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                            >
                                <Check className="w-3.5 h-3.5" />
                                <span>Quitar Todas as Folhas</span>
                            </button>
                        </div>
                    </div>

                    {feedbackFolha && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{feedbackFolha}</span>
                        </div>
                    )}

                    {/* Tabela de Folha Mensal */}
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-white">Demonstrativo da Folha — {mesAno}</h3>
                                <p className="text-xs text-slate-400">Edite benefícios/descontos diretamente na tabela antes de quitar</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700/60">
                                    <tr>
                                        <th className="px-5 py-3.5">Colaborador</th>
                                        <th className="px-4 py-3.5">Tipo / Função</th>
                                        <th className="px-4 py-3.5">Salário Base (R$)</th>
                                        <th className="px-4 py-3.5">Benefícios (+)</th>
                                        <th className="px-4 py-3.5">Descontos (-)</th>
                                        <th className="px-4 py-3.5 text-right">Líquido a Pagar</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/40">
                                    {folhaData.folhas.map((item) => {
                                        const isPago = item.status === 'pago';
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-700/30 transition">
                                                <td className="px-5 py-3.5 font-bold text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.funcionario_nome}</span>
                                                        {item.funcionario_mora_na_fazenda === 1 && (
                                                            <span title="Mora na Fazenda" className="p-1 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                                                                <Home className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-300">
                                                    <div>{item.funcionario_funcao}</div>
                                                    <div className="text-[10px] text-slate-400 capitalize">{item.funcionario_tipo_contratacao}</div>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-200 font-semibold">
                                                    {isPago ? (
                                                        formatCurrency(item.salario_base)
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="10"
                                                            value={item.salario_base}
                                                            onChange={(e) => handleUpdateFolhaItem(item.id, 'salario_base', e.target.value)}
                                                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-emerald-400 font-medium">
                                                    {isPago ? (
                                                        `+ ${formatCurrency(item.beneficios)}`
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="10"
                                                            placeholder="0.00"
                                                            value={item.beneficios || ''}
                                                            onChange={(e) => handleUpdateFolhaItem(item.id, 'beneficios', e.target.value)}
                                                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-rose-400 font-medium">
                                                    {isPago ? (
                                                        `- ${formatCurrency(item.descontos)}`
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="10"
                                                            placeholder="0.00"
                                                            value={item.descontos || ''}
                                                            onChange={(e) => handleUpdateFolhaItem(item.id, 'descontos', e.target.value)}
                                                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-400 focus:outline-none focus:border-emerald-500"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-extrabold text-white text-sm">
                                                    {formatCurrency(item.valor_liquido)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                                        isPago 
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                    }`}>
                                                        {isPago ? 'Pago' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {!isPago ? (
                                                        <button
                                                            onClick={() => handlePagarItem(item)}
                                                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Pagar</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">{item.data_pagamento}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {folhaData.folhas.length === 0 && !loadingFolha && (
                                <div className="py-16 text-center text-xs text-slate-500">
                                    Nenhum colaborador ativo cadastrado para compor a folha. Cadastre funcionários na aba ao lado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: COLABORADORES & EQUIPE */}
            {tab === 'colaboradores' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-sm">
                        <div>
                            <h3 className="font-bold text-sm text-white">Quadro de Colaboradores da Fazenda</h3>
                            <p className="text-xs text-slate-400">Gerenciamento de funcionários fixos, diaristas e moradia na propriedade</p>
                        </div>
                        <button
                            onClick={handleOpenNewFunc}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Novo Colaborador</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {funcionarios.map((f) => (
                            <div key={f.id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                                                {f.nome.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-white">{f.nome}</h4>
                                                <div className="text-[11px] text-slate-400">{f.funcao || 'Colaborador'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEditFunc(f)}
                                                className="p-1 text-slate-400 hover:text-white transition"
                                                title="Editar"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFunc(f.id, f.nome)}
                                                className="p-1 text-slate-400 hover:text-rose-400 transition"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 my-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700">
                                            {f.tipo_contratacao === 'fixo' ? 'Contrato Fixo' : 'Diarista'}
                                        </span>
                                        {f.mora_na_fazenda === 1 && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                <Home className="w-3 h-3" /> Mora na Fazenda
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                            f.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                        }`}>
                                            {f.status === 'ativo' ? 'Ativo' : 'Desligado'}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl space-y-1 text-xs mb-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">
                                                {f.tipo_contratacao === 'fixo' ? 'Salário Base Mensal:' : 'Valor da Diária:'}
                                            </span>
                                            <span className="font-bold text-white">
                                                {f.tipo_contratacao === 'fixo' ? formatCurrency(f.salario) : `${formatCurrency(f.valor_diaria)} / dia`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Admissão:</span>
                                            <span>{f.data_admissao || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {funcionarios.length === 0 && (
                            <div className="sm:col-span-3 py-16 text-center text-xs text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                                Nenhum colaborador cadastrado ainda.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Cadastro / Edição de Colaborador */}
            {modalFuncOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">
                                    {editingFunc ? `Editar Colaborador — ${editingFunc.nome}` : 'Cadastrar Novo Colaborador'}
                                </h3>
                            </div>
                            <button onClick={() => setModalFuncOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveFunc} className="p-6 space-y-4">
                            {errorFunc && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorFunc}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: João da Silva"
                                    value={funcForm.nome}
                                    onChange={(e) => setFuncForm({ ...funcForm, nome: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Função / Cargo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Capataz, Campeiro, Tratorista"
                                        value={funcForm.funcao}
                                        onChange={(e) => setFuncForm({ ...funcForm, funcao: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Contratação *</label>
                                    <select
                                        value={funcForm.tipo_contratacao}
                                        onChange={(e) => setFuncForm({ ...funcForm, tipo_contratacao: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="fixo">Contrato Fixo Mensalista</option>
                                        <option value="diarista">Diarista / Temporário</option>
                                    </select>
                                </div>
                            </div>

                            {/* Salário Base ou Valor da Diária */}
                            {funcForm.tipo_contratacao === 'fixo' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Salário Base Mensal (R$) *</label>
                                    <input
                                        type="number"
                                        step="50"
                                        required
                                        placeholder="Ex: 2800.00"
                                        value={funcForm.salario}
                                        onChange={(e) => setFuncForm({ ...funcForm, salario: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor da Diária (R$) *</label>
                                    <input
                                        type="number"
                                        step="10"
                                        required
                                        placeholder="Ex: 140.00"
                                        value={funcForm.valor_diaria}
                                        onChange={(e) => setFuncForm({ ...funcForm, valor_diaria: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Admissão</label>
                                    <input
                                        type="date"
                                        value={funcForm.data_admissao}
                                        onChange={(e) => setFuncForm({ ...funcForm, data_admissao: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                                    <select
                                        value={funcForm.status}
                                        onChange={(e) => setFuncForm({ ...funcForm, status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="desligado">Desligado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={funcForm.mora_na_fazenda}
                                        onChange={(e) => setFuncForm({ ...funcForm, mora_na_fazenda: e.target.checked })}
                                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                                    />
                                    <span>Colaborador reside na fazenda (casa / alojamento)</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalFuncOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Salvar Colaborador</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
