import { createUserModal, checkUserExists } from "../models/users.js";
import { sendJson } from "../routes/route.js";
import crypto from "node:crypto";
import { db } from "../index.js";

export const userService = {
  createUser(req, res) {
    const { login, password } = req.body;

    if (!login || !password) {
      return sendJson(res, 400, { error: "Введите пароль и логин" });
    }

    try {
      if (checkUserExists(login)) {
        return sendJson(res, 400, { error: "Этот логин уже занят" });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

      createUserModal(login, `${salt}:${hashedPassword}`);

      return sendJson(res, 201, {
        success: true,
        message: "Успешная регистрация",
      });
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },

  loginUser(req, res) {
    const { login, password } = req.body;

    if (!login || !password) {
      return sendJson(res, 400, { error: "Введите логин и пароль" });
    }

    try {
      if (!db) {
        console.error("Критическая ошибка: Переменная db не инициализирована!");
        return sendJson(res, 500, {
          error: "Ошибка подключения к базе данных",
        });
      }

      const user = db.prepare("SELECT * FROM users WHERE login = ?").get(login);
      if (!user || !user.password) {
        return sendJson(res, 400, { error: "Неверный логин или пароль" });
      }

      const parts = user.password.split(":");
      if (parts.length !== 2) {
        return sendJson(res, 400, { error: "Неверный логин или пароль" });
      }

      const [salt, storedHash] = parts;
      const hashToVerify = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

      if (storedHash !== hashToVerify) {
        return sendJson(res, 400, { error: "Неверный логин или пароль" });
      }

      const userId = user.id !== undefined ? user.id : user.user_id;

      return sendJson(res, 200, {
        success: true,
        user: user.login,
        userId: userId,
      });
    } catch (error) {
      console.error("\n=== КРИТИЧЕСКАЯ ОШИБКА АВТОРИЗАЦИИ ===");
      console.error(error);
      console.error("======================================\n");
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },
};
