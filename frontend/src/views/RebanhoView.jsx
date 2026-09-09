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
    RefreshCw,
    Scale,
    Calendar,
    Activity,
    ShieldAlert,
    TrendingUp,
    Clock,
    FileText,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

const CATEGORIAS = [
    { value: 'bezerro', label: 'Bezerro' },
    { value: 'bezerra', label: 'Bezerra' },
    { value: 'novilha', label: 'Novilha' },
    { value: 'novilho', label: 'Novilho' },
    { value: 'garrote', label: 'Garrote' },
    { value: 'vaca', label: 'Vaca / Matriz' },
    { value: 'touro', label: 'Touro / Reprodutor' },
    { value: 'boi_gordo', label: 'Boi Gordo' },
    { value: 'outro', label: 'Outro' }
];

export default function RebanhoView({ piquetes = [], onReloadPiquetes, triggerNewModal, onResetTrigger }) {
    const [animais, setAnimais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('ativo');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroPiquete, setFiltroPiquete] = useState('');
    const [filtroSexo, setFiltroSexo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal Cadastro / Edição Animal
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

    // Modal / Drawer Ficha Completa do Animal
    const [selectedAnimalId, setSelectedAnimalId] = useState(null);
    const [animalDetails, setAnimalDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeFichaTab, setActiveFichaTab] = useState('pesagens'); // 'pesagens' | 'movimentacoes' | 'sanidade'

    // Modal Nova Pesagem
    const [modalPesagemOpen, setModalPesagemOpen] = useState(false);
    const [pesagemAnimal, setPesagemAnimal] = useState(null);
    const [pesagemForm, setPesagemForm] = useState({
        data_pesagem: new Date().toISOString().split('T')[0],
        peso: '',
        observacoes: ''
    });
    const [savingPesagem, setSavingPesagem] = useState(false);
    const [errorPesagem, setErrorPesagem] = useState('');

    const loadAnimais = async () => {
        try {
            setLoading(true);
            const data = await api.getAnimais({
                status: filtroStatus,
                categoria: filtroCategoria,
                sexo: filtroSexo,
                piquete_id: filtroPiquete,
                busca: busca
            });
            setAnimais(data || []);
            setCurrentPage(1);
        } catch (err) {
            console.error('Erro ao buscar animais:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnimais();
    }, [filtroStatus, filtroCategoria, filtroSexo, filtroPiquete]);

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
            piquete_atual_id: '',
            peso_atual: '',
            observacoes: ''
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleOpenEdit = (animal, e) => {
        if (e) e.stopPropagation();
        setEditingAnimal(animal);
        setFormData({
            identificacao: animal.identificacao || '',
            sexo: animal.sexo || 'M',
            data_nascimento: animal.data_nascimento || '',
            raca: animal.raca || '',
            categoria: animal.categoria || 'garrote',
            status: animal.status || 'ativo',
            piquete_atual_id: animal.piquete_atual_id ? String(animal.piquete_atual_id) : '',
            peso_atual: animal.peso_atual !== null ? String(animal.peso_atual) : '',
            observacoes: animal.observacoes || ''
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSaveAnimal = async (e) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        try {
            if (!formData.identificacao.trim()) {
                throw new Error('Identificação (brinco) é obrigatória');
            }

            const payload = {
                ...formData,
                identificacao: formData.identificacao.trim().toUpperCase(),
                peso_atual: formData.peso_atual ? Number(formData.peso_atual) : null,
                piquete_atual_id: formData.piquete_atual_id ? Number(formData.piquete_atual_id) : null
            };

            if (editingAnimal) {
                await api.updateAnimal(editingAnimal.id, payload);
            } else {
                await api.createAnimal(payload);
            }

            setModalOpen(false);
            loadAnimais();
            if (onReloadPiquetes) onReloadPiquetes();
            if (selectedAnimalId && editingAnimal && selectedAnimalId === editingAnimal.id) {
                loadAnimalDetails(selectedAnimalId);
            }
        } catch (err) {
            setFormError(err.message || 'Erro ao salvar animal');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAnimal = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este animal e todo seu histórico?')) return;
        try {
            await api.deleteAnimal(id);
            loadAnimais();
            if (selectedAnimalId === id) setSelectedAnimalId(null);
            if (onReloadPiquetes) onReloadPiquetes();
        } catch (err) {
            alert(err.message || 'Erro ao excluir animal');
        }
    };

    // Detalhes da Ficha do Animal
    const loadAnimalDetails = async (id) => {
        try {
            setLoadingDetails(true);
            setSelectedAnimalId(id);
            const details = await api.getAnimalById(id);
            setAnimalDetails(details);
        } catch (err) {
            console.error('Erro ao carregar detalhes do animal:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Nova Pesagem
    const handleOpenPesagem = (animal, e) => {
        if (e) e.stopPropagation();
        setPesagemAnimal(animal);
        setPesagemForm({
            data_pesagem: new Date().toISOString().split('T')[0],
            peso: '',
            observacoes: ''
        });
        setErrorPesagem('');
        setModalPesagemOpen(true);
    };

    const handleSavePesagem = async (e) => {
        e.preventDefault();
        setErrorPesagem('');
        setSavingPesagem(true);

        try {
            if (!pesagemForm.peso || Number(pesagemForm.peso) <= 0) {
                throw new Error('Informe um peso válido maior que zero');
            }

            await api.createPesagem(pesagemAnimal.id, {
                data_pesagem: pesagemForm.data_pesagem,
                peso: Number(pesagemForm.peso),
                observacoes: pesagemForm.observacoes
            });

            setModalPesagemOpen(false);
            loadAnimais();
            if (selectedAnimalId === pesagemAnimal.id) {
                loadAnimalDetails(pesagemAnimal.id);
            }
        } catch (err) {
            setErrorPesagem(err.message || 'Erro ao registrar pesagem');
        } finally {
            setSavingPesagem(false);
        }
    };

    const handleDeletePesagem = async (pesagemId) => {
        if (!window.confirm('Deseja excluir este registro de pesagem?')) return;
        try {
            await api.deletePesagem(selectedAnimalId, pesagemId);
            loadAnimalDetails(selectedAnimalId);
            loadAnimais();
        } catch (err) {
            alert(err.message || 'Erro ao excluir pesagem');
        }
    };

    // Formatação de Idade
    const calcularIdade = (dataNasc) => {
        if (!dataNasc) return 'Não informada';
        const nasc = new Date(dataNasc);
        const hoje = new Date();
        let meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
        if (meses < 0) return 'Data futura';
        if (meses < 12) return `${meses} meses`;
        const anos = Math.floor(meses / 12);
        const restMeses = meses % 12;
        return restMeses > 0 ? `${anos}a ${restMeses}m` : `${anos} anos`;
    };

    const formatCategoriaLabel = (cat) => {
        const item = CATEGORIAS.find(c => c.value === cat);
        return item ? item.label : cat;
    };

    // Pagination slice
    const totalPages = Math.ceil(animais.length / itemsPerPage) || 1;
    const paginatedAnimais = animais.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Beef className="w-5 h-5 text-emerald-400" />
                        Rebanho & Manejo Individual
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Controle individual de brincos, pesagens com GMD, categorias e histórico sanitário.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpenNew}
                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Animal</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por brinco, raça..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <div>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Status</option>
                        <option value="ativo">Ativos na Fazenda</option>
                        <option value="vendido">Vendidos</option>
                        <option value="morto">Óbitos (Mortos)</option>
                    </select>
                </div>

                <div>
                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todas as Categorias</option>
                        {CATEGORIAS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <select
                        value={filtroPiquete}
                        onChange={(e) => setFiltroPiquete(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Todos os Piquetes / Pastos</option>
                        {piquetes.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <select
                        value={filtroSexo}
                        onChange={(e) => setFiltroSexo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">Ambos os Sexos</option>
                        <option value="M">Macho (M)</option>
                        <option value="F">Fêmea (F)</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                                <th className="p-4 pl-6">Brinco / Identificação</th>
                                <th className="p-4">Sexo / Idade</th>
                                <th className="p-4">Categoria & Raça</th>
                                <th className="p-4">Pasto Atual</th>
                                <th className="p-4">Peso Atual & GMD</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Carregando rebanho...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedAnimais.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-500">
                                        Nenhum animal encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAnimais.map((animal) => (
                                    <tr 
                                        key={animal.id} 
                                        onClick={() => loadAnimalDetails(animal.id)}
                                        className="hover:bg-slate-800/40 transition cursor-pointer group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                                                    <Tag className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition">
                                                        {animal.identificacao}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {animal.total_pesagens ? `${animal.total_pesagens} pesagem(ns)` : 'Cadastrado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    animal.sexo === 'M' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'
                                                }`}>
                                                    {animal.sexo === 'M' ? 'Macho' : 'Fêmea'}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {calcularIdade(animal.data_nascimento)}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-semibold text-slate-200">
                                                {formatCategoriaLabel(animal.categoria)}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                                {animal.raca || 'Nelore'}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            {animal.piquete_nome ? (
                                                <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                                                    {animal.piquete_nome}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 italic">Sem pasto alocado</span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-slate-100 flex items-baseline gap-1">
                                                <span>{animal.peso_atual ? `${animal.peso_atual} kg` : '-'}</span>
                                                {animal.ultimo_gmd > 0 && (
                                                    <span className="text-[10px] text-emerald-400 font-semibold">
                                                        (+{animal.ultimo_gmd} kg/d)
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                                animal.status === 'ativo' 
                                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                                    : animal.status === 'vendido' 
                                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' 
                                                    : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                            }`}>
                                                {animal.status === 'ativo' ? 'Ativo' : animal.status === 'vendido' ? 'Vendido' : 'Óbito'}
                                            </span>
                                        </td>

                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleOpenPesagem(animal, e)}
                                                    title="Registrar Pesagem"
                                                    className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-lg transition"
                                                >
                                                    <Scale className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleOpenEdit(animal, e)}
                                                    title="Editar Dados"
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteAnimal(animal.id, e)}
                                                    title="Excluir Animal"
                                                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition"
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

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={animais.length}
                    itemsPerPage={itemsPerPage}
                />
            </div>

            {/* Modal: Ficha Completa do Animal (Drawer / Modal) */}
            {selectedAnimalId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        {/* Header Ficha */}
                        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-extrabold text-lg">
                                    <Beef className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-white">
                                            Brinco {animalDetails?.identificacao || '...'}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            animalDetails?.status === 'ativo' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {animalDetails?.status?.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {formatCategoriaLabel(animalDetails?.categoria)} • {animalDetails?.raca || 'Nelore'} • Pasto: {animalDetails?.piquete_nome || 'Sem pasto'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenPesagem(animalDetails)}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Scale className="w-3.5 h-3.5" />
                                    <span>Nova Pesagem</span>
                                </button>
                                <button
                                    onClick={() => setSelectedAnimalId(null)}
                                    className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs Ficha */}
                        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
                            <button
                                onClick={() => setActiveFichaTab('pesagens')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                    activeFichaTab === 'pesagens' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Evolução de Peso & GMD ({animalDetails?.pesagens?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveFichaTab('movimentacoes')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                    activeFichaTab === 'movimentacoes' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Histórico de Pastos & Movimentações ({animalDetails?.movimentacoes?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveFichaTab('sanidade')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                    activeFichaTab === 'sanidade' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Sanidade & Vacinas ({animalDetails?.sanidade?.length || 0})</span>
                            </button>
                        </div>

                        {/* Content Area Ficha */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingDetails ? (
                                <div className="p-12 text-center text-slate-400">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <span>Carregando histórico do animal...</span>
                                </div>
                            ) : (
                                <>
                                    {/* ABA 1: PESAGENS & GMD */}
                                    {activeFichaTab === 'pesagens' && (
                                        <div className="space-y-4">
                                            {/* KPIs de Desempenho de Peso */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                                                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Peso Inicial</div>
                                                    <div className="text-lg font-extrabold text-white mt-0.5">
                                                        {animalDetails?.estatisticas_peso?.peso_inicial || '-'} kg
                                                    </div>
                                                </div>
                                                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                                                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Peso Atual</div>
                                                    <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                                                        {animalDetails?.estatisticas_peso?.peso_atual || '-'} kg
                                                    </div>
                                                </div>
                                                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                                                    <div className="text-[11px] text-slate-400 font-semibold uppercase">Ganho Total</div>
                                                    <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                                                        +{animalDetails?.estatisticas_peso?.ganho_total_kg || 0} kg
                                                    </div>
                                                </div>
                                                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                                                    <div className="text-[11px] text-slate-400 font-semibold uppercase">GMD Médio</div>
                                                    <div className="text-lg font-extrabold text-cyan-400 mt-0.5">
                                                        {animalDetails?.estatisticas_peso?.gmd_medio_kg_dia || 0} kg/dia
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tabela de Pesagens */}
                                            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/60">
                                                            <th className="p-3 pl-4">Data Pesagem</th>
                                                            <th className="p-3">Peso (kg)</th>
                                                            <th className="p-3">Ganho de Peso</th>
                                                            <th className="p-3">GMD (kg/dia)</th>
                                                            <th className="p-3">Observações</th>
                                                            <th className="p-3 pr-4 text-right">Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/40">
                                                        {animalDetails?.pesagens?.map((pes) => (
                                                            <tr key={pes.id} className="hover:bg-slate-800/30">
                                                                <td className="p-3 pl-4 font-semibold text-slate-200">{pes.data_pesagem}</td>
                                                                <td className="p-3 font-bold text-white">{pes.peso} kg</td>
                                                                <td className="p-3">
                                                                    <span className={pes.ganho_peso_kg > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                                                                        {pes.ganho_peso_kg > 0 ? `+${pes.ganho_peso_kg} kg` : (pes.ganho_peso_kg === 0 ? '-' : `${pes.ganho_peso_kg} kg`)}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 font-semibold text-cyan-400">
                                                                    {pes.gmd_kg_dia > 0 ? `+${pes.gmd_kg_dia} kg/d` : '-'}
                                                                </td>
                                                                <td className="p-3 text-slate-400">{pes.observacoes || '-'}</td>
                                                                <td className="p-3 pr-4 text-right">
                                                                    <button
                                                                        onClick={() => handleDeletePesagem(pes.id)}
                                                                        className="p-1 hover:text-rose-400 text-slate-500 transition"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!animalDetails?.pesagens || animalDetails.pesagens.length === 0) && (
                                                            <tr>
                                                                <td colSpan="6" className="p-6 text-center text-slate-500">
                                                                    Nenhuma pesagem registrada para este animal.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* ABA 2: HISTÓRICO DE MOVIMENTAÇÕES */}
                                    {activeFichaTab === 'movimentacoes' && (
                                        <div className="space-y-3">
                                            {animalDetails?.movimentacoes?.map((mov) => (
                                                <div key={mov.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                                mov.tipo === 'venda' ? 'bg-emerald-500/20 text-emerald-300' :
                                                                mov.tipo === 'compra' ? 'bg-blue-500/20 text-blue-300' :
                                                                mov.tipo === 'morte' ? 'bg-rose-500/20 text-rose-300' :
                                                                'bg-purple-500/20 text-purple-300'
                                                            }`}>
                                                                {mov.tipo}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-semibold">{mov.data}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-200 mt-1">
                                                            {mov.tipo === 'transferencia' ? (
                                                                <span>De <strong>{mov.piquete_origem_nome || 'Pasto'}</strong> para <strong>{mov.piquete_destino_nome || 'Pasto'}</strong></span>
                                                            ) : (
                                                                <span>{mov.observacao || 'Registro oficial de movimentação'}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {mov.valor > 0 && (
                                                        <div className="text-sm font-bold text-emerald-400">
                                                            R$ {mov.valor.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!animalDetails?.movimentacoes || animalDetails.movimentacoes.length === 0) && (
                                                <div className="p-8 text-center text-xs text-slate-500">
                                                    Nenhuma movimentação registrada.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ABA 3: SANIDADE */}
                                    {activeFichaTab === 'sanidade' && (
                                        <div className="space-y-3">
                                            {animalDetails?.sanidade?.map((san) => (
                                                <div key={san.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-xs text-slate-100">{san.nome_produto}</div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5">
                                                            Tipo: {san.tipo} • Aplicação: {san.data_aplicacao} {san.data_proxima_dose ? `• Próx. Dose: ${san.data_proxima_dose}` : ''}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        san.status === 'aplicada' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                    }`}>
                                                        {san.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!animalDetails?.sanidade || animalDetails.sanidade.length === 0) && (
                                                <div className="p-8 text-center text-xs text-slate-500">
                                                    Nenhum registro sanitário para este animal.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Cadastro / Edição Animal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">
                                {editingAnimal ? `Editar Animal — ${editingAnimal.identificacao}` : 'Novo Animal no Rebanho'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveAnimal} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Identificação / Brinco *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: BR-1050"
                                        value={formData.identificacao}
                                        onChange={(e) => setFormData({ ...formData, identificacao: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 uppercase focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Sexo *</label>
                                    <select
                                        value={formData.sexo}
                                        onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="M">Macho (M)</option>
                                        <option value="F">Fêmea (F)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoria *</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                    >
                                        {CATEGORIAS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Raça</label>
                                    <input
                                        type="text"
                                        placeholder="Nelore, Angus, Senepol..."
                                        value={formData.raca}
                                        onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={formData.data_nascimento}
                                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 340.5"
                                        value={formData.peso_atual}
                                        onChange={(e) => setFormData({ ...formData, peso_atual: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Pasto / Piquete Alocado</label>
                                    <select
                                        value={formData.piquete_atual_id}
                                        onChange={(e) => setFormData({ ...formData, piquete_atual_id: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">Sem pasto alocado</option>
                                        {piquetes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="vendido">Vendido</option>
                                        <option value="morto">Óbito (Morto)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Observações</label>
                                <textarea
                                    rows="2"
                                    placeholder="Filiação, matriz, histórico..."
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Animal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Nova Pesagem Rápida */}
            {modalPesagemOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Scale className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-base font-bold text-white">
                                    Registrar Pesagem — Brinco {pesagemAnimal?.identificacao}
                                </h3>
                            </div>
                            <button onClick={() => setModalPesagemOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorPesagem && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                                {errorPesagem}
                            </div>
                        )}

                        <form onSubmit={handleSavePesagem} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Data da Pesagem</label>
                                <input
                                    type="date"
                                    required
                                    value={pesagemForm.data_pesagem}
                                    onChange={(e) => setPesagemForm({ ...pesagemForm, data_pesagem: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Peso Aferido (kg) *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    placeholder="Ex: 480.0"
                                    value={pesagemForm.peso}
                                    onChange={(e) => setPesagemForm({ ...pesagemForm, peso: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                                {pesagemAnimal?.peso_atual && pesagemForm.peso && (
                                    <p className="text-[11px] text-emerald-400 mt-1">
                                        Ganho estimado: {(Number(pesagemForm.peso) - pesagemAnimal.peso_atual).toFixed(1)} kg
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Observações do Manejo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pós-desmame, pesagem balança digital..."
                                    value={pesagemForm.observacoes}
                                    onChange={(e) => setPesagemForm({ ...pesagemForm, observacoes: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalPesagemOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPesagem}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    {savingPesagem ? 'Salvando...' : 'Salvar Pesagem'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
