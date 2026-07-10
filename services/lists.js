import {
  createListModel,
  getListsByUserId,
  deleteList,
  updateList,
} from "../models/lists.js";
import { sendJson } from "../routes/route.js";

export const listService = {
  createListModel(req, res) {
    const { title, description, userId } = req.body;

    if (!userId) {
      return sendJson(res, 400, { error: "userId обязателен в теле запроса" });
    }
    if (!title) {
      return sendJson(res, 400, { error: "Название списка обязательно" });
    }

    try {
      const newList = createListModel(title, description, userId);
      return sendJson(res, 201, { success: true, list: newList });
    } catch (error) {
      console.error("Ошибка при работе с БД:", error);
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },

  getLists(req, res) {
    const userId = req.query.userId || req.headers["userid"];

    if (!userId) {
      return sendJson(res, 400, {
        error: "userId обязателен в параметрах запроса",
      });
    }

    try {
      const lists = getListsByUserId(userId);
      return sendJson(res, 200, { success: true, lists });
    } catch (error) {
      console.error("Ошибка при получении списков:", error);
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },

  removeList(req, res) {
    const { id } = req.params;

    if (!id) {
      return sendJson(res, 400, { error: "ID списка обязателен для удаления" });
    }

    try {
      const result = deleteList(id);

      if (result.changes === 0) {
        return sendJson(res, 404, { error: "Список с таким ID не найден" });
      }

      return sendJson(res, 200, {
        success: true,
        message: "Список успешно удален",
      });
    } catch (error) {
      console.error("Ошибка при удалении списка:", error);
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },

  updateListModel(req, res) {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!id) {
      return sendJson(res, 400, {
        error: "ID списка обязателен для обновления",
      });
    }
    if (!title) {
      return sendJson(res, 400, {
        error: "Название списка обязательно для обновления",
      });
    }

    try {
      const updatedList = updateList(id, title, description || "");

      if (!updatedList) {
        return sendJson(res, 404, { error: "Список с таким ID не найден" });
      }

      return sendJson(res, 200, { success: true, list: updatedList });
    } catch (error) {
      console.error("Ошибка при обновлении списка:", error);
      return sendJson(res, 500, { error: "Внутренняя ошибка сервера" });
    }
  },
};
