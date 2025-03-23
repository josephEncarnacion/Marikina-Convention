require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Database config
const dbConfig = {
    server: "localhost",
    database: "Reservation_Hotel",
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: "default"
    },
    user: "sa",  // Your SQL Server Authentication username
    password: "123"  // Your SA password
};

async function connectDB() {

    try {
        await sql.connect(dbConfig);
        console.log("✅ MSSQL Database Connected Successfully!");
    } catch (err) {
        console.error("❌ Database Connection Failed: ", err.message);
    }
}


connectDB();
// Register User with Role
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const role = "user"; // Default role set to 'user'
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await sql.connect(dbConfig);
        await sql.query`INSERT INTO Users (username, password, role) VALUES (${username}, ${hashedPassword}, ${role})`;
        res.json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Registration failed!" });
    }
});

// Login User with Role
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        await sql.connect(dbConfig);
        const result = await sql.query`SELECT * FROM Users WHERE username = ${username}`;
        const user = result.recordset[0];

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ username, role: user.role }, "secret_key", { expiresIn: "1h" });
            res.json({ token, role: user.role });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: "Login failed!" });
    }
});

app.get("/", (req, res) => {
    res.send("API is Running...");
});

app.listen(5000, () => console.log("Server running on port 5000"));
