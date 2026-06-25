"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getOrders, createReview, cancelOrder, API_URL } from "@/lib/api"
import { Order } from "@/types"
import Link from "next/link"
import { io } from "socket.io-client"
import { useToast } from "@/lib/ToastContext"

const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
    PENDING: { color: "bg-yellow-900/30 text-yellow-300 border-yellow-700/50", label: "Pendente", icon: "⏳" },
    ACCEPTED: { color: "bg-blue-900/30 text-blue-300 border-blue-700/50", label: "Aceite", icon: "✓" },
    PREPARING: { color: "bg-purple-900/30 text-purple-300 border-purple-700/50", label: "A preparar", icon: "👨‍🍳" },
    DELIVERING: { color: "bg-orange-900/30 text-orange-300 border-orange-700/50", label: "A entregar", icon: "🚚" },
    COMPLETED: { color: "bg-green-900/30 text-green-300 border-green-700/50", label: "Concluído", icon: "✅" },
    CANCELLED: { color: "bg-red-900/30 text-red-300 border-red-700/50", label: "Cancelado", icon: "✕" }
}

const cancelable = ["PENDING", "ACCEPTED"]

export default function OrdersPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [reviewOrderId, setReviewOrderId] = useState<number | null>(null)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [reviewLoading, setReviewLoading] = useState(false)
    const [cancellingId, setCancellingId] = useState<number | null>(null)
    const [userName, setUserName] = useState("")

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }

        const user = JSON.parse(localStorage.getItem("user") || "{}")
        setUserName(user.name || "")

        getOrders()
            .then((res) => {
                const data = res.data.data
                setOrders(data)

                const socket = io(API_URL)
                socket.on("connect", () => {
                    data.forEach((order: Order) => {
                        socket.emit("join_order", order.id)
                    })
                })
                socket.on("order_status", (event: { orderId: number; status: string }) => {
                    setOrders(prev => prev.map(order =>
                        order.id === event.orderId
                            ? { ...order, status: event.status as Order["status"] }
                            : order
                    ))
                    const order = data.find((o: Order) => o.id === event.orderId)
                    if (order) {
                        const cfg = statusConfig[event.status]
                        toast(`Pedido #${event.orderId}: ${cfg?.label || event.status}`, "info")
                    }
                })

                return () => { socket.disconnect() }
            })
            .finally(() => setLoading(false))
    }, [])

    async function handleReview() {
        if (!reviewOrderId) return
        setReviewLoading(true)
        try {
            await createReview(reviewOrderId, { rating, comment })
            setOrders(prev => prev.map(o =>
                o.id === reviewOrderId ? { ...o, review: { id: 0, rating, comment: comment || null } } : o
            ))
            setReviewOrderId(null)
            setRating(5)
            setComment("")
            toast("Avaliação enviada com sucesso!", "success")
        } catch (err: any) {
            toast(err.response?.data?.message || "Erro ao avaliar", "error")
        } finally {
            setReviewLoading(false)
        }
    }

    async function handleCancel(orderId: number) {
        if (!confirm("Tens a certeza que queres cancelar este pedido?")) return
        setCancellingId(orderId)
        try {
            await cancelOrder(orderId)
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: "CANCELLED" } : o
            ))
            toast("Pedido cancelado", "success")
        } catch (err: any) {
            toast(err.response?.data?.message || "Erro ao cancelar", "error")
        } finally {
            setCancellingId(null)
        }
    }

    function handleLogout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
    }

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
                <Link href="/" className="text-xl font-bold text-orange-500">Parcelar</Link>
                <div className="flex items-center gap-4">
                    {userName && (
                        <span className="text-gray-400 text-sm hidden sm:block">
                            Olá, <span className="text-orange-400 font-medium">{userName}</span>
                        </span>
                    )}
                    <Link href="/" className="text-gray-400 hover:text-orange-400 transition text-sm">
                        Restaurantes
                    </Link>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition text-sm">
                        Sair
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold mb-8">Os meus pedidos</h1>

                {orders.length === 0 ? (
                    <div className="text-center text-gray-600 py-20">
                        <p className="text-5xl mb-4">📦</p>
                        <p className="text-lg mb-2">Ainda não tens pedidos</p>
                        <Link href="/" className="text-orange-500 hover:text-orange-400 transition font-medium">
                            Ver restaurantes →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => {
                            const cfg = statusConfig[order.status] || statusConfig.PENDING
                            return (
                                <div key={order.id} className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-6 animate-fade-in">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                                                {order.review && (
                                                    <span className="text-yellow-500 text-sm" title="Avaliado">
                                                        ★ {order.review.rating}/5
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm">{order.restaurant?.name}</p>
                                            <p className="text-gray-600 text-sm">{order.deliveryAddress}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                            <p className="text-orange-500 font-bold">${order.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-[#1f1f2a] pt-3 space-y-1.5">
                                        {order.items.map(item => (
                                            <p key={item.id} className="text-gray-500 text-sm flex items-center gap-2">
                                                <span className="text-gray-600">×{item.quantity}</span>
                                                <span>{item.product?.name || `Produto #${item.productId}`}</span>
                                                <span className="ml-auto text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                                            </p>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        {order.status === "COMPLETED" && !order.review && (
                                            <button onClick={() => setReviewOrderId(order.id)}
                                                className="text-orange-500 hover:text-orange-400 text-sm font-medium transition flex items-center gap-1">
                                                ⭐ Avaliar pedido
                                            </button>
                                        )}
                                        {cancelable.includes(order.status) && (
                                            <button onClick={() => handleCancel(order.id)} disabled={cancellingId === order.id}
                                                className="text-red-400 hover:text-red-300 text-sm transition disabled:opacity-50">
                                                {cancellingId === order.id ? "A cancelar..." : "Cancelar pedido"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {reviewOrderId && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-8 w-full max-w-md animate-scale-in">
                        <h2 className="text-xl font-bold mb-1">Avaliar pedido #{reviewOrderId}</h2>
                        <p className="text-gray-500 text-sm mb-6">Partilha a tua experiência</p>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-3">Nota</label>
                            <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} onClick={() => setRating(star)}
                                        className={`text-3xl transition hover:scale-110 ${rating >= star ? "text-orange-500" : "text-gray-700"}`}>
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-1.5">Comentário (opcional)</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-[#1a1a24] border border-[#2a2a35] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
                                rows={3} placeholder="O que achaste do pedido?" />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleReview} disabled={reviewLoading}
                                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition font-medium text-sm">
                                {reviewLoading ? "A enviar..." : "Enviar avaliação"}
                            </button>
                            <button onClick={() => setReviewOrderId(null)}
                                className="flex-1 bg-[#1a1a24] text-gray-300 py-2.5 rounded-xl hover:bg-[#2a2a35] transition text-sm">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
