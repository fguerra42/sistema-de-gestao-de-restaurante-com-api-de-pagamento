"use client"
import { useEffect, useState } from "react"
import { getRestaurants } from "@/lib/api"
import { Restaurant } from "@/types"
import Link from "next/link"

export default function HomePage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getRestaurants()
            .then((res) => setRestaurants(res.data.restaurants))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</h1>
                <div className="space-x-3">
                    <Link href="/login" className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-orange-500 hover:text-orange-500 transition">
                        Entrar
                    </Link>
                    <Link href="/register" className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition">
                        Criar conta
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="text-center py-16 px-8">
                <h2 className="text-5xl font-bold mb-4">Pede o teu prato favorito</h2>
                <p className="text-gray-400 text-lg">Escolhe um restaurante e faz o teu pedido online</p>
            </div>

            {/* Restaurantes */}
            <div className="max-w-5xl mx-auto px-8 pb-16">
                <h3 className="text-xl font-semibold mb-6 text-gray-300">Restaurantes disponíveis</h3>

                {loading ? (
                    <div className="text-center text-gray-500 py-20">A carregar...</div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">Nenhum restaurante disponível</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant) => (
                            <div key={restaurant.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition group">
                                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl mb-4">
                                    🍴
                                </div>
                                <h4 className="text-lg font-semibold mb-1 group-hover:text-orange-500 transition">
                                    {restaurant.name}
                                </h4>
                                <p className="text-gray-500 text-sm mb-4">{restaurant.address}</p>
                                <Link
                                    href={`/restaurants/${restaurant.id}`}
                                    className="text-orange-500 text-sm font-medium hover:underline"
                                >
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