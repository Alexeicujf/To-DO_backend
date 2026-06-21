import { db } from "../index.js";

export const createUserModal = (login, password) => {
  const stmt = db.prepare("INSERT INTO users (login, password) VALUES (?, ?)");
  return stmt.run(login, password);
};

export const checkUserExists = (login) => {
  const stmt = db.prepare("SELECT 1 FROM users WHERE login = ?");
  return stmt.get(login);
};
