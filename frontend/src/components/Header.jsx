import React from 'react';
import { Building2, ArrowLeft } from 'lucide-react';
import { MODULE_TITLES } from './navigation/menuConfig';
import HeaderActions from './navigation/HeaderActions';
import UserProfileMenu from './navigation/UserProfileMenu';

/**
 * Topbar / Barra Superior de Navegação do Sistema AGRO.
 * Modularizado com botão de retorno, título dinâmico, dados da propriedade, ações contextuais e perfil.
 */
export default function Header({ 
    fazenda, 
    mesAno, 
    setMesAno, 
    onQuickAction, 
    activeTab, 
    onNavigateHome, 
    currentUser, 
    onLogout 
}) {
    const pageTitle = MODULE_TITLES[activeTab] || 'Módulo';

    return (
        <header className="min-h-16 sm:h-18 border-b border-[#E6EBE8] bg-white/95 backdrop-blur px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 select-none py-2 sm:py-0">
            {/* Esquerda: Botão Voltar ao Menu Principal + Título do Módulo + Propriedade */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                    onClick={onNavigateHome}
                    title="Voltar ao Menu Principal"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E8F5EF] hover:bg-[#087F5B] text-[#087F5B] hover:text-white border border-[#C3E6D6] transition-all duration-200 cursor-pointer font-bold text-xs shadow-2xs group shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.2} />
                    <span className="hidden sm:inline">Menu Principal</span>
                    <span className="sm:hidden">Voltar</span>
                </button>

                <div className="h-6 w-[1px] bg-[#E6EBE8] hidden sm:block" />

                {/* Título Dinâmico do Módulo */}
                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight truncate">
                        {pageTitle}
                    </h1>
                </div>

                {/* Dados da Fazenda / Propriedade */}
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

            {/* Direita: Ações Rápidas Contextuais do Módulo + Seletor de Mês + Perfil do Usuário */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <HeaderActions 
                    activeTab={activeTab}
                    mesAno={mesAno}
                    setMesAno={setMesAno}
                    onQuickAction={onQuickAction}
                />

                <UserProfileMenu 
                    currentUser={currentUser}
                    onLogout={onLogout}
                />
            </div>
        </header>
    );
}
