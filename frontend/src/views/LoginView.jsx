import React, { useState } from 'react';
import { 
    Beef, 
    Lock, 
    Mail, 
    ArrowRight, 
    AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
    const [loginInput, setLoginInput] = useState('fazendagdapp');
    const [senha, setSenha] = useState('app2026@');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await api.login({ 
                usuario: loginInput, 
                email: loginInput, 
                senha 
            });
            if (data && data.user) {
                onLoginSuccess(data.user);
            }
        } catch (err) {
            setError(err.message || 'Falha ao autenticar. Verifique seu usuário e senha.');
        } finally {
            setLoading(false);
        }
    };

    const preencherCredencial = (user, pass) => {
        setLoginInput(user);
        setSenha(pass);
        setError('');
    };

    return (
        <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
            {/* Background Decorative Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md z-10 space-y-6">
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/20 mb-2">
                        <Beef className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                        AGRO<span className="text-emerald-400 text-sm font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">SaaS</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">Plataforma Integrada de Gestão Agropecuária & Fazendas</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-2xl shadow-black/60 space-y-5">
                    <div>
                        <h2 className="text-base font-bold text-white tracking-tight">Acesso ao Sistema</h2>
                        <p className="text-xs text-slate-400">Informe seu usuário ou e-mail e senha cadastrados</p>
                    </div>

                    {/* Dica de Acesso Rápido / Credenciais Configuradas */}
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Acesso Oficial do Sistema</span>
                            <button
                                type="button"
                                onClick={() => preencherCredencial('fazendagdapp', 'app2026@')}
                                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                            >
                                Usar este acesso
                            </button>
                        </div>
                        <div className="text-xs text-slate-300 space-y-0.5">
                            <div><strong className="text-slate-400">Usuário:</strong> <code className="text-emerald-300 bg-slate-950/60 px-1.5 py-0.5 rounded">fazendagdapp</code></div>
                            <div><strong className="text-slate-400">Senha:</strong> <code className="text-emerald-300 bg-slate-950/60 px-1.5 py-0.5 rounded">app2026@</code></div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Usuário ou E-mail</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    required
                                    placeholder="fazendagdapp ou seu@email.com"
                                    value={loginInput}
                                    onChange={(e) => setLoginInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition duration-200 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Entrar no Painel da Fazenda</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center text-[11px] text-slate-500">
                    Sistema AGRO SaaS • Gestão Pecuária, Agrícola & Financeira
                </div>
            </div>
        </div>
    );
}
