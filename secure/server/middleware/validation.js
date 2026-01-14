import Joi from "joi";

export const registerSchema = Joi.object({
    name: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^[0-9\-]+$/).required()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const eventSchema = Joi.object({
    title: Joi.string().min(3).required(),
    date: Joi.string().required(), // 可以加更嚴格的日期格式驗證
    description: Joi.string().optional(),
    location: Joi.string().optional(),
    price: Joi.number().min(0).optional(),
    quota: Joi.number().min(1).integer().required()
});

// 通用驗證 Middleware
export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            ok: false,
            error: error.details[0].message
        });
    }
    next();
};
