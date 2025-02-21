import mongoose, { Schema } from 'mongoose'

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        thumbnail: {
            url: {
                type: String,
                required: true
            },
            publicId: {
                type: String,
                required: true
            }
        },
        description: {
            type: String,
            required: true
        },
        eventDate: {
            type: Date,
            default: Date.now(),
            index: { expires: '1d'}
        },
        prizeMoney: {
            type: Number,
            required: true
        },
        entryFee: {
            type: Number,
            required: true
        }
    }, { timestamps: true}
)


const Event = mongoose.model('Event', eventSchema)

export default Event