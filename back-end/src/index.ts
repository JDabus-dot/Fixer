import express from "express";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.get("/", (req, res) => {
    res.json({ message: "Hola mundo desde Fixer API" });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});