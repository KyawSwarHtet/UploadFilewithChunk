import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import md5 from "md5";

const app = express();
app.use(
  bodyParser.raw({
    type: "application/octet-stream",
    limit: "600mb",
  })
);
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use("/public", express.static("public"));

app.post("/upload", (req, res) => {
  const { name, currentChunkIndex, totalChunks } = req.query;
  const firstChunk = parseInt(currentChunkIndex) === 0;
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
  const ext = name.split(".").pop();
  const data = req.body.toString().split(",")[1];
  const buffer = new Buffer(data, "base64");
  const tmpFilename = "tmp_" + md5(name + req.ip) + "." + ext;
  if (firstChunk && fs.existsSync("./public/" + tmpFilename)) {
    fs.unlinkSync("./public/" + tmpFilename);
  }
  fs.appendFileSync("./public/" + tmpFilename, buffer);
  if (lastChunk) {
    const finalFilename = md5(Date.now()).substr(0, 6) + "." + ext;
    fs.renameSync("./public/" + tmpFilename, "./public/" + finalFilename);
    res.json({ finalFilename });
  } else {
    res.json("ok");
  }
});

const PORT = 8000;
console.log("prosess in server server", PORT);
app.listen(PORT);
