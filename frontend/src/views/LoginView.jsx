import React, { useState } from 'react';
import { 
    Sprout, 
    Lock, 
    Mail, 
    ArrowRight, 
    AlertCircle,
    ShieldCheck
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
        <div className="min-h-screen w-full bg-[#F7F9F8] flex flex-col justify-center items-center p-4 selection:bg-[#E8F5EF] selection:text-[#087F5B] relative overflow-hidden">
            {/* Background Decorative Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#087F5B]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#159A70]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md z-10 space-y-6">
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F5EF] border border-[#087F5B]/20 shadow-xs mb-1">
                        <Sprout className="w-7 h-7 text-[#087F5B]" strokeWidth={2} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center justify-center gap-2">
                        Fazenda GD
                        <span className="text-[#087F5B] text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F5EF] border border-[#087F5B]/20">
                            SaaS Agro
                        </span>
                    </h1>
                    <p className="text-xs text-[#64748B] font-normal">Plataforma Integrada de Gestão Agropecuária & Fazendas</p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-[#E6EBE8] rounded-3xl p-8 shadow-xl shadow-[#143C2D]/5 space-y-5">
                    <div>
                        <h2 className="text-base font-bold text-[#172033] tracking-tight">Acesso ao Sistema</h2>
                        <p className="text-xs text-[#64748B] mt-0.5">Informe seu usuário ou e-mail e senha cadastrados</p>
                    </div>

                    {/* Dica de Acesso Rápido / Credenciais Configuradas */}
                    <div className="p-3.5 bg-[#F7F9F8] border border-[#E6EBE8] rounded-2xl">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-[#087F5B] uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Acesso Oficial do Sistema
                            </span>
                            <button
                                type="button"
                                onClick={() => preencherCredencial('fazendagdapp', 'app2026@')}
                                className="text-[11px] font-semibold text-[#087F5B] hover:underline cursor-pointer"
                            >
                                Usar este acesso
                            </button>
                        </div>
                        <div className="text-xs text-[#172033] space-y-1">
                            <div><strong className="text-[#64748B] font-medium">Usuário:</strong> <code className="text-[#087F5B] bg-white border border-[#E6EBE8] px-1.5 py-0.5 rounded font-mono text-[11px]">fazendagdapp</code></div>
                            <div><strong className="text-[#64748B] font-medium">Senha:</strong> <code className="text-[#087F5B] bg-white border border-[#E6EBE8] px-1.5 py-0.5 rounded font-mono text-[11px]">app2026@</code></div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Usuário ou E-mail</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    required
                                    placeholder="fazendagdapp ou seu@email.com"
                                    value={loginInput}
                                    onChange={(e) => setLoginInput(e.target.value)}
                                    className="w-full bg-white border border-[#E6EBE8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#087F5B] transition shadow-2xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#172033] mb-1.5">Senha</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full bg-white border border-[#E6EBE8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#087F5B] transition shadow-2xs"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-[#087F5B] hover:bg-[#087F5B]/90 text-white font-semibold text-xs py-3 rounded-xl shadow-sm transition duration-200 disabled:opacity-50 cursor-pointer"
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

                <div className="text-center text-[11px] text-[#64748B]">
                    Fazenda GD • Gestão Pecuária, Agrícola & Financeira
                </div>
            </div>
        </div>
    );
}
