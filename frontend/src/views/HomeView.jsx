import React from 'react';
import { 
    Beef, 
    Fence, 
    Sprout, 
    CircleDollarSign, 
    ShieldAlert, 
    BarChart3, 
    Settings2, 
    Tractor, 
    Users, 
    Calendar, 
    ArrowLeftRight, 
    Home,
    ArrowRight,
    Bell,
    User,
    Building2,
    LogOut,
    CheckCircle2
} from 'lucide-react';

export default function HomeView({ onNavigate, currentUser, onLogout, fazenda, counts = {} }) {
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    }).format(new Date());

    const papel = currentUser?.papel || 'dono';

    // 12 Módulos estruturados em 3 colunas x 4 linhas no desktop
    const modules = [
        {
            id: 'rebanho',
            title: 'Rebanho',
            description: 'Gerencie seu rebanho, acompanhe os animais e seus dados.',
            icon: Beef,
            badge: counts.ativos ? `${counts.ativos} ativos` : null,
            image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'piquetes',
            title: 'Pastos',
            description: 'Acompanhe a ocupação, manejo e produtividade dos pastos.',
            icon: Fence,
            image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'agricola',
            title: 'Lavouras & Safras',
            description: 'Monitore suas lavouras, safra e planeje sua produção.',
            icon: Sprout,
            badge: counts.safrasAtivas ? `${counts.safrasAtivas} ativas` : null,
            image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'financeiro',
            title: 'Financeiro',
            description: 'Acompanhe receitas, custos e o desempenho financeiro.',
            icon: CircleDollarSign,
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'contador']
        },
        {
            id: 'sanidade',
            title: 'Sanidade',
            description: 'Controle vacinas, tratamentos e a saúde do seu rebanho.',
            icon: ShieldAlert,
            badge: (counts.vacinasAtrasadas || 0) > 0 ? `${counts.vacinasAtrasadas} atrasada(s)` : null,
            badgeColor: 'bg-[#FEF2F2] text-[#D64545]',
            image: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'dashboard',
            title: 'Relatórios & Indicadores',
            description: 'Gere relatórios e tenha uma visão completa da sua operação.',
            icon: BarChart3,
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente', 'contador']
        },
        {
            id: 'fazenda',
            title: 'Configurações',
            description: 'Personalize o sistema conforme sua necessidade.',
            icon: Settings2,
            image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'patrimonio',
            title: 'Patrimônio & Máquinas',
            description: 'Acompanhe máquinas, implementos e depreciação patrimonial.',
            icon: Tractor,
            image: 'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'rh',
            title: 'Equipe & RH',
            description: 'Gestão de colaboradores, equipes e folha de pagamento.',
            icon: Users,
            badge: counts.colaboradores ? `${counts.colaboradores} pessoas` : null,
            image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'sanidade',
            title: 'Atividades & Calendário',
            description: 'Confira suas próximas tarefas, vacinações e compromissos.',
            icon: Calendar,
            image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'movimentacoes',
            title: 'Movimentações',
            description: 'Acompanhe entradas, saídas e movimentações do rebanho.',
            icon: ArrowLeftRight,
            image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente']
        },
        {
            id: 'dashboard',
            title: 'Visão Geral da Fazenda',
            description: 'Acompanhe os principais indicadores consolidados da sua fazenda.',
            icon: Home,
            image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=800&q=80',
            roles: ['dono', 'gerente', 'contador']
        }
    ];

    // Filtra módulos pelo papel do usuário conectado
    const visibleModules = modules.filter(m => m.roles.includes(papel));

    return (
        <div className="min-h-screen bg-[#F7F9F8] flex flex-col justify-between text-[#172033] relative overflow-x-hidden selection:bg-[#E8F5EF] selection:text-[#087F5B]">
            {/* Top Atmospheric Subtle Glow / Rural Background Header */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#087F5B]/5 via-[#087F5B]/2 to-transparent pointer-events-none"></div>

            {/* HEADER SUPERIOR */}
            <header className="relative z-10 w-full bg-white/80 backdrop-blur-md border-b border-[#E6EBE8] px-4 sm:px-8 py-3.5 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Logo & Greeting */}
                <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#087F5B] flex items-center justify-center shadow-sm shadow-[#087F5B]/20">
                            <Sprout className="w-5 h-5 text-white" strokeWidth={2.2} />
                        </div>
                        <div>
                            <span className="font-bold text-lg text-[#172033] tracking-tight block leading-tight">Fazenda GD</span>
                            <span className="text-[10px] text-[#64748B] font-semibold tracking-wider uppercase">SaaS Agro</span>
                        </div>
                    </div>

                    <div className="hidden sm:block h-8 w-[1px] bg-[#E6EBE8]" />

                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                            Bom dia, Fazenda GD 👋
                        </h1>
                        <p className="text-xs text-[#64748B] font-medium truncate">
                            Aqui está o resumo da sua operação hoje.
                        </p>
                    </div>
                </div>

                {/* Status, Date, Alerts & Profile */}
                <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3.5 w-full md:w-auto">
                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F5EF] border border-[#C3E6D6] text-xs font-semibold text-[#087F5B] shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#087F5B] animate-pulse"></span>
                        <span className="hidden xs:inline">Operação em tempo real</span>
                        <span className="xs:hidden">Online</span>
                    </div>

                    {/* Date Pill */}
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6EBE8] text-xs font-medium text-[#64748B] shadow-2xs shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-[#087F5B]" strokeWidth={1.75} />
                        <span className="capitalize">{dataFormatada}</span>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={() => onNavigate('sanidade')}
                            title="Notificações e Alertas"
                            className="w-9 h-9 rounded-full bg-white border border-[#E6EBE8] hover:border-[#087F5B]/30 flex items-center justify-center text-[#64748B] hover:text-[#087F5B] transition shadow-2xs cursor-pointer"
                        >
                            <Bell className="w-4 h-4" strokeWidth={1.75} />
                            {(counts.vacinasAtrasadas > 0 || counts.vacinasVencendo > 0) && (
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D64545] ring-2 ring-white"></span>
                            )}
                        </button>
                    </div>

                    {/* User Profile Pill & Logout */}
                    <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#E6EBE8]">
                        <div className="w-9 h-9 rounded-full bg-[#087F5B] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                            {currentUser?.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <button
                            onClick={onLogout}
                            title="Sair do sistema"
                            className="p-2 text-[#64748B] hover:text-[#D64545] hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                    </div>
                </div>
            </header>

            {/* CORPO PRINCIPAL — GRADE 3 x 4 DE CARDS FLUTUANTES */}
            <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {visibleModules.map((mod, index) => {
                        const Icon = mod.icon;
                        return (
                            <div
                                key={`${mod.id}-${index}`}
                                onClick={() => onNavigate(mod.id)}
                                tabIndex={0}
                                role="button"
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(mod.id); }}
                                className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E6EBE8] bg-white shadow-[0_4px_20px_rgba(20,60,45,0.04)] hover:shadow-[0_12px_32px_rgba(20,60,45,0.1)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[170px] sm:min-h-[185px] p-5 sm:p-6"
                            >
                                {/* Imagem de Fundo Fotográfica à Direita */}
                                <img 
                                    src={mod.image} 
                                    alt={mod.title} 
                                    loading="lazy"
                                    className="absolute right-0 top-0 w-3/5 sm:w-2/3 h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                />

                                {/* Gradiente Suave com Desfoque para Garantir 100% de Legibilidade */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/90 to-transparent w-full pointer-events-none" />

                                {/* Conteúdo Superior: Ícone e Badge */}
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-[#E8F5EF] text-[#087F5B] flex items-center justify-center shadow-2xs group-hover:bg-[#087F5B] group-hover:text-white transition-colors duration-200">
                                        <Icon className="w-5 h-5" strokeWidth={1.8} />
                                    </div>
                                    {mod.badge && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-current/20 shadow-2xs ${mod.badgeColor || 'bg-[#E8F5EF] text-[#087F5B]'}`}>
                                            {mod.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Conteúdo Inferior: Título, Descrição e Seta */}
                                <div className="relative z-10 mt-4 flex items-end justify-between gap-2">
                                    <div className="max-w-[210px] sm:max-w-[240px]">
                                        <h3 className="font-bold text-base sm:text-lg text-[#172033] tracking-tight group-hover:text-[#087F5B] transition-colors duration-200">
                                            {mod.title}
                                        </h3>
                                        <p className="text-xs text-[#64748B] font-medium leading-relaxed mt-1 line-clamp-2">
                                            {mod.description}
                                        </p>
                                    </div>

                                    {/* Seta de Acesso */}
                                    <div className="w-7 h-7 rounded-full bg-[#E8F5EF] text-[#087F5B] flex items-center justify-center group-hover:bg-[#087F5B] group-hover:text-white transition-all duration-200 shrink-0 group-hover:translate-x-0.5">
                                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* RODAPÉ INSTITUCIONAL */}
            <footer className="relative z-10 border-t border-[#E6EBE8] bg-white/70 backdrop-blur-sm px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
                <div className="flex items-center gap-2 font-medium">
                    <Sprout className="w-4 h-4 text-[#087F5B]" strokeWidth={2} />
                    <span className="font-bold text-[#172033]">Fazenda GD</span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span>Gestão que gera resultados</span>
                </div>

                <div className="font-semibold text-[#087F5B] italic tracking-tight text-sm">
                    Mais produtividade. Mais futuro.
                </div>
            </footer>
        </div>
    );
}
