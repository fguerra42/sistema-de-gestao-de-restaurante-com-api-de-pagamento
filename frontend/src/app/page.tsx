"use client"
import { useEffect, useState } from "react"
import { getRestaurants } from "@/lib/api"
import { Restaurant } from "@/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

const API_URL = "http://localhost:3000"

function RestaurantImage({ image, name }: { image?: string | null; name: string }) {
    const [error, setError] = useState(false)
    const src = image ? (image.startsWith("http") ? image : `${API_URL}${image}`) : null

    if (!src || error) {
        return (
            <div className="w-full h-40 bg-gray-800 rounded-lg flex items-center justify-center text-4xl mb-4">
                🍴
            </div>
        )
    }

    return (
        <img src={src} alt={name} onError={() => setError(true)}
            className="w-full h-40 object-cover rounded-lg mb-4" />
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
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Topbar fixa */}
            <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</h1>
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <span className="text-gray-300 text-sm">
                                Olá, <span className="text-orange-400 font-medium">{userName}</span>
                            </span>
                            <Link href="/orders" className="text-gray-400 hover:text-orange-500 transition text-sm">
                                Os meus pedidos
                            </Link>
                            <button onClick={handleLogout}
                                className="text-gray-400 hover:text-red-400 transition text-sm">
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login"
                                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500 transition">
                                Entrar
                            </Link>
                            <Link href="/register"
                                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition">
                                Criar conta
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="text-center py-16 px-8">
                <h2 className="text-5xl font-bold mb-4">Pede o teu prato favorito</h2>
                <p className="text-gray-400 text-lg">Escolhe um restaurante e faz o teu pedido online</p>
            </div>

            <div className="max-w-5xl mx-auto px-8 pb-16">
                <h3 className="text-xl font-semibold mb-6 text-gray-300">Restaurantes disponíveis</h3>

                {loading ? (
                    <div className="text-center text-gray-500 py-20">A carregar...</div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">Nenhum restaurante disponível</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.id}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition group">
                                <RestaurantImage image={restaurant.image} name={restaurant.name} />
                                <h4 className="text-lg font-semibold mb-1 group-hover:text-orange-500 transition">
                                    {restaurant.name}
                                </h4>
                                <p className="text-gray-500 text-sm mb-4">{restaurant.address}</p>
                                <Link href={`/restaurants/${restaurant.id}`}
                                    className="text-orange-500 text-sm font-medium hover:underline">
                                    Ver cardápio →
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}