const express = require("express");
const router = express.Router();
const { Account } = require("../models/association");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const account = await Account.findOne({ where: { username } });
    // Case-sensitive password
    if (!account || account.password !== password) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }
    // Return user information including role
    res.json({
      message: "Login successful",
      user: {
        id: account.id,
        username: account.username,
        role: account.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
