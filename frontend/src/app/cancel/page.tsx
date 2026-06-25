"use client"
import Link from "next/link"

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
            <div className="bg-[#13131a] border border-[#1f1f2a] rounded-2xl p-10 text-center max-w-md animate-scale-in">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    ✕
                </div>
                <h1 className="text-2xl font-bold mb-2">Pagamento cancelado</h1>
                <p className="text-gray-500 mb-8">O pagamento foi cancelado. Podes tentar novamente.</p>
                <Link href="/"
                    className="inline-block bg-orange-500 text-white px-8 py-3 rounded-xl hover:bg-orange-600 transition font-medium">
                    Voltar ao início
                </Link>
            </div>
        </div>
    )
}
