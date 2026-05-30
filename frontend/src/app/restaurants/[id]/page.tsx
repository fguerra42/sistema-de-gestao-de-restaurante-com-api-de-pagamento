"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getRestaurants, getProducts, createOrder, createPayment } from "@/lib/api"
import { Product, Restaurant } from "@/types"
import Link from "next/link"

interface CartItem {
    product: Product
    quantity: number
}

export default function RestaurantPage() {
    const { id } = useParams()
    const router = useRouter()
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [address, setAddress] = useState("")
    const [loading, setLoading] = useState(true)
    const [ordering, setOrdering] = useState(false)

    useEffect(() => {
        Promise.all([
            getRestaurants(),
            getProducts(Number(id))
        ]).then(([restRes, prodRes]) => {
            const found = restRes.data.restaurants.find((r: Restaurant) => r.id === Number(id))
            setRestaurant(found)
            setProducts(prodRes.data.products)
        }).finally(() => setLoading(false))
    }, [id])

    function addToCart(product: Product) {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id)
            if (exists) {
                return prev.map(i => i.product.id === product.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    function removeFromCart(productId: number) {
        setCart(prev => prev.filter(i => i.product.id !== productId))
    }

    const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

    async function handleOrder() {
        if (!address) return alert("Insere o endereço de entrega!")
        if (cart.length === 0) return alert("Adiciona produtos ao carrinho!")

        setOrdering(true)
        try {
            const orderRes = await createOrder({
                restaurantId: Number(id),
                deliveryAddress: address,
                items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
            })

            const paymentRes = await createPayment(orderRes.data.data.id)
            window.location.href = paymentRes.data.url
        } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao criar pedido")
        } finally {
            setOrdering(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">A carregar...</div>

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</Link>
                <Link href="/orders" className="text-gray-300 hover:text-orange-500 transition">Os meus pedidos</Link>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Produtos */}
                <div className="lg:col-span-2">
                    <h1 className="text-3xl font-bold mb-2">{restaurant?.name}</h1>
                    <p className="text-gray-400 mb-8">{restaurant?.address}</p>

                    <div className="space-y-4">
                        {products.map(product => (
                            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-between items-center hover:border-orange-500 transition">
                                <div>
                                    <h3 className="font-semibold text-lg">{product.name}</h3>
                                    <p className="text-gray-400 text-sm mb-2">{product.description}</p>
                                    <p className="text-orange-500 font-bold">${product.price.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => addToCart(product)}
                                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                                >
                                    + Adicionar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Carrinho */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit">
                    <h2 className="text-xl font-bold mb-4">🛒 Carrinho</h2>

                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum item adicionado</p>
                    ) : (
                        <>
                            <div className="space-y-3 mb-4">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium">{item.product.name}</p>
                                            <p className="text-gray-400 text-xs">x{item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-orange-500 text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="text-red-500 hover:text-red-400 text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-700 pt-3 mb-4">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-500">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-300 mb-1">Endereço de entrega</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                    placeholder="Rua, número..."
                                />
                            </div>

                            <button
                                onClick={handleOrder}
                                disabled={ordering}
                                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition font-medium"
                            >
                                {ordering ? "A processar..." : "Pagar agora"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}