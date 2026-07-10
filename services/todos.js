import {
  createTodoModel,
  getTodosByUserId,
  deleteTodo,
  updateTodo,
} from "../models/todos.js";
import { sendJson } from "../routes/route.js";

export const todosService = {
  createTodoModel(req, res) {
    const { title, description, list, userId } = req.body;

    if (!userId) {
      return sendJson(res, 400, { error: "userId обязателен в теле запроса" });
    }
    if (!list) {
      return sendJson(res, 400, { error: "Лист обязателен для задачи" });
    }
    if (!title) {
      return sendJson(res, 400, { error: "Название задачи обязательно" });
    }

    try {
      const newTodo = createTodoModel(title, description, list, userId);
      return sendJson(res, 201, { success: true, todo: newTodo });
    } catch (error) {
      console.error("Ошибка при работе с БД:", error);
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },
  getTodos(req, res) {
    const { userId } = req.query;
    if (!userId) {
      return sendJson(res, 400, {
        error: "userId обязателен в параметрах запроса",
      });
    }
    try {
      const todos = getTodosByUserId(userId);
      return sendJson(res, 200, { success: true, todos });
    } catch (error) {
      console.error("Ошиба при получении задачи", error);
      return sendJson(res, 500, { error: "Ошибка сервера" });
    }
  },
  removeTodo(req, res) {
    const { id } = req.params;
    if (!id) {
      return sendJson(res, 400, { error: "Задачи ч таким id не найдено" });
    }
    try {
      const isDelete = deleteTodo(id);
      if (isDelete.changes === 0) {
        return sendJson(res, 404, { error: "Задачи с таким id не найдено" });
      }
      return sendJson(res, 200, {
        success: true,
        message: "Задача успешно удален",
      });
    } catch (error) {
      console.error("Ошибка удаления задачи");
      return sendJson(res, 500, { error: "Ошибка сервера" });
    }
  },
  updateTodoModel(req, res) {
    const { id } = req.params;
    const { title, description, check } = req.body;
    if (!id) {
      return sendJson(res, 400, {
        error: "Id задачи обязательно для обновления",
      });
    }
    if (!title) {
      return sendJson(res, 400, {
        error: "Название задачи обязательно для обновления",
      });
    }
    try {
      const updated = updateTodo(id, { title, description, check });
      if (!updated) {
        return sendJson(res, 404, { error: "Задачи с таким id не найден" });
      }
      return sendJson(res, 200, { success: true, todo: updated });
    } catch (error) {
      console.error("Ошибка при обновлении задачи", error);
      return sendJson(res, 500, { error: "Ошибка сервера" });
    }
  },
};
