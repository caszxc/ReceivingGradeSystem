const express = require("express");
const router = express.Router();
const { Account } = require("../models/association");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const account = await Account.findOne({ where: { username, password } });
    if (!account) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }
    res.json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
