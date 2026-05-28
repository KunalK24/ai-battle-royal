import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const port = 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});