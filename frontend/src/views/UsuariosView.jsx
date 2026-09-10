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
    { value: 'dono', label: 'Dono (Acesso Total + Gestão de Usuários)', badge: 'bg-[#E8F5EF] text-[#087F5B] border-[#087F5B]/20' },
    { value: 'gerente', label: 'Gerente (Acesso Operacional: Rebanho, Pastos, Agrícola, Patrimônio, RH)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'contador', label: 'Contador (Acesso Exclusivo ao Financeiro e Dashboard)', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
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
                <div className="p-4 bg-[#E8F5EF] border border-[#087F5B]/20 text-[#087F5B] rounded-2xl flex items-center justify-between animate-fade-in shadow-xs">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#087F5B] shrink-0" />
                        <span className="text-sm font-medium">{feedback}</span>
                    </div>
                    <button onClick={() => setFeedback('')} className="text-[#087F5B] hover:text-[#087F5B]/80">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Topbar Info & Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E6EBE8] p-6 rounded-2xl shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-[#087F5B]" />
                        <h2 className="text-base font-bold text-[#172033]">Controle de Usuários & Permissões (RBAC)</h2>
                    </div>
                    <p className="text-xs text-[#64748B]">
                        Gerencie os membros da equipe com acesso ao sistema e defina papéis de acesso estritos.
                    </p>
                </div>

                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-[#087F5B] hover:bg-[#087F5B]/90 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar Usuário</span>
                </button>
            </div>

            {/* Permissions Reference Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#E8F5EF] flex items-center justify-center text-[#087F5B] font-bold text-xs">D</div>
                        <span className="text-xs font-bold text-[#172033]">Perfil: Dono</span>
                    </div>
                    <p className="text-[12px] text-[#64748B] leading-relaxed">
                        Acesso irrestrito a todos os módulos da fazenda, relatórios e gestão de usuários.
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">G</div>
                        <span className="text-xs font-bold text-[#172033]">Perfil: Gerente</span>
                    </div>
                    <p className="text-[12px] text-[#64748B] leading-relaxed">
                        Acesso a Rebanho, Pastos, Sanidade, Agrícola, Máquinas e RH. <strong className="text-[#172033]">Sem acesso a finanças nem usuários</strong>.
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E6EBE8] shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">C</div>
                        <span className="text-xs font-bold text-[#172033]">Perfil: Contador</span>
                    </div>
                    <p className="text-[12px] text-[#64748B] leading-relaxed">
                        Acesso exclusivo ao <strong className="text-[#172033]">Fluxo de Caixa / Financeiro e Dashboard</strong>.
                    </p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-[#E6EBE8] rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-[#E6EBE8] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#087F5B]" />
                        <span>Usuários Cadastrados ({usuarios.length})</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7F9F8] text-[#64748B] font-semibold border-b border-[#E6EBE8]">
                            <tr>
                                <th className="p-4">Nome do Usuário</th>
                                <th className="p-4">E-mail de Acesso</th>
                                <th className="p-4">Papel no Sistema</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Cadastrado em</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6EBE8]">
                            {usuarios.map((u) => {
                                const isSelf = u.id === currentUser?.id;
                                const papelDef = PAPEIS.find(p => p.value === u.papel);
                                return (
                                    <tr key={u.id} className="hover:bg-[#F7F9F8]/70 transition">
                                        <td className="p-4 font-bold text-[#172033] flex items-center gap-2">
                                            <span>{u.nome}</span>
                                            {isSelf && (
                                                <span className="text-[10px] bg-[#E8F5EF] text-[#087F5B] px-2 py-0.5 rounded-full font-medium border border-[#087F5B]/20">
                                                    (Você)
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-[#64748B] font-mono text-[11px]">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border uppercase ${
                                                u.papel === 'dono'
                                                    ? 'bg-[#E8F5EF] border-[#087F5B]/20 text-[#087F5B]'
                                                    : u.papel === 'gerente'
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                    : 'bg-amber-50 border-amber-200 text-amber-700'
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
                                                        ? 'bg-[#E8F5EF] border-[#087F5B]/30 text-[#087F5B] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                                        : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-[#E8F5EF] hover:text-[#087F5B] hover:border-[#087F5B]/30'
                                                } ${isSelf ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                                title={isSelf ? 'Não é permitido desativar sua própria conta' : 'Clique para alternar status'}
                                            >
                                                {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-[#64748B] whitespace-nowrap">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(u)}
                                                    title="Editar Papel / Senha"
                                                    className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-[#F7F9F8] border border-transparent hover:border-[#E6EBE8] rounded-lg transition"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {!isSelf && (
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        title="Excluir Usuário"
                                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition"
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E6EBE8] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-fade-in">
                        <div className="p-6 border-b border-[#E6EBE8] flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-[#087F5B]" />
                                <span>{editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}</span>
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-[#64748B] hover:text-[#172033]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1.5">Nome Completo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Carlos Eduardo"
                                    value={userForm.nome}
                                    onChange={(e) => setUserForm({ ...userForm, nome: e.target.value })}
                                    className="w-full bg-white border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1.5">E-mail corporativo *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Ex: carlos@fazenda.com"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    className="w-full bg-white border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                                    {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha Inicial *'}
                                </label>
                                <input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={userForm.senha}
                                    onChange={(e) => setUserForm({ ...userForm, senha: e.target.value })}
                                    className="w-full bg-white border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">Papel / Permissão *</label>
                                    <select
                                        value={userForm.papel}
                                        onChange={(e) => setUserForm({ ...userForm, papel: e.target.value })}
                                        className="w-full bg-white border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="dono">Dono (Acesso Total)</option>
                                        <option value="gerente">Gerente (Operacional)</option>
                                        <option value="contador">Contador (Financeiro)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">Status *</label>
                                    <select
                                        value={userForm.status}
                                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                                        className="w-full bg-white border border-[#E6EBE8] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:outline-none focus:border-[#087F5B]"
                                    >
                                        <option value="ativo">Ativo</option>
                                        <option value="inativo">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EBE8]">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-[#087F5B] hover:bg-[#087F5B]/90 text-white font-semibold text-xs transition shadow-xs cursor-pointer"
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
