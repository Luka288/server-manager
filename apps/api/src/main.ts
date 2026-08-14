import express from "express";

const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "Hello API" });
});

app.get("/api/servers", (req, res) => {
  res.json([]);
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
