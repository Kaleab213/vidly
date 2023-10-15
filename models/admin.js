const Joi = require('joi');

function validateAdmin(admin) {
  const schema = Joi.object({
    admin_phone: Joi.string().min(3).max(255).required(),
    admin_password: Joi.string().required()
  });

  return schema.validate(admin);
}

exports.validateAdmin = validateAdmin;