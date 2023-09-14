const express = require("express");
const router = express.Router();

const {
  getConnectionsByUserId,
  getConnection,
  getAllMessagesByConnectionId,
} = require("../controllers/connectionController");
const { isLoggedIn } = require("../middlewares/user");

router.route("/get-connections").get(isLoggedIn, getConnectionsByUserId);
router.route("/get-connection/:userBid").get(isLoggedIn, getConnection);
router
  .route("/get-all-messages/:connectionId")
  .get(isLoggedIn, getAllMessagesByConnectionId);

module.exports = router;
