import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Beef, 
    Tag, 
    X, 
    Scale, 
    Activity, 
    ShieldAlert, 
    AlertCircle,
    ArrowLeft,
    Download,
    Upload,
    Printer,
    FileSpreadsheet,
    CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { exportToCSV } from '../utils/csvExporter';
import { printReport } from '../utils/reportPrinter';
import { parseCSVToAnimals, generateSampleCSV } from '../utils/batchImporter';

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

    // Modal Importação em Lote via Planilha CSV
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [batchText, setBatchText] = useState('');
    const [batchParsed, setBatchParsed] = useState([]);
    const [batchErrors, setBatchErrors] = useState([]);
    const [batchPiquetePadrao, setBatchPiquetePadrao] = useState('');
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
    const [batchResultMsg, setBatchResultMsg] = useState('');

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

    const handleExportCSV = () => {
        const columns = [
            { header: 'Brinco', accessor: (r) => r.identificacao },
            { header: 'Sexo', accessor: (r) => r.sexo === 'M' ? 'Macho' : 'Fêmea' },
            { header: 'Categoria', accessor: (r) => formatCategoriaLabel(r.categoria) },
            { header: 'Raça', accessor: (r) => r.raca || 'Nelore' },
            { header: 'Peso Atual (kg)', accessor: (r) => r.peso_atual ? Number(r.peso_atual).toFixed(1) : '-' },
            { header: 'Pasto / Piquete', accessor: (r) => r.piquete_nome || 'Sem Pasto' },
            { header: 'GMD Médio (kg/dia)', accessor: (r) => r.gmd_medio ? `${Number(r.gmd_medio).toFixed(2)}` : '-' },
            { header: 'Status', accessor: (r) => r.status },
            { header: 'Data Nascimento', accessor: (r) => r.data_nascimento || '' },
            { header: 'Observações', accessor: (r) => r.observacoes || '' }
        ];
        const filename = `relatorio_rebanho_${new Date().toISOString().split('T')[0]}`;
        exportToCSV(animais, columns, filename);
    };

    const handlePrintPDF = () => {
        const columns = [
            { key: 'identificacao', label: 'Brinco / Tag' },
            { key: 'sexo', label: 'Sexo', format: (val) => val === 'M' ? 'Macho' : 'Fêmea' },
            { key: 'categoria', label: 'Categoria', format: (val) => formatCategoriaLabel(val) },
            { key: 'raca', label: 'Raça' },
            { key: 'peso_atual', label: 'Peso Atual', align: 'right', format: (val) => val ? `${Number(val).toFixed(1)} kg` : '-' },
            { key: 'piquete_nome', label: 'Piquete', format: (val) => val || 'Sem Piquete' },
            { key: 'gmd_medio', label: 'GMD', align: 'right', format: (val) => val ? `${Number(val).toFixed(2)} kg/d` : '-' },
            { key: 'status', label: 'Status' }
        ];

        const totalAtivos = animais.filter(a => a.status === 'ativo').length;
        const totalMachos = animais.filter(a => a.status === 'ativo' && a.sexo === 'M').length;
        const totalFemeas = animais.filter(a => a.status === 'ativo' && a.sexo === 'F').length;
        const pesosValidos = animais.filter(a => a.status === 'ativo' && Number(a.peso_atual) > 0).map(a => Number(a.peso_atual));
        const mediaPeso = pesosValidos.length > 0 ? (pesosValidos.reduce((a, b) => a + b, 0) / pesosValidos.length).toFixed(1) : '0';

        const summaryCards = [
            { label: 'Total de Animais', value: String(animais.length), colorClass: 'text-blue' },
            { label: 'Ativos na Fazenda', value: String(totalAtivos), colorClass: 'text-green' },
            { label: 'Machos / Fêmeas', value: `${totalMachos}M / ${totalFemeas}F` },
            { label: 'Média de Peso', value: `${mediaPeso} kg` }
        ];

        printReport({
            title: 'Ficha Zootécnica & Manejo do Rebanho',
            subtitle: 'Inventário e Desempenho Ponderal do Efetivo Pecuário',
            summaryCards,
            columns,
            data: animais,
            notes: 'Relatório gerado automaticamente pelo Sistema AGRO - Fazenda GD.'
        });
    };

    const handleOpenBatchModal = () => {
        setBatchModalOpen(true);
        setBatchText('');
        setBatchParsed([]);
        setBatchErrors([]);
        setBatchResultMsg('');
        setBatchProgress({ current: 0, total: 0, success: 0, failed: 0 });
    };

    const handleBatchFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result;
            if (typeof content === 'string') {
                try {
                    const parsed = parseCSVToAnimals(content);
                    setBatchParsed(parsed.results);
                    setBatchErrors(parsed.errors);
                    setBatchText(content);
                } catch (err) {
                    alert('Erro ao ler planilha: ' + err.message);
                }
            }
        };
        reader.readAsText(file);
    };

    const handleExecuteBatchImport = async () => {
        if (batchParsed.length === 0) {
            alert('Nenhum animal válido identificado para importar.');
            return;
        }

        setBatchProcessing(true);
        setBatchResultMsg('');
        let success = 0;
        let failed = 0;

        for (let i = 0; i < batchParsed.length; i++) {
            const item = batchParsed[i];
            setBatchProgress({ current: i + 1, total: batchParsed.length, success, failed });
            try {
                await api.createAnimal({
                    identificacao: item.brinco,
                    sexo: item.sexo,
                    categoria: item.categoria,
                    raca: item.raca,
                    peso_atual: item.peso_atual || null,
                    data_nascimento: item.data_nascimento || null,
                    status: 'ativo',
                    piquete_atual_id: batchPiquetePadrao || null,
                    observacoes: item.observacoes
                });
                success++;
            } catch (err) {
                console.error(`Erro ao importar brinco ${item.brinco}:`, err);
                failed++;
            }
        }

        setBatchProcessing(false);
        setBatchProgress({ current: batchParsed.length, total: batchParsed.length, success, failed });
        setBatchResultMsg(`Importação finalizada: ${success} animais cadastrados com sucesso${failed > 0 ? `, ${failed} falhas/duplicados.` : '.'}`);
        loadAnimais();
        if (onReloadPiquetes) onReloadPiquetes();
    };

    // Pagination slice
    const totalPages = Math.ceil(animais.length / itemsPerPage) || 1;
    const paginatedAnimais = animais.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
                        <Beef className="w-5 h-5 text-[#087F5B]" strokeWidth={2} />
                        Rebanho & Manejo Individual
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                        Controle individual de brincos, pesagens com GMD, categorias e histórico sanitário.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handlePrintPDF}
                        disabled={animais.length === 0}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#172033] border border-[#E6EBE8] font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        title="Imprimir Ficha Zootécnica em PDF"
                    >
                        <Printer className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={2} />
                        <span>Imprimir PDF</span>
                    </button>

                    <button
                        onClick={handleExportCSV}
                        disabled={animais.length === 0}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#172033] border border-[#E6EBE8] font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                        title="Exportar Rebanho para Planilha CSV / Excel"
                    >
                        <Download className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={2} />
                        <span>Exportar CSV</span>
                    </button>

                    <button
                        onClick={handleOpenBatchModal}
                        className="px-3.5 py-2 bg-[#E8F5EF] hover:bg-[#D3EFE3] text-[#087F5B] border border-[#C3E6D6] font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        title="Importar múltiplos animais via Planilha CSV"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={2} />
                        <span>Importar Planilha</span>
                    </button>

                    <button
                        onClick={handleOpenNew}
                        className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        <span>Novo Animal</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-white border border-[#E6EBE8] rounded-2xl shadow-xs">
                <div className="relative">
                    <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por brinco, raça..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl pl-9 pr-3 py-2 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#087F5B]"
                    />
                </div>

                <div>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
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
                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
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
                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
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
                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                    >
                        <option value="">Ambos os Sexos</option>
                        <option value="M">Macho (M)</option>
                        <option value="F">Fêmea (F)</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#E6EBE8] text-[11px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F7F9F8]">
                                <th className="p-4 pl-6">Brinco / Identificação</th>
                                <th className="p-4">Sexo / Idade</th>
                                <th className="p-4">Categoria & Raça</th>
                                <th className="p-4">Pasto Atual</th>
                                <th className="p-4">Peso Atual & GMD</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6EBE8] text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-[#64748B]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin"></div>
                                            <span>Carregando rebanho...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedAnimais.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-[#64748B]">
                                        Nenhum animal encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAnimais.map((animal) => (
                                    <tr 
                                        key={animal.id} 
                                        onClick={() => loadAnimalDetails(animal.id)}
                                        className="hover:bg-[#F7F9F8] transition cursor-pointer group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B] font-bold">
                                                    <Tag className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-[#172033] group-hover:text-[#087F5B] transition">
                                                        {animal.identificacao}
                                                    </div>
                                                    <div className="text-[11px] text-[#94A3B8]">
                                                        {animal.total_pesagens ? `${animal.total_pesagens} pesagem(ns)` : 'Cadastrado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-medium text-[#172033]">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    animal.sexo === 'M' ? 'bg-[#EFF6FF] text-[#3978C7]' : 'bg-[#FAF5FF] text-[#D946EF]'
                                                }`}>
                                                    {animal.sexo === 'M' ? 'Macho' : 'Fêmea'}
                                                </span>
                                                <span className="text-[11px] text-[#64748B]">
                                                    {calcularIdade(animal.data_nascimento)}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-semibold text-[#172033]">
                                                {formatCategoriaLabel(animal.categoria)}
                                            </div>
                                            <div className="text-[11px] text-[#64748B]">
                                                {animal.raca || 'Nelore'}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            {animal.piquete_nome ? (
                                                <span className="px-2 py-1 rounded-lg bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8] font-medium">
                                                    {animal.piquete_nome}
                                                </span>
                                            ) : (
                                                <span className="text-[#94A3B8] italic">Sem pasto alocado</span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <div className="font-semibold text-[#172033] flex items-center gap-1.5 flex-wrap">
                                                <span>{animal.peso_atual ? `${animal.peso_atual} kg` : '-'}</span>
                                                {animal.ultimo_gmd !== null && animal.ultimo_gmd !== undefined && animal.total_pesagens > 1 ? (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                        animal.ultimo_gmd > 0 
                                                            ? 'bg-[#E8F5EF] text-[#087F5B]' 
                                                            : animal.ultimo_gmd < 0 
                                                            ? 'bg-[#FEF2F2] text-[#D64545]' 
                                                            : 'bg-[#F1F5F9] text-[#64748B]'
                                                    }`}>
                                                        {animal.ultimo_gmd > 0 ? `+${animal.ultimo_gmd}` : animal.ultimo_gmd} kg/d
                                                    </span>
                                                ) : animal.total_pesagens === 1 ? (
                                                    <span className="text-[10px] text-[#94A3B8] font-medium">(Base)</span>
                                                ) : null}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                animal.status === 'ativo' 
                                                    ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' 
                                                    : animal.status === 'vendido' 
                                                    ? 'bg-[#EFF6FF] text-[#3978C7] border-[#DBEAFE]' 
                                                    : 'bg-[#FEF2F2] text-[#D64545] border-[#FACDCD]'
                                            }`}>
                                                {animal.status === 'ativo' ? 'Ativo' : animal.status === 'vendido' ? 'Vendido' : 'Óbito'}
                                            </span>
                                        </td>

                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleOpenPesagem(animal, e)}
                                                    title="Registrar Pesagem"
                                                    className="p-1.5 bg-[#F7F9F8] hover:bg-[#E8F5EF] text-[#64748B] hover:text-[#087F5B] border border-[#E6EBE8] rounded-lg transition cursor-pointer"
                                                >
                                                    <Scale className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleOpenEdit(animal, e)}
                                                    title="Editar Dados"
                                                    className="p-1.5 bg-[#F7F9F8] hover:bg-[#E8F5EF] text-[#64748B] hover:text-[#087F5B] border border-[#E6EBE8] rounded-lg transition cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteAnimal(animal.id, e)}
                                                    title="Excluir Animal"
                                                    className="p-1.5 bg-[#F7F9F8] hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#D64545] border border-[#E6EBE8] rounded-lg transition cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl flex flex-col">
                        {/* Header Ficha */}
                        <div className="p-6 bg-white border-b border-[#E6EBE8] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B] font-extrabold text-lg">
                                    <Beef className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-[#172033]">
                                            Brinco {animalDetails?.identificacao || '...'}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            animalDetails?.status === 'ativo' ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' : 'bg-[#F1F5F9] text-[#64748B]'
                                        }`}>
                                            {animalDetails?.status?.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#64748B]">
                                        {formatCategoriaLabel(animalDetails?.categoria)} • {animalDetails?.raca || 'Nelore'} • Pasto: {animalDetails?.piquete_nome || 'Sem pasto'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenPesagem(animalDetails)}
                                    className="px-3 py-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Scale className="w-3.5 h-3.5" />
                                    <span>Nova Pesagem</span>
                                </button>
                                <button
                                    onClick={() => setSelectedAnimalId(null)}
                                    className="p-2 text-[#64748B] hover:text-[#172033] rounded-xl bg-[#F7F9F8] hover:bg-[#E8F5EF] transition cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs Ficha */}
                        <div className="flex border-b border-[#E6EBE8] px-6 bg-[#F7F9F8]">
                            <button
                                onClick={() => setActiveFichaTab('pesagens')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                    activeFichaTab === 'pesagens' ? 'border-[#087F5B] text-[#087F5B]' : 'border-transparent text-[#64748B] hover:text-[#172033]'
                                }`}
                            >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Evolução de Peso & GMD ({animalDetails?.pesagens?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveFichaTab('movimentacoes')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                    activeFichaTab === 'movimentacoes' ? 'border-[#087F5B] text-[#087F5B]' : 'border-transparent text-[#64748B] hover:text-[#172033]'
                                }`}
                            >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Histórico de Pastos ({animalDetails?.movimentacoes?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveFichaTab('sanidade')}
                                className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                                    activeFichaTab === 'sanidade' ? 'border-[#087F5B] text-[#087F5B]' : 'border-transparent text-[#64748B] hover:text-[#172033]'
                                }`}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Sanidade & Vacinas ({animalDetails?.sanidade?.length || 0})</span>
                            </button>
                        </div>

                        {/* Content Area Ficha */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loadingDetails ? (
                                <div className="p-12 text-center text-[#64748B]">
                                    <div className="w-6 h-6 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <span>Carregando histórico do animal...</span>
                                </div>
                            ) : (
                                <>
                                    {/* ABA 1: PESAGENS & GMD */}
                                    {activeFichaTab === 'pesagens' && (
                                        <div className="space-y-4">
                                            {/* KPIs de Desempenho de Peso */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="p-3.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl">
                                                    <div className="text-[11px] text-[#64748B] font-semibold uppercase">Peso Inicial</div>
                                                    <div className="text-lg font-bold text-[#172033] mt-0.5">
                                                        {animalDetails?.estatisticas_peso?.peso_inicial || '-'} kg
                                                    </div>
                                                </div>
                                                <div className="p-3.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl">
                                                    <div className="text-[11px] text-[#64748B] font-semibold uppercase">Peso Atual</div>
                                                    <div className="text-lg font-bold text-[#087F5B] mt-0.5">
                                                        {animalDetails?.estatisticas_peso?.peso_atual || '-'} kg
                                                    </div>
                                                </div>
                                                <div className="p-3.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl">
                                                    <div className="text-[11px] text-[#64748B] font-semibold uppercase">Ganho Total</div>
                                                    <div className="text-lg font-bold text-[#087F5B] mt-0.5">
                                                        +{animalDetails?.estatisticas_peso?.ganho_total_kg || 0} kg
                                                    </div>
                                                </div>
                                                <div className="p-3.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl">
                                                    <div className="text-[11px] text-[#64748B] font-semibold uppercase">GMD Médio</div>
                                                    <div className="text-lg font-bold text-[#3978C7] mt-0.5">
                                                        {animalDetails?.estatisticas_peso?.gmd_medio_kg_dia || 0} kg/dia
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tabela de Pesagens */}
                                            <div className="bg-white border border-[#E6EBE8] rounded-xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#E6EBE8] text-[#64748B] font-bold bg-[#F7F9F8]">
                                                            <th className="p-3 pl-4">Data Pesagem</th>
                                                            <th className="p-3">Peso (kg)</th>
                                                            <th className="p-3">Ganho de Peso</th>
                                                            <th className="p-3">GMD (kg/dia)</th>
                                                            <th className="p-3">Observações</th>
                                                            <th className="p-3 pr-4 text-right">Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#E6EBE8]">
                                                        {animalDetails?.pesagens?.map((pes) => (
                                                             <tr key={pes.id} className="hover:bg-[#F7F9F8]">
                                                                <td className="p-3 pl-4 font-semibold text-[#172033]">{pes.data_pesagem}</td>
                                                                <td className="p-3 font-bold text-[#172033]">{pes.peso} kg</td>
                                                                <td className="p-3">
                                                                    <span className={pes.ganho_peso_kg > 0 ? 'text-[#087F5B] font-semibold' : 'text-[#64748B]'}>
                                                                        {pes.ganho_peso_kg > 0 ? `+${pes.ganho_peso_kg} kg` : (pes.ganho_peso_kg === 0 ? '-' : `${pes.ganho_peso_kg} kg`)}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 font-semibold text-[#3978C7]">
                                                                    {pes.gmd_kg_dia > 0 ? `+${pes.gmd_kg_dia} kg/d` : '-'}
                                                                </td>
                                                                <td className="p-3 text-[#64748B]">{pes.observacoes || '-'}</td>
                                                                <td className="p-3 pr-4 text-right">
                                                                    <button
                                                                        onClick={() => handleDeletePesagem(pes.id)}
                                                                        className="p-1 hover:text-[#D64545] text-[#94A3B8] transition cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!animalDetails?.pesagens || animalDetails.pesagens.length === 0) && (
                                                            <tr>
                                                                <td colSpan="6" className="p-6 text-center text-[#64748B]">
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
                                                <div key={mov.id} className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8] flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                mov.tipo === 'venda' ? 'bg-[#E8F5EF] text-[#087F5B]' :
                                                                mov.tipo === 'compra' ? 'bg-[#EFF6FF] text-[#3978C7]' :
                                                                mov.tipo === 'morte' ? 'bg-[#FEF2F2] text-[#D64545]' :
                                                                'bg-[#FAF5FF] text-[#9333EA]'
                                                            }`}>
                                                                {mov.tipo}
                                                            </span>
                                                            <span className="text-xs text-[#64748B] font-semibold">{mov.data}</span>
                                                        </div>
                                                        <div className="text-xs text-[#172033] mt-1">
                                                            {mov.tipo === 'transferencia' ? (
                                                                <span>De <strong>{mov.piquete_origem_nome || 'Pasto'}</strong> para <strong>{mov.piquete_destino_nome || 'Pasto'}</strong></span>
                                                            ) : (
                                                                <span>{mov.observacao || 'Registro oficial de movimentação'}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {mov.valor > 0 && (
                                                        <div className="text-sm font-bold text-[#087F5B]">
                                                            R$ {mov.valor.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!animalDetails?.movimentacoes || animalDetails.movimentacoes.length === 0) && (
                                                <div className="p-8 text-center text-xs text-[#64748B]">
                                                    Nenhuma movimentação registrada.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ABA 3: SANIDADE */}
                                    {activeFichaTab === 'sanidade' && (
                                        <div className="space-y-3">
                                            {animalDetails?.sanidade?.map((san) => (
                                                <div key={san.id} className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8] flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-xs text-[#172033]">{san.nome_produto}</div>
                                                        <div className="text-[11px] text-[#64748B] mt-0.5">
                                                            Tipo: {san.tipo} • Aplicação: {san.data_aplicacao} {san.data_proxima_dose ? `• Próx. Dose: ${san.data_proxima_dose}` : ''}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        san.status === 'aplicada' ? 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' : 'bg-[#FEF9E7] text-[#D99A22] border-[#FDE8B3]'
                                                    }`}>
                                                        {san.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!animalDetails?.sanidade || animalDetails.sanidade.length === 0) && (
                                                <div className="p-8 text-center text-xs text-[#64748B]">
                                                    Nenhum registro sanitário para este animal.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Ficha */}
                        <div className="p-4 bg-[#F7F9F8] border-t border-[#E6EBE8] flex items-center justify-between">
                            <button
                                onClick={() => setSelectedAnimalId(null)}
                                className="px-4 py-2 bg-white hover:bg-[#E8F5EF] text-[#172033] hover:text-[#087F5B] border border-[#E6EBE8] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Voltar ao Rebanho</span>
                            </button>
                            <button
                                onClick={() => handleOpenPesagem(animalDetails)}
                                className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Scale className="w-3.5 h-3.5" />
                                <span>Registrar Nova Pesagem</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Cadastro / Edição Animal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-lg bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    title="Voltar / Cancelar"
                                    className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <h3 className="text-base font-bold text-[#172033]">
                                    {editingAnimal ? `Editar Animal — ${editingAnimal.identificacao}` : 'Novo Animal no Rebanho'}
                                </h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveAnimal} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Identificação / Brinco *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: BR-1050"
                                        value={formData.identificacao}
                                        onChange={(e) => setFormData({ ...formData, identificacao: e.target.value.toUpperCase() })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] uppercase focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Sexo *</label>
                                    <select
                                        value={formData.sexo}
                                        onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="M">Macho (M)</option>
                                        <option value="F">Fêmea (F)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Categoria *</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        {CATEGORIAS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Raça</label>
                                    <input
                                        type="text"
                                        placeholder="Nelore, Angus, Senepol..."
                                        value={formData.raca}
                                        onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={formData.data_nascimento}
                                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Ex: 340.5"
                                        value={formData.peso_atual}
                                        onChange={(e) => setFormData({ ...formData, peso_atual: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Pasto / Piquete Alocado</label>
                                    <select
                                        value={formData.piquete_atual_id}
                                        onChange={(e) => setFormData({ ...formData, piquete_atual_id: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="">Sem pasto alocado</option>
                                        {piquetes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#172033] mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="vendido">Vendido</option>
                                        <option value="morto">Óbito (Morto)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Observações</label>
                                <textarea
                                    rows="2"
                                    placeholder="Filiação, matriz, histórico..."
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] border border-[#E6EBE8] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Voltar / Cancelar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="w-full max-w-md bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalPesagemOpen(false)}
                                    title="Voltar / Cancelar"
                                    className="p-1 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <Scale className="w-5 h-5 text-[#087F5B]" />
                                <h3 className="text-base font-bold text-[#172033]">
                                    Registrar Pesagem — Brinco {pesagemAnimal?.identificacao}
                                </h3>
                            </div>
                            <button onClick={() => setModalPesagemOpen(false)} className="text-[#64748B] hover:text-[#172033] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorPesagem && (
                            <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] rounded-xl text-xs">
                                {errorPesagem}
                            </div>
                        )}

                        <form onSubmit={handleSavePesagem} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Data da Pesagem</label>
                                <input
                                    type="date"
                                    required
                                    value={pesagemForm.data_pesagem}
                                    onChange={(e) => setPesagemForm({ ...pesagemForm, data_pesagem: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Peso Aferido (kg) *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    placeholder="Ex: 480.0"
                                    value={pesagemForm.peso}
                                    onChange={(e) => setPesagemForm({ ...pesagemForm, peso: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                                {pesagemAnimal?.peso_atual && pesagemForm.peso && (
                                    <p className="text-[11px] text-[#087F5B] font-semibold mt-1">
                                        Ganho estimado: {(Number(pesagemForm.peso) - pesagemAnimal.peso_atual).toFixed(1)} kg
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">Observações do Manejo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pós-desmame, pesagem balança digital..."
                                    value={pesagemForm.observacoes}
                                    onChange={(e) => setPesagemForm({ ...pesagemForm, observacoes: e.target.value })}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalPesagemOpen(false)}
                                    className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] border border-[#E6EBE8] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Voltar / Cancelar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPesagem}
                                    className="px-4 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                                >
                                    {savingPesagem ? 'Salvando...' : 'Salvar Pesagem'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Importação em Lote CSV / Planilha */}
            {batchModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E6EBE8] animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center pb-4 border-b border-[#E6EBE8]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-[#E8F5EF] text-[#087F5B] flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#172033]">Importação em Lote via Planilha CSV</h3>
                                    <p className="text-xs text-[#64748B]">Cadastre centenas de animais em segundos a partir de arquivos CSV/Excel.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setBatchModalOpen(false)} 
                                disabled={batchProcessing}
                                className="text-[#64748B] hover:text-[#172033] cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
                            {/* Download Modelo CSV */}
                            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-between gap-3">
                                <div>
                                    <h4 className="text-xs font-bold text-[#0F172A]">Não tem a planilha no modelo?</h4>
                                    <p className="text-[11px] text-[#64748B]">Baixe nosso arquivo modelo com cabeçalhos prontos para preencher.</p>
                                </div>
                                <button
                                    onClick={generateSampleCSV}
                                    type="button"
                                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#087F5B] border border-[#C3E6D6] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Baixar Modelo CSV</span>
                                </button>
                            </div>

                            {/* Piquete Destino Padrão */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                                    Piquete / Pasto de Destino (Opcional):
                                </label>
                                <select
                                    value={batchPiquetePadrao}
                                    onChange={(e) => setBatchPiquetePadrao(e.target.value)}
                                    disabled={batchProcessing}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                >
                                    <option value="">Nenhum piquete (manter sem alocação inicial)</option>
                                    {piquetes.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome} (Capacidade: {p.capacidade_suporte || '-'} cab)</option>
                                    ))}
                                </select>
                            </div>

                            {/* Upload Area */}
                            <div>
                                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                                    Selecione o arquivo CSV (.csv):
                                </label>
                                <input
                                    type="file"
                                    accept=".csv,text/csv,text/plain"
                                    onChange={handleBatchFileChange}
                                    disabled={batchProcessing}
                                    className="w-full text-xs text-[#64748B] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E8F5EF] file:text-[#087F5B] hover:file:bg-[#D3EFE3] cursor-pointer"
                                />
                            </div>

                            {/* Erros / Avisos de Validação */}
                            {batchErrors.length > 0 && (
                                <div className="p-3 bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545] rounded-xl text-xs space-y-1">
                                    <div className="font-bold flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Linhas com aviso ({batchErrors.length}):</span>
                                    </div>
                                    <ul className="list-disc pl-4 text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                                        {batchErrors.map((err, idx) => (
                                            <li key={idx}>Linha {err.line}: {err.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Prévia da Importação */}
                            {batchParsed.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-[#087F5B]" />
                                            Prévia: <strong>{batchParsed.length}</strong> animais prontos para importar
                                        </h4>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-[#E6EBE8] rounded-xl">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-[#F7F9F8] text-[#64748B] font-semibold border-b border-[#E6EBE8] sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2">Brinco</th>
                                                    <th className="px-3 py-2">Sexo</th>
                                                    <th className="px-3 py-2">Categoria</th>
                                                    <th className="px-3 py-2">Raça</th>
                                                    <th className="px-3 py-2 text-right">Peso (kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E6EBE8]">
                                                {batchParsed.slice(0, 50).map((a, idx) => (
                                                    <tr key={idx} className="hover:bg-[#F8FAFC]">
                                                        <td className="px-3 py-1.5 font-bold text-[#172033]">{a.brinco}</td>
                                                        <td className="px-3 py-1.5">{a.sexo === 'M' ? 'Macho' : 'Fêmea'}</td>
                                                        <td className="px-3 py-1.5">{a.categoria}</td>
                                                        <td className="px-3 py-1.5">{a.raca}</td>
                                                        <td className="px-3 py-1.5 text-right font-medium">{a.peso_atual || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {batchParsed.length > 50 && (
                                            <div className="p-2 text-center text-[11px] text-[#64748B] bg-[#F8FAFC] border-t border-[#E6EBE8]">
                                                ...e mais {batchParsed.length - 50} animais
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Barra de Progresso durante processamento */}
                            {batchProcessing && (
                                <div className="space-y-2 p-3 bg-[#E8F5EF] border border-[#C3E6D6] rounded-2xl">
                                    <div className="flex justify-between text-xs font-bold text-[#087F5B]">
                                        <span>Importando animais...</span>
                                        <span>{batchProgress.current} de {batchProgress.total}</span>
                                    </div>
                                    <div className="w-full bg-[#C3E6D6] h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-[#087F5B] h-full transition-all duration-150"
                                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Mensagem de Resultado */}
                            {batchResultMsg && (
                                <div className="p-3 bg-[#E8F5EF] border border-[#C3E6D6] text-[#087F5B] rounded-xl text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                    <span>{batchResultMsg}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-[#E6EBE8] flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setBatchModalOpen(false)}
                                disabled={batchProcessing}
                                className="px-4 py-2 bg-[#F7F9F8] hover:bg-[#E6EBE8] text-[#172033] border border-[#E6EBE8] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>{batchResultMsg ? 'Fechar' : 'Voltar / Cancelar'}</span>
                            </button>

                            {batchParsed.length > 0 && !batchResultMsg && (
                                <button
                                    type="button"
                                    onClick={handleExecuteBatchImport}
                                    disabled={batchProcessing}
                                    className="px-5 py-2 bg-[#087F5B] hover:bg-[#159A70] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>{batchProcessing ? 'Importando...' : `Confirmar Importação (${batchParsed.length} animais)`}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
