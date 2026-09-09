import React from 'react';
import { Building2, Calendar, Plus, ShieldAlert, Menu } from 'lucide-react';

export default function Header({ fazenda, mesAno, setMesAno, onQuickAction, activeTab, onOpenMobile }) {
    const titles = {
        dashboard: 'Dashboard Geral',
        rebanho: 'Gestão do Rebanho',
        movimentacoes: 'Movimentações de Animais',
        sanidade: 'Controle Sanitário e Vacinas',
        financeiro: 'Fluxo de Caixa & Finanças',
        piquetes: 'Pastagens & Piquetes',
        agricola: 'Lavoura, Safras & Insumos',
        patrimonio: 'Patrimônio, Máquinas & Benfeitorias',
        rh: 'Equipe, RH & Folha de Pagamento',
        usuarios: 'Gestão de Usuários & Permissões',
        fazenda: 'Configurações da Propriedade'
    };

    return (
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
            {/* Page Title & Farm Badge */}
            <div className="flex items-center gap-3">
                {/* Mobile Drawer Trigger Button */}
                <button
                    onClick={onOpenMobile}
                    className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition focus:outline-none"
                    title="Abrir Menu"
                >
                    <Menu className="w-4 h-4" />
                </button>

                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
                    {titles[activeTab] || 'Visão Geral'}
                </h1>
                {fazenda && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{fazenda.nome}</span>
                        {fazenda.area_hectares > 0 && (
                            <span className="text-slate-400">({fazenda.area_hectares} ha)</span>
                        )}
                    </div>
                )}
            </div>

            {/* Actions & Filters */}
            <div className="flex items-center gap-3">
                {/* Month Picker Filter for Dashboard, Financeiro & RH */}
                {(activeTab === 'dashboard' || activeTab === 'financeiro' || activeTab === 'rh') && (
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-400">Mês:</span>
                        <input
                            type="month"
                            value={mesAno}
                            onChange={(e) => setMesAno(e.target.value)}
                            className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer text-xs"
                        />
                    </div>
                )}

                {/* Contextual Quick Actions */}
                {activeTab === 'rebanho' && (
                    <button
                        onClick={() => onQuickAction('novo_animal')}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Animal</span>
                    </button>
                )}

                {activeTab === 'movimentacoes' && (
                    <button
                        onClick={() => onQuickAction('nova_movimentacao')}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Registrar Movimentação</span>
                    </button>
                )}

                {activeTab === 'sanidade' && (
                    <button
                        onClick={() => onQuickAction('nova_sanidade')}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Lançar Vacina / Dose</span>
                    </button>
                )}

                {activeTab === 'financeiro' && (
                    <button
                        onClick={() => onQuickAction('novo_financeiro')}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Lançamento</span>
                    </button>
                )}

                {activeTab === 'piquetes' && (
                    <button
                        onClick={() => onQuickAction('novo_piquete')}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Novo Piquete</span>
                    </button>
                )}

                {activeTab === 'agricola' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onQuickAction('novo_talhao')}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-3 py-2 rounded-lg transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Talhão</span>
                        </button>
                        <button
                            onClick={() => onQuickAction('nova_safra')}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Safra</span>
                        </button>
                    </div>
                )}

                {activeTab === 'patrimonio' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onQuickAction('nova_benfeitoria')}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-3 py-2 rounded-lg transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Benfeitoria</span>
                        </button>
                        <button
                            onClick={() => onQuickAction('nova_maquina')}
                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition shadow-sm shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nova Máquina</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
