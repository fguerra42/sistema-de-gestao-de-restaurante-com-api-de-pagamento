"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login, saveToken } from "@/lib/api"
import Link from "next/link"
import { useToast } from "@/lib/ToastContext"

export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await login({ email, password })
            const { token, data } = response.data
            saveToken(token)
            localStorage.setItem("user", JSON.stringify(data))
            toast("Login efetuado com sucesso!", "success")
            if (data.role === "ADMIN") {
                router.push("/dashboard")
            } else {
                router.push("/orders")
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Erro ao fazer login"
            setError(msg)
            toast(msg, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
            <nav className="bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1f1f2a] px-6 py-4 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-orange-500">Parcelar</Link>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-8 w-full max-w-md animate-fade-in">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
                        <p className="text-gray-500 mt-1">Entra na tua conta para continuar</p>
                    </div>

                    {error && (
                        <div className="bg-red-900/30 border border-red-800/50 text-red-300 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <span>✕</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: "spin-slow 0.8s linear infinite" }} />
                                    A entrar...
                                </span>
                            ) : "Entrar"}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm text-gray-600">
                        Não tens conta?{" "}
                        <Link href="/register" className="text-orange-500 hover:text-orange-400 transition font-medium">
                            Criar conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
