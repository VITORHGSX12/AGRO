import React from 'react';
import { 
    LayoutDashboard, 
    Beef, 
    ArrowLeftRight, 
    ShieldAlert, 
    CircleDollarSign, 
    Fence, 
    Sprout,
    Tractor,
    Users,
    ShieldCheck,
    Settings2,
    LogOut,
    X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, counts = {}, currentUser, onLogout, mobileOpen, onCloseMobile }) {
    const papel = currentUser?.papel || 'dono';

    // Lista de todos os itens com seus papéis autorizados
    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['dono', 'gerente', 'contador'] },
        { id: 'rebanho', label: 'Rebanho', icon: Beef, badge: counts.ativos, roles: ['dono', 'gerente'] },
        { id: 'movimentacoes', label: 'Movimentações', icon: ArrowLeftRight, roles: ['dono', 'gerente'] },
        { 
            id: 'sanidade', 
            label: 'Sanidade', 
            icon: ShieldAlert, 
            badge: (counts.vacinasAtrasadas || 0) + (counts.vacinasVencendo || 0),
            badgeColor: counts.vacinasAtrasadas > 0 ? 'bg-[#D64545] text-white' : 'bg-[#D99A22] text-white',
            roles: ['dono', 'gerente']
        },
        { id: 'financeiro', label: 'Financeiro', icon: CircleDollarSign, roles: ['dono', 'contador'] },
        { id: 'piquetes', label: 'Pastagens & Piquetes', icon: Fence, roles: ['dono', 'gerente'] },
        { id: 'agricola', label: 'Lavouras & Safras', icon: Sprout, badge: counts.safrasAtivas, roles: ['dono', 'gerente'] },
        { id: 'patrimonio', label: 'Patrimônio & Máquinas', icon: Tractor, roles: ['dono', 'gerente'] },
        { id: 'rh', label: 'Equipe & RH', icon: Users, badge: counts.colaboradores, roles: ['dono', 'gerente'] },
        { id: 'usuarios', label: 'Usuários & Permissões', icon: ShieldCheck, roles: ['dono'] },
        { id: 'fazenda', label: 'Configurações', icon: Settings2, roles: ['dono', 'gerente'] },
    ];

    // Filtra itens com base no papel do usuário
    const navItems = allNavItems.filter(item => item.roles.includes(papel));

    const roleBadge = {
        dono: { label: 'Administrador', color: 'bg-[#E8F5EF] text-[#087F5B] border-[#C3E6D6]' },
        gerente: { label: 'Gerente Campo', color: 'bg-[#EFF6FF] text-[#3978C7] border-[#DBEAFE]' },
        contador: { label: 'Contador', color: 'bg-[#FAF5FF] text-[#9333EA] border-[#F3E8FF]' }
    }[papel] || { label: papel, color: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]' };

    const handleItemClick = (id) => {
        setActiveTab(id);
        if (onCloseMobile) onCloseMobile();
    };

    const sidebarContent = (
        <aside className="w-64 h-full bg-white border-r border-[#E6EBE8] flex flex-col justify-between shrink-0 select-none shadow-sm">
            {/* Logo & Navigation */}
            <div className="flex-1 overflow-y-auto flex flex-col">
                {/* Logo Header */}
                <div className="h-18 flex items-center justify-between px-5 border-b border-[#E6EBE8] sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#087F5B] flex items-center justify-center shadow-sm shadow-[#087F5B]/20 shrink-0">
                            <Sprout className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-base text-[#172033] tracking-tight">Fazenda GD</span>
                            </div>
                            <p className="text-[11px] text-[#64748B] font-medium tracking-wide">Gestão Agropecuária</p>
                        </div>
                    </div>
                    {/* Mobile Close Button */}
                    {onCloseMobile && (
                        <button 
                            onClick={onCloseMobile}
                            className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] transition"
                        >
                            <X className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="p-3 space-y-1 mt-2 flex-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        Menu Principal
                    </div>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                                    isActive
                                        ? 'bg-[#E8F5EF] text-[#087F5B] font-semibold shadow-xs'
                                        : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8]'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Icon 
                                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#087F5B]' : 'text-[#64748B]'}`} 
                                        strokeWidth={1.75}
                                    />
                                    <span className="truncate">{item.label}</span>
                                </div>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                        item.badgeColor || (isActive ? 'bg-[#087F5B] text-white' : 'bg-[#E6EBE8] text-[#172033]')
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Institutional Info Card */}
                <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8] text-[11px] text-[#64748B] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse"></span>
                        <span className="font-semibold text-[#172033]">Fazenda GD SaaS</span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono">v2.6</span>
                </div>
            </div>

            {/* User Session Footer */}
            <div className="p-3 border-t border-[#E6EBE8] bg-white">
                <div className="p-2.5 rounded-xl bg-[#F7F9F8] border border-[#E6EBE8] flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#087F5B] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-xs text-[#172033] truncate">
                                {currentUser?.nome || 'Usuário'}
                            </div>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium ${roleBadge.color}`}>
                                {roleBadge.label}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        title="Encerrar Sessão"
                        className="p-1.5 text-[#64748B] hover:text-[#D64545] hover:bg-[#FEF2F2] rounded-lg transition cursor-pointer shrink-0"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex h-full shrink-0">
                {sidebarContent}
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div 
                        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
                        onClick={onCloseMobile}
                    />
                    <div className="relative z-10">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}
