const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  sendWelcomeEmail,
  sendResetPasswordEmail,
} = require("../emails/sendMail");

// Utility function to generate JWT
const generateToken = ({ userId, fullName }) => {
  return jwt.sign({ userId, fullName }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Register
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    // Check if required fields are provided
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
    });

    const clientUrl = `${process.env.FRONTEND_URL}/login`;
    console.log(clientUrl);

    try {
      await sendWelcomeEmail({
        email: user.email,
        fullName: user.fullName,
        clientUrl,
      });
    } catch (emailError) {
      console.error("Error sending welcome email", emailError);
    }

    res
      .status(201)
      .json({ success: true, message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    // Generate token
    const token = generateToken({ userId: user._id, email: user.email });
    res.status(200).json({
      success: true,
      token,
      user: {
        email: user.email,
        fullName: user.fullName,
        password: user.password,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Provide email, oldPassword and new Password" });
  }

  try {
    // Validate that the new password meets the schema requirements
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]+$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "New Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the old password with the stored hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // // Hash the new password before saving it
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token (signed with user ID)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Save the reset token and its expiry in the database
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Create reset link for the frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    console.log(resetUrl);

    try {
      await sendResetPasswordEmail({
        email: user.email,
        fullName: user.fullName,
        resetUrl,
      });
    } catch (emailError) {
      console.error("Error sending welcome email", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ success: true, message: "Provide Token and new password" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user with the token
    const user = await User.findOne({
      _id: decoded.id,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Ensure token hasn't expired
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired token", success: false });

    user.password = newPassword;

    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res
      .status(200)
      .json({ message: "Password has been reset successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  login,
  register,
  changePassword,
  forgotPassword,
  resetPassword,
};
