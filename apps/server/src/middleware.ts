import type { RequestHandler } from "express";

import { ADMIN_PASSWORD } from "./config.js";

export const requireAdminPassword: RequestHandler = (req, res, next) => {
  const providedPassword = req.header("x-admin-password");

  if (providedPassword !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};
