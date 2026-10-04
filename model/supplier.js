import { mongoose } from 'mongoose';


const SupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
    },
    contactPerson: {
        type: String,
    },
}, {
    timestamps: true
});

export const Supplier = mongoose.model('Supplier', SupplierSchema);