import { createUser, checkUserExists } from "../services/users.js";
import {
  createList,
  getListsByUserId,
  updateList,
  deleteList,
} from "../services/lists.js";
import {
  createTodo,
  getTodosByUserId,
  updateTodo,
  deleteTodo,
} from "../services/todos.js";
import crypto from "node:crypto";
import { db } from "../models/database.js";

// Функция отправки ответа, которую вы использовали в коде
const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
};

export const handleRoutes = async (req, res, url) => {
  const { pathname } = url;

  // --- ЛОГИКА ДЛЯ СПИСКОВ (То, что было на вашем скриншоте) ---
  if (req.method === "POST" && pathname === "/lists") {
    const { title, description, userId } = req.body;

    // Ваша валидация теперь живет здесь, в роутере!
    if (!userId)
      return sendJson(res, 400, { error: "userId обязателен в теле запроса" });
    if (!title)
      return sendJson(res, 400, { error: "Название списка обязательно" });

    // Вызываем чистый сервис, передавая только данные
    const newList = createList(title, description, userId);
    return sendJson(res, 201, { success: true, list: newList });
  }

  if (req.method === "GET" && pathname === "/lists") {
    const userId = url.searchParams.get("userId");
    if (!userId)
      return sendJson(res, 400, {
        error: "Укажите userId в параметрах строки запроса",
      });

    const lists = getListsByUserId(userId);
    return sendJson(res, 200, { success: true, lists });
  }

  if (req.method === "PUT" && pathname === "/lists") {
    const { listId, title, description } = req.body;
    if (!listId || !title)
      return sendJson(res, 400, { error: "listId и title обязательны" });

    const updatedList = updateList(listId, title, description);
    return sendJson(res, 200, { success: true, list: updatedList });
  }

  if (req.method === "DELETE" && pathname === "/lists") {
    const { listId } = req.body;
    if (!listId)
      return sendJson(res, 400, { error: "Укажите listId для удаления" });
    deleteList(listId);
    return sendJson(res, 200, {
      success: true,
      message: "Список успешно удален",
    });
  }

  // --- ПОЛЬЗОВАТЕЛИ ---
  if (req.method === "POST" && pathname === "/register") {
    const { login, password } = req.body;
    if (!login || !password)
      return sendJson(res, 400, { error: "Введите пароль и логин" });
    if (checkUserExists(login))
      return sendJson(res, 400, { error: "Этот логин уже занят" });

    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");
    createUser(login, `${salt}:${hashedPassword}`);

    return sendJson(res, 201, {
      success: true,
      message: "Успешная регистрация",
    });
  }

  if (req.method === "POST" && pathname === "/login") {
    const { login, password } = req.body;
    if (!login || !password)
      return sendJson(res, 400, { error: "Введите логин и пароль" });

    const user = db.prepare("SELECT * FROM users WHERE login = ?").get(login);
    if (!user)
      return sendJson(res, 400, { error: "Неверный логин или пароль" });

    const [salt, storedHash] = user.password.split(":");
    const hashToVerify = crypto.scryptSync(password, salt, 64).toString("hex");

    if (storedHash !== hashToVerify)
      return sendJson(res, 400, { error: "Неверный логин или пароль" });
    return sendJson(res, 200, {
      success: true,
      user: user.login,
      userId: user.id,
    });
  }

  // --- ЗАДАЧИ (TODOS) ---
  if (req.method === "POST" && pathname === "/todos") {
    const { title, description, list, userId } = req.body;
    if (!userId || !title)
      return sendJson(res, 400, { error: "userId и title обязательны" });

    const newTodo = createTodo(title, description, list, userId);
    return sendJson(res, 201, { success: true, todo: newTodo });
  }

  if (req.method === "GET" && pathname === "/todos") {
    const userId = url.searchParams.get("userId");
    if (!userId)
      return sendJson(res, 400, {
        error: "Укажите userId в параметрах строки запроса",
      });

    const todos = getTodosByUserId(userId);
    return sendJson(res, 200, { success: true, todos });
  }

  if (req.method === "PUT" && pathname === "/todos") {
    const { todoId, fields } = req.body;
    if (!todoId || !fields)
      return sendJson(res, 400, { error: "Укажите todoId и объект fields" });

    const updatedTodo = updateTodo(todoId, fields);
    if (!updatedTodo) return sendJson(res, 404, { error: "Задача не найдена" });

    return sendJson(res, 200, { success: true, todo: updatedTodo });
  }

  if (req.method === "DELETE" && pathname === "/todos") {
    const { todoId } = req.body;
    if (!todoId)
      return sendJson(res, 400, { error: "Укажите todoId для удаления" });
    deleteTodo(todoId);
    return sendJson(res, 200, {
      success: true,
      message: "Задача успешно удалена",
    });
  }

  // Дефолтный ответ, если эндпоинт не найден
  sendJson(res, 404, { error: "Маршрут не найден" });
};
