import { db } from "../index.js";

export const createTodoModel = (title, description, list, userId) => {
  const stmt = db.prepare(
    "INSERT INTO todos (title, description, list, user_id) VALUES (?, ?, ?, ?) RETURNING *",
  );
  const row = stmt.get(title, description || "", list || null, userId);
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
  const currentTodo = db
    .prepare("SELECT * FROM todos WHERE id = ?")
    .get(todoId);
  if (!currentTodo) return null;

  const title = fields.title !== undefined ? fields.title : currentTodo.title;
  const description =
    fields.description !== undefined
      ? fields.description
      : currentTodo.description;
  const list = fields.list !== undefined ? fields.list : currentTodo.list;

  let check = currentTodo.check;
  if (fields.check !== undefined) {
    check = fields.check ? 1 : 0;
  }

  const stmt = db.prepare(
    'UPDATE todos SET title = ?, description = ?, list = ?, "check" = ? WHERE id = ? RETURNING *',
  );
  const updatedRow = stmt.get(title, description, list, check, todoId);

  return { ...updatedRow, check: updatedRow.check === 1 };
};
