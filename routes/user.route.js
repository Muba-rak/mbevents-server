const express = require("express");
const {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
