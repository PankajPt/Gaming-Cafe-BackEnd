import mongoose, { Schema } from "mongoose";

const slotSchema = new Schema(
    {
        date: {
            type: Date, // date format yyyy-mm-dd
            required: true,
            index: {
                expires: 86400
            }
        },
        timeFrame: {
            type: String,
            required: true,
            trim: true
        },
        maxBookings: {
            type: Number,
            default: 5
        }
    },{ timestamps: true }
)
slotSchema.index({ date: 1, timeFrame: 1 },{ unique: true })

slotSchema.pre('save', function(next){
    if(typeof this.date === 'String'){
        this.date = new Date(this.date)
    }
    next()
})

const Slot = mongoose.model('Slot', slotSchema)

export default Slot