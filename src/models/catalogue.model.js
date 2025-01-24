import mongoose, { Schema } from "mongoose";

const catalogueSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            trim: true
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
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },{ timestamps: true}
)

const Catalogue = mongoose.model('Catalogue', catalogueSchema)

export default Catalogue