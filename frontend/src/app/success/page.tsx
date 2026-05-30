"use client"
import Link from "next/link"

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center max-w-md">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold mb-2">Pagamento efetuado!</h1>
                <p className="text-gray-400 mb-6">O teu pedido foi confirmado e está a ser preparado.</p>
                <Link href="/orders" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
                    Ver os meus pedidos
                </Link>
            </div>
        </div>
    )
}