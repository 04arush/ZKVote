require("dotenv").config();
const express = require("express");
const cors = require("cors");

const electionsRouter = require("./routes/elections");
const adminRouter = require("./routes/admin");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/elections", electionsRouter);
app.use("/api/admin", adminRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`ZKVote backend listening on: ${PORT}`));
