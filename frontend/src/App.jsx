import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginView from './views/LoginView';
import HomeView from './views/HomeView';
import DashboardView from './views/DashboardView';
import RebanhoView from './views/RebanhoView';
import MovimentacoesView from './views/MovimentacoesView';
import SanidadeView from './views/SanidadeView';
import FinanceiroView from './views/FinanceiroView';
import FazendaView from './views/FazendaView';
import RHView from './views/RHView';
import AgricolaView from './views/AgricolaView';
import PatrimonioView from './views/PatrimonioView';
import UsuariosView from './views/UsuariosView';
import { api, getAuthToken } from './services/api';

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('home');
    const [mesAno, setMesAno] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
    
    // Global Data
    const [fazenda, setFazenda] = useState(null);
    const [piquetes, setPiquetes] = useState([]);
    const [counts, setCounts] = useState({ 
        ativos: 0, 
        vacinasAtrasadas: 0, 
        vacinasVencendo: 0, 
        colaboradores: 0,
        safrasAtivas: 0 
    });

    // Quick Action Triggers
    const [triggerModal, setTriggerModal] = useState(null);

    // Verifica sessão inicial
    useEffect(() => {
        const verifyAuth = async () => {
            const token = getAuthToken();
            if (!token) {
                setAuthLoading(false);
                return;
            }

            try {
                const user = await api.getMe();
                setCurrentUser(user);
            } catch (err) {
                console.warn('Sessão expirada:', err);
                api.logout();
                setCurrentUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const loadGlobalState = async () => {
        if (!currentUser) return;
        try {
            const [fazendaData, piquetesData, dashboardData] = await Promise.all([
                api.getFazenda().catch(() => null),
                api.getPiquetes().catch(() => []),
                api.getDashboard({ mes_ano: mesAno }).catch(() => null)
            ]);

            if (fazendaData) setFazenda(fazendaData);
            if (piquetesData) setPiquetes(piquetesData);
            if (dashboardData) {
                setCounts({
                    ativos: dashboardData.rebanho?.total_ativos || 0,
                    vacinasAtrasadas: dashboardData.sanidade?.atrasadas || 0,
                    vacinasVencendo: dashboardData.sanidade?.vencendo_7dias || 0,
                    colaboradores: dashboardData.rh?.total_colaboradores_ativos || 0,
                    safrasAtivas: dashboardData.agricola?.safras_ativas || 0
                });
            }
        } catch (err) {
            console.error('Erro ao carregar estado global:', err);
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadGlobalState();
        }
    }, [currentUser, mesAno]);

    // Redireciona aba se o papel não tiver acesso
    useEffect(() => {
        if (!currentUser) return;
        const papel = currentUser.papel;

        if (papel === 'gerente' && (activeTab === 'financeiro' || activeTab === 'usuarios')) {
            setActiveTab('home');
        } else if (papel === 'contador' && activeTab !== 'home' && activeTab !== 'dashboard' && activeTab !== 'financeiro') {
            setActiveTab('home');
        }
    }, [currentUser, activeTab]);

    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        setActiveTab('home');
    };

    const handleLogout = () => {
        api.logout();
        setCurrentUser(null);
    };

    const handleQuickAction = (actionType) => {
        if (actionType === 'novo_animal') setActiveTab('rebanho');
        else if (actionType === 'nova_movimentacao') setActiveTab('movimentacoes');
        else if (actionType === 'nova_sanidade') setActiveTab('sanidade');
        else if (actionType === 'novo_financeiro') setActiveTab('financeiro');
        else if (actionType === 'novo_piquete') setActiveTab('piquetes');
        else if (actionType === 'novo_colaborador') setActiveTab('rh');
        else if (actionType === 'nova_safra' || actionType === 'novo_talhao') setActiveTab('agricola');
        else if (actionType === 'nova_maquina' || actionType === 'nova_benfeitoria') setActiveTab('patrimonio');

        setTriggerModal(actionType);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Se não estiver logado, exibe tela de login
    if (!currentUser) {
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
    }

    // SE ESTIVER NA HOME: Exibe a tela inicial sem sidebar, ocupando 100% da largura
    if (activeTab === 'home') {
        return (
            <HomeView
                onNavigate={(targetTab) => setActiveTab(targetTab)}
                currentUser={currentUser}
                onLogout={handleLogout}
                fazenda={fazenda}
                counts={counts}
            />
        );
    }

    // PÁGINAS INTERNAS: Exibe com Header completo (sem sidebar) e botão de voltar ao Menu Principal
    return (
        <div className="min-h-screen w-full bg-[#F7F9F8] font-sans text-[#172033] flex flex-col">
            {/* Header Topbar com botão "← Menu Principal" */}
            <Header 
                fazenda={fazenda}
                mesAno={mesAno}
                setMesAno={setMesAno}
                onQuickAction={handleQuickAction}
                activeTab={activeTab}
                currentUser={currentUser}
                onLogout={handleLogout}
                onNavigateHome={() => setActiveTab('home')}
            />

            {/* Main Scrollable View */}
            <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6">
                <div className="w-full max-w-7xl mx-auto pb-12">
                        {activeTab === 'dashboard' && (
                            <DashboardView 
                                mesAno={mesAno} 
                                setActiveTab={setActiveTab} 
                            />
                        )}

                        {activeTab === 'rebanho' && (
                            <RebanhoView 
                                piquetes={piquetes}
                                onReloadPiquetes={loadGlobalState}
                                triggerNewModal={triggerModal === 'novo_animal'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'movimentacoes' && (
                            <MovimentacoesView 
                                piquetes={piquetes}
                                onReloadAll={loadGlobalState}
                                triggerNewModal={triggerModal === 'nova_movimentacao'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'sanidade' && (
                            <SanidadeView 
                                onReloadDashboard={loadGlobalState}
                                triggerNewModal={triggerModal === 'nova_sanidade'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'financeiro' && (
                            <FinanceiroView 
                                mesAno={mesAno}
                                onReloadDashboard={loadGlobalState}
                                triggerNewModal={triggerModal === 'novo_financeiro'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'piquetes' && (
                            <FazendaView 
                                fazenda={fazenda}
                                onReloadFazenda={loadGlobalState}
                                piquetes={piquetes}
                                onReloadPiquetes={loadGlobalState}
                                triggerNewModal={triggerModal === 'novo_piquete'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'rh' && (
                            <RHView 
                                mesAno={mesAno}
                                onReloadDashboard={loadGlobalState}
                                triggerNewModal={triggerModal === 'novo_colaborador'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'agricola' && (
                            <AgricolaView 
                                onReloadDashboard={loadGlobalState}
                                triggerNewModal={triggerModal === 'nova_safra' || triggerModal === 'novo_talhao'}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'patrimonio' && (
                            <PatrimonioView 
                                onReloadDashboard={loadGlobalState}
                                triggerNewModal={triggerModal}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}

                        {activeTab === 'usuarios' && currentUser.papel === 'dono' && (
                            <UsuariosView currentUser={currentUser} />
                        )}

                        {activeTab === 'fazenda' && (
                            <FazendaView 
                                fazenda={fazenda}
                                onReloadFazenda={loadGlobalState}
                                piquetes={piquetes}
                                onReloadPiquetes={loadGlobalState}
                                triggerNewModal={false}
                                onResetTrigger={() => setTriggerModal(null)}
                            />
                        )}
                    </div>
                </main>
        </div>
    );
}
