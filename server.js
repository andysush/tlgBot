require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Bot, InputFile } = require("grammy");
const User = require("./models/User");
const PORT = process.env.PORT;
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Віддаємо статичні файли (фронтенд)
app.use(express.static(path.join(__dirname, "public")));

// Віддаємо index.html при заході на головну
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use((req, res, next) => {
	console.log(`🌐 Request received: ${req.method} ${req.url}`);
	next();
});

const bot = new Bot(process.env.BOT_API_KEY);

// 📌 Підключаємося до MongoDB
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("✅ Connected to MongoDB"))
	.catch((err) => console.error("❌ MongoDB connection error:", err));

// 📌 Команда /start
bot.command("start", async (ctx) => {
	await ctx.replyWithPhoto(new InputFile("./media/gcg_bcgrnd.jpg"), {
		caption: "Welcome to GCG_LAB",
	});
	const userData = {
		id: ctx.from.id,
		username: ctx.from.username || "No username",
		first_name: ctx.from.first_name,
		last_name: ctx.from.last_name || "",
		user_lang: ctx.from.language_code || "",
		is_premium: ctx.from.is_premium || false,
		is_bot: ctx.from.is_bot || false,
	};

	try {
		const existingUser = await User.findOne({ id: ctx.from.id });
		if (!existingUser) {
			const newUser = new User(userData);
			await newUser.save();
			console.log("✅ New user added:", userData);
		} else {
			console.log("ℹ️ User already exists:", existingUser);
		}
	} catch (error) {
		console.error("❌ Error saving user:", error);
	}
});

// 📌 Обробка всіх повідомлень
bot.on("message", async (ctx) => {
	await ctx.reply(`Hello, ${ctx.from.first_name}! Your ID: ${ctx.from.id}`);
});

// 📌 API для отримання списку юзерів (для сайту)
app.get("/", (req, res) => {
	res.send("Server is running!");
});
app.get("/api/users", async (req, res) => {
	try {
		const users = await User.find({}); // Фільтр через URL-параметри
		res.json(users);
	} catch (error) {
		console.error("❌ Error fetching users:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// 📌 Запускаємо сервер Express та Telegram-бота

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	bot.start();
});
