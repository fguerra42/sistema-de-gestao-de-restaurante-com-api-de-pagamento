"use client"
import { useEffect, useRef, useState } from "react"
import { getOrders, updateOrderStatus, getPayments, createRestaurant, createProduct, getRestaurants, deleteRestaurant, deleteProduct, getProducts, updateRestaurant, updateProduct, cancelOrder, API_URL } from "@/lib/api"
import api from "@/lib/api"
import { Order, Restaurant, Product } from "@/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"
import { useToast } from "@/lib/ToastContext"

const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: "bg-yellow-900/30 text-yellow-300 border-yellow-700/50", label: "Pendente" },
    ACCEPTED: { color: "bg-blue-900/30 text-blue-300 border-blue-700/50", label: "Aceite" },
    PREPARING: { color: "bg-purple-900/30 text-purple-300 border-purple-700/50", label: "A preparar" },
    DELIVERING: { color: "bg-orange-900/30 text-orange-300 border-orange-700/50", label: "A entregar" },
    COMPLETED: { color: "bg-green-900/30 text-green-300 border-green-700/50", label: "Concluído" },
    CANCELLED: { color: "bg-red-900/30 text-red-300 border-red-700/50", label: "Cancelado" }
}

const nextStatus: Record<string, string> = {
    PENDING: "ACCEPTED",
    ACCEPTED: "PREPARING",
    PREPARING: "DELIVERING",
    DELIVERING: "COMPLETED"
}

const paymentStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-900/30 text-yellow-300 border-yellow-700/50",
    PAID: "bg-green-900/30 text-green-300 border-green-700/50",
    FAILED: "bg-red-900/30 text-red-300 border-red-700/50",
    REFUNDED: "bg-gray-700/30 text-gray-300 border-gray-700/50"
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

function ImageUpload({ label, onUploaded, currentUrl }: { label: string; onUploaded: (url: string) => void; currentUrl?: string }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(currentUrl || null)
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
            setPreview(null)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <label className="block text-sm text-gray-400 mb-1">{label}</label>
            <div onClick={() => inputRef.current?.click()}
                className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition relative min-h-[100px]">
                {preview ? (
                    <img src={preview} alt="preview" className="w-full object-cover" style={{ maxHeight: 140 }} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-1">
                        <span className="text-gray-500 text-sm">📷</span>
                        <span className="text-gray-600 text-xs">Clique para selecionar imagem</span>
                    </div>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm text-white font-medium">
                        A enviar...
                    </div>
                )}
            </div>
            {done && <p className="text-green-500 text-xs mt-1">✓ Upload concluído</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </div>
    )
}

