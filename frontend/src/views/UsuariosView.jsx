import React, { useState, useEffect } from 'react';
import { 
    Users, 
    UserPlus, 
    ShieldCheck, 
    UserCheck, 
    Calculator, 
    Edit, 
    Trash2, 
    Check, 
    X, 
    AlertCircle, 
    CheckCircle2, 
    Key, 
    Mail, 
    ShieldAlert,
    Lock
} from 'lucide-react';
import { api } from '../services/api';

const PAPEIS = [
    { value: 'dono', label: 'Dono (Acesso Total + Gestão de Usuários)', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'gerente', label: 'Gerente (Acesso Operacional: Rebanho, Pastos, Agrícola, Patrimônio, RH)', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'contador', label: 'Contador (Acesso Exclusivo ao Financeiro e Dashboard)', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
];

export default function UsuariosView({ currentUser }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    // Modal Create / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        nome: '',
        email: '',
        senha: '',
        papel: 'gerente',
        status: 'ativo'
    });
    const [modalError, setModalError] = useState('');

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const data = await api.getUsuarios();
            setUsuarios(data);
        } catch (err) {
            setError(err.message || 'Erro ao listar usuários');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsuarios();
    }, []);

    const handleOpenNew = () => {
        setEditingUser(null);
        setUserForm({
            nome: '',
            email: '',
            senha: '',
            papel: 'gerente',
            status: 'ativo'
        });
        setModalError('');
        setModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setUserForm({
            nome: user.nome,
            email: user.email,
            senha: '',
            papel: user.papel,
            status: user.status
        });
        setModalError('');
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setModalError('');

        try {
            if (editingUser) {
                await api.updateUsuario(editingUser.id, userForm);
                setFeedback('Usuário atualizado com sucesso!');
            } else {
                if (!userForm.senha || userForm.senha.length < 6) {
                    setModalError('A senha inicial deve ter no mínimo 6 caracteres');
                    return;
                }
                await api.createUsuario(userForm);
                setFeedback('Usuário cadastrado com sucesso!');
            }

            setModalOpen(false);
            loadUsuarios();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            setModalError(err.message);
        }
    };

    const handleDelete = async (user) => {
        if (user.id === currentUser?.id) {
            alert('Você não pode excluir sua própria conta conectada.');
            return;
        }

        if (!window.confirm(`Deseja realmente remover o usuário "${user.nome}" (${user.email})?`)) return;

        try {
            await api.deleteUsuario(user.id);
            setFeedback('Usuário removido com sucesso!');
            loadUsuarios();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleStatus = async (user) => {
        if (user.id === currentUser?.id) {
            alert('Você não pode desativar sua própria conta.');
            return;
        }

        const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
        try {
            await api.updateUsuario(user.id, { status: newStatus });
            setFeedback(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
            loadUsuarios();
            setTimeout(() => setFeedback(''), 4000);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Feedback Alert */}
            {feedback && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-sm font-medium">{feedback}</span>
                    </div>
                    <button onClick={() => setFeedback('')} className="text-emerald-400 hover:text-emerald-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl flex items-center gap-3 text-xs">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Topbar Info & Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-base font-bold text-white">Controle de Usuários & Permissões (RBAC)</h2>
                    </div>
                    <p className="text-xs text-slate-400">
                        Gerencie os membros da equipe com acesso ao sistema e defina papéis de acesso estritos.
                    </p>
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar Usuário</span>
                </button>
            </div>

            {/* Permissions Reference Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">D</div>
                        <span className="text-xs font-bold text-white">Perfil: Dono</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Acesso irrestrito a todos os módulos da fazenda, relatórios e gestão de usuários.
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">G</div>
                        <span className="text-xs font-bold text-white">Perfil: Gerente</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Acesso a Rebanho, Pastos, Sanidade, Agrícola, Máquinas e RH. <strong>Sem acesso a finanças nem usuários</strong>.
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xs">C</div>
                        <span className="text-xs font-bold text-white">Perfil: Contador</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                        Acesso exclusivo ao <strong>Fluxo de Caixa / Financeiro e Dashboard</strong>.
                    </p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Usuários Cadastrados ({usuarios.length})</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                            <tr>
                                <th className="p-4">Nome do Usuário</th>
                                <th className="p-4">E-mail de Acesso</th>
                                <th className="p-4">Papel no Sistema</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Cadastrado em</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {usuarios.map((u) => {
                                const isSelf = u.id === currentUser?.id;
                                const papelDef = PAPEIS.find(p => p.value === u.papel);
                                return (
                                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                                        <td className="p-4 font-bold text-white flex items-center gap-2">
                                            <span>{u.nome}</span>
                                            {isSelf && (
                                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-normal border border-slate-700">
                                                    (Você)
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border uppercase ${
                                                u.papel === 'dono'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : u.papel === 'gerente'
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                            }`}>
                                                {u.papel}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                disabled={isSelf}
                                                className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition ${
                                                    u.status === 'ativo'
                                                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                                        : 'bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
                                                } ${isSelf ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                                title={isSelf ? 'Não é permitido desativar sua própria conta' : 'Clique para alternar status'}
                                            >
                                                {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-slate-400 whitespace-nowrap">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(u)}
                                                    title="Editar Papel / Senha"
                                                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {!isSelf && (
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        title="Excluir Usuário"
                                                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CADASTRAR / EDITAR USUÁRIO */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-emerald-400" />
                                <span>{editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}</span>
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Carlos Eduardo"
                                    value={userForm.nome}
                                    onChange={(e) => setUserForm({ ...userForm, nome: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail corporativo *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Ex: carlos@fazenda.com"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha Inicial *'}
                                </label>
                                <input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={userForm.senha}
                                    onChange={(e) => setUserForm({ ...userForm, senha: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Papel / Permissão *</label>
                                    <select
                                        value={userForm.papel}
                                        onChange={(e) => setUserForm({ ...userForm, papel: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="dono">Dono (Acesso Total)</option>
                                        <option value="gerente">Gerente (Operacional)</option>
                                        <option value="contador">Contador (Financeiro)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status *</label>
                                    <select
                                        value={userForm.status}
                                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
                                >
                                    {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
