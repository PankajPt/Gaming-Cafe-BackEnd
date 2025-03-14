import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        fullname: {
            type: String,
            required: true
        },
        avatar: {
            type: String, //cloudinary url
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        },
        role: {
            type: String,
            enum: ['user', 'manager', 'admin'],
            default: 'user'
        },
        permissions: {
            type: [String],
            default: []
        },
        isActiveUser: {
            type: Boolean,
            default: false
        }

    },{timestamps: true})


userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
    // returns true or false 
}


userSchema.methods.generateAccessToken = async function(){
    const payload = {
        _id: this.id,
        username: this.username,
        fullname: this.fullname,
        email: this.email
    }
    const options = {
        algorithm: 'HS256',
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, options)
}

userSchema.methods.generateRefreshToken = async function() {
    const options = {
        algorithm: 'HS256',
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        options
    )
}

const User = mongoose.model('User', userSchema)
export default User