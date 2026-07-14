const { Notification } = require("../models");
const { serializeNotification } = require("../utils/serialize");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({ notifications: notifications.map(serializeNotification), unreadCount });
});

// Clicking a notification marks it read and the frontend uses postId/
// commentId from the payload to redirect to the respective post.
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!notification) throw new ApiError(404, "Notification not found.");
  notification.read = true;
  await notification.save();
  res.json({ notification: serializeNotification(notification) });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
  res.status(204).send();
});

module.exports = { list, markRead, markAllRead };
