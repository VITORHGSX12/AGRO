import React from 'react';
import { LogOut } from 'lucide-react';

/**
 * Componente atômico para exibição da identificação do usuário logado e ação de logout.
 */
export default function UserProfileMenu({ currentUser, onLogout }) {
    const papelLabel = {
        dono: 'Dono / Admin',
        gerente: 'Gerente',
        contador: 'Contador'
    }[currentUser?.papel] || 'Usuário';

    return (
        <div className="flex items-center gap-2 pl-2 border-l border-[#E6EBE8]">
            <div 
                className="w-8 h-8 rounded-full bg-[#087F5B] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 cursor-default"
                title={`${currentUser?.nome || 'Usuário'} (${papelLabel})`}
            >
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
    );
}
