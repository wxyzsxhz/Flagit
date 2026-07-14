const Joi = require("joi");
const { Post } = require("../models");

const createPost = Joi.object({
  title: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  category: Joi.string().valid(...Post.CATEGORIES).required(),
  image: Joi.string().uri().max(1000).allow("", null).optional(),
});

const vote = Joi.object({
  type: Joi.string().valid("red", "green", "black").required(),
});

const createComment = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  parentId: Joi.string().allow(null).optional(),
});

const editComment = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
});

const react = Joi.object({
  reactionKey: Joi.string()
    .valid("funny", "shocking", "sad", "crazy", "confusing", "agree", "wild")
    .required(),
});

const report = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
});

module.exports = { createPost, vote, createComment, editComment, react, report };
