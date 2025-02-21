import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true
        },
        features: {
            type: [String]
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
                type: String,
                required: true
            }
        }
    }, {timestamps: true}
)

const SubscriptionModels = mongoose.model('SubscriptionModels', subscriptionSchema)

export default SubscriptionModels