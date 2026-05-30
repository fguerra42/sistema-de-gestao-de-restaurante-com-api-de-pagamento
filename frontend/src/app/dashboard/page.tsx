"use client"
import { useEffect, useState } from "react"
import { getOrders, updateOrderStatus } from "@/lib/api"
import { Order } from "@/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export default function DashboardPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Verifica se é admin
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        if (user.role !== "ADMIN") {
            router.push("/login")
            return
        }

        getOrders()
            .then((res) => setOrders(res.data.data))
            .finally(() => setLoading(false))
    }, [])

    async function handleUpdateStatus(orderId: number, status: string) {
        try {
            await updateOrderStatus(orderId, status)
            setOrders(prev => prev.map(order =>
                order.id === orderId
                    ? { ...order, status: status as Order["status"] }
                    : order
            ))
        } catch (err) {
            alert("Erro ao atualizar status")
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
                    <span className="text-gray-400 text-sm">Painel Admin</span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-red-400 transition text-sm"
                    >
                        Sair
                    </button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-10">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-400 mb-8">Gestão de pedidos</p>

                {/* Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {["PENDING", "PREPARING", "DELIVERING", "COMPLETED"].map(status => (
                        <div key={status} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-orange-500">
                                {orders.filter(o => o.status === status).length}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">{statusLabels[status]}</p>
                        </div>
                    ))}
                </div>

                {/* Lista de pedidos */}
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

                            <div className="border-t border-gray-800 pt-3 mb-4 space-y-1">
                                {order.items.map(item => (
                                    <p key={item.id} className="text-gray-400 text-sm">
                                        x{item.quantity} — ${item.price.toFixed(2)}
                                    </p>
                                ))}
                            </div>

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
                                    className="ml-3 text-red-400 hover:text-red-300 text-sm transition"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}