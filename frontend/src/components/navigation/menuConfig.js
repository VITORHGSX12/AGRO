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
    ArrowLeftRight, 
    Building2,
    CheckCircle2
} from 'lucide-react';

/**
 * Configuração centralizada de todos os módulos do Sistema AGRO.
 * Fonte única da verdade para títulos, ícones, descrições, imagens e controle de acesso RBAC.
 */
export const MODULES_CONFIG = [
    {
        id: 'rebanho',
        title: 'Rebanho',
        description: 'Gerencie seu rebanho, acompanhe os animais e seus dados.',
        icon: Beef,
        image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente'],
        getBadge: (counts) => counts.ativos ? `${counts.ativos} ativos` : null
    },
    {
        id: 'piquetes',
        title: 'Pastos & Piquetes',
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
        image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente'],
        getBadge: (counts) => counts.safrasAtivas ? `${counts.safrasAtivas} ativas` : null
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
        title: 'Sanidade & Protocolos',
        description: 'Controle vacinas, tratamentos e a saúde do seu rebanho.',
        icon: ShieldAlert,
        image: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente'],
        getBadge: (counts) => (counts.vacinasAtrasadas || 0) > 0 ? `${counts.vacinasAtrasadas} atrasada(s)` : null,
        badgeColor: 'bg-[#FEF2F2] text-[#D64545]'
    },
    {
        id: 'movimentacoes',
        title: 'Movimentações de Gado',
        description: 'Acompanhe entradas, saídas e transferências do rebanho.',
        icon: ArrowLeftRight,
        image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
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
        image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente'],
        getBadge: (counts) => counts.colaboradores ? `${counts.colaboradores} pessoas` : null
    },
    {
        id: 'dashboard',
        title: 'Painel Geral',
        description: 'Visão consolidada de indicadores e relatórios da fazenda.',
        icon: BarChart3,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente', 'contador']
    },
    {
        id: 'fazenda',
        title: 'Minha Fazenda',
        description: 'Dados cadastrais da propriedade, área total e localização.',
        icon: Building2,
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente']
    },
    {
        id: 'usuarios',
        title: 'Gestão de Usuários',
        description: 'Controle de acessos e permissões para Dono, Gerente e Contador.',
        icon: Users,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        roles: ['dono']
    },
    {
        id: 'configuracoes',
        title: 'Configurações',
        description: 'Ajustes gerais do sistema, preferências e integrações.',
        icon: Settings2,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        roles: ['dono', 'gerente', 'contador']
    }
];

export const MODULE_TITLES = {
    home: 'Menu Principal',
    dashboard: 'Relatórios & Indicadores',
    rebanho: 'Gestão do Rebanho',
    movimentacoes: 'Movimentações de Animais',
    sanidade: 'Sanidade & Protocolos',
    financeiro: 'Fluxo de Caixa & Finanças',
    piquetes: 'Pastagens & Piquetes',
    agricola: 'Lavouras & Safras',
    patrimonio: 'Patrimônio & Máquinas',
    rh: 'Equipe & RH (Folha)',
    usuarios: 'Usuários & Permissões',
    fazenda: 'Configurações da Propriedade'
};