function EditRestaurantModal({ restaurant, onClose, onSaved }: { restaurant: Restaurant; onClose: () => void; onSaved: () => void }) {
    const { toast } = useToast()
    const [name, setName] = useState(restaurant.name)
    const [address, setAddress] = useState(restaurant.address)
    const [image, setImage] = useState(restaurant.image || "")
    const [saving, setSaving] = useState(false)

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await updateRestaurant(restaurant.id, { name, address, image: image || undefined })
            toast("Restaurante atualizado!", "success")
            onSaved()
        } catch {
            toast("Erro ao atualizar restaurante", "error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-8 w-full max-w-md animate-scale-in">
                <h2 className="text-lg font-bold mb-6">Editar {restaurant.name}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Nome</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Endereço</label>
                        <input value={address} onChange={e => setAddress(e.target.value)}
                            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition" required />
                    </div>
                    <ImageUpload label="Imagem" onUploaded={url => setImage(url)} currentUrl={image} />
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition font-medium text-sm">
                            {saving ? "A salvar..." : "Salvar"}
                        </button>
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-[#1a1a24] text-gray-300 py-2.5 rounded-xl hover:bg-[#2a2a35] transition text-sm">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditProductModal({ product, restaurantId, onClose, onSaved }: { product: Product; restaurantId: number; onClose: () => void; onSaved: () => void }) {
    const { toast } = useToast()
    const [name, setName] = useState(product.name)
    const [description, setDescription] = useState(product.description || "")
    const [price, setPrice] = useState(product.price.toString())
    const [image, setImage] = useState(product.image || "")
    const [available, setAvailable] = useState(product.available)
    const [saving, setSaving] = useState(false)

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            await updateProduct(restaurantId, product.id, {
                name,
                description: description || undefined,
                price: parseFloat(price),
                image: image || undefined,
                available
            })
            toast("Produto atualizado!", "success")
            onSaved()
        } catch {
            toast("Erro ao atualizar produto", "error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-8 w-full max-w-md animate-scale-in">
                <h2 className="text-lg font-bold mb-6">Editar {product.name}</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Nome</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                        <input value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Preço ($)</label>
                        <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                            className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition" required />
                    </div>
                    <ImageUpload label="Imagem" onUploaded={url => setImage(url)} currentUrl={image} />
                    <div className="flex items-center gap-3 bg-[#1a1a24] rounded-xl px-4 py-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)}
                                className="sr-only peer" />
                            <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-orange-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                        <span className="text-sm text-gray-300">Produto disponível</span>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving}
                            className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition font-medium text-sm">
                            {saving ? "A salvar..." : "Salvar"}
                        </button>
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-[#1a1a24] text-gray-300 py-2.5 rounded-xl hover:bg-[#2a2a35] transition text-sm">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const router = useRouter()
    const { toast } = useToast()

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

    const [expandedRestaurant, setExpandedRestaurant] = useState<number | null>(null)
    const [restaurantProducts, setRestaurantProducts] = useState<Record<number, Product[]>>({})
    const [loadingProducts, setLoadingProducts] = useState<number | null>(null)

    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
    const [editingProduct, setEditingProduct] = useState<{ product: Product; restaurantId: number } | null>(null)

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

        const socket = io(API_URL)
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
            .catch(() => toast("Erro ao carregar utilizadores", "error"))
    }, [activeTab])

    async function handleToggleProducts(restaurantId: number) {
        if (expandedRestaurant === restaurantId) {
            setExpandedRestaurant(null)
            return
        }
        setExpandedRestaurant(restaurantId)
        if (restaurantProducts[restaurantId]) return
        setLoadingProducts(restaurantId)
        try {
            const res = await getProducts(restaurantId)
            setRestaurantProducts(prev => ({ ...prev, [restaurantId]: res.data.products }))
        } catch {
            toast("Erro ao carregar produtos", "error")
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
                [restaurantId]: (prev[restaurantId] || []).filter(p => p.id !== productId)
            }))
            toast("Produto removido", "success")
        } catch {
            toast("Erro ao remover produto", "error")
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
            toast("Restaurante criado!", "success")
        } catch (err: any) {
            toast(err.response?.data?.message || "Erro ao criar restaurante", "error")
        } finally {
            setRestLoading(false)
        }
    }

    async function handleCreateProduct(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedRestaurant) return toast("Seleciona um restaurante!", "error")
        setProdLoading(true)
        try {
            await createProduct(selectedRestaurant, {
                name: prodName,
                description: prodDescription,
                price: parseFloat(prodPrice),
                image: prodImage || undefined
            })
            setRestaurantProducts(prev => { const u = { ...prev }; delete u[selectedRestaurant]; return u })
            setProdName("")
            setProdDescription("")
            setProdPrice("")
            setProdImage("")
            toast("Produto criado!", "success")
        } catch (err: any) {
            toast(err.response?.data?.message || "Erro ao criar produto", "error")
        } finally {
            setProdLoading(false)
        }
    }

    async function handleRemoveRestaurant(id: number, name: string) {
        if (!confirm(`Remover "${name}"? Todos os produtos serão apagados.`)) return
        try {
            await deleteRestaurant(id)
            setRestaurants(prev => prev.filter(r => r.id !== id))
            if (selectedRestaurant === id) setSelectedRestaurant(null)
            if (expandedRestaurant === id) setExpandedRestaurant(null)
            toast("Restaurante removido", "success")
        } catch {
            toast("Erro ao remover restaurante", "error")
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
            const cfg = statusConfig[status]
            toast(`Pedido #${orderId} → ${cfg?.label || status}`, "success")
        } catch {
            toast("Erro ao atualizar status", "error")
        }
    }

    async function handleToggleBlock(u: UserItem) {
        try {
            const res = await toggleBlockUser(u.id, !u.blocked)
            if (res.data.success) {
                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, blocked: !x.blocked } : x))
                toast(u.blocked ? "Utilizador desbloqueado" : "Utilizador bloqueado", "success")
            }
        } catch {
            toast("Erro ao atualizar utilizador", "error")
        }
    }

    async function handleRemoveUser(u: UserItem) {
        if (!confirm(`Remover "${u.name}"? Esta ação não pode ser desfeita.`)) return
        try {
            const res = await deleteUser(u.id)
            if (res.data.success) {
                setUsers(prev => prev.filter(x => x.id !== u.id))
                toast("Utilizador removido", "success")
            }
        } catch {
            toast("Erro ao remover utilizador", "error")
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
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <span className="inline-block w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full" style={{ animation: "spin-slow 0.8s linear infinite" }} />
                <span className="text-gray-500 text-sm">A carregar...</span>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1f1f2a] px-6 py-4 flex justify-between items-center">
                <Link href="/dashboard" className="text-xl font-bold text-orange-500">Parcelar</Link>
                <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm">Painel Admin</span>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition text-sm">
                        Sair
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
                <p className="text-gray-500 mb-8">Gestão completa do sistema</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {["PENDING", "PREPARING", "DELIVERING", "COMPLETED"].map(status => (
                        <div key={status} className="bg-[#13131a] border border-[#1f1f2a] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-orange-500">
                                {orders.filter(o => o.status === status).length}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">{statusConfig[status]?.label || status}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-6 mb-6 border-b border-[#1f1f2a] overflow-x-auto">
                    {(["orders", "payments", "restaurants", "users"] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-1 text-sm font-medium transition border-b-2 whitespace-nowrap ${
                                activeTab === tab
                                    ? "border-orange-500 text-orange-500"
                                    : "border-transparent text-gray-500 hover:text-gray-300"
                            }`}>
                            {tab === "orders" && "Pedidos"}
                            {tab === "payments" && "Pagamentos"}
                            {tab === "restaurants" && "Restaurantes"}
                            {tab === "users" && "Utilizadores"}
                        </button>
                    ))}
                </div>

                {activeTab === "orders" && (
                    <div className="space-y-4">
                        {orders.length === 0 && (
                            <p className="text-gray-600 text-center py-10">Nenhum pedido encontrado</p>
                        )}
                        {orders.map(order => {
                            const cfg = statusConfig[order.status] || statusConfig.PENDING
                            return (
                                <div key={order.id} className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-6 animate-fade-in">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                                            <p className="text-gray-400 text-sm">{order.restaurant?.name}</p>
                                            <p className="text-gray-600 text-sm">{order.deliveryAddress}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                            <p className="text-orange-500 font-bold mt-2">${order.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-[#1f1f2a] pt-3 mb-4 space-y-1">
                                        {order.items.map(item => (
                                            <p key={item.id} className="text-gray-500 text-sm flex items-center gap-2">
                                                <span>×{item.quantity}</span>
                                                <span>{item.product?.name || `Produto #${item.productId}`}</span>
                                                <span className="ml-auto text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                                            </p>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        {nextStatus[order.status] && (
                                            <button onClick={() => handleUpdateStatus(order.id, nextStatus[order.status])}
                                                className="bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition text-sm font-medium">
                                                Avançar para {statusConfig[nextStatus[order.status]]?.label}
                                            </button>
                                        )}
                                        {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                                            <button onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                                                className="text-red-400 hover:text-red-300 text-sm transition border border-red-900/50 rounded-xl px-4 py-2">
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {activeTab === "payments" && (
                    <div className="space-y-4">
                        {payments.length === 0 ? (
                            <p className="text-gray-600 text-center py-10">Nenhum pagamento encontrado</p>
                        ) : (
                            payments.map((payment: any) => (
                                <div key={payment.id} className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-6 animate-fade-in">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">Pagamento #{payment.id}</h3>
                                            <p className="text-gray-400 text-sm">Pedido #{payment.orderId}</p>
                                            <p className="text-gray-400 text-sm">{payment.order?.user?.name} — {payment.order?.restaurant?.name}</p>
                                            <p className="text-gray-600 text-xs mt-1">{payment.method} · {payment.externalId}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${paymentStatusColors[payment.status] || paymentStatusColors.PENDING}`}>
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

                {activeTab === "restaurants" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-4">Novo restaurante</h2>
                            <form onSubmit={handleCreateRestaurant} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nome</label>
                                    <input value={restName} onChange={e => setRestName(e.target.value)}
                                        className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                                        placeholder="Nome do restaurante" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Endereço</label>
                                    <input value={restAddress} onChange={e => setRestAddress(e.target.value)}
                                        className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                                        placeholder="Endereço" required />
                                </div>
                                <ImageUpload label="Imagem" onUploaded={url => setRestImage(url)} />
                                <button type="submit" disabled={restLoading}
                                    className="w-full bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition font-medium text-sm">
                                    {restLoading ? "A criar..." : "Criar restaurante"}
                                </button>
                            </form>
                        </div>

                        <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-4">Novo produto</h2>
                            <form onSubmit={handleCreateProduct} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Restaurante</label>
                                    <select value={selectedRestaurant || ""} onChange={e => setSelectedRestaurant(Number(e.target.value))}
                                        className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition" required>
                                        <option value="">Seleciona um restaurante</option>
                                        {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nome</label>
                                    <input value={prodName} onChange={e => setProdName(e.target.value)}
                                        className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                                        placeholder="Nome do produto" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                                    <input value={prodDescription} onChange={e => setProdDescription(e.target.value)}
                                        className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                                        placeholder="Descrição opcional" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Preço ($)</label>
                                    <input type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)}
                                        className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition"
                                        placeholder="0.00" required />
                                </div>
                                <ImageUpload label="Imagem" onUploaded={url => setProdImage(url)} />
                                <button type="submit" disabled={prodLoading}
                                    className="w-full bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition font-medium text-sm">
                                    {prodLoading ? "A criar..." : "Criar produto"}
                                </button>
                            </form>
                        </div>

                        <div className="lg:col-span-2">
                            <h2 className="text-lg font-bold mb-4">Restaurantes cadastrados</h2>
                            {restaurants.length === 0 ? (
                                <p className="text-gray-600 text-center py-10">Nenhum restaurante cadastrado</p>
                            ) : (
                                <div className="space-y-3">
                                    {restaurants.map(r => (
                                        <div key={r.id} className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl overflow-hidden">
                                            <div className="p-5 flex gap-4 items-center">
                                                {r.image ? (
                                                    <img src={r.image.startsWith("http") ? r.image : `${API_URL}${r.image}`} alt={r.name}
                                                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl bg-[#1a1a24] flex items-center justify-center text-2xl flex-shrink-0">🍽</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold">{r.name}</h3>
                                                    <p className="text-gray-500 text-sm">{r.address}</p>
                                                    <p className="text-gray-600 text-xs mt-1">{r.products?.length || (restaurantProducts[r.id]?.length || 0)} produtos</p>
                                                </div>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button onClick={() => setEditingRestaurant(r)}
                                                        className="text-xs px-3 py-1.5 rounded-xl bg-orange-900/30 text-orange-300 hover:bg-orange-800/50 transition border border-orange-800/50">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleToggleProducts(r.id)}
                                                        className="text-xs px-3 py-1.5 rounded-xl bg-[#1a1a24] text-gray-300 hover:bg-[#2a2a35] transition">
                                                        {expandedRestaurant === r.id ? "▲" : "▼"} Produtos
                                                    </button>
                                                    <button onClick={() => handleRemoveRestaurant(r.id, r.name)}
                                                        className="text-xs px-3 py-1.5 rounded-xl bg-red-900/30 text-red-300 hover:bg-red-800/50 transition border border-red-800/50">
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedRestaurant === r.id && (
                                                <div className="border-t border-[#1f1f2a] px-5 pb-5 pt-3">
                                                    {loadingProducts === r.id ? (
                                                        <p className="text-gray-600 text-sm text-center py-4">A carregar produtos...</p>
                                                    ) : (restaurantProducts[r.id] || []).length === 0 ? (
                                                        <p className="text-gray-600 text-sm text-center py-4">Nenhum produto neste restaurante</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {(restaurantProducts[r.id] || []).map(p => (
                                                                <div key={p.id} className="flex items-center gap-3 bg-[#1a1a24] rounded-xl px-4 py-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-medium">{p.name}</p>
                                                                            {!p.available && (
                                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-300 border border-red-800/50">
                                                                                    Indisponível
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {p.description && <p className="text-gray-600 text-xs truncate">{p.description}</p>}
                                                                    </div>
                                                                    <p className="text-orange-500 text-sm font-bold flex-shrink-0">${p.price.toFixed(2)}</p>
                                                                    <button onClick={() => setEditingProduct({ product: p, restaurantId: r.id })}
                                                                        className="text-xs px-2.5 py-1.5 rounded-xl bg-orange-900/30 text-orange-300 hover:bg-orange-800/50 transition border border-orange-800/50">
                                                                        Editar
                                                                    </button>
                                                                    <button onClick={() => handleRemoveProduct(r.id, p.id, p.name)}
                                                                        className="text-xs px-2.5 py-1.5 rounded-xl bg-red-900/30 text-red-300 hover:bg-red-800/50 transition border border-red-800/50">
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

                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#13131a] border border-[#1f1f2a] rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-orange-500">{users.length}</p>
                                <p className="text-gray-500 text-sm mt-1">Total</p>
                            </div>
                            <div className="bg-[#13131a] border border-[#1f1f2a] rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-orange-500">{totalClients}</p>
                                <p className="text-gray-500 text-sm mt-1">Clientes</p>
                            </div>
                            <div className={`bg-[#13131a] border rounded-xl p-4 text-center ${totalBlocked > 0 ? "border-red-800/50" : "border-[#1f1f2a]"}`}>
                                <p className={`text-2xl font-bold ${totalBlocked > 0 ? "text-red-400" : "text-orange-500"}`}>{totalBlocked}</p>
                                <p className="text-gray-500 text-sm mt-1">Bloqueados</p>
                            </div>
                        </div>

                        <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full bg-[#13131a] border border-[#1f1f2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition placeholder-gray-600" />

                        {filteredUsers.length === 0 ? (
                            <p className="text-gray-600 text-center py-10">
                                {users.length === 0 ? "A carregar utilizadores..." : "Nenhum utilizador encontrado"}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map(u => (
                                    <div key={u.id}
                                        className={`bg-[#13131a] border rounded-2xl p-5 flex items-center gap-4 ${u.blocked ? "border-red-800/50" : "border-[#1f1f2a]"}`}>
                                        <div className="w-10 h-10 rounded-full bg-[#1a1a24] flex items-center justify-center font-bold text-orange-400 flex-shrink-0 overflow-hidden">
                                            {u.photo ? <img src={u.photo} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">{u.name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "ADMIN" ? "bg-blue-900/30 text-blue-300 border border-blue-800/50" : "bg-gray-800/50 text-gray-400 border border-gray-700/50"}`}>
                                                    {u.role}
                                                </span>
                                                {u.blocked && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-300 border border-red-800/50">
                                                        Bloqueado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-xs mt-0.5 truncate">{u.email}</p>
                                            <p className="text-gray-600 text-xs mt-0.5">{u._count.orders} pedidos · {u._count.reviews} avaliações</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => handleToggleBlock(u)}
                                                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition border ${
                                                    u.blocked
                                                        ? "bg-green-900/30 text-green-300 border-green-800/50 hover:bg-green-800/50"
                                                        : "bg-yellow-900/30 text-yellow-300 border-yellow-800/50 hover:bg-yellow-800/50"
                                                }`}>
                                                {u.blocked ? "Desbloquear" : "Bloquear"}
                                            </button>
                                            <button onClick={() => handleRemoveUser(u)}
                                                className="text-xs px-3 py-1.5 rounded-xl font-medium bg-red-900/30 text-red-300 border border-red-800/50 hover:bg-red-800/50 transition">
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

            {editingRestaurant && (
                <EditRestaurantModal
                    restaurant={editingRestaurant}
                    onClose={() => setEditingRestaurant(null)}
                    onSaved={async () => {
                        const res = await getRestaurants()
                        setRestaurants(res.data.restaurants)
                        if (editingRestaurant) {
                            setRestaurantProducts(prev => { const u = { ...prev }; delete u[editingRestaurant.id]; return u })
                        }
                        setEditingRestaurant(null)
                    }}
                />
            )}

            {editingProduct && (
                <EditProductModal
                    product={editingProduct.product}
                    restaurantId={editingProduct.restaurantId}
                    onClose={() => setEditingProduct(null)}
                    onSaved={() => {
                        setRestaurantProducts(prev => { const u = { ...prev }; delete u[editingProduct.restaurantId]; return u })
                        setEditingProduct(null)
                    }}
                />
            )}
        </div>
    )
}
