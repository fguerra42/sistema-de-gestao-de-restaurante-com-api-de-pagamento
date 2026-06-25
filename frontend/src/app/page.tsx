"use client"
import { useEffect, useState } from "react"
import { getRestaurants, API_URL } from "@/lib/api"
import { Restaurant } from "@/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

function SkeletonCard() {
    return (
        <div className="bg-[#13131a] border border-[#1f1f2a] rounded-xl p-5 animate-pulse-skeleton">
            <div className="w-full h-40 bg-gray-800 rounded-lg mb-4" />
            <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-1/3" />
        </div>
    )
}

function RestaurantImage({ image, name }: { image?: string | null; name: string }) {
    const [error, setError] = useState(false)
    const src = image ? (image.startsWith("http") ? image : `${API_URL}${image}`) : null

    if (!src || error) {
        return (
            <div className="w-full h-44 bg-gradient-to-br from-orange-900/30 to-gray-800 rounded-xl flex items-center justify-center text-5xl mb-4">
                <span className="opacity-60">🍽</span>
            </div>
        )
    }

    return (
        <img src={src} alt={name} onError={() => setError(true)}
            className="w-full h-44 object-cover rounded-xl mb-4 transition-transform duration-500 group-hover:scale-105" />
    )
}

export default function HomePage() {
    const router = useRouter()
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState("")
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (token && user.name) {
            setIsLoggedIn(true)
            setUserName(user.name)
        }

        getRestaurants()
            .then((res) => setRestaurants(res.data.restaurants))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    function handleLogout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setIsLoggedIn(false)
        setUserName("")
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1f1f2a] px-6 py-4 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                    <span className="text-orange-500">Parcelar</span>
                </Link>
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <span className="text-gray-400 text-sm hidden sm:block">
                                Olá, <span className="text-orange-400 font-medium">{userName}</span>
                            </span>
                            <Link href="/orders" className="text-gray-400 hover:text-orange-400 transition text-sm">
                                Pedidos
                            </Link>
                            <button onClick={handleLogout}
                                className="text-gray-500 hover:text-red-400 transition text-sm">
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login"
                                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-orange-500 hover:text-orange-400 transition text-sm">
                                Entrar
                            </Link>
                            <Link href="/register"
                                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition text-sm font-medium">
                                Criar conta
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="text-center py-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
                <h2 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">
                    Pede o teu <span className="text-orange-500">prato favorito</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                    Escolhe um restaurante, vê o cardápio e faz o teu pedido online
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-6 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-medium text-gray-300">Restaurantes disponíveis</h3>
                    <span className="text-sm text-gray-600">
                        {!loading && `${restaurants.length} restaurante${restaurants.length !== 1 ? "s" : ""}`}
                    </span>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center text-gray-600 py-24">
                        <span className="text-5xl block mb-4">🍽</span>
                        <p className="text-lg">Nenhum restaurante disponível</p>
                        <p className="text-sm mt-2 text-gray-700">Volta mais tarde para novidades</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant) => (
                            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}
                                className="group bg-[#13131a] border border-[#1f1f2a] rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5">
                                <RestaurantImage image={restaurant.image} name={restaurant.name} />
                                <h4 className="text-lg font-semibold mb-1 group-hover:text-orange-400 transition-colors">
                                    {restaurant.name}
                                </h4>
                                <p className="text-gray-600 text-sm mb-4">{restaurant.address}</p>
                                <span className="text-orange-500 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Ver cardápio <span className="text-lg leading-none">→</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
