function randomAvatar(seed) {
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
}

module.exports = { randomAvatar };
