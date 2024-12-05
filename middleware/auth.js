const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized to Perform Action" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res
        .status(401)
        .json({ success: false, msg: "Authentication Failed" });
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({ message: "Authentication Failed" });
  }
};

module.exports = auth;
