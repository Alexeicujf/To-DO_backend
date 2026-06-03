import { createServer } from "node:http";
import Database from "better-sqlite3";
import crypto from "node:crypto";
import { list } from "postcss";
import { title } from "node:process";

const PORT = process.env.PORT || 3000;
const db = new Database("database.db", {
  verbose: console.log,
});

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        "check" INTEGER DEFAULT 0, 
        list TEXT,  
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
`);
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
};

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

const createUser = (login, password) => {
  const stmt = db.prepare("INSERT INTO users (login, password) VALUES (?, ?)");
  return stmt.run(login, password);
};

const checkUserExists = (login) => {
  const stmt = db.prepare("SELECT 1 FROM users WHERE login = ?");
  return stmt.get(login);
};
class TodoRequestContext {
  constructor(body = {}, userId = null) {
    this.title = body.title || "Без изменений";
    this.description = body.description || "";
    this.list = body.list || null;
    this.listId = body.listId || null;
    this.todoId = body.todoId || null;
    this.userId = userId || body.userId || null;
  }
}
// 1. Создать список
const createList = (ctx) => {
  const stmt = db.prepare(
    "INSERT INTO lists (title, description, user_id) VALUES (?, ?, ?)",
  );
  return stmt.run(ctx.title, ctx.description, ctx.userId); // Добавили возврат и запуск
};

// 2. Получить списки пользователя
const getListsByUserId = (userId) => {
  const stmt = db.prepare("SELECT * FROM lists WHERE user_id = ?"); // Убрали лишнюю точку с запятой
  return stmt.all(userId);
};

// 3. Удалить список
const deleteList = (listId) => {
  const stmt = db.prepare("DELETE FROM lists WHERE id = ?");
  return stmt.run(listId);
};

// 4. Редактировать список
const updateList = (ctx) => {
  const stmt = db.prepare(
    "UPDATE lists SET title = ?, description = ? WHERE id = ?",
  ); // Исправили const и stmt
  return stmt.run(ctx.title, ctx.description, ctx.listId);
};
const createTodo = (ctx) => {
  const stmt = db.prepare(
    "INSERT INTO todos (title, description, list, user_id) VALUES (?, ?, ?, ?)",
  );
  return stmt.run(ctx.title, ctx.description, ctx.list, ctx.userId);
};

const getTodosByUserId = (userId) => {
  const stmt = db.prepare("SELECT * FROM todos WHERE user_id = ?");
  const rows = stmt.all(userId);
  return rows.map((row) => ({
    ...row,
    check: row.check === 1,
  }));
};

const deleteTodo = (todoId) => {
  const stmt = db.prepare("DELETE FROM todos WHERE id = ?");
  return stmt.run(todoId);
};

const toggleTodoCheck = (todoId) => {
  const stmt = db.prepare(
    "UPDATE todos SET check = CASE WHEN check = 1 THEN 0 ELSE 1 END WHERE id = ?",
  );
  return stmt.run(todoId);
};
const server = createServer(async (req, res) => {
  await parseBody(req);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  // 1. РЕГИСТРАЦИЯ
  if (req.method === "POST" && pathname === "/register") {
    const { login, password } = req.body;

    if (!login || !password) {
      return sendJson(res, 400, { error: "Введите пароль и логин" });
    }

    if (checkUserExists(login)) {
      return sendJson(res, 400, { error: "Этот логин уже занят" });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");
    const securePassword = `${salt}:${hashedPassword}`;

    createUser(login, securePassword);

    return sendJson(res, 201, {
      success: true,
      message: "Успешная регистрация",
    });
  }

  // 2. ЛОГИН
  if (req.method === "POST" && pathname === "/login") {
    const { login, password } = req.body;

    if (!login || !password) {
      return sendJson(res, 400, { error: "Введите логин и пароль" });
    }

    const stmt = db.prepare("SELECT * FROM users WHERE login = ?");
    const user = stmt.get(login);

    if (!user) {
      return sendJson(res, 400, { error: "Неверный логин или пароль" });
    }

    const [salt, storedHash] = user.password.split(":");
    const hashToVerify = crypto.scryptSync(password, salt, 64).toString("hex");

    if (storedHash !== hashToVerify) {
      return sendJson(res, 400, { error: "Неверный login или пароль" });
    }

    return sendJson(res, 200, {
      success: true,
      user: user.login,
    });
  }

  // 3. СОЗДАНИЕ СПИСКА
  if (req.method === "POST" && pathname === "/lists") {
    const userId = 1;
    const ctx = new TodoRequestContext(req.body, userId);
    if (!req.body.title) {
      return sendJson(res, 400, { error: "Название списка обязательно" });
    }
    createList(ctx);
    return sendJson(res, 201, {
      success: true,
      message: "Список успешно создан",
    });
  }

  // 4. ПОЛУЧЕНИЕ ВСЕХ СПИСКОВ
  if (req.method === "GET" && pathname === "/lists") {
    const userId = 1;
    const lists = getListsByUserId(userId);
    return sendJson(res, 200, { success: true, lists });
  }

  // 5. СОЗДАНИЕ ЗАДАЧИ (TODO)
  if (req.method === "POST" && pathname === "/todos") {
    const userId = 1;
    const ctx = new TodoRequestContext(req.body, userId);
    if (!req.body.title) {
      return sendJson(res, 400, { error: "Название задачи обязательно" });
    }
    createTodo(ctx);
    return sendJson(res, 201, {
      success: true,
      message: "Задача успешно создана",
    });
  }

  // 6. ПОЛУЧЕНИЕ ВСЕХ ЗАДАЧ (TODOS)
  if (req.method === "GET" && pathname === "/todos") {
    const userId = 1;
    const todos = getTodosByUserId(userId);
    return sendJson(res, 200, { success: true, todos });
  }

  // --- ЭТА СТРОКА ДОЛЖНА БЫТЬ САМОЙ ПОСЛЕДНЕЙ ВНУТРИ СЕРВЕРА ---
  return sendJson(res, 404, { error: "Маршрут не найден" });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/// на гит кинуть и почитать sql
// попоробовать для постмана сделать фаил что бы он добавлял тестовые энпоинты которые у меня есть логина, регистра и тд
// ЗАХКЕШИРОВАТЬ ПОРОЛИ И ПОЧИТАТЬ ПРО ХЕШ  И СРАВНИВАТЬ ПОРОЛЬ КОТОРЫЙ Я ОТПРАВЛЯЮ И ОН СРАВНИВАЛСЯ С ПОРОЛЕМ ИЗ БД, И ОБА ОНИ ДОЛЖНЫ  БЫТЬ ХЭШИРОВАННЫЕ
// REST API перечитать и посмотреть что-то
// согдание редактировавание удаление и добавлениезадач в бд задач
// db.exec(`
//     CREATE TABLE IF NOT EXISTS users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         login TEXT NOT NULL UNIQUE,
//         password TEXT NOT NULL
//     );
// `);
// для листов скоприровать  и для задач
// сделать связь меджу полльзователями и задачами
// сделать связь меджу полльзователями и задачами
