// const express = require("express");
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { bind1WithWeb3Proof, createProposal, vote } from "./api/index.js";
import FormData from "form-data";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import multer from "multer";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // 上传文件的存储目录
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 上传文件的原始名称
  },
});
const upload = multer({ storage: storage });
const chain_name = process.env.CHAIN_NAME; // "TONtest";
const app = express();
app.use(cors());
app.use(bodyParser.json());

var log = console.log;

console.log = function () {
  const timestamp = new Date().toLocaleString();
  const args = Array.from(arguments);
  args.unshift(`[${timestamp}]`);
  log.apply(console, args);
};

app.get("/", (req, res) => {
  res.send("Hello Soton!");
});

app.post("/api/new-proposal", async (req, res) => {
  console.log("req: ", req.body);
  try {
    const data = req.body;
    const resp = await createProposal(data);
    res.json(resp);
  } catch (e) {
    res.json(e);
  }
});

app.post("/api/vote", async (req, res) => {
  console.log("req: ", req.body);
  try {
    const data = req.body;
    const params = {
      addr: data.address,
      tid: data.username,
      sig: "",
      platform: "Telegram",
      chain_name,
    };
    const resp = await vote(data);
    res.json(resp);
  } catch (e) {
    res.json(e);
  }
});

app.post("/api/bind", async (req, res) => {
  try {
    const data = req.body;
    const resp = await bind1WithWeb3Proof(data);
    res.json(resp);
  } catch (e) {
    res.json(e);
  }
});

const saveBase64ToFile = async (base64Str, fileName) => {
  return new Promise((resolve, reject) => {
    const imgStr = base64Str.split(",");
    const imgBuffer = Buffer.from(imgStr[imgStr.length - 1], "base64");
    const readableStream = new Readable();
    const writeStream = fs.createWriteStream(fileName);
    readableStream.push(imgBuffer);
    readableStream.push(null);
    readableStream.pipe(writeStream);
    // Listen for errors on the write stream
    writeStream.on("error", (err) => {
      reject(err);
    });

    // Listen for the 'finish' event to know when the file has been saved
    writeStream.on("finish", () => {
      resolve(fileName);
    });
  });
};

app.post("/api/sdCallback", upload.single("image"), async (req, res) => {
  // const fileName = `${Date.now}.png`;
  // const filePath = path.resolve(process.cwd(), fileName);
  const { originalname, filename, path } = req.file;

  try {
    const { prompt, extra } = req.body;
    let extraJson = JSON.parse(extra);
    if (typeof extraJson === "string") {
      extraJson = JSON.parse(extraJson);
    }
    console.log(extraJson);
    console.log(originalname, filename, path);
    // await saveBase64ToFile(image, fileName);
    const form = new FormData();
    // Create a form and append image with additional fields
    // const fileStream = fs.createReadStream(fileName);
    form.append("photo", fs.createReadStream(path));
    form.append("caption", prompt);
    form.append("chat_id", extraJson.chat_id);
    form.append("reply_to_message_id", extraJson.message_id);
    const reply_markup = JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "Mint",
            callback_data: "mint_prompt",
          },
        ],
      ],
    });
    form.append("reply_markup", reply_markup);
    // Send form data with axios

    const botToken = process.env.BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const response = await axios.request({
      url,
      method: "POST",
      requestType: "form",
      data: form,
    });

    console.log(response.data);
    // delete temp img
    res.json(response.data);
    // form.on("close", () => {
    //   fs.unlink(fileName);
    // });
  } catch (e) {
    console.log(e);
    res.json(e);
  } finally {
    fs.unlinkSync(path);
  }
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
export default app;
