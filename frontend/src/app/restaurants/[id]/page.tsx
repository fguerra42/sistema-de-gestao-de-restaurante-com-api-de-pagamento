"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getRestaurants, getProducts, createOrder, createPayment, deleteProduct } from "@/lib/api"
import { Product, Restaurant } from "@/types"
import Link from "next/link"

const API_URL = "http://localhost:3000"

interface CartItem {
    product: Product
    quantity: number
}

function RestaurantImage({ image, name }: { image?: string | null; name: string }) {
    const [error, setError] = useState(false)
    const src = image ? (image.startsWith("http") ? image : `${API_URL}${image}`) : null
    if (!src || error) return null
    return (
        <img src={src} alt={name} onError={() => setError(true)}
            className="w-full h-52 object-cover rounded-xl mb-6" />
    )
}

function ProductImage({ image, name }: { image?: string | null; name: string }) {
    const [error, setError] = useState(false)
    const src = image ? (image.startsWith("http") ? image : `${API_URL}${image}`) : null
    if (!src || error) {
        return (
            <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍽</div>
        )
    }
    return (
        <img src={src} alt={name} onError={() => setError(true)}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
    )
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
    const [userName, setUserName] = useState("")
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        const token = localStorage.getItem("token")
        if (token && user.name) {
            setUserName(user.name)
            setIsLoggedIn(true)
            setIsAdmin(user.role === "ADMIN")
        }

        Promise.all([getRestaurants(), getProducts(Number(id))])
            .then(([restRes, prodRes]) => {
                const found = restRes.data.restaurants.find((r: Restaurant) => r.id === Number(id))
                setRestaurant(found)
                setProducts(prodRes.data.products)
            })
            .finally(() => setLoading(false))
    }, [id])

    function addToCart(product: Product) {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === product.id)
            if (exists) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            return [...prev, { product, quantity: 1 }]
        })
    }

    function removeFromCart(productId: number) {
        setCart(prev => prev.filter(i => i.product.id !== productId))
    }

    async function handleRemoveProduct(productId: number) {
        if (!confirm("Remover este produto? Esta ação não pode ser desfeita.")) return
        try {
            await deleteProduct(Number(id), productId)
            setProducts(prev => prev.filter(p => p.id !== productId))
            // Remove do carrinho também se estava lá
            setCart(prev => prev.filter(i => i.product.id !== productId))
        } catch {
            alert("Erro ao remover produto")
        }
    }

    const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

    async function handleOrder() {
        if (!isLoggedIn) {
            router.push("/login")
            return
        }
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

    function handleLogout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setIsLoggedIn(false)
        setUserName("")
        router.push("/")
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">A carregar...</div>
    )

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Topbar fixa */}
            <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</Link>
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <span className="text-gray-300 text-sm">
                                Olá, <span className="text-orange-400 font-medium">{userName}</span>
                            </span>
                            {/* Link correto para os pedidos do cliente */}
                            <Link href="/orders" className="text-gray-400 hover:text-orange-500 transition text-sm">
                                Os meus pedidos
                            </Link>
                            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition text-sm">
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-gray-400 hover:text-orange-500 transition text-sm">
                                Entrar
                            </Link>
                            <Link href="/register" className="px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition text-sm">
                                Criar conta
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {restaurant && <RestaurantImage image={restaurant.image} name={restaurant.name} />}
                    <h1 className="text-3xl font-bold mb-2">{restaurant?.name}</h1>
                    <p className="text-gray-400 mb-8">{restaurant?.address}</p>

                    {products.length === 0 ? (
                        <div className="text-center text-gray-500 py-20">
                            <p className="text-4xl mb-4">🍽</p>
                            <p>Nenhum produto disponível neste restaurante</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.map(product => (
                                <div key={product.id}
                                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4 items-center hover:border-orange-500 transition">
                                    <ProductImage image={product.image} name={product.name} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg">{product.name}</h3>
                                        {product.description && (
                                            <p className="text-gray-400 text-sm mb-2">{product.description}</p>
                                        )}
                                        <p className="text-orange-500 font-bold">${product.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-shrink-0">
                                        <button onClick={() => addToCart(product)}
                                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm">
                                            + Adicionar
                                        </button>
                                        {/* Botão remover produto — apenas para admins */}
                                        {isAdmin && (
                                            <button onClick={() => handleRemoveProduct(product.id)}
                                                className="text-red-400 hover:text-red-300 text-xs text-center transition border border-red-900 rounded-lg px-4 py-1.5">
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Carrinho — sticky com top ajustado à topbar */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit sticky top-20">
                    <h2 className="text-xl font-bold mb-4">🛒 Carrinho</h2>

                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum item adicionado</p>
                    ) : (
                        <>
                            <div className="space-y-3 mb-4">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex justify-between items-center gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center text-lg">
                                                {item.product.image ? (
                                                    <img
                                                        src={item.product.image.startsWith("http") ? item.product.image : `${API_URL}${item.product.image}`}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover" />
                                                ) : "🍽"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{item.product.name}</p>
                                                <p className="text-gray-400 text-xs">x{item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <p className="text-orange-500 text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item.product.id)}
                                                className="text-red-500 hover:text-red-400 text-xs">✕</button>
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

                            {isLoggedIn && (
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-300 mb-1">Endereço de entrega</label>
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        placeholder="Rua, número..." />
                                </div>
                            )}

                            <button onClick={handleOrder} disabled={ordering}
                                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition font-medium">
                                {ordering ? "A processar..." : isLoggedIn ? "Pagar agora" : "Entrar para pagar"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}