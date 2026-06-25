"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getRestaurants, getProducts, createOrder, createPayment, deleteProduct, API_URL } from "@/lib/api"
import { Product, Restaurant } from "@/types"
import Link from "next/link"
import { useToast } from "@/lib/ToastContext"

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
            className="w-full h-56 object-cover rounded-2xl mb-6" />
    )
}

function ProductImage({ image, name }: { image?: string | null; name: string }) {
    const [error, setError] = useState(false)
    const src = image ? (image.startsWith("http") ? image : `${API_URL}${image}`) : null
    if (!src || error) {
        return (
            <div className="w-20 h-20 bg-[#1a1a24] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍽</div>
        )
    }
    return (
        <img src={src} alt={name} onError={() => setError(true)}
            className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
    )
}

export default function RestaurantPage() {
    const { id } = useParams()
    const router = useRouter()
    const { toast } = useToast()
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
        toast(`${product.name} adicionado ao carrinho`, "success")
    }

    function removeFromCart(productId: number) {
        setCart(prev => prev.filter(i => i.product.id !== productId))
    }

    function decreaseQuantity(productId: number) {
        setCart(prev => {
            const exists = prev.find(i => i.product.id === productId)
            if (!exists) return prev
            if (exists.quantity <= 1) return prev.filter(i => i.product.id !== productId)
            return prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
        })
    }

    function increaseQuantity(productId: number) {
        setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i))
    }

    async function handleRemoveProduct(productId: number) {
        if (!confirm("Remover este produto? Esta ação não pode ser desfeita.")) return
        try {
            await deleteProduct(Number(id), productId)
            setProducts(prev => prev.filter(p => p.id !== productId))
            setCart(prev => prev.filter(i => i.product.id !== productId))
            toast("Produto removido", "success")
        } catch {
            toast("Erro ao remover produto", "error")
        }
    }

    const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

    async function handleOrder() {
        if (!isLoggedIn) {
            router.push("/login")
            return
        }
        if (!address) return toast("Insere o endereço de entrega!", "error")
        if (cart.length === 0) return toast("Adiciona produtos ao carrinho!", "error")

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
            toast(err.response?.data?.message || "Erro ao criar pedido", "error")
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
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <span className="inline-block w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full" style={{ animation: "spin-slow 0.8s linear infinite" }} />
                <span className="text-gray-500 text-sm">A carregar...</span>
            </div>
        </div>
    )

    const availableProducts = products.filter(p => p.available)

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1f1f2a] px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold text-orange-500">Parcelar</Link>
                    <span className="text-gray-700 hidden sm:block">/</span>
                    <span className="text-gray-400 text-sm hidden sm:block">{restaurant?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    {cartCount > 0 && (
                        <span className="text-sm text-gray-400 hidden sm:block">
                            🛒 {cartCount} item{cartCount !== 1 ? "s" : ""}
                        </span>
                    )}
                    {isLoggedIn ? (
                        <>
                            <span className="text-gray-400 text-sm hidden sm:block">
                                Olá, <span className="text-orange-400 font-medium">{userName}</span>
                            </span>
                            <Link href="/orders" className="text-gray-400 hover:text-orange-400 transition text-sm">
                                Pedidos
                            </Link>
                            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition text-sm">
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-gray-400 hover:text-orange-400 transition text-sm">
                                Entrar
                            </Link>
                            <Link href="/register" className="px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition text-sm font-medium">
                                Criar conta
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {restaurant && <RestaurantImage image={restaurant.image} name={restaurant.name} />}
                    <h1 className="text-3xl font-bold mb-1">{restaurant?.name}</h1>
                    <p className="text-gray-500 mb-8">{restaurant?.address}</p>

                    {availableProducts.length === 0 ? (
                        <div className="text-center text-gray-600 py-20">
                            <p className="text-5xl mb-4">🍽</p>
                            <p className="text-lg">Nenhum produto disponível</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {products.map(product => {
                                const cartItem = cart.find(i => i.product.id === product.id)
                                return (
                                    <div key={product.id}
                                        className={`bg-[#13131a] border ${!product.available ? "border-gray-800/50 opacity-50" : "border-[#1f1f2a] hover:border-orange-500/50"} rounded-xl p-5 flex gap-4 items-center transition-all duration-200`}>
                                        <ProductImage image={product.image} name={product.name} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-lg">{product.name}</h3>
                                            {product.description && (
                                                <p className="text-gray-500 text-sm mb-1">{product.description}</p>
                                            )}
                                            <p className="text-orange-500 font-bold">${product.price.toFixed(2)}</p>
                                            {!product.available && (
                                                <p className="text-red-400 text-xs mt-1">Indisponível</p>
                                            )}
                                        </div>
                                        {product.available && (
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {cartItem ? (
                                                    <div className="flex items-center gap-2 bg-[#1a1a24] rounded-lg p-1">
                                                        <button onClick={() => decreaseQuantity(product.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-700 transition text-gray-400 hover:text-white">
                                                            −
                                                        </button>
                                                        <span className="text-sm font-medium w-6 text-center">{cartItem.quantity}</span>
                                                        <button onClick={() => increaseQuantity(product.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-700 transition text-gray-400 hover:text-white">
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => addToCart(product)}
                                                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm font-medium">
                                                        + Adicionar
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button onClick={() => handleRemoveProduct(product.id)}
                                                        className="text-red-500 hover:text-red-400 text-xs text-center transition">
                                                        Remover
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-6 sticky top-24 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Carrinho</h2>
                            {cartCount > 0 && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <p className="text-gray-600 text-sm py-8 text-center">
                                Nenhum item adicionado
                            </p>
                        ) : (
                            <>
                                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="flex justify-between items-center gap-2 p-2 bg-[#1a1a24] rounded-xl">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a2a35] flex items-center justify-center text-lg">
                                                    {item.product.image ? (
                                                        <img
                                                            src={item.product.image.startsWith("http") ? item.product.image : `${API_URL}${item.product.image}`}
                                                            alt={item.product.name}
                                                            className="w-full h-full object-cover" />
                                                    ) : "🍽"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                                                    <p className="text-gray-500 text-xs">${item.product.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => decreaseQuantity(item.product.id)}
                                                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 transition text-gray-400 hover:text-white text-xs">
                                                        −
                                                    </button>
                                                    <span className="text-xs w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => increaseQuantity(item.product.id)}
                                                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 transition text-gray-400 hover:text-white text-xs">
                                                        +
                                                    </button>
                                                </div>
                                                <p className="text-orange-500 text-sm font-medium w-16 text-right">${(item.product.price * item.quantity).toFixed(2)}</p>
                                                <button onClick={() => removeFromCart(item.product.id)}
                                                    className="text-gray-600 hover:text-red-400 transition text-xs">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[#1f1f2a] pt-4 mb-4 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Subtotal</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-orange-500">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {isLoggedIn && (
                                    <div className="mb-4">
                                        <label className="block text-sm text-gray-400 mb-1.5">Endereço de entrega</label>
                                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
                                            placeholder="Rua, número, bairro..." />
                                    </div>
                                )}

                                <button onClick={handleOrder} disabled={ordering || cart.length === 0}
                                    className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm">
                                    {ordering ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: "spin-slow 0.8s linear infinite" }} />
                                            A processar...
                                        </span>
                                    ) : isLoggedIn ? "Pagar agora" : "Entrar para pagar"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
