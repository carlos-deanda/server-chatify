
import express from 'express';
import { disconnect } from 'node:cluster';
import { createServer } from 'node:http';
import { Server } from 'socket.io';


const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173/',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// PostgreSQL connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});


await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);


app.get('/', (req, res) => {
  res.send('<h1>Hello world 3</h1>');
});


io.on('connection', async (socket) => {
    console.log('a user connected', socket.id);

    if (!socket.recovered) {
        try {
        await db.each('SELECT id, content FROM messages WHERE id > ?',
            [socket.handshake.auth.serverOffset || 0],
            (_err, row) => {
            socket.emit('chat message', row.content, row.id);
            }
        )
        } catch (e) {
        }
    }

    socket.on('chat message', async (msg) => {
        console.log('message: ' + msg);
        let result;
        try {
        result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
        } catch (e) {
        return;
        }
     io.emit('chat message', msg, result.lastID);
    });
    
    socket.on('disconnect',() => {
        console.log("User disconnected", socket.id)
    });

    connectionStateRecovery: {

    }
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});