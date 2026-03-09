const express = require("express");
const router = express.Router();
const { Account } = require("../models/association");

router.post("/create", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Check if username already exists
    const existingAccount = await Account.findOne({ where: { username } });
    if (existingAccount) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new account
    const newAccount = await Account.create({
      username,
      password,
      role,
    });

    res.status(201).json({
      message: "Account created successfully",
      account: {
        id: newAccount.id,
        username: newAccount.username,
        role: newAccount.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
