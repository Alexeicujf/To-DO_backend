import { userService } from "../services/users.js";
import { listService } from "../services/lists.js";
import { todosService } from "../services/todos.js";

export const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
};

export const handleRoutes = async (req, res, url) => {
  const { pathname } = url;
  const pathParts = pathname.split("/");

  const resource = pathParts[1];
  const id = pathParts[2];

  req.params = { id: id };
  req.query = Object.fromEntries(url.searchParams);

  if (req.method === "POST" && pathname === "/lists") {
    return listService.createListModel(req, res);
  }
  if (req.method === "GET" && pathname === "/lists") {
    return listService.getLists(req, res);
  }
  if (req.method === "PUT" && resource === "lists" && id) {
    return listService.updateListModel(req, res);
  }
  if (req.method === "DELETE" && resource === "lists" && id) {
    return listService.removeList(req, res);
  }

  if (req.method === "POST" && pathname === "/todos") {
    return todosService.createTodoModel(req, res);
  }
  if (req.method === "GET" && pathname === "/todos") {
    return todosService.getTodos(req, res);
  }
  if (req.method === "DELETE" && resource === "todos" && id) {
    return todosService.removeTodo(req, res);
  }
  if (req.method === "PUT" && resource === "todos" && id) {
    return todosService.updateTodoModel(req, res);
  }

  if (req.method === "POST" && pathname === "/register") {
    return userService.createUser(req, res);
  }
  if (req.method === "POST" && pathname === "/login") {
    return userService.loginUser(req, res);
  }

  sendJson(res, 404, { error: "Маршрут не найден" });
};
