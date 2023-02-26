// const express = require("express");
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { bind1WithWeb3Proof, createProposal, vote } from "./api/index.js";
const chain_name = "TONtest";
const app = express();
app.use(cors());
app.use(bodyParser.json());


app.get("/", (req, res) => {
  res.send("Hello World!");
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

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
export default app;
