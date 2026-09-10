import React from 'react';
import { Plus, Calendar } from 'lucide-react';

/**
 * Componente modular para renderização de ações rápidas contextuais e filtros na barra superior (Header).
 */
export default function HeaderActions({ 
    activeTab, 
    mesAno, 
    setMesAno, 
    onQuickAction 
}) {
    return (
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Seletor de Mês para Financeiro e RH */}
            {(activeTab === 'financeiro' || activeTab === 'rh') && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-[#172033]">
                    <Calendar className="w-3.5 h-3.5 text-[#087F5B] shrink-0" strokeWidth={1.75} />
                    <span className="text-[#64748B] hidden sm:inline">Mês:</span>
                    <input
                        type="month"
                        value={mesAno}
                        onChange={(e) => setMesAno(e.target.value)}
                        className="bg-transparent text-[#172033] font-medium focus:outline-none cursor-pointer text-xs"
                    />
                </div>
            )}

            {/* Ações Rápidas Contextuais */}
            {activeTab === 'rebanho' && (
                <button
                    onClick={() => onQuickAction('novo_animal')}
                    className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span>Novo Animal</span>
                </button>
            )}

            {activeTab === 'movimentacoes' && (
                <button
                    onClick={() => onQuickAction('nova_movimentacao')}
                    className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span className="hidden sm:inline">Registrar Movimentação</span>
                    <span className="sm:hidden">Nova Mov.</span>
                </button>
            )}

            {activeTab === 'sanidade' && (
                <button
                    onClick={() => onQuickAction('nova_sanidade')}
                    className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span>Lançar Dose</span>
                </button>
            )}

            {activeTab === 'financeiro' && (
                <button
                    onClick={() => onQuickAction('novo_financeiro')}
                    className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span>Novo Lançamento</span>
                </button>
            )}

            {activeTab === 'piquetes' && (
                <button
                    onClick={() => onQuickAction('novo_piquete')}
                    className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span>Novo Piquete</span>
                </button>
            )}

            {activeTab === 'agricola' && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={() => onQuickAction('novo_talhao')}
                        className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8] font-semibold text-xs px-3 py-2 min-h-[38px] rounded-xl transition cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4 text-[#087F5B] shrink-0" strokeWidth={2.2} />
                        <span>Talhão</span>
                    </button>
                    <button
                        onClick={() => onQuickAction('nova_safra')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                        <span>Nova Safra</span>
                    </button>
                </div>
            )}

            {activeTab === 'patrimonio' && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={() => onQuickAction('nova_benfeitoria')}
                        className="hidden sm:flex items-center gap-1.5 bg-white hover:bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8] font-semibold text-xs px-3 py-2 min-h-[38px] rounded-xl transition cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4 text-[#087F5B] shrink-0" strokeWidth={2.2} />
                        <span>Benfeitoria</span>
                    </button>
                    <button
                        onClick={() => onQuickAction('nova_maquina')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                        <span>Nova Máquina</span>
                    </button>
                </div>
            )}

            {activeTab === 'rh' && (
                <button
                    onClick={() => onQuickAction('novo_colaborador')}
                    className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-semibold text-xs px-3.5 py-2 min-h-[38px] rounded-xl transition shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                    <span>Novo Colaborador</span>
                </button>
            )}
        </div>
    );
}
