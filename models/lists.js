import { db } from "../index.js";

export const createListModel = (title, description, userId) => {
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
