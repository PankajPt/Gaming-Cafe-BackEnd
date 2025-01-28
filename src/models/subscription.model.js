import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            toLowerCase: true
        },
        description: {
            type: String,
            required: true
        },
        period: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        paymentQR: {
            url: {
                type: String,
                required: true
            },
            publicId: {
                type: true,
                required: true
            }
        }
    }, {timestamps: true}
)

const SubscriptionOptions = mongoose.model('SubscriptionOptions', subscriptionSchema)

export default SubscriptionOptions