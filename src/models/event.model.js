import mongoose, { Schema } from 'mongoose'

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now()
        },
        prizeMoney: {
            type: Number,
            required: true
        },
        entryFee: {
            type: Number,
            required: true
        }
    },{ timestamps: true}
)


export default const Event = mongoose.model('Event', eventSchema)