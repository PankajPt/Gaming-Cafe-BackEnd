import mongoose, { Schema } from "mongoose";

const catelogueSchema = new Schema(
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
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },{ timestamps: true}
)

const Catalouge = mongoose.model('Catalouge', catelogueSchema)

export default Catalouge