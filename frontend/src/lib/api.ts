import axios from "axios"

const API_URL = "http://localhost:3000/api"

export function getToken() {
    return localStorage.getItem("token")
}

export function saveToken(token: string) {
    localStorage.setItem("token", token)
}

export function removeToken() {
    localStorage.removeItem("token")
}

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

export const createRestaurant = (data: { name: string, address: string, image?: string }) =>
    api.post("/restaurants", data)

export const deleteRestaurant = (id: number) =>
    api.delete("/restaurants", { data: { id } })

// PRODUTOS
export const getProducts = (restaurantId: number) =>
    api.get(`/restaurants/${restaurantId}/products`)

export const createProduct = (restaurantId: number, data: { name: string, description?: string, price: number, image?: string }) =>
    api.post(`/restaurants/${restaurantId}/products`, data)

export const deleteProduct = (restaurantId: number, productId: number) =>
    api.delete(`/restaurants/${restaurantId}/products`, { data: { productId } })

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

export const getPayments = () =>
    api.get("/payments/list")

// AVALIAÇÕES
export const createReview = (orderId: number, data: { rating: number, comment?: string }) =>
    api.post(`/orders/${orderId}/review`, data)

// UTILIZADORES
export const getUsers = () =>
    api.get("/users")

export const toggleBlockUser = (userId: number, blocked: boolean) =>
    api.patch(`/users/${userId}`, { blocked })

export const deleteUser = (userId: number) =>
    api.delete(`/users/${userId}`)

// UPLOAD
export const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return res.data.url
}

export default api