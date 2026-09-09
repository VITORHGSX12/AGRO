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
    UserCheck,
    Calculator,
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
            badgeColor: counts.vacinasAtrasadas > 0 ? 'bg-rose-500' : 'bg-amber-500',
            roles: ['dono', 'gerente']
        },
        { id: 'financeiro', label: 'Financeiro', icon: CircleDollarSign, roles: ['dono', 'contador'] },
        { id: 'piquetes', label: 'Pastagens & Piquetes', icon: Fence, roles: ['dono', 'gerente'] },
        { id: 'agricola', label: 'Lavoura & Safras', icon: Sprout, badge: counts.safrasAtivas, roles: ['dono', 'gerente'] },
        { id: 'patrimonio', label: 'Patrimônio & Máquinas', icon: Tractor, roles: ['dono', 'gerente'] },
        { id: 'rh', label: 'Equipe & RH', icon: Users, badge: counts.colaboradores, roles: ['dono', 'gerente'] },
        { id: 'usuarios', label: 'Usuários & Permissões', icon: ShieldCheck, roles: ['dono'] },
        { id: 'fazenda', label: 'Configurações', icon: Settings2, roles: ['dono', 'gerente'] },
    ];

    // Filtra itens com base no papel do usuário
    const navItems = allNavItems.filter(item => item.roles.includes(papel));

    const roleBadge = {
        dono: { label: 'Dono (Total)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        gerente: { label: 'Gerente (Campo)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        contador: { label: 'Contador (Fin.)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
    }[papel] || { label: papel, color: 'bg-slate-800 text-slate-300 border-slate-700' };

    const handleItemClick = (id) => {
        setActiveTab(id);
        if (onCloseMobile) onCloseMobile();
    };

    const sidebarContent = (
        <aside className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none shadow-2xl lg:shadow-none">
            {/* Logo & Navigation Items */}
            <div className="flex-1 overflow-y-auto">
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Beef className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-white tracking-tight flex items-center gap-1.5">
                                AGRO<span className="text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">SaaS</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Gestão de Fazendas</p>
                        </div>
                    </div>
                    {/* Close button on mobile drawer */}
                    {onCloseMobile && (
                        <button 
                            onClick={onCloseMobile}
                            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="p-3 space-y-1.5 mt-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                                    isActive
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-semibold'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                </div>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold text-white ${item.badgeColor || (isActive ? 'bg-emerald-700' : 'bg-slate-700')}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* User Session & Logout Footer */}
            <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/70">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-bold text-xs text-white truncate">{currentUser?.nome || 'Usuário'}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleBadge.color}`}>
                            {roleBadge.label}
                        </span>
                    </div>
                    <button
                        onClick={onLogout}
                        title="Encerrar Sessão"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop Static Sidebar */}
            <div className="hidden lg:flex h-full shrink-0">
                {sidebarContent}
            </div>

            {/* Mobile Drawer with backdrop */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div 
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                        onClick={onCloseMobile}
                    ></div>
                    <div className="relative z-10 h-full animate-in slide-in-from-left duration-200">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}

