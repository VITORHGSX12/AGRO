const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
    return localStorage.getItem('agro_auth_token') || '';
}

export function setAuthToken(token) {
    if (token) {
        localStorage.setItem('agro_auth_token', token);
    } else {
        localStorage.removeItem('agro_auth_token');
    }
}

export async function fetchJson(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!res.ok) {
        let errorMsg = 'Erro na requisição';
        try {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
        } catch (e) {
            errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
    }

    return res.json();
}

export const api = {
    // Autenticação
    login: async (credentials) => {
        const data = await fetchJson('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        if (data.token) {
            setAuthToken(data.token);
        }
        return data;
    },
    getMe: () => fetchJson('/auth/me'),
    logout: () => {
        setAuthToken('');
    },

    // Usuários (Gestão de Acessos - exclusivo Dono)
    getUsuarios: () => fetchJson('/usuarios'),
    createUsuario: (data) => fetchJson('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
    updateUsuario: (id, data) => fetchJson(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUsuario: (id) => fetchJson(`/usuarios/${id}`, { method: 'DELETE' }),

    // Fazenda
    getFazenda: () => fetchJson('/fazenda'),
    updateFazenda: (data) => fetchJson('/fazenda', { method: 'PUT', body: JSON.stringify(data) }),

    // Piquetes
    getPiquetes: () => fetchJson('/piquetes'),
    getPiqueteRotacao: (id) => fetchJson(`/piquetes/${id}/rotacao`),
    createPiquete: (data) => fetchJson('/piquetes', { method: 'POST', body: JSON.stringify(data) }),
    createRotacaoPiquete: (id, data) => fetchJson(`/piquetes/${id}/rotacao`, { method: 'POST', body: JSON.stringify(data) }),
    updatePiquete: (id, data) => fetchJson(`/piquetes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePiquete: (id) => fetchJson(`/piquetes/${id}`, { method: 'DELETE' }),

    // Arrendamentos
    getArrendamentos: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tipo) q.append('tipo', params.tipo);
        if (params.status) q.append('status', params.status);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/arrendamentos${query}`);
    },
    createArrendamento: (data) => fetchJson('/arrendamentos', { method: 'POST', body: JSON.stringify(data) }),
    lancarPagamentoArrendamento: (id, data = {}) => fetchJson(`/arrendamentos/${id}/lancar-pagamento`, { method: 'POST', body: JSON.stringify(data) }),
    deleteArrendamento: (id) => fetchJson(`/arrendamentos/${id}`, { method: 'DELETE' }),

    // Animais
    getAnimais: (params = {}) => {
        const q = new URLSearchParams();
        if (params.status) q.append('status', params.status);
        if (params.categoria) q.append('categoria', params.categoria);
        if (params.sexo) q.append('sexo', params.sexo);
        if (params.piquete_id) q.append('piquete_id', params.piquete_id);
        if (params.busca) q.append('busca', params.busca);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/animais${query}`);
    },
    getAnimalById: (id) => fetchJson(`/animais/${id}`),
    createAnimal: (data) => fetchJson('/animais', { method: 'POST', body: JSON.stringify(data) }),
    updateAnimal: (id, data) => fetchJson(`/animais/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAnimal: (id) => fetchJson(`/animais/${id}`, { method: 'DELETE' }),
    getPesagens: (animalId) => fetchJson(`/animais/${animalId}/pesagens`),
    createPesagem: (animalId, data) => fetchJson(`/animais/${animalId}/pesagens`, { method: 'POST', body: JSON.stringify(data) }),
    deletePesagem: (animalId, pesagemId) => fetchJson(`/animais/${animalId}/pesagens/${pesagemId}`, { method: 'DELETE' }),

    // Movimentações
    getMovimentacoes: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tipo) q.append('tipo', params.tipo);
        if (params.animal_id) q.append('animal_id', params.animal_id);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/movimentacoes${query}`);
    },
    createMovimentacao: (data) => fetchJson('/movimentacoes', { method: 'POST', body: JSON.stringify(data) }),

    // Sanidade
    getSanidadeKpis: () => fetchJson('/sanidade/kpis'),
    getSanidade: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tipo) q.append('tipo', params.tipo);
        if (params.status_filtro) q.append('status_filtro', params.status_filtro);
        if (params.animal_id) q.append('animal_id', params.animal_id);
        if (params.busca) q.append('busca', params.busca);
        if (params.data_inicio) q.append('data_inicio', params.data_inicio);
        if (params.data_fim) q.append('data_fim', params.data_fim);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/sanidade${query}`);
    },
    createSanidade: (data) => fetchJson('/sanidade', { method: 'POST', body: JSON.stringify(data) }),
    concluirSanidade: (id, data = {}) => fetchJson(`/sanidade/${id}/concluir`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSanidade: (id) => fetchJson(`/sanidade/${id}`, { method: 'DELETE' }),

    // Financeiro
    getFinanceiro: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tipo) q.append('tipo', params.tipo);
        if (params.categoria) q.append('categoria', params.categoria);
        if (params.mes_ano) q.append('mes_ano', params.mes_ano);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/financeiro${query}`);
    },
    getResumoFinanceiro: (params = {}) => {
        const q = new URLSearchParams();
        if (params.mes_ano) q.append('mes_ano', params.mes_ano);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/financeiro/resumo${query}`);
    },
    createFinanceiro: (data) => fetchJson('/financeiro', { method: 'POST', body: JSON.stringify(data) }),
    deleteFinanceiro: (id) => fetchJson(`/financeiro/${id}`, { method: 'DELETE' }),

    // Dashboard
    getDashboard: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tipo_periodo) q.append('tipo_periodo', params.tipo_periodo);
        if (params.mes_ano) q.append('mes_ano', params.mes_ano);
        if (params.ano_safra) q.append('ano_safra', params.ano_safra);
        if (params.data_inicio) q.append('data_inicio', params.data_inicio);
        if (params.data_fim) q.append('data_fim', params.data_fim);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/dashboard${query}`);
    },

    // Funcionários (RH)
    getFuncionarios: (params = {}) => {
        const q = new URLSearchParams();
        if (params.status) q.append('status', params.status);
        if (params.tipo_contratacao) q.append('tipo_contratacao', params.tipo_contratacao);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/funcionarios${query}`);
    },
    createFuncionario: (data) => fetchJson('/funcionarios', { method: 'POST', body: JSON.stringify(data) }),
    updateFuncionario: (id, data) => fetchJson(`/funcionarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteFuncionario: (id) => fetchJson(`/funcionarios/${id}`, { method: 'DELETE' }),

    // Folha de Pagamento
    getFolha: (mesReferencia) => {
        const query = mesReferencia ? `?mes_referencia=${mesReferencia}` : '';
        return fetchJson(`/folha${query}`);
    },
    updateFolhaItem: (id, data) => fetchJson(`/folha/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    pagarFolhaItem: (id, data = {}) => fetchJson(`/folha/${id}/pagar`, { method: 'POST', body: JSON.stringify(data) }),
    pagarTodasFolhas: (data) => fetchJson('/folha/pagar-todas', { method: 'POST', body: JSON.stringify(data) }),

    // Módulo Agrícola (Talhões, Safras, Insumos)
    getAgricolaKpis: () => fetchJson('/agricola/kpis'),
    getTalhoes: () => fetchJson('/agricola/talhoes'),
    createTalhao: (data) => fetchJson('/agricola/talhoes', { method: 'POST', body: JSON.stringify(data) }),
    updateTalhao: (id, data) => fetchJson(`/agricola/talhoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTalhao: (id) => fetchJson(`/agricola/talhoes/${id}`, { method: 'DELETE' }),

    getSafras: (params = {}) => {
        const q = new URLSearchParams();
        if (params.status) q.append('status', params.status);
        if (params.talhao_id) q.append('talhao_id', params.talhao_id);
        if (params.cultura) q.append('cultura', params.cultura);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/agricola/safras${query}`);
    },
    getSafraById: (id) => fetchJson(`/agricola/safras/${id}`),
    createSafra: (data) => fetchJson('/agricola/safras', { method: 'POST', body: JSON.stringify(data) }),
    updateSafraStatus: (id, data) => fetchJson(`/agricola/safras/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    colherSafra: (id, data) => fetchJson(`/agricola/safras/${id}/colher`, { method: 'POST', body: JSON.stringify(data) }),
    deleteSafra: (id) => fetchJson(`/agricola/safras/${id}`, { method: 'DELETE' }),

    getInsumos: (params = {}) => {
        const q = new URLSearchParams();
        if (params.safra_id) q.append('safra_id', params.safra_id);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/agricola/insumos${query}`);
    },
    createInsumo: (data) => fetchJson('/agricola/insumos', { method: 'POST', body: JSON.stringify(data) }),
    deleteInsumo: (id) => fetchJson(`/agricola/insumos/${id}`, { method: 'DELETE' }),

    // Módulo Patrimônio & Maquinário
    getPatrimonioResumo: () => fetchJson('/patrimonio/resumo'),

    getBenfeitorias: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tipo) q.append('tipo', params.tipo);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/patrimonio/benfeitorias${query}`);
    },
    createBenfeitoria: (data) => fetchJson('/patrimonio/benfeitorias', { method: 'POST', body: JSON.stringify(data) }),
    updateBenfeitoria: (id, data) => fetchJson(`/patrimonio/benfeitorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteBenfeitoria: (id) => fetchJson(`/patrimonio/benfeitorias/${id}`, { method: 'DELETE' }),

    getMaquinas: (params = {}) => {
        const q = new URLSearchParams();
        if (params.status) q.append('status', params.status);
        if (params.tipo) q.append('tipo', params.tipo);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/patrimonio/maquinas${query}`);
    },
    getMaquinaById: (id) => fetchJson(`/patrimonio/maquinas/${id}`),
    createMaquina: (data) => fetchJson('/patrimonio/maquinas', { method: 'POST', body: JSON.stringify(data) }),
    updateMaquina: (id, data) => fetchJson(`/patrimonio/maquinas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMaquina: (id) => fetchJson(`/patrimonio/maquinas/${id}`, { method: 'DELETE' }),

    getManutencoes: (params = {}) => {
        const q = new URLSearchParams();
        if (params.maquina_id) q.append('maquina_id', params.maquina_id);
        const query = q.toString() ? `?${q.toString()}` : '';
        return fetchJson(`/patrimonio/manutencoes${query}`);
    },
    createManutencao: (data) => fetchJson('/patrimonio/manutencoes', { method: 'POST', body: JSON.stringify(data) }),
    deleteManutencao: (id) => fetchJson(`/patrimonio/manutencoes/${id}`, { method: 'DELETE' })
};
