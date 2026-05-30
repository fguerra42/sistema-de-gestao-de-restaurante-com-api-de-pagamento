"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getOrders, createReview } from "@/lib/api"
import { Order } from "@/types"
import Link from "next/link"
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

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [reviewOrderId, setReviewOrderId] = useState<number | null>(null)
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [reviewLoading, setReviewLoading] = useState(false)

    useEffect(() => {
        // Verifica se está logado
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }

        getOrders()
            .then((res) => {
                const data = res.data.data
                setOrders(data)

                // Socket.io — entra nas rooms após carregar os pedidos
                const socket = io("http://localhost:3000")

                socket.on("connect", () => {
                    data.forEach((order: Order) => {
                        socket.emit("join_order", order.id)
                    })
                })

                socket.on("order_status", (event: { orderId: number, status: string }) => {
                    setOrders(prev => prev.map(order =>
                        order.id === event.orderId
                            ? { ...order, status: event.status as Order["status"] }
                            : order
                    ))
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
            setReviewOrderId(null)
            setRating(5)
            setComment("")
            alert("Avaliação enviada!")
        } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao avaliar")
        } finally {
            setReviewLoading(false)
        }
    }

    function handleLogout() {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        router.push("/login")
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            A carregar...
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-orange-500">🍽 RestaurantApp</Link>
                <div className="flex items-center gap-4">
                    <span className="text-gray-300">Os meus pedidos</span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-400 transition text-sm"
                    >
                        Sair
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-8 py-10">
                <h1 className="text-3xl font-bold mb-8">Os meus pedidos</h1>

                {orders.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">
                        <p className="mb-4">Ainda não tens pedidos</p>
                        <Link href="/" className="text-orange-500 hover:underline">
                            Ver restaurantes →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
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

                                <div className="border-t border-gray-800 pt-3 space-y-1">
                                    {order.items.map(item => (
                                        <p key={item.id} className="text-gray-400 text-sm">
                                            x{item.quantity} — ${item.price.toFixed(2)}
                                        </p>
                                    ))}
                                </div>

                                {order.status === "COMPLETED" && (
                                    <button
                                        onClick={() => setReviewOrderId(order.id)}
                                        className="mt-4 text-orange-500 text-sm hover:underline"
                                    >
                                        Avaliar pedido ⭐
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de avaliação */}
            {reviewOrderId && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Avaliar pedido #{reviewOrderId}</h2>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-300 mb-2">Nota</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-2xl ${rating >= star ? "text-orange-500" : "text-gray-600"}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-300 mb-1">Comentário</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                                rows={3}
                                placeholder="O que achou do pedido?"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReview}
                                disabled={reviewLoading}
                                className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
                            >
                                {reviewLoading ? "A enviar..." : "Enviar avaliação"}
                            </button>
                            <button
                                onClick={() => setReviewOrderId(null)}
                                className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}