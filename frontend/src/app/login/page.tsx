"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login, saveToken } from "@/lib/api"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
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
            if (data.role === "ADMIN") {
                router.push("/dashboard")
            } else {
                router.push("/orders")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro ao fazer login")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</Link>
            </nav>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-2">Bem-vindo de volta</h1>
                    <p className="text-gray-400 mb-6">Entra na tua conta</p>

                    {error && (
                        <div className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            {loading ? "A entrar..." : "Entrar"}
                        </button>
                    </form>

                    <p className="text-center mt-4 text-sm text-gray-400">
                        Não tens conta?{" "}
                        <Link href="/register" className="text-orange-500 hover:underline">
                            Criar conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}