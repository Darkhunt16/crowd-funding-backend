import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Volunteer } from '../models/volunteer.js';

dotenv.config();
const stripe = Stripe('sk_test_51PDttXSIPJlXUMpCpHDQ0KPN8oMWsjwIQ023GvwRmQFO67BCbGLXEE8SlPVQzIDgJgf4umGjj7D8ds5Y8Yj8U5sn00gWCaO0e1');

export const checkout = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });
        }

        const invoice = await createInvoice(amount);
        await Volunteer.create({
            ...req.body,
            orderId: invoice.order_id,
        });

        res.json({
            success: true,
            message: "Checkout session created successfully",
            sessionId: invoice.session_id,
            orderId: invoice.order_id,
            data_link: invoice.datalink,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const createInvoice = async (amount) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: 'Donation',
                },
                unit_amount: Math.round(amount * 100),  // Stripe expects amount in cents
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}?payment=canceled`,
        
    });
    return {
        order_id: session.id,  // Use Stripe's session ID as order ID
        session_id: session.id,
        amount: session.amount_total,
        datalink: session.url,
    };
};
