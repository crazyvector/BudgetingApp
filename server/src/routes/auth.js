import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.APP_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ message: "Server misconfiguration: APP_PASSWORD is not set." });
  }

  if (password === correctPassword) {
    const token = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET || "fallback_secret_for_dev_only",
      { expiresIn: "30d" } // Token valid for 30 days
    );
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid password" });
  }
});

export default router;
