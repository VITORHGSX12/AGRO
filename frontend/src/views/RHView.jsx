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
            <div className="flex items-center gap-2 border-b border-[#E6EBE8] pb-3">
                <button
                    onClick={() => setTab('folha')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        tab === 'folha' 
                            ? 'bg-[#087F5B] text-white shadow-sm' 
                            : 'bg-white border border-[#E6EBE8] text-[#64748B] hover:text-[#172033]'
                    }`}
                >
                    <Banknote className="w-4 h-4" strokeWidth={1.75} />
                    <span>Folha de Pagamento Mensal ({mesAno})</span>
                </button>

                <button
                    onClick={() => setTab('colaboradores')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                        tab === 'colaboradores' 
                            ? 'bg-[#087F5B] text-white shadow-sm' 
                            : 'bg-white border border-[#E6EBE8] text-[#64748B] hover:text-[#172033]'
                    }`}
                >
                    <Users className="w-4 h-4" strokeWidth={1.75} />
                    <span>Equipe & Colaboradores ({funcionarios.length})</span>
                </button>
            </div>

            {/* TAB 1: FOLHA DE PAGAMENTO MENSAL */}
            {tab === 'folha' && (
                <div className="space-y-6">
                    {/* Top KPI Cards da Folha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Líquido do Mês</span>
                            <div className="text-2xl font-bold text-[#172033] mt-1">
                                {formatCurrency(resumo.total_liquido)}
                            </div>
                            <div className="text-[11px] text-[#64748B] mt-1 font-medium">
                                {resumo.qtd_colaboradores || 0} colaboradores ativos
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Salários Já Quitados</span>
                            <div className="text-2xl font-bold text-[#087F5B] mt-1">
                                {formatCurrency(resumo.total_pago)}
                            </div>
                            <div className="text-[11px] text-[#087F5B] mt-1 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Lançados no Financeiro
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all">
                            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Salários Pendentes</span>
                            <div className="text-2xl font-bold text-[#D9A441] mt-1">
                                {formatCurrency(resumo.total_pendente)}
                            </div>
                            <div className="text-[11px] text-[#D9A441] mt-1 flex items-center gap-1 font-semibold">
                                <Clock className="w-3.5 h-3.5" /> Aguardando pagamento
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all flex flex-col justify-between">
                            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Ação em Lote</span>
                            <button
                                onClick={handlePagarTodas}
                                disabled={resumo.total_pendente === 0}
                                className="w-full py-2.5 bg-[#087F5B] hover:bg-[#159A70] disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer mt-2"
                            >
                                <Check className="w-4 h-4" strokeWidth={2.5} />
                                <span>Quitar Todas as Folhas</span>
                            </button>
                        </div>
                    </div>

                    {feedbackFolha && (
                        <div className="p-3.5 bg-[#E8F5EF] border border-[#C3E6D6] rounded-xl text-[#087F5B] text-xs flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{feedbackFolha}</span>
                        </div>
                    )}

                    {/* Tabela de Folha Mensal */}
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(20,60,45,0.04)]">
                        <div className="p-5 border-b border-[#E6EBE8] flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-sm text-[#172033]">Demonstrativo da Folha — {mesAno}</h3>
                                <p className="text-xs text-[#64748B] font-medium mt-0.5">Edite benefícios/descontos diretamente na tabela antes de quitar</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#F7F9F8] text-[#64748B] font-semibold border-b border-[#E6EBE8]">
                                    <tr>
                                        <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Colaborador</th>
                                        <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Tipo / Função</th>
                                        <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Salário Base (R$)</th>
                                        <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Benefícios (+)</th>
                                        <th className="px-4 py-3.5 uppercase tracking-wider text-[11px]">Descontos (-)</th>
                                        <th className="px-4 py-3.5 text-right uppercase tracking-wider text-[11px]">Líquido a Pagar</th>
                                        <th className="px-4 py-3.5 text-center uppercase tracking-wider text-[11px]">Status</th>
                                        <th className="px-5 py-3.5 text-right uppercase tracking-wider text-[11px]">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E6EBE8]">
                                    {folhaData.folhas.map((item) => {
                                        const isPago = item.status === 'pago';
                                        return (
                                            <tr key={item.id} className="hover:bg-[#F7F9F8] transition-colors">
                                                <td className="px-5 py-4 font-bold text-[#172033]">
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.funcionario_nome}</span>
                                                        {item.funcionario_mora_na_fazenda === 1 && (
                                                            <span title="Mora na Fazenda" className="p-1 rounded-lg bg-[#E8F5EF] border border-[#C3E6D6] text-[#087F5B]">
                                                                <Home className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-[#172033]">
                                                    <div className="font-semibold">{item.funcionario_funcao}</div>
                                                    <div className="text-[10px] text-[#64748B] capitalize">{item.funcionario_tipo_contratacao}</div>
                                                </td>
                                                <td className="px-4 py-4 text-[#172033] font-semibold">
                                                    {isPago ? (
                                                        formatCurrency(item.salario_base)
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="10"
                                                            value={item.salario_base}
                                                            onChange={(e) => handleUpdateFolhaItem(item.id, 'salario_base', e.target.value)}
                                                            className="w-24 bg-[#F7F9F8] border border-[#E6EBE8] rounded-lg px-2.5 py-1 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B] font-semibold"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-[#087F5B] font-medium">
                                                    {isPago ? (
                                                        `+ ${formatCurrency(item.beneficios)}`
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="10"
                                                            placeholder="0.00"
                                                            value={item.beneficios || ''}
                                                            onChange={(e) => handleUpdateFolhaItem(item.id, 'beneficios', e.target.value)}
                                                            className="w-20 bg-[#F7F9F8] border border-[#E6EBE8] rounded-lg px-2.5 py-1 text-xs text-[#087F5B] font-semibold focus:outline-none focus:border-[#087F5B]"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-[#D64545] font-medium">
                                                    {isPago ? (
                                                        `- ${formatCurrency(item.descontos)}`
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step="10"
                                                            placeholder="0.00"
                                                            value={item.descontos || ''}
                                                            onChange={(e) => handleUpdateFolhaItem(item.id, 'descontos', e.target.value)}
                                                            className="w-20 bg-[#F7F9F8] border border-[#E6EBE8] rounded-lg px-2.5 py-1 text-xs text-[#D64545] font-semibold focus:outline-none focus:border-[#087F5B]"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-[#172033] text-sm">
                                                    {formatCurrency(item.valor_liquido)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                                        isPago 
                                                            ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' 
                                                            : 'bg-[#FEF9E7] text-[#D9A441] border-[#FDE8B3]'
                                                    }`}>
                                                        {isPago ? 'Pago' : 'Pendente'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {!isPago ? (
                                                        <button
                                                            onClick={() => handlePagarItem(item)}
                                                            className="px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                                        >
                                                            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                            <span>Pagar</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-[#64748B] font-medium">{item.data_pagamento}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {folhaData.folhas.length === 0 && !loadingFolha && (
                                <div className="py-16 text-center text-xs text-[#64748B]">
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
                    <div className="flex items-center justify-between p-4 bg-white border border-[#E6EBE8] rounded-2xl shadow-[0_4px_20px_rgba(20,60,45,0.03)]">
                        <div>
                            <h3 className="font-bold text-sm text-[#172033]">Quadro de Colaboradores da Fazenda</h3>
                            <p className="text-xs text-[#64748B] font-medium">Gerenciamento de funcionários fixos, diaristas e moradia na propriedade</p>
                        </div>
                        <button
                            onClick={handleOpenNewFunc}
                            className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-sm hover:shadow-md cursor-pointer"
                        >
                            <UserPlus className="w-4 h-4" strokeWidth={2.5} />
                            <span>Novo Colaborador</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {funcionarios.map((f) => (
                            <div key={f.id} className="p-5 rounded-2xl bg-white border border-[#E6EBE8] shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-[#E8F5EF] border border-[#C3E6D6] flex items-center justify-center text-[#087F5B] font-bold text-xs">
                                                {f.nome.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#172033]">{f.nome}</h4>
                                                <div className="text-[11px] text-[#64748B] font-medium">{f.funcao || 'Colaborador'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenEditFunc(f)}
                                                className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                title="Editar"
                                            >
                                                <Edit className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFunc(f.id, f.nome)}
                                                className="p-1.5 text-[#64748B] hover:text-[#D64545] hover:bg-[#FEF2F2] rounded-lg transition cursor-pointer"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 my-3">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8]">
                                            {f.tipo_contratacao === 'fixo' ? 'Contrato Fixo' : 'Diarista'}
                                        </span>
                                        {f.mora_na_fazenda === 1 && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F5EF] text-[#087F5B] border border-[#C3E6D6] flex items-center gap-1">
                                                <Home className="w-3 h-3" /> Mora na Fazenda
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                            f.status === 'ativo' ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' : 'bg-[#FEF2F2] text-[#D64545] border-[#FACDCD]'
                                        }`}>
                                            {f.status === 'ativo' ? 'Ativo' : 'Desligado'}
                                        </span>
                                    </div>

                                    <div className="p-3.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl space-y-1.5 text-xs mb-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#64748B] font-medium">
                                                {f.tipo_contratacao === 'fixo' ? 'Salário Base Mensal:' : 'Valor da Diária:'}
                                            </span>
                                            <span className="font-bold text-[#172033]">
                                                {f.tipo_contratacao === 'fixo' ? formatCurrency(f.salario) : `${formatCurrency(f.valor_diaria)} / dia`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-[#64748B] font-medium">
                                            <span>Admissão:</span>
                                            <span>{f.data_admissao || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {funcionarios.length === 0 && (
                            <div className="sm:col-span-3 py-16 text-center text-xs text-[#64748B] bg-white border border-[#E6EBE8] rounded-2xl shadow-sm">
                                Nenhum colaborador cadastrado ainda.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Cadastro / Edição de Colaborador */}
            {modalFuncOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-[#E6EBE8] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                    <Users className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <h3 className="font-bold text-sm text-[#172033]">
                                    {editingFunc ? `Editar Colaborador — ${editingFunc.nome}` : 'Cadastrar Novo Colaborador'}
                                </h3>
                            </div>
                            <button onClick={() => setModalFuncOpen(false)} className="text-[#64748B] hover:text-[#172033] transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveFunc} className="p-6 space-y-4">
                            {errorFunc && (
                                <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] rounded-xl text-[#D64545] text-xs font-medium">
                                    {errorFunc}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1">Nome Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: João da Silva"
                                    value={funcForm.nome}
                                    onChange={(e) => setFuncForm({ ...funcForm, nome: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Função / Cargo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Capataz, Campeiro, Tratorista"
                                        value={funcForm.funcao}
                                        onChange={(e) => setFuncForm({ ...funcForm, funcao: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Tipo de Contratação *</label>
                                    <select
                                        value={funcForm.tipo_contratacao}
                                        onChange={(e) => setFuncForm({ ...funcForm, tipo_contratacao: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        <option value="fixo">Contrato Fixo Mensalista</option>
                                        <option value="diarista">Diarista / Temporário</option>
                                    </select>
                                </div>
                            </div>

                            {/* Salário Base ou Valor da Diária */}
                            {funcForm.tipo_contratacao === 'fixo' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Salário Base Mensal (R$) *</label>
                                    <input
                                        type="number"
                                        step="50"
                                        required
                                        placeholder="Ex: 2800.00"
                                        value={funcForm.salario}
                                        onChange={(e) => setFuncForm({ ...funcForm, salario: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Valor da Diária (R$) *</label>
                                    <input
                                        type="number"
                                        step="10"
                                        required
                                        placeholder="Ex: 140.00"
                                        value={funcForm.valor_diaria}
                                        onChange={(e) => setFuncForm({ ...funcForm, valor_diaria: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Data de Admissão</label>
                                    <input
                                        type="date"
                                        value={funcForm.data_admissao}
                                        onChange={(e) => setFuncForm({ ...funcForm, data_admissao: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1">Status</label>
                                    <select
                                        value={funcForm.status}
                                        onChange={(e) => setFuncForm({ ...funcForm, status: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#087F5B] focus:bg-white"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="desligado">Desligado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 text-xs text-[#172033] font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={funcForm.mora_na_fazenda}
                                        onChange={(e) => setFuncForm({ ...funcForm, mora_na_fazenda: e.target.checked })}
                                        className="rounded border-[#E6EBE8] text-[#087F5B] focus:ring-[#087F5B] cursor-pointer"
                                    />
                                    <span>Colaborador reside na fazenda (casa / alojamento)</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalFuncOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#087F5B] hover:bg-[#159A70] text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
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
