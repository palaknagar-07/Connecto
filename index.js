const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const port = 9000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// socket.io
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("user-message", (message) => {
        const msgData = {
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
         };
    
        io.emit("message", msgData); // broadcast to everyone
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// serve static files
app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(port, () => console.log(`Server started at http://localhost:${port}`));
