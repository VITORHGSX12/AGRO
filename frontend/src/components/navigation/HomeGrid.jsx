import React from 'react';
import { MODULES_CONFIG } from './menuConfig';
import ModuleCard from './ModuleCard';

/**
 * Grade responsiva de módulos (3 colunas x 4 linhas no desktop, 2 col no tablet, 1 col no mobile).
 * Filtra automaticamente os módulos autorizados pelo papel (RBAC) do usuário logado.
 */
export default function HomeGrid({ onNavigate, currentUser, counts = {} }) {
    const papel = currentUser?.papel || 'dono';

    // Filtra os módulos autorizados para o perfil atual
    const visibleModules = MODULES_CONFIG.filter(mod => {
        if (!mod.roles) return true;
        return mod.roles.includes(papel);
    });

    return (
        <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {visibleModules.map((mod, index) => (
                    <ModuleCard 
                        key={`${mod.id}-${index}`}
                        mod={mod}
                        onNavigate={onNavigate}
                        counts={counts}
                    />
                ))}
            </div>
        </main>
    );
}
