import { createServer } from "node:http";
import { handleRoutes } from "./routes/route.js";

const PORT = process.env.PORT || 3000;

// Утилита для чтения JSON-данных от фронтенда
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
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 2. Сразу отвечаем на предзапрос OPTIONS от CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return; // Дальше роуты выполнять не нужно, браузер просто проверял доступы
  }
  await parseBody(req);

  const url = new URL(req.url, `http://${req.headers.host}`);

  await handleRoutes(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Сервер успешно запущен на порту ${PORT}`);
});
