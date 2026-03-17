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

router.get("/getAccounts", async (req, res) => {
  try {
    const accounts = await Account.findAll({
      attributes: [
        "id",
        "username",
        "password",
        "role",
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Accounts fetched successfully",
      accounts: accounts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/deleteAccount/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const account = await Account.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    await account.destroy();
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/changePassword/:id", async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const account = await Account.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    await account.update({ password: newPassword });
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
