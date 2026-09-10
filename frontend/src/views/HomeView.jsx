import React from 'react';
import { Sprout } from 'lucide-react';
import HomeHeader from '../components/navigation/HomeHeader';
import HomeGrid from '../components/navigation/HomeGrid';

/**
 * Portal Inicial (HomeView) — Tela central de entrada e navegação em cards flutuantes.
 * Orquestrado com HomeHeader, HomeGrid e Rodapé Institucional Fazenda GD.
 */
export default function HomeView({ onNavigate, currentUser, onLogout, fazenda, counts = {} }) {
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    }).format(new Date());

    return (
        <div className="min-h-screen bg-[#F7F9F8] text-[#172033] flex flex-col font-sans selection:bg-[#087F5B]/20 relative overflow-hidden select-none">
            {/* Efeito sutil de iluminação de fundo */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-[#E8F5EF]/60 rounded-full blur-3xl pointer-events-none -z-0" />
            <div className="absolute bottom-10 left-10 w-[450px] h-[300px] bg-[#D9A441]/5 rounded-full blur-3xl pointer-events-none -z-0" />

            {/* Cabeçalho do Portal */}
            <HomeHeader 
                currentUser={currentUser}
                onLogout={onLogout}
                onNavigate={onNavigate}
                counts={counts}
                dataFormatada={dataFormatada}
            />

            {/* Grade de Módulos Responsiva (3x4) */}
            <HomeGrid 
                onNavigate={onNavigate}
                currentUser={currentUser}
                counts={counts}
            />

            {/* Rodapé Institucional */}
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
