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
    RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

export default function SanidadeView({ onReloadDashboard, triggerNewModal, onResetTrigger }) {
    const [sanidades, setSanidades] = useState([]);
    const [animais, setAnimais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

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
        status: 'pendente',
        observacoes: ''
    });
    const [isColetivo, setIsColetivo] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const queryParams = {
                status_filtro: filtroStatus || undefined,
                tipo: filtroTipo || undefined,
                data_inicio: dataInicio || undefined,
                data_fim: dataFim || undefined
            };

            const [sanData, animData] = await Promise.all([
                api.getSanidade(queryParams),
                api.getAnimais({ status: 'ativo' })
            ]);
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
    }, [filtroStatus, filtroTipo, dataInicio, dataFim]);

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
            animal_id: '',
            lote_ou_grupo: 'Todo o Rebanho',
            data_aplicacao: new Date().toISOString().split('T')[0],
            data_proxima_dose: '',
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
                lote_ou_grupo: isColetivo ? formData.lote_ou_grupo : null
            });
            setModalOpen(false);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleConcluir = async (id) => {
        try {
            await api.concluirSanidade(id);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao concluir dose: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja excluir este registro de sanidade?')) return;
        try {
            await api.deleteSanidade(id);
            loadData();
            if (onReloadDashboard) onReloadDashboard();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleClearFilters = () => {
        setFiltroStatus('');
        setFiltroTipo('');
        setDataInicio('');
        setDataFim('');
    };

    const currentSanidades = sanidades.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Filter Bar & Quick Stats */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Tabs */}
                    <button
                        onClick={() => setFiltroStatus('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            filtroStatus === '' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFiltroStatus('atrasada')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                            filtroStatus === 'atrasada' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-rose-400 hover:bg-rose-500/20'
                        }`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Atrasadas</span>
                    </button>
                    <button
                        onClick={() => setFiltroStatus('alerta_vencendo')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                            filtroStatus === 'alerta_vencendo' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-amber-400 hover:bg-amber-500/20'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Vence em 7 dias</span>
                    </button>
                    <button
                        onClick={() => setFiltroStatus('aplicada')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                            filtroStatus === 'aplicada' ? 'bg-slate-700 text-emerald-400' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluídas</span>
                    </button>

                    <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>

                    {/* Tipo Filter */}
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="vacina">Vacinas</option>
                        <option value="vermifugo">Vermífugos</option>
                        <option value="tratamento">Tratamentos</option>
                        <option value="outro">Outros</option>
                    </select>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                        <span className="text-slate-400 text-[11px]">De:</span>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="bg-transparent text-slate-200 focus:outline-none text-xs"
                        />
                        <span className="text-slate-400 text-[11px]">Até:</span>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="bg-transparent text-slate-200 focus:outline-none text-xs"
                        />
                    </div>

                    {(filtroStatus || filtroTipo || dataInicio || dataFim) && (
                        <button
                            onClick={handleClearFilters}
                            className="px-2.5 py-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                        >
                            Limpar
                        </button>
                    )}
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Lançar Vacina / Dose</span>
                </button>
            </div>

            {/* Sanidade Cards / Table */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700/60">
                            <tr>
                                <th className="px-5 py-3.5">Medicamento / Vacina</th>
                                <th className="px-4 py-3.5">Tipo</th>
                                <th className="px-4 py-3.5">Alvo / Rebanho</th>
                                <th className="px-4 py-3.5">Última Aplicação</th>
                                <th className="px-4 py-3.5">Próxima Dose</th>
                                <th className="px-4 py-3.5">Status Sanitário</th>
                                <th className="px-5 py-3.5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/40">
                            {currentSanidades.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-700/30 transition">
                                    <td className="px-5 py-3.5 font-bold text-slate-100">
                                        <div className="text-sm">{s.nome_produto}</div>
                                        {s.observacoes && (
                                            <div className="text-[11px] text-slate-400 font-normal">{s.observacoes}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 capitalize text-slate-300">
                                        {s.tipo}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-200 font-medium">
                                        {s.animal_brinco ? (
                                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                                                Brinco {s.animal_brinco} ({s.animal_categoria})
                                            </span>
                                        ) : (
                                            <span className="text-emerald-400 font-semibold">
                                                {s.lote_ou_grupo || 'Todo o Rebanho'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-300">
                                        {s.data_aplicacao}
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-slate-200">
                                        {s.data_proxima_dose || '-'}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        {s.computed_status === 'atrasada' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                                Atrasada
                                            </span>
                                        )}
                                        {s.computed_status === 'alerta_vencendo' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                <Clock className="w-3 h-3 text-amber-400" />
                                                Vence em 7 dias
                                            </span>
                                        )}
                                        {s.computed_status === 'pendente' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                Pendente
                                            </span>
                                        )}
                                        {s.computed_status === 'aplicada' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                Aplicada
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {s.status !== 'aplicada' && (
                                                <button
                                                    onClick={() => handleConcluir(s.id)}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition flex items-center gap-1"
                                                    title="Marcar dose como aplicada"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    <span>Aplicada</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                                title="Excluir Registro"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {loading && (
                        <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>Carregando dados sanitários...</span>
                        </div>
                    )}

                    {sanidades.length === 0 && !loading && (
                        <div className="py-16 text-center text-xs text-slate-500">
                            Nenhum registro sanitário cadastrado com os filtros selecionados.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="border-t border-slate-700/60 p-3 bg-slate-900/30">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={sanidades.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>

            {/* Modal: Novo Lançamento Sanitário */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">Cadastrar Vacinação / Sanidade</h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Tipo */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Aplicação *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['vacina', 'vermifugo', 'tratamento'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, tipo: t })}
                                            className={`py-2 rounded-xl border text-xs font-semibold capitalize transition ${
                                                formData.tipo === t
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nome do Produto / Vacina */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Medicamento / Vacina *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Vacina Aftosa Bivalente, Ivermectina 1%..."
                                    value={formData.nome_produto}
                                    onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Destino: Coletivo ou Animal Específico */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-300">Público / Alvo da Aplicação</label>
                                    <div className="flex items-center gap-2 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setIsColetivo(true)}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                                                isColetivo ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Lote / Rebanho
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsColetivo(false)}
                                            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                                                !isColetivo ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}
                                        >
                                            Animal Individual
                                        </button>
                                    </div>
                                </div>

                                {isColetivo ? (
                                    <input
                                        type="text"
                                        placeholder="Ex: Todo o Rebanho, Bezerrada 2026, Lote Piquete 1..."
                                        value={formData.lote_ou_grupo}
                                        onChange={(e) => setFormData({ ...formData, lote_ou_grupo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                ) : (
                                    <select
                                        required={!isColetivo}
                                        value={formData.animal_id}
                                        onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">Selecione o animal...</option>
                                        {animais.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                Brinco {a.identificacao} — {a.categoria} ({a.raca || 'S/ raça'})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Datas: Aplicação e Próxima Dose */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Data da Aplicação *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data_aplicacao}
                                        onChange={(e) => setFormData({ ...formData, data_aplicacao: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Próxima Dose / Reforço</label>
                                    <input
                                        type="date"
                                        value={formData.data_proxima_dose}
                                        onChange={(e) => setFormData({ ...formData, data_proxima_dose: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações / Dosagem</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Dose de 5ml subcutâneo, reforço semestral..."
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{saving ? 'Gravando...' : 'Salvar Registro'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
