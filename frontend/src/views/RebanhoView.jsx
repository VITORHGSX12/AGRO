import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Filter, 
    Edit, 
    Trash2, 
    Beef, 
    Tag, 
    ArrowRight,
    X,
    Check,
    RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

const CATEGORIAS = [
    { value: 'bezerro', label: 'Bezerro' },
    { value: 'bezerra', label: 'Bezerra' },
    { value: 'novilha', label: 'Novilha' },
    { value: 'novilho', label: 'Novilho' },
    { value: 'garrote', label: 'Garrote' },
    { value: 'vaca', label: 'Vaca' },
    { value: 'touro', label: 'Touro' },
    { value: 'boi_gordo', label: 'Boi Gordo' },
    { value: 'outro', label: 'Outro' }
];

export default function RebanhoView({ piquetes, onReloadPiquetes, triggerNewModal, onResetTrigger }) {
    const [animais, setAnimais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('ativo');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroPiquete, setFiltroPiquete] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [formData, setFormData] = useState({
        identificacao: '',
        sexo: 'M',
        data_nascimento: '',
        raca: '',
        categoria: 'garrote',
        status: 'ativo',
        piquete_atual_id: '',
        peso_atual: '',
        observacoes: ''
    });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const loadAnimais = async () => {
        try {
            setLoading(true);
            const data = await api.getAnimais({
                status: filtroStatus,
                categoria: filtroCategoria,
                piquete_id: filtroPiquete,
                busca: busca
            });
            setAnimais(data);
            setCurrentPage(1);
        } catch (err) {
            console.error('Erro ao buscar animais:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnimais();
    }, [filtroStatus, filtroCategoria, filtroPiquete]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadAnimais();
        }, 300);
        return () => clearTimeout(timeout);
    }, [busca]);

    // Triggers from Header
    useEffect(() => {
        if (triggerNewModal) {
            handleOpenNew();
            onResetTrigger();
        }
    }, [triggerNewModal]);

    const handleOpenNew = () => {
        setEditingAnimal(null);
        setFormData({
            identificacao: '',
            sexo: 'M',
            data_nascimento: '',
            raca: '',
            categoria: 'garrote',
            status: 'ativo',
            piquete_atual_id: piquetes.length > 0 ? String(piquetes[0].id) : '',
            peso_atual: '',
            observacoes: ''
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleOpenEdit = (animal) => {
        setEditingAnimal(animal);
        setFormData({
            identificacao: animal.identificacao,
            sexo: animal.sexo,
            data_nascimento: animal.data_nascimento || '',
            raca: animal.raca || '',
            categoria: animal.categoria,
            status: animal.status,
            piquete_atual_id: animal.piquete_atual_id ? String(animal.piquete_atual_id) : '',
            peso_atual: animal.peso_atual !== null ? String(animal.peso_atual) : '',
            observacoes: animal.observacoes || ''
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const payload = {
                ...formData,
                piquete_atual_id: formData.piquete_atual_id ? Number(formData.piquete_atual_id) : null,
                peso_atual: formData.peso_atual ? Number(formData.peso_atual) : null
            };

            if (editingAnimal) {
                await api.updateAnimal(editingAnimal.id, payload);
            } else {
                await api.createAnimal(payload);
            }

            setModalOpen(false);
            loadAnimais();
            if (onReloadPiquetes) onReloadPiquetes();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, brinco) => {
        if (!confirm(`Tem certeza que deseja excluir o animal brinco "${brinco}"?`)) return;
        try {
            await api.deleteAnimal(id);
            loadAnimais();
            if (onReloadPiquetes) onReloadPiquetes();
        } catch (err) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por brinco, raça ou obs..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Status</option>
                        <option value="ativo">Somente Ativos</option>
                        <option value="vendido">Vendidos</option>
                        <option value="morto">Mortos / Óbito</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todas Categorias</option>
                        {CATEGORIAS.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>

                    {/* Pasture Filter */}
                    <select
                        value={filtroPiquete}
                        onChange={(e) => setFiltroPiquete(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Piquetes</option>
                        {piquetes.map((piq) => (
                            <option key={piq.id} value={piq.id}>{piq.nome}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Animal</span>
                </button>
            </div>

            {/* Animals Table */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-700/60">
                            <tr>
                                <th className="px-5 py-3.5">Brinco / Identificação</th>
                                <th className="px-4 py-3.5">Categoria</th>
                                <th className="px-4 py-3.5">Sexo</th>
                                <th className="px-4 py-3.5">Raça</th>
                                <th className="px-4 py-3.5">Pasto Atual</th>
                                <th className="px-4 py-3.5">Peso Atual</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/40">
                            {animais
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((animal) => (
                                <tr key={animal.id} className="hover:bg-slate-700/30 transition">
                                    <td className="px-5 py-3.5 font-bold text-slate-100 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xs">
                                            {animal.identificacao.slice(0, 2)}
                                        </div>
                                        <span>{animal.identificacao}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-300 capitalize">
                                        {animal.categoria.replace('_', ' ')}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                            animal.sexo === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                                        }`}>
                                            {animal.sexo === 'M' ? 'Macho' : 'Fêmea'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-400">
                                        {animal.raca || '-'}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-300 font-medium">
                                        {animal.piquete_nome ? (
                                            <span className="flex items-center gap-1.5 text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                {animal.piquete_nome}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">Sem pasto</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-300">
                                        {animal.peso_atual ? `${animal.peso_atual} kg` : '-'}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                            animal.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                            animal.status === 'vendido' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                        }`}>
                                            {animal.status === 'ativo' ? 'Ativo' : animal.status === 'vendido' ? 'Vendido' : 'Morto'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(animal)}
                                                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-300 hover:text-white transition"
                                                title="Editar Animal"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(animal.id, animal.identificacao)}
                                                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                                title="Excluir Animal"
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
                            <span>Carregando rebanho...</span>
                        </div>
                    )}

                    {animais.length === 0 && !loading && (
                        <div className="py-12 text-center text-xs text-slate-500">
                            Nenhum animal encontrado com os filtros selecionados.
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="border-t border-slate-700/60 p-3 bg-slate-900/30">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={animais.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>

            {/* Modal: Cadastro / Edição de Animal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Beef className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-bold text-sm text-white">
                                    {editingAnimal ? `Editar Animal — ${editingAnimal.identificacao}` : 'Cadastrar Novo Animal'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Brinco / Identificação *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: BR-1009"
                                        value={formData.identificacao}
                                        onChange={(e) => setFormData({ ...formData, identificacao: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sexo *</label>
                                    <select
                                        value={formData.sexo}
                                        onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="M">Macho</option>
                                        <option value="F">Fêmea</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria *</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {CATEGORIAS.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Raça</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Nelore, Angus, Senepol"
                                        value={formData.raca}
                                        onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Pasto / Piquete</label>
                                    <select
                                        value={formData.piquete_atual_id}
                                        onChange={(e) => setFormData({ ...formData, piquete_atual_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">Sem pasto</option>
                                        {piquetes.map((piq) => (
                                            <option key={piq.id} value={piq.id}>{piq.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 450"
                                        value={formData.peso_atual}
                                        onChange={(e) => setFormData({ ...formData, peso_atual: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="vendido">Vendido</option>
                                        <option value="morto">Morto</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Nascimento (estimada)</label>
                                <input
                                    type="date"
                                    value={formData.data_nascimento}
                                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                                <textarea
                                    rows="2"
                                    placeholder="Ex: Filiação, vacinas especiais, temperamento..."
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
                                    <span>{saving ? 'Salvando...' : 'Salvar Animal'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
