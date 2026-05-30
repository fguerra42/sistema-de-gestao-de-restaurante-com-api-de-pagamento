import axios from "axios"

const API_URL = "http://localhost:3000/api"

// Pega o token guardado
export function getToken() {
    return localStorage.getItem("token")
}

// Guarda o token
export function saveToken(token: string) {
    localStorage.setItem("token", token)
}

// Remove o token (logout)
export function removeToken() {
    localStorage.removeItem("token")
}

// Instância do axios com token automático
const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// AUTH
export const register = (data: { name: string, email: string, password: string, role: string }) =>
    api.post("/auth/register", data)

export const login = (data: { email: string, password: string }) =>
    api.post("/auth/login", data)

// RESTAURANTES
export const getRestaurants = () =>
    api.get("/restaurants")

// PRODUTOS
export const getProducts = (restaurantId: number) =>
    api.get(`/restaurants/${restaurantId}/products`)

// PEDIDOS
export const createOrder = (data: { restaurantId: number, deliveryAddress: string, items: { productId: number, quantity: number }[] }) =>
    api.post("/orders", data)

export const getOrders = () =>
    api.get("/orders")

export const updateOrderStatus = (orderId: number, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status })

// PAGAMENTOS
export const createPayment = (orderId: number) =>
    api.post("/payments", { orderId })

// AVALIAÇÕES
export const createReview = (orderId: number, data: { rating: number, comment?: string }) =>
    api.post(`/orders/${orderId}/review`, data)

export const getPayments = () =>
    api.get("/payments/list")

export default api