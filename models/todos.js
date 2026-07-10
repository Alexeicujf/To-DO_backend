import { db } from "../index.js";

export const createTodoModel = (title, description, list, userId) => {
  let targetUserId = Number(userId || 0);
  const userExists = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(targetUserId);
  if (!userExists) {
    const firstUser = db.prepare("SELECT id FROM users LIMIT 1").get();
    targetUserId = firstUser ? firstUser.id : 1;
  }

  const stmt = db.prepare(
    "INSERT INTO todos (title, description, list, user_id) VALUES (?, ?, ?, ?) RETURNING *",
  );
  const row = stmt.get(title, description || "", list, targetUserId);
  return { ...row, check: row.check === 1 };
};

export const getTodosByUserId = (userId) => {
  const stmt = db.prepare("SELECT * FROM todos WHERE user_id = ?");
  const rows = stmt.all(userId);
  return rows.map((row) => ({
    ...row,
    check: row.check === 1,
  }));
};

export const deleteTodo = (todoId) => {
  const stmt = db.prepare("DELETE FROM todos WHERE id = ?");
  return stmt.run(todoId);
};

export const updateTodo = (todoId, fields) => {
  try {
    const currentTodo = db
      .prepare("SELECT * FROM todos WHERE id = ?")
      .get(Number(todoId));

    if (!currentTodo) return null;

    const safeFields = fields || {};
    const title =
      safeFields.title !== undefined ? safeFields.title : currentTodo.title;
    const description =
      safeFields.description !== undefined
        ? safeFields.description
        : currentTodo.description;
    const check =
      safeFields.check !== undefined
        ? safeFields.check
          ? 1
          : 0
        : currentTodo.check;

    db.prepare(
      'UPDATE todos SET title = ?, description = ?, "check" = ? WHERE id = ?',
    ).run(title, description || "", check, Number(todoId));

    const row = db
      .prepare("SELECT * FROM todos WHERE id = ?")
      .get(Number(todoId));
    return { ...row, check: row.check === 1 };
  } catch (error) {
    console.error("Ошибка в модели updateTodo:", error);
    return null;
  }
};
