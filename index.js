import { createServer } from "node:http";
import { handleRoutes } from "./routes/route.js";
import Database from "better-sqlite3";

export const db = new Database("./database.db");
const PORT = process.env.PORT || 5001;

const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      resolve();
    });
  });
};

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  await parseBody(req);

  const url = new URL(req.url, `http://${req.headers.host}`);

  await handleRoutes(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Сервер успешно запущен на порту ${PORT}`);
});
