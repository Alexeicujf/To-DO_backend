import { db } from "../models/database.js";

// const createList = (req, data) => {};

// const lisrService = {
//   createList() {
//     const { title, description, userId } = req.body;
//     if (!userId)
//       return sendJson(res, 400, { error: "userId обязателен в теле запроса" });
//     if (!title)
//       return sendJson(res, 400, { error: "Название списка обязательно" });

//     const newList = createListModel(title, description, userId);
//     return sendJson(res, 201, { success: true, list: newList });
//   },
// };

// lisrService.createList({});

export const createList = (title, description, userId) => {
  const stmt = db.prepare(
    "INSERT INTO lists (title, description, user_id) VALUES (?, ?, ?) RETURNING *",
  );
  return stmt.get(title, description || "", userId);
};

export const getListsByUserId = (userId) => {
  const stmt = db.prepare("SELECT * FROM lists WHERE user_id = ?");
  return stmt.all(userId);
};

export const deleteList = (listId) => {
  const stmt = db.prepare("DELETE FROM lists WHERE id = ?");
  return stmt.run(listId);
};

export const updateList = (listId, title, description) => {
  const stmt = db.prepare(
    "UPDATE lists SET title = ?, description = ? WHERE id = ? RETURNING *",
  );
  return stmt.get(title, description, listId);
};
