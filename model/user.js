import { mongoose } from 'mongoose';



const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'user',
        enum: ['admin', 'user', "manager"],
    }
}, {
    timestamps: true
})

export const User = mongoose.model('User', UserSchema);