import Joi from "joi";

// Validation for user registration
export const userValidation = () => {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().trim().lowercase().email().required(),
        phone: Joi.string().max(11),
        role: Joi.string().valid('admin', 'user', 'manager').required(),
        password: Joi.string().min(6).required(),
    });
    return schema;
}

// Validation for user registration
export const userUpdateValidation = () => {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().trim().lowercase().email().required(),
        phone: Joi.string().max(11),
        role: Joi.string().valid('admin', 'user', 'manager').required(),
    });
    return schema;
}

export const LoginSchema = Joi.object({
    email: Joi.string().trim().lowercase().required().messages({
        'string.base': 'Email must be a string.',
        'any.required': 'Email number is required.',
    }),
    password: Joi.string().required().messages({
        'string.base': 'password must be a string.',
    }),

});

// -- category validation
export const categoryValidation = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
});

// -- supplier validation
export const createSupplierValidation = Joi.object({
    name: Joi.string().required().max(40),
    email: Joi.string().trim().lowercase().email(),
    phone: Joi.string().required().max(11),
    address: Joi.string().max(60),
    contactPerson: Joi.string().max(20)

})


// -- product validation
export const createProductValidation = Joi.object({
    name: Joi.string().required().max(40),
    description: Joi.string(),
    sku: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().integer().min(0),
    minimumStock: Joi.number().integer().min(0),
    categoryId: Joi.string().hex().length(24).required(),
    supplierId: Joi.string().hex().length(24).required(),
});
