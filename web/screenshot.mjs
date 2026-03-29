#!/usr/bin/env node
import puppeteer from "puppeteer";
import { mkdirSync, readdirSync } from "fs";
import { join } from "path";

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";
const dir = join(import.meta.dirname, "temporary screenshots");

mkdirSync(dir, { recursive: true });

// Auto-increment screenshot number
const existing = readdirSync(dir).filter((f) => f.startsWith("screenshot-"));
const nums = existing.map((f) => parseInt(f.match(/screenshot-(\d+)/)?.[1] || "0"));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
await page.screenshot({ path: join(dir, filename), fullPage: false });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);
