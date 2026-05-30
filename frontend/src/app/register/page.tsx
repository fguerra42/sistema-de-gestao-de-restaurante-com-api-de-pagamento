"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { register } from "@/lib/api"
import Link from "next/link"

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await register({ name, email, password, role: "CLIENT" })
            router.push("/login")
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro ao registar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</Link>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-2">Criar conta</h1>
                    <p className="text-gray-400 mb-6">Regista-te para fazer pedidos</p>

                    {error && (
                        <div className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                                placeholder="O teu nome"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition font-medium"
                        >
                            {loading ? "A registar..." : "Criar conta"}
                        </button>
                    </form>

                    <p className="text-center mt-4 text-sm text-gray-400">
                        Já tens conta?{" "}
                        <Link href="/login" className="text-orange-500 hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}