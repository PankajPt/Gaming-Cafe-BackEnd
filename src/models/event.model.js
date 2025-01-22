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
        createdAt: {
            type: Date,
            default: Date.now(),
            index: { expires: '1h'}
        },
        prizeMoney: {
            type: Number,
            required: true
        },
        entryFee: {
            type: Number,
            required: true
        }
    }
)


const Event = mongoose.model('Event', eventSchema)

export default Event