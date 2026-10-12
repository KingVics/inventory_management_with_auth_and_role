import { mongoose } from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    type: {
        type: String,
        enum: ['in', 'out'],
        required: true,
    },
    quantity: {
        type: Number,
        min: 1,
        required: true,
    },
    previousQuantity: {
        type: Number,
        min: 0,
        required: true,
    },
    newQuantity: {
        type: Number,
        min: 0,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});

export const Transaction = mongoose.model('Transaction', TransactionSchema);
