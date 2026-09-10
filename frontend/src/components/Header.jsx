import React from 'react';
import { 
    Building2, 
    Calendar, 
    Plus, 
    ArrowLeft, 
    Sprout, 
    LogOut, 
    Bell,
    CheckCircle2
} from 'lucide-react';

export default function Header({ fazenda, mesAno, setMesAno, onQuickAction, activeTab, onNavigateHome, currentUser, onLogout }) {
    const titles = {
        home: 'Menu Principal',
        dashboard: 'Relatórios & Indicadores',
        rebanho: 'Gestão do Rebanho',
        movimentacoes: 'Movimentações de Animais',
        sanidade: 'Sanidade & Protocolos',
        financeiro: 'Fluxo de Caixa & Finanças',
        piquetes: 'Pastagens & Piquetes',
        agricola: 'Lavouras & Safras',
        patrimonio: 'Patrimônio & Máquinas',
        rh: 'Equipe & RH (Folha)',
        usuarios: 'Usuários & Permissões',
        fazenda: 'Configurações da Propriedade'
    };

    return (
        <header className="min-h-16 sm:h-18 border-b border-[#E6EBE8] bg-white/95 backdrop-blur px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 select-none py-2 sm:py-0">
            {/* Left: Prominent Back to Home Button & Page Title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Botão de Voltar ao Menu Principal */}
                <button
                    onClick={onNavigateHome}
                    title="Voltar ao Menu Inicial"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E8F5EF] hover:bg-[#087F5B] text-[#087F5B] hover:text-white border border-[#C3E6D6] transition-all duration-200 cursor-pointer font-bold text-xs shadow-2xs group shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.2} />
                    <span className="hidden sm:inline">Menu Principal</span>
                    <span className="sm:hidden">Voltar</span>
                </button>

                <div className="h-6 w-[1px] bg-[#E6EBE8] hidden sm:block" />

                {/* Module Title */}
                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight truncate">
                        {titles[activeTab] || 'Módulo'}
                    </h1>
                </div>

                {fazenda && (
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F9F8] border border-[#E6EBE8] text-xs text-[#64748B] font-medium shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span className="text-[#172033] font-semibold truncate max-w-[140px]">{fazenda.nome}</span>
                        {fazenda.area_hectares > 0 && (
                            <span className="text-[#64748B]">({fazenda.area_hectares} ha)</span>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Contextual Module Actions + Month Picker + User */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Month Picker Filter for Financeiro & RH */}
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

                {/* Contextual Quick Actions for This Specific Module */}
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

                {/* User avatar & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-[#E6EBE8]">
                    <div className="w-8 h-8 rounded-full bg-[#087F5B] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                        {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            title="Sair do sistema"
                            className="p-1.5 text-[#64748B] hover:text-[#D64545] hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
