import React from 'react';
import { 
    Sprout, 
    Calendar, 
    Bell, 
    LogOut 
} from 'lucide-react';

/**
 * Cabeçalho institucional do portal principal (HomeView).
 * Exibe dados da fazenda, data corrente formatada, indicador de status online, notificações e perfil do usuário.
 */
export default function HomeHeader({ 
    currentUser, 
    onLogout, 
    onNavigate, 
    counts = {}, 
    dataFormatada 
}) {
    const defaultDataFormatada = dataFormatada || new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    }).format(new Date());

    const hasAlerts = (counts.vacinasAtrasadas > 0 || counts.vacinasVencendo > 0);

    return (
        <header className="relative z-10 border-b border-[#E6EBE8] bg-white/80 backdrop-blur-md px-4 sm:px-8 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Branding & Saudação */}
            <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="flex items-center gap-2.5">
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

            {/* Status, Data, Alertas & Perfil */}
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
                    <span className="capitalize">{defaultDataFormatada}</span>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => onNavigate && onNavigate('sanidade')}
                        title="Notificações e Alertas Sanitários"
                        className="w-9 h-9 rounded-full bg-white border border-[#E6EBE8] hover:border-[#087F5B]/30 flex items-center justify-center text-[#64748B] hover:text-[#087F5B] transition shadow-2xs cursor-pointer"
                    >
                        <Bell className="w-4 h-4" strokeWidth={1.75} />
                        {hasAlerts && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D64545] ring-2 ring-white"></span>
                        )}
                    </button>
                </div>

                {/* User Profile Pill & Logout */}
                <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[#E6EBE8]">
                    <div className="w-9 h-9 rounded-full bg-[#087F5B] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0" title={currentUser?.nome || 'Usuário'}>
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
    );
}
