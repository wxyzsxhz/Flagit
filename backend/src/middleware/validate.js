// Generic request validator: pass a Joi schema, get 400s with clear
// messages for any malformed input instead of it reaching the DB layer.
function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: true, stripUnknown: true });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req[source] = value;
    next();
  };
}

module.exports = { validate };
