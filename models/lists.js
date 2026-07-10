import { db } from "../index.js";

export const createListModel = (title, description, userId) => {
  let targetUserId = Number(userId || 0);

  const userExists = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(targetUserId);
  if (!userExists) {
    const firstUser = db.prepare("SELECT id FROM users LIMIT 1").get();
    targetUserId = firstUser ? firstUser.id : 1;
  }

  const stmt = db.prepare(
    "INSERT INTO lists (title, description, user_id) VALUES (?, ?, ?) RETURNING *",
  );
  return stmt.get(title, description || "", targetUserId);
};

export const getListsByUserId = (userId) => {
  let targetUserId = Number(userId || 0);

  const userExists = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(targetUserId);
  if (!userExists) {
    const firstUser = db.prepare("SELECT id FROM users LIMIT 1").get();
    targetUserId = firstUser ? firstUser.id : 1;
  }

  const stmt = db.prepare("SELECT * FROM lists WHERE user_id = ?");
  return stmt.all(targetUserId);
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
