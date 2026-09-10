import React, { useState, useEffect } from 'react';
import { 
    ArrowLeftRight, 
    ShoppingCart, 
    DollarSign, 
    Skull, 
    History,
    Check,
    AlertCircle,
    Info,
    RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import Pagination from '../components/Pagination';

export default function MovimentacoesView({ piquetes, onReloadAll, triggerNewModal, onResetTrigger }) {
    const [animais, setAnimais] = useState([]);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filtroTipo, setFiltroTipo] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form states
    const [tipo, setTipo] = useState('transferencia');
    const [animalId, setAnimalId] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [valor, setValor] = useState('');
    const [piqueteDestinoId, setPiqueteDestinoId] = useState('');
    const [observacao, setObservacao] = useState('');
    const [gerarFinanceiro, setGerarFinanceiro] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const queryParams = {
                tipo: filtroTipo || undefined,
                data_inicio: dataInicio || undefined,
                data_fim: dataFim || undefined
            };

            const [animaisData, movsData] = await Promise.all([
                api.getAnimais({ status: 'ativo' }),
                api.getMovimentacoes(queryParams)
            ]);
            setAnimais(animaisData);
            setMovimentacoes(movsData);
            if (animaisData.length > 0 && !animalId) {
                setAnimalId(String(animaisData[0].id));
            }
            setCurrentPage(1);
        } catch (err) {
            console.error('Erro ao carregar dados de movimentações:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filtroTipo, dataInicio, dataFim]);

    const selectedAnimal = animais.find(a => String(a.id) === String(animalId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFeedback(null);

        try {
            await api.createMovimentacao({
                animal_id: Number(animalId),
                tipo,
                data,
                valor: (tipo === 'venda' || tipo === 'compra') && valor ? Number(valor) : 0,
                piquete_destino_id: (tipo === 'transferencia' || (tipo === 'compra' && piqueteDestinoId)) ? Number(piqueteDestinoId) : null,
                observacao,
                gerar_lancamento_financeiro: gerarFinanceiro
            });

            setFeedback({ type: 'success', text: `Movimentação de ${tipo.toUpperCase()} registrada com sucesso!` });
            
            // Limpa campos
            setValor('');
            setObservacao('');
            
            loadData();
            if (onReloadAll) onReloadAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearFilters = () => {
        setFiltroTipo('');
        setDataInicio('');
        setDataFim('');
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const currentMovimentacoes = movimentacoes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Quick Movement Action Form */}
            <div className="lg:col-span-1 saas-card-static p-6 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                            <ArrowLeftRight className="w-4 h-4" strokeWidth={2} />
                        </div>
                        <h2 className="font-bold text-base text-[#172033]">Registrar Movimentação</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Tipo de Movimentação Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Tipo de Ação</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'transferencia', label: 'Transferência', icon: ArrowLeftRight },
                                    { id: 'venda', label: 'Venda', icon: DollarSign },
                                    { id: 'compra', label: 'Compra', icon: ShoppingCart },
                                    { id: 'morte', label: 'Morte / Baixa', icon: Skull }
                                ].map((t) => {
                                    const Icon = t.icon;
                                    const isSel = tipo === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setTipo(t.id)}
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                                                isSel 
                                                    ? 'bg-[#E8F5EF] border-[#087F5B] text-[#087F5B] font-semibold' 
                                                    : 'bg-[#F7F9F8] border-[#E6EBE8] text-[#64748B] hover:text-[#172033]'
                                            }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-[#087F5B]' : 'text-[#64748B]'}`} />
                                            <span>{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Informação da regra automática */}
                        <div className="p-3 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl text-xs text-[#64748B] flex items-start gap-2">
                            <Info className="w-4 h-4 text-[#087F5B] shrink-0 mt-0.5" />
                            <div>
                                {tipo === 'transferencia' && 'Atualiza o pasto atual do animal para o piquete de destino selecionado.'}
                                {tipo === 'venda' && 'Muda automaticamente o status do animal para "vendido" e lança receita no financeiro.'}
                                {tipo === 'compra' && 'Registra a entrada do animal e lança despesa no financeiro.'}
                                {tipo === 'morte' && 'Muda o status do animal para "morto" e desvincula do pasto para não distorcer lotação.'}
                            </div>
                        </div>

                        {/* Animal Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1">Selecionar Animal (Brinco) *</label>
                            <select
                                required
                                value={animalId}
                                onChange={(e) => setAnimalId(e.target.value)}
                                className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            >
                                <option value="">Selecione o animal...</option>
                                {animais.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.identificacao} — {a.categoria} ({a.raca || 'S/ raça'}) • {a.piquete_nome || 'Sem pasto'}
                                    </option>
                                ))}
                            </select>
                            {selectedAnimal && (
                                <div className="mt-1 text-xs text-[#64748B]">
                                    Pasto Atual: <span className="text-[#087F5B] font-semibold">{selectedAnimal.piquete_nome || 'Nenhum'}</span>
                                </div>
                            )}
                        </div>

                        {/* Se Transferência: Piquete Destino Obrigatório */}
                        {tipo === 'transferencia' && (
                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1">Pasto / Piquete Destino *</label>
                                <select
                                    required
                                    value={piqueteDestinoId}
                                    onChange={(e) => setPiqueteDestinoId(e.target.value)}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                >
                                    <option value="">Selecione o pasto destino...</option>
                                    {piquetes.map((p) => {
                                        const isCurrent = selectedAnimal && Number(selectedAnimal.piquete_atual_id) === Number(p.id);
                                        return (
                                            <option key={p.id} value={p.id} disabled={isCurrent}>
                                                {p.nome} {isCurrent ? '(Pasto Atual - Origem)' : `(Capacidade: ${p.capacidade_suporte || '-'} cab)`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* Se Compra: Piquete de Entrada Opcional */}
                        {tipo === 'compra' && (
                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1">Pasto / Piquete de Entrada (Opcional)</label>
                                <select
                                    value={piqueteDestinoId}
                                    onChange={(e) => setPiqueteDestinoId(e.target.value)}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                >
                                    <option value="">Sem pasto alocado inicialmente</option>
                                    {piquetes.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nome} (Capacidade: {p.capacidade_suporte || '-'} cab)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Se Venda ou Compra: Valor */}
                        {(tipo === 'venda' || tipo === 'compra') && (
                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1">
                                    {tipo === 'venda' ? 'Valor da Venda (R$) *' : 'Valor da Compra (R$) *'}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    placeholder={tipo === 'venda' ? 'Ex: 4800.00 (Preço recebido)' : 'Ex: 3200.00 (Preço pago)'}
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="gerarFin"
                                        checked={gerarFinanceiro}
                                        onChange={(e) => setGerarFinanceiro(e.target.checked)}
                                        className="rounded border-[#CBD5E1] text-[#087F5B] focus:ring-0 cursor-pointer"
                                    />
                                    <label htmlFor="gerarFin" className="text-xs text-[#64748B] cursor-pointer">
                                        Lançar automaticamente no fluxo de caixa ({tipo === 'venda' ? 'Receita' : 'Despesa'})
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Data */}
                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1">Data do Evento *</label>
                            <input
                                type="date"
                                required
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            />
                        </div>

                        {/* Observações / Motivo */}
                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1">
                                {tipo === 'morte' ? 'Causa / Motivo do Óbito *' : tipo === 'venda' ? 'Comprador / Observação' : tipo === 'compra' ? 'Fornecedor / Origem' : 'Observações'}
                            </label>
                            {tipo === 'morte' && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {['Doença / Enfermidade', 'Acidente / Predador', 'Picada de Peçonhento', 'Descarte Sanitário', 'Causa Natural / Velhice'].map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setObservacao(tag)}
                                            className="px-2 py-0.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FACDCD] text-[#D64545] border border-[#FACDCD] text-[10px] font-medium transition cursor-pointer"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <textarea
                                rows="2"
                                required={tipo === 'morte'}
                                placeholder={
                                    tipo === 'morte'
                                        ? 'Informe a causa da morte do animal (obrigatório)...'
                                        : tipo === 'venda'
                                        ? 'Ex: Frigorífico X, Comprador Fulano, Nota Fiscal...'
                                        : tipo === 'compra'
                                        ? 'Ex: Leilão GD, Fazenda São José...'
                                        : 'Ex: Rotação periódica de pasto...'
                                }
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                className="w-full bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            ></textarea>
                        </div>

                        {feedback && (
                            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                                feedback.type === 'success' 
                                    ? 'bg-[#E8F5EF] border border-[#C3E6D6] text-[#087F5B]' 
                                    : 'bg-[#FEF2F2] border border-[#FACDCD] text-[#D64545]'
                            }`}>
                                {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                <span>{feedback.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-[#087F5B] hover:bg-[#159A70] disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>{submitting ? 'Gravando...' : 'Confirmar Movimentação'}</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: Movement History Table */}
            <div className="lg:col-span-2 saas-card-static overflow-hidden flex flex-col justify-between">
                <div>
                    {/* Header with Title and Filters */}
                    <div className="p-5 border-b border-[#E6EBE8] space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center text-[#087F5B]">
                                    <History className="w-4 h-4" strokeWidth={2} />
                                </div>
                                <h3 className="font-bold text-base text-[#172033]">Histórico de Movimentações</h3>
                            </div>
                            <span className="text-xs text-[#64748B] font-medium">{movimentacoes.length} registros</span>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                            >
                                <option value="">Todos os Tipos</option>
                                <option value="transferencia">Transferências</option>
                                <option value="venda">Vendas</option>
                                <option value="compra">Compras</option>
                                <option value="morte">Mortes / Baixas</option>
                            </select>

                            <div className="flex items-center gap-1.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1.5 text-xs text-[#172033]">
                                <span className="text-[#64748B] text-[11px]">De:</span>
                                <input
                                    type="date"
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="bg-transparent text-[#172033] focus:outline-none text-xs"
                                />
                                <span className="text-[#CBD5E1]">|</span>
                                <span className="text-[#64748B] text-[11px]">Até:</span>
                                <input
                                    type="date"
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="bg-transparent text-[#172033] focus:outline-none text-xs"
                                />
                            </div>

                            {(filtroTipo || dataInicio || dataFim) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-3 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E6EBE8] text-xs text-[#64748B] transition cursor-pointer"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#F7F9F8] text-[#64748B] font-bold border-b border-[#E6EBE8]">
                                <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Animal</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Detalhes / Piquetes</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6EBE8]">
                                {currentMovimentacoes.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-[#F7F9F8] transition">
                                        <td className="px-4 py-3 font-medium text-[#172033] whitespace-nowrap">
                                            {mov.data}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-[#172033]">Brinco {mov.animal_brinco}</div>
                                            <div className="text-[11px] text-[#64748B] capitalize">{mov.animal_categoria}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                mov.tipo === 'venda' ? 'bg-[#E8F5EF] text-[#087F5B]' :
                                                mov.tipo === 'compra' ? 'bg-[#EFF6FF] text-[#3978C7]' :
                                                mov.tipo === 'morte' ? 'bg-[#FEF2F2] text-[#D64545]' :
                                                'bg-[#FAF5FF] text-[#9333EA]'
                                            }`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#172033]">
                                            {mov.tipo === 'transferencia' ? (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <span className="text-[#64748B]">{mov.piquete_origem_nome || 'Sem pasto'}</span>
                                                    <span className="text-[#087F5B] font-bold">➔</span>
                                                    <span className="text-[#087F5B] font-semibold">{mov.piquete_destino_nome}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[#64748B]">{mov.observacao || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-[#172033]">
                                            {mov.valor > 0 ? formatCurrency(mov.valor) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {loading && (
                            <div className="py-16 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-[#087F5B]" />
                                <span>Carregando movimentações...</span>
                            </div>
                        )}

                        {!loading && movimentacoes.length === 0 && (
                            <div className="py-16 text-center text-xs text-[#64748B]">
                                Nenhuma movimentação encontrada com os filtros selecionados.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="border-t border-[#E6EBE8]">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={movimentacoes.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            </div>
        </div>
    );
}
