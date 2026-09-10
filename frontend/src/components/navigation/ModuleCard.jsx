import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Componente atômico para exibição de cada card de módulo do sistema.
 * Apresenta foto temática com overlay suave, ícone contextual, badge de status/alerta e transições hover.
 */
export default function ModuleCard({ mod, onNavigate, counts = {} }) {
    const Icon = mod.icon;
    const badgeText = mod.badge || (mod.getBadge ? mod.getBadge(counts) : null);

    const handleClick = () => {
        if (onNavigate) onNavigate(mod.id);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div
            onClick={handleClick}
            tabIndex={0}
            role="button"
            onKeyDown={handleKeyDown}
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
                {badgeText && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-current/20 shadow-2xs ${mod.badgeColor || 'bg-[#E8F5EF] text-[#087F5B]'}`}>
                        {badgeText}
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
}
