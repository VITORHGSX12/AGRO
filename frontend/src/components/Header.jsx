import React from 'react';
import { Building2, Calendar, Plus, Menu } from 'lucide-react';

export default function Header({ fazenda, mesAno, setMesAno, onQuickAction, activeTab, onOpenMobile }) {
    const titles = {
        dashboard: 'Dashboard Geral',
        rebanho: 'Gestão do Rebanho',
        movimentacoes: 'Movimentações de Animais',
        sanidade: 'Controle Sanitário & Vacinas',
        financeiro: 'Fluxo de Caixa & Finanças',
        piquetes: 'Pastagens & Piquetes',
        agricola: 'Lavouras & Safras',
        patrimonio: 'Patrimônio & Máquinas',
        rh: 'Equipe & RH (Folha)',
        usuarios: 'Usuários & Permissões',
        fazenda: 'Configurações da Propriedade'
    };

    return (
        <header className="h-18 border-b border-[#E6EBE8] bg-white/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 select-none">
            {/* Page Title & Farm Badge */}
            <div className="flex items-center gap-3">
                {/* Mobile Drawer Trigger Button */}
                <button
                    onClick={onOpenMobile}
                    className="lg:hidden p-2 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8] text-[#172033] hover:bg-[#E8F5EF] transition cursor-pointer"
                    title="Abrir Menu"
                >
                    <Menu className="w-4 h-4" strokeWidth={2} />
                </button>

                <div>
                    <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight truncate max-w-[200px] sm:max-w-none">
                        {titles[activeTab] || 'Visão Geral'}
                    </h1>
                </div>

                {fazenda && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F9F8] border border-[#E6EBE8] text-xs text-[#64748B] font-medium">
                        <Building2 className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span className="text-[#172033] font-semibold">{fazenda.nome}</span>
                        {fazenda.area_hectares > 0 && (
                            <span className="text-[#64748B]">({fazenda.area_hectares} ha)</span>
                        )}
                    </div>
                )}
            </div>

            {/* Actions & Live Status */}
            <div className="flex items-center gap-3">
                {/* Live Status Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F5EF] border border-[#C3E6D6] text-xs text-[#087F5B] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse"></span>
                    <span>Operação em tempo real</span>
                </div>

                {/* Month Picker Filter for Financeiro & RH */}
                {(activeTab === 'financeiro' || activeTab === 'rh') && (
                    <div className="flex items-center gap-2 bg-[#F7F9F8] border border-[#E6EBE8] rounded-xl px-3 py-1.5 text-xs text-[#172033]">
                        <Calendar className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span className="text-[#64748B]">Mês:</span>
                        <input
                            type="month"
                            value={mesAno}
                            onChange={(e) => setMesAno(e.target.value)}
                            className="bg-transparent text-[#172033] font-medium focus:outline-none cursor-pointer text-xs"
                        />
                    </div>
                )}

                {/* Contextual Quick Actions */}
                {activeTab === 'rebanho' && (
                    <button
                        onClick={() => onQuickAction('novo_animal')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        <span>Novo Animal</span>
                    </button>
                )}

                {activeTab === 'movimentacoes' && (
                    <button
                        onClick={() => onQuickAction('nova_movimentacao')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        <span>Registrar Movimentação</span>
                    </button>
                )}

                {activeTab === 'sanidade' && (
                    <button
                        onClick={() => onQuickAction('nova_sanidade')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        <span>Lançar Vacina / Dose</span>
                    </button>
                )}

                {activeTab === 'financeiro' && (
                    <button
                        onClick={() => onQuickAction('novo_financeiro')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        <span>Novo Lançamento</span>
                    </button>
                )}

                {activeTab === 'piquetes' && (
                    <button
                        onClick={() => onQuickAction('novo_piquete')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        <span>Novo Piquete</span>
                    </button>
                )}

                {activeTab === 'agricola' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onQuickAction('novo_talhao')}
                            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8] font-medium text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-[#087F5B]" strokeWidth={2} />
                            <span>Novo Talhão</span>
                        </button>
                        <button
                            onClick={() => onQuickAction('nova_safra')}
                            className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            <span>Nova Safra</span>
                        </button>
                    </div>
                )}

                {activeTab === 'patrimonio' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onQuickAction('nova_benfeitoria')}
                            className="flex items-center gap-1.5 bg-white hover:bg-[#F7F9F8] text-[#172033] border border-[#E6EBE8] font-medium text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-[#087F5B]" strokeWidth={2} />
                            <span>Nova Benfeitoria</span>
                        </button>
                        <button
                            onClick={() => onQuickAction('nova_maquina')}
                            className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" strokeWidth={2} />
                            <span>Nova Máquina</span>
                        </button>
                    </div>
                )}

                {activeTab === 'rh' && (
                    <button
                        onClick={() => onQuickAction('novo_colaborador')}
                        className="flex items-center gap-1.5 bg-[#087F5B] hover:bg-[#159A70] text-white font-medium text-xs px-3.5 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        <span>Novo Colaborador</span>
                    </button>
                )}
            </div>
        </header>
    );
}
