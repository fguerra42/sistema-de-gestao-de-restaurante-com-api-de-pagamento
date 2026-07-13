import axios from "axios"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://firminoguerra.loca.lt"
const API_BASE = `${API_URL}/api`

export function getToken() {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
}

export function saveToken(token: string) {
    localStorage.setItem("token", token)
}

export function removeToken() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
}

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export const register = (data: { name: string; email: string; password: string; role: string }) =>
    api.post("/auth/register", data)

export const login = (data: { email: string; password: string }) =>
    api.post("/auth/login", data)

export const getRestaurants = () =>
    api.get("/restaurants")

export const createRestaurant = (data: { name: string; address: string; image?: string }) =>
    api.post("/restaurants", data)

export const updateRestaurant = (id: number, data: { name?: string; address?: string; image?: string }) =>
    api.patch(`/restaurants/${id}`, data)

export const deleteRestaurant = (id: number) =>
    api.delete("/restaurants", { data: { id } })

export const getProducts = (restaurantId: number) =>
    api.get(`/restaurants/${restaurantId}/products`)

export const createProduct = (restaurantId: number, data: { name: string; description?: string; price: number; image?: string }) =>
    api.post(`/restaurants/${restaurantId}/products`, data)

export const updateProduct = (restaurantId: number, productId: number, data: { name?: string; description?: string; price?: number; image?: string; available?: boolean }) =>
    api.patch(`/restaurants/${restaurantId}/products/${productId}`, data)

export const deleteProduct = (restaurantId: number, productId: number) =>
    api.delete(`/restaurants/${restaurantId}/products`, { data: { productId } })

export const createOrder = (data: { restaurantId: number; deliveryAddress: string; items: { productId: number; quantity: number }[] }) =>
    api.post("/orders", data)

export const getOrders = () =>
    api.get("/orders")

export const updateOrderStatus = (orderId: number, status: string) =>
    api.patch(`/orders/${orderId}/status`, { status })

export const cancelOrder = (orderId: number) =>
    api.patch(`/orders/${orderId}/cancel`)

export const createPayment = (orderId: number) =>
    api.post("/payments", { orderId })

export const getPayments = () =>
    api.get("/payments/list")

export const createReview = (orderId: number, data: { rating: number; comment?: string }) =>
    api.post(`/orders/${orderId}/review`, data)

export const getUsers = () =>
    api.get("/users")

export const toggleBlockUser = (userId: number, blocked: boolean) =>
    api.patch(`/users/${userId}`, { blocked })

export const deleteUser = (userId: number) =>
    api.delete(`/users/${userId}`)

export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return res.data.url
}

export default api
