const Joi = require('joi');
const passwordComplexity = require("joi-password-complexity");

function validateUser(user) {
  const schema = Joi.object({
    user_first_name: Joi.string().max(255).required(),
    user_last_name: Joi.string().max(255).required(),
    user_phone: Joi.string().min(3).max(255).required(),
    user_password: Joi.string()
  });
  return schema.validate(user);
}

function validatePhone(req) {
  const schema = Joi.string().min(3).max(255).required()
  return schema.validate(req);
};

function validatePassword(password){
  const complexityOptions = {
    min: 6,
    max: 80,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    requirementCount: 3,
  };
  
  return passwordComplexity(complexityOptions, "Password").validate(password);
}

exports.validateUser = validateUser;
exports.validatePassword = validatePassword;
exports.validatePhone = validatePhone;