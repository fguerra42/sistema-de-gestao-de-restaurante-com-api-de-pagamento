"use client"
import { useEffect, useRef, useState } from "react"
import { getOrders, updateOrderStatus, getPayments, createRestaurant, createProduct, getRestaurants, deleteRestaurant, deleteProduct, getProducts } from "@/lib/api"
import api from "@/lib/api"
import { Order, Restaurant, Product } from "@/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"

const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-900 text-yellow-300",
    ACCEPTED: "bg-blue-900 text-blue-300",
    PREPARING: "bg-purple-900 text-purple-300",
    DELIVERING: "bg-orange-900 text-orange-300",
    COMPLETED: "bg-green-900 text-green-300",
    CANCELLED: "bg-red-900 text-red-300"
}

const statusLabels: Record<string, string> = {
    PENDING: "Pendente",
    ACCEPTED: "Aceite",
    PREPARING: "A preparar",
    DELIVERING: "A entregar",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado"
}

const nextStatus: Record<string, string> = {
    PENDING: "ACCEPTED",
    ACCEPTED: "PREPARING",
    PREPARING: "DELIVERING",
    DELIVERING: "COMPLETED"
}

const paymentStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-900 text-yellow-300",
    PAID: "bg-green-900 text-green-300",
    FAILED: "bg-red-900 text-red-300",
    REFUNDED: "bg-gray-700 text-gray-300"
}

type UserItem = {
    id: number
    name: string
    email: string
    role: "CLIENT" | "ADMIN"
    phone: string | null
    photo: string | null
    blocked: boolean
    createdAt: string
    _count: { orders: number; reviews: number }
}

const getUsers = () => api.get("/users")
const toggleBlockUser = (id: number, blocked: boolean) => api.patch(`/users/${id}`, { blocked })
const deleteUser = (id: number) => api.delete(`/users/${id}`)
const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return res.data.url
}

function ImageUpload({ label, onUploaded }: { label: string; onUploaded: (url: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [done, setDone] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPreview(URL.createObjectURL(file))
        setDone(false)
        setUploading(true)
        try {
            const url = await uploadImage(file)
            onUploaded(url)
            setDone(true)
        } catch {
            alert("Erro ao fazer upload da imagem")
            setPreview(null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <label className="block text-sm text-gray-300 mb-1">{label}</label>
            <div
                onClick={() => inputRef.current?.click()}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:border-orange-500 transition relative"
                style={{ minHeight: 100 }}
            >
                {preview ? (
                    <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: 140 }} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-1">
                        <span className="text-2xl">🖼️</span>
                        <span className="text-gray-400 text-xs">Clique para selecionar imagem</span>
                        <span className="text-gray-600 text-xs">JPG, PNG, WEBP · Máx. 5MB</span>
                    </div>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-sm text-white font-medium">
                        A enviar...
                    </div>
                )}
            </div>
            {done && <p className="text-green-400 text-xs mt-1">✅ Upload concluído</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </div>
    )
}

export default function DashboardPage() {
    const router = useRouter()

    const [orders, setOrders] = useState<Order[]>([])
    const [payments, setPayments] = useState<any[]>([])
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [users, setUsers] = useState<UserItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"orders" | "payments" | "restaurants" | "users">("orders")

    const [restName, setRestName] = useState("")
    const [restAddress, setRestAddress] = useState("")
    const [restImage, setRestImage] = useState("")
    const [restLoading, setRestLoading] = useState(false)

    const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
    const [prodName, setProdName] = useState("")
    const [prodDescription, setProdDescription] = useState("")
    const [prodPrice, setProdPrice] = useState("")
    const [prodImage, setProdImage] = useState("")
    const [prodLoading, setProdLoading] = useState(false)

    const [userSearch, setUserSearch] = useState("")

    // ── Produtos expandidos por restaurante ──────────────────────────────────
    const [expandedRestaurant, setExpandedRestaurant] = useState<number | null>(null)
    const [restaurantProducts, setRestaurantProducts] = useState<Record<number, Product[]>>({})
    const [loadingProducts, setLoadingProducts] = useState<number | null>(null)

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (user.role !== "ADMIN") {
            router.push("/login")
            return
        }

        Promise.all([getOrders(), getPayments(), getRestaurants()])
            .then(([ordersRes, paymentsRes, restaurantsRes]) => {
                setOrders(ordersRes.data.data)
                setPayments(paymentsRes.data.data)
                setRestaurants(restaurantsRes.data.restaurants)
            })
            .finally(() => setLoading(false))

        const socket = io("http://localhost:3000")
        socket.on("order_status", (data: { orderId: number; status: string }) => {
            setOrders(prev =>
                prev.map(order =>
                    order.id === data.orderId ? { ...order, status: data.status as Order["status"] } : order
                )
            )
        })
        return () => { socket.disconnect() }
    }, [])

    useEffect(() => {
        if (activeTab !== "users" || users.length > 0) return
        getUsers()
            .then(res => { if (res.data.success) setUsers(res.data.users) })
            .catch(() => alert("Erro ao carregar utilizadores"))
    }, [activeTab])

    async function handleToggleProducts(restaurantId: number) {
        // Fecha se já estava aberto
        if (expandedRestaurant === restaurantId) {
            setExpandedRestaurant(null)
            return
        }

        setExpandedRestaurant(restaurantId)

        // Só carrega se ainda não tiver em cache
        if (restaurantProducts[restaurantId]) return

        setLoadingProducts(restaurantId)
        try {
            const res = await getProducts(restaurantId)
            setRestaurantProducts(prev => ({ ...prev, [restaurantId]: res.data.products }))
        } catch {
            alert("Erro ao carregar produtos")
        } finally {
            setLoadingProducts(null)
        }
    }

    async function handleRemoveProduct(restaurantId: number, productId: number, productName: string) {
        if (!confirm(`Remover "${productName}"? Esta ação não pode ser desfeita.`)) return
        try {
            await deleteProduct(restaurantId, productId)
            setRestaurantProducts(prev => ({
                ...prev,
                [restaurantId]: prev[restaurantId].filter(p => p.id !== productId)
            }))
            // Atualiza contagem no restaurante
            setRestaurants(prev => prev.map(r =>
                r.id === restaurantId
                    ? { ...r, products: (r.products || []).filter((p: any) => p.id !== productId) }
                    : r
            ))
        } catch {
            alert("Erro ao remover produto")
        }
    }

    async function handleCreateRestaurant(e: React.FormEvent) {
        e.preventDefault()
        setRestLoading(true)
        try {
            await createRestaurant({ name: restName, address: restAddress, image: restImage || undefined })
            const res = await getRestaurants()
            setRestaurants(res.data.restaurants)
            setRestName("")
            setRestAddress("")
            setRestImage("")
            alert("Restaurante criado!")
        } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao criar restaurante")
        } finally {
            setRestLoading(false)
        }
    }

    async function handleCreateProduct(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedRestaurant) return alert("Seleciona um restaurante!")
        setProdLoading(true)
        try {
            await createProduct(selectedRestaurant, {
                name: prodName,
                description: prodDescription,
                price: parseFloat(prodPrice),
                image: prodImage || undefined
            })
            // Invalida cache de produtos desse restaurante para recarregar
            setRestaurantProducts(prev => {
                const updated = { ...prev }
                delete updated[selectedRestaurant]
                return updated
            })
            setProdName("")
            setProdDescription("")
            setProdPrice("")
            setProdImage("")
            alert("Produto criado!")
        } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao criar produto")
        } finally {
            setProdLoading(false)
        }
    }

    async function handleRemoveRestaurant(id: number, name: string) {
        if (!confirm(`Remover "${name}"? Todos os produtos serão apagados. Esta ação não pode ser desfeita.`)) return
        try {
            await deleteRestaurant(id)
            setRestaurants(prev => prev.filter(r => r.id !== id))
            if (selectedRestaurant === id) setSelectedRestaurant(null)
            if (expandedRestaurant === id) setExpandedRestaurant(null)
        } catch {
            alert("Erro ao remover restaurante")
        }
    }

    async function handleUpdateStatus(orderId: number, status: string) {
        try {
            await updateOrderStatus(orderId, status)
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: status as Order["status"] } : order
                )
            )
        } catch {
            alert("Erro ao atualizar status")
        }
    }

    async function handleToggleBlock(u: UserItem) {
        try {
            const res = await toggleBlockUser(u.id, !u.blocked)
            if (res.data.success) {
                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, blocked: !x.blocked } : x))
            }
        } catch {
            alert("Erro ao atualizar utilizador")
        }
    }

    async function handleRemoveUser(u: UserItem) {
        if (!confirm(`Remover "${u.name}"? Esta ação não pode ser desfeita.`)) return
        try {
            const res = await deleteUser(u.id)
            if (res.data.success) {
                setUsers(prev => prev.filter(x => x.id !== u.id))
            }
        } catch {
            alert("Erro ao remover utilizador")
        }
    }

    function handleLogout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    )
    const totalBlocked = users.filter(u => u.blocked).length
    const totalClients = users.filter(u => u.role === "CLIENT").length

    if (loading) return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            A carregar...
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <Link href="/dashboard" className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</Link>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm">Painel Admin</span>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition text-sm">
                        Sair
                    </button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-10">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400 mb-8">Gestão de pedidos, pagamentos e utilizadores</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {["PENDING", "PREPARING", "DELIVERING", "COMPLETED"].map(status => (
                        <div key={status} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-orange-500">
                                {orders.filter(o => o.status === status).length}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">{statusLabels[status]}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 mb-6 border-b border-gray-800">
                    {(["orders", "payments", "restaurants", "users"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-1 text-sm font-medium transition border-b-2 ${
                                activeTab === tab
                                    ? "border-orange-500 text-orange-500"
                                    : "border-transparent text-gray-400 hover:text-gray-300"
                            }`}
                        >
                            {tab === "orders" && "Pedidos"}
                            {tab === "payments" && "Pagamentos"}
                            {tab === "restaurants" && "Restaurantes"}
                            {tab === "users" && (
                                <span className="flex items-center gap-2">
                                    Utilizadores
                                    {users.length > 0 && (
                                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                                            {users.length}
                                        </span>
                                    )}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Pedidos ───────────────────────────────────────────────── */}
                {activeTab === "orders" && (
                    <div className="space-y-4">
                        {orders.length === 0 && (
                            <p className="text-gray-500 text-center py-10">Nenhum pedido encontrado</p>
                        )}
                        {orders.map(order => (
                            <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                                        <p className="text-gray-400 text-sm">{order.restaurant?.name}</p>
                                        <p className="text-gray-500 text-sm">{order.deliveryAddress}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                            {statusLabels[order.status]}
                                        </span>
                                        <p className="text-orange-500 font-bold mt-2">${order.total.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-800 pt-3 mb-4 space-y-1">
                                    {order.items.map(item => (
                                        <p key={item.id} className="text-gray-400 text-sm">
                                            x{item.quantity} — ${item.price.toFixed(2)}
                                        </p>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    {nextStatus[order.status] && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, nextStatus[order.status])}
                                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm"
                                        >
                                            Avançar para {statusLabels[nextStatus[order.status]]}
                                        </button>
                                    )}
                                    {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                                            className="text-red-400 hover:text-red-300 text-sm transition"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Pagamentos ────────────────────────────────────────────── */}
                {activeTab === "payments" && (
                    <div className="space-y-4">
                        {payments.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">Nenhum pagamento encontrado</p>
                        ) : (
                            payments.map((payment: any) => (
                                <div key={payment.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">Pagamento #{payment.id}</h3>
                                            <p className="text-gray-400 text-sm">Pedido #{payment.orderId}</p>
                                            <p className="text-gray-400 text-sm">
                                                {payment.order?.user?.name} — {payment.order?.restaurant?.name}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">
                                                {payment.method} · {payment.externalId}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[payment.status]}`}>
                                                {payment.status}
                                            </span>
                                            <p className="text-orange-500 font-bold mt-2">${payment.amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── Restaurantes ──────────────────────────────────────────── */}
                {activeTab === "restaurants" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-4">Novo restaurante</h2>
                            <form onSubmit={handleCreateRestaurant} className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Nome</label>
                                    <input
                                        value={restName}
                                        onChange={e => setRestName(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        placeholder="Nome do restaurante"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Endereço</label>
                                    <input
                                        value={restAddress}
                                        onChange={e => setRestAddress(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        placeholder="Endereço"
                                        required
                                    />
                                </div>
                                <ImageUpload label="Imagem do restaurante" onUploaded={url => setRestImage(url)} />
                                <button
                                    type="submit"
                                    disabled={restLoading}
                                    className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition text-sm"
                                >
                                    {restLoading ? "A criar..." : "Criar restaurante"}
                                </button>
                            </form>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-4">Novo produto</h2>
                            <form onSubmit={handleCreateProduct} className="space-y-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Restaurante</label>
                                    <select
                                        value={selectedRestaurant || ""}
                                        onChange={e => setSelectedRestaurant(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        required
                                    >
                                        <option value="">Seleciona um restaurante</option>
                                        {restaurants.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Nome</label>
                                    <input
                                        value={prodName}
                                        onChange={e => setProdName(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        placeholder="Nome do produto"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Descrição</label>
                                    <input
                                        value={prodDescription}
                                        onChange={e => setProdDescription(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        placeholder="Descrição opcional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Preço</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={prodPrice}
                                        onChange={e => setProdPrice(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <ImageUpload label="Imagem do produto" onUploaded={url => setProdImage(url)} />
                                <button
                                    type="submit"
                                    disabled={prodLoading}
                                    className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition text-sm"
                                >
                                    {prodLoading ? "A criar..." : "Criar produto"}
                                </button>
                            </form>
                        </div>

                        {/* Lista de restaurantes com produtos expandíveis */}
                        <div className="md:col-span-2">
                            <h2 className="text-lg font-bold mb-4">Restaurantes cadastrados</h2>
                            {restaurants.length === 0 ? (
                                <p className="text-gray-500 text-center py-10">Nenhum restaurante cadastrado</p>
                            ) : (
                                <div className="space-y-3">
                                    {restaurants.map(r => (
                                        <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                            {/* Cabeçalho do restaurante */}
                                            <div className="p-4 flex gap-4 items-center">
                                                {r.image ? (
                                                    <img
                                                        src={r.image.startsWith("http") ? r.image : `http://localhost:3000${r.image}`}
                                                        alt={r.name}
                                                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                                                        🍽
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold">{r.name}</h3>
                                                    <p className="text-gray-400 text-sm">{r.address}</p>
                                                    <p className="text-gray-500 text-xs mt-1">{r.products?.length || 0} produtos</p>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleToggleProducts(r.id)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                                                    >
                                                        {expandedRestaurant === r.id ? "▲ Fechar" : "▼ Produtos"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveRestaurant(r.id, r.name)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-red-900 text-red-300 hover:bg-red-800 transition"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Produtos expandidos */}
                                            {expandedRestaurant === r.id && (
                                                <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                                                    {loadingProducts === r.id ? (
                                                        <p className="text-gray-500 text-sm text-center py-4">A carregar produtos...</p>
                                                    ) : (restaurantProducts[r.id] || []).length === 0 ? (
                                                        <p className="text-gray-500 text-sm text-center py-4">Nenhum produto neste restaurante</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {(restaurantProducts[r.id] || []).map(p => (
                                                                <div key={p.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium">{p.name}</p>
                                                                        {p.description && (
                                                                            <p className="text-gray-400 text-xs truncate">{p.description}</p>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-orange-500 text-sm font-bold flex-shrink-0">${p.price.toFixed(2)}</p>
                                                                    <button
                                                                        onClick={() => handleRemoveProduct(r.id, p.id, p.name)}
                                                                        className="text-xs px-2 py-1 rounded-lg bg-red-900 text-red-300 hover:bg-red-800 transition flex-shrink-0"
                                                                    >
                                                                        Remover
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Utilizadores ──────────────────────────────────────────── */}
                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-orange-500">{users.length}</p>
                                <p className="text-gray-400 text-sm mt-1">Total</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-orange-500">{totalClients}</p>
                                <p className="text-gray-400 text-sm mt-1">Clientes</p>
                            </div>
                            <div className={`bg-gray-900 border rounded-xl p-4 text-center ${totalBlocked > 0 ? "border-red-800" : "border-gray-800"}`}>
                                <p className={`text-2xl font-bold ${totalBlocked > 0 ? "text-red-400" : "text-orange-500"}`}>
                                    {totalBlocked}
                                </p>
                                <p className="text-gray-400 text-sm mt-1">Bloqueados</p>
                            </div>
                        </div>

                        <input
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            placeholder="🔍 Buscar por nome ou e-mail..."
                            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500 placeholder-gray-600"
                        />

                        {filteredUsers.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">
                                {users.length === 0 ? "A carregar utilizadores..." : "Nenhum utilizador encontrado"}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map(u => (
                                    <div
                                        key={u.id}
                                        className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-4 ${u.blocked ? "border-red-900" : "border-gray-800"}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-orange-400 flex-shrink-0 overflow-hidden">
                                            {u.photo ? (
                                                <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                                            ) : (
                                                u.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">{u.name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    u.role === "ADMIN" ? "bg-blue-900 text-blue-300" : "bg-gray-800 text-gray-400"
                                                }`}>
                                                    {u.role}
                                                </span>
                                                {u.blocked && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">
                                                        Bloqueado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-xs mt-0.5 truncate">{u.email}</p>
                                            <p className="text-gray-600 text-xs mt-0.5">
                                                {u._count.orders} pedidos · {u._count.reviews} avaliações
                                            </p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleToggleBlock(u)}
                                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                                                    u.blocked
                                                        ? "bg-green-900 text-green-300 hover:bg-green-800"
                                                        : "bg-yellow-900 text-yellow-300 hover:bg-yellow-800"
                                                }`}
                                            >
                                                {u.blocked ? "Desbloquear" : "Bloquear"}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveUser(u)}
                                                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-900 text-red-300 hover:bg-red-800 transition"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}