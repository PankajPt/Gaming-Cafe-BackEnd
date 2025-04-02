import mongoose, { Schema } from "mongoose";

const monthlyDuration = 30 * 24 * 60 * 60 * 1000;
const quarterlyDuration = 90 * 24 * 60 * 60 * 1000;
const yearlyDuration = 365 * 24 * 60 * 60 * 1000;
const defaultDuration = 24 * 60 * 60 * 1000;

const userSubscriptionMappingSchema = new Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        plan: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly'],
            required: true
        },
        startDate: {
            type: Date,
            default: Date.now,
            required: true
        },
        expiresAt: {
            type: Date,
            index: { expires: 0 }
        }
    },{ timestamps: true }
)

userSubscriptionMappingSchema.pre('save', function (next) {
    let expirationTime;
    if(this.plan === 'monthly'){
        expirationTime = monthlyDuration;
    } else if ( this.plan === 'quarterly'){
        expirationTime = quarterlyDuration;
    } else if ( this.plan === 'yearly'){
        expirationTime = yearlyDuration
    } else {
        expirationTime = defaultDuration
    }
    this.expiresAt = new Date( this.startDate.getTime() + expirationTime )
    next()
})

const UserPlan = mongoose.model('UserPlan', userSubscriptionMappingSchema)

export default UserPlan