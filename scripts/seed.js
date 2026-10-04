import mongoose from 'mongoose';
import connectDB from '../config/connection.js';
import { Category } from '../model/category.js';
import { Product } from '../model/product.js';
import { Supplier } from '../model/supplier.js';

const categories = [
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Office Supplies', description: 'Furniture and everyday office equipment' },
    { name: 'Safety Equipment', description: 'Workplace safety and protective equipment' },
];

const suppliers = [
    {
        name: 'Aster Electronics Supply',
        email: 'orders@aster-electronics.example',
        phone: '5551002001',
        address: '100 Circuit Avenue',
        contactPerson: 'Jordan Lee',
    },
    {
        name: 'Papertrail Office Goods',
        email: 'orders@papertrail-office.example',
        phone: '5551002002',
        address: '220 Ledger Street',
        contactPerson: 'Morgan Reed',
    },
    {
        name: 'Summit Safety Products',
        email: 'orders@summit-safety.example',
        phone: '5551002003',
        address: '35 Summit Road',
        contactPerson: 'Taylor Quinn',
    },
];

const upsertRecords = async (model, key, records) => Promise.all(
    records.map((record) => model.findOneAndUpdate(
        { [key]: record[key] },
        { $setOnInsert: record },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    )),
);

const seed = async () => {
    await connectDB();

    try {
        const [categoryDocs, supplierDocs] = await Promise.all([
            upsertRecords(Category, 'name', categories),
            upsertRecords(Supplier, 'name', suppliers),
        ]);
        const categoryByName = new Map(categoryDocs.map((category) => [category.name, category]));
        const supplierByName = new Map(supplierDocs.map((supplier) => [supplier.name, supplier]));

        const products = [
            {
                name: 'USB-C Docking Station',
                description: 'Dual-display USB-C docking station',
                sku: 'ELEC-DOCK-001',
                price: 129.99,
                quantity: 18,
                minimumStock: 5,
                category: 'Electronics',
                supplier: 'Aster Electronics Supply',
            },
            {
                name: 'Wireless Keyboard',
                description: 'Compact wireless keyboard with numeric keypad',
                sku: 'ELEC-KEY-002',
                price: 44.5,
                quantity: 32,
                minimumStock: 8,
                category: 'Electronics',
                supplier: 'Aster Electronics Supply',
            },
            {
                name: 'LED Desk Lamp',
                description: 'Adjustable LED desk lamp with dimmer',
                sku: 'ELEC-LAMP-003',
                price: 36.75,
                quantity: 4,
                minimumStock: 6,
                category: 'Electronics',
                supplier: 'Aster Electronics Supply',
            },
            {
                name: 'Ergonomic Office Chair',
                description: 'Adjustable mesh-back office chair',
                sku: 'OFF-CHAIR-001',
                price: 219.0,
                quantity: 12,
                minimumStock: 3,
                category: 'Office Supplies',
                supplier: 'Papertrail Office Goods',
            },
            {
                name: 'Copy Paper Case',
                description: 'Case of 10 reams of letter-size copy paper',
                sku: 'OFF-PAPER-002',
                price: 52.0,
                quantity: 40,
                minimumStock: 10,
                category: 'Office Supplies',
                supplier: 'Papertrail Office Goods',
            },
            {
                name: 'Protective Safety Glasses',
                description: 'Anti-fog clear protective eyewear',
                sku: 'SAFE-GLASS-001',
                price: 8.95,
                quantity: 3,
                minimumStock: 10,
                category: 'Safety Equipment',
                supplier: 'Summit Safety Products',
            },
        ];

        const productDocs = await Promise.all(products.map(({ category, supplier, ...product }) => (
            Product.findOneAndUpdate(
                { sku: product.sku },
                {
                    $setOnInsert: {
                        ...product,
                        categoryId: categoryByName.get(category)._id,
                        supplierId: supplierByName.get(supplier)._id,
                    },
                },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
            )
        )));

        console.log(`Seeded ${categoryDocs.length} categories, ${supplierDocs.length} suppliers, and ${productDocs.length} products.`);
    } finally {
        await mongoose.disconnect();
    }
};

seed().catch((error) => {
    console.error('Failed to seed inventory records:', error.message);
    process.exitCode = 1;
});