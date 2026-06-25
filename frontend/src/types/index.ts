export interface User {
    id: number
    name: string
    email: string
    role: "CLIENT" | "ADMIN"
    phone?: string
    address?: string
    photo?: string
}

export interface Product {
    id: number
    name: string
    description?: string
    price: number
    image?: string
    available: boolean
    restaurantId: number
}

export interface Restaurant {
    id: number
    name: string
    address: string
    image?: string
    ownerId: number
    products?: Product[]
}

export interface OrderItem {
    id: number
    quantity: number
    price: number
    productId: number
    product?: {
        id: number
        name: string
        image?: string | null
    }
}

export interface Order {
    id: number
    status: "PENDING" | "ACCEPTED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELLED"
    total: number
    deliveryAddress: string
    userId: number
    restaurantId: number
    items: OrderItem[]
    restaurant?: Restaurant
    review?: {
        id: number
        rating: number
        comment?: string | null
    } | null
}

export interface Review {
    id: number
    rating: number
    comment?: string
    orderId: number
    userId: number
}
