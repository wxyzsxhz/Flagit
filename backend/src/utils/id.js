const { v4: uuidv4 } = require("uuid");

// Prefixed ids (u_, p_, c_...) keep ids human-recognizable in logs while
// staying globally unique, similar in spirit to the frontend's u1/p1/c1.
function makeId(prefix) {
  return `${prefix}_${uuidv4()}`;
}

module.exports = { makeId };
