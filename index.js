import { createServer } from "node:http";
import Database from 'better-sqlite3';
import { error } from "node:console";
import { resolve } from "node:dns";
const PORT = process.env.PORT || 3000; 
const db = new Database('database.db', {
    verbase: console.log
    
})
db.exec(`
    CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);`)



const sendJson = (res, statusCode, data) => {
    res.writeHead(statusCode, {"Content-Type": "application/json"})
    res.end(JSON.stringify(data, null, 2));
}

const parseBody = (req) => {
    return new Promise((resolve) => {
        let body= "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {req.body = body ? JSON.parse(body) : {};}
            catch {req.body = {};}
            resolve();
        });
    });
};
const createUser = (login, password) => {
    const stmt = db.prepare("INSERT INTO users (login, password) VALUES (?, ?)");
    return stmt.run(login, password); 
}
const getUser =(login, password) => {
    const stmt = db.prepare("SELECT * FROM users WHERE login = ? AND password = ?");
     return stmt.get(login, password);
} 
const checkUserExists = (login) => {
    const stmt = db.prepare("SELECT 1 FROM users WHERE login = ?");
    return stmt.get(login);
};
const server = createServer(async (req, res) => {
    await parseBody(req)
    const url = new URL(req.url, `http://${req.headers.host}`);
    const {pathname}= url;
    if (req.method === "GET" && pathname === "/todos") {
        console.log("Получение Todos");
        
    }
    if(pathname === "/register") {
        const {login, password} = req.body;
        if (!login || !password) {
            return sendJson(res, 400, {error: "Введите пороль и логин"});
        }
        if (checkUserExists(login)) {
            return sendJson(res, 400, {error: "Этот логин уже занят"});
        }
        createUser(login, password);
        return sendJson(res, 201, {
            success: true,
            message: "Успешная регистрация"
        })
    }
    if (pathname === "/login") {
        const {login, password} = req.body;
        if (!login || !password) {
            return sendJson(res, 400, {error: "Введите логин и пороль"});
        }
        const user = getUser(login, password);
        if (!user) {
            return sendJson(res, 400, {error: "Неверный логин или пороль"})
        }
         return sendJson(res, 200, {
            success: true,
            user: user.login
        });
    }
       return sendJson(res, 404, { error: "Маршрут не найден" });
})
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT})`);
    
})


/// на гит кинуть и почитать sql
/// сделать фунции для создания и получения пользователя, энпоинты 