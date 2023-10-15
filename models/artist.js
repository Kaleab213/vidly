const Joi = require('joi');

function validateArtist(artist) {
  const schema = Joi.object({
    artist_bio: Joi.string().max(255).allow(''),
    artist_category: Joi.string().valid('religion', 'non-religion').required(),
    artist_first_name: Joi.string().max(255).required(),
    artist_last_name: Joi.string().max(255).required(),
    artist_stage_name: Joi.string().max(80).allow(''),
    artist_phone: Joi.string().min(3).max(255).required(),
    artist_password: Joi.string().required(),
    artist_id_card: Joi.string().required()
  });

  return schema.validate(artist);
}

exports.validateArtist = validateArtist;