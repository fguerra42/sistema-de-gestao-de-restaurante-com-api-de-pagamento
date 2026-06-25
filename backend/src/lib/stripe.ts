import Stripe from "stripe"

export const getStripe = () => {
    return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null as unknown as Stripe