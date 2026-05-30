import { createServer } from "node:http";
import Database from 'better-sqlite3';
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

const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const {pathname}= url;
    if (req.method === "GET" && pathname === "/todos") {
        console.log("Получение Todos");
        
    }

})
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT})`);
    
})

/// на гит кинуть и почитать sql
/// сделать фунции для создания и получения пользователя, энпоинты 