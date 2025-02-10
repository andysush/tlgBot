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
	const keyboard = {
		reply_markup: {
			keyboard: [
				[
					{
						text: "📍 Поділитися геолокацією",
						request_location: true,
					},
				],
			],
			resize_keyboard: true,
			one_time_keyboard: true,
		},
	};

	await ctx.reply(
		"Щоб покращити роботу, поділися своєю геолокацією:",
		keyboard
	);

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
bot.on("message:location", async (ctx) => {
	const userId = ctx.from.id;
	const location = ctx.message.location;

	console.log(
		`📍 Отримано координати: ${location.latitude}, ${location.longitude}`
	);

	try {
		// 1️⃣ Отримуємо IP користувача
		const ipResponse = await fetch("http://127.0.0.1:3001/get-ip");
		const ipData = await ipResponse.json();
		let userIp = ipData.ip || "❌ Не вдалося отримати IP";

		// Якщо IP локальний, підставляємо тестовий IP
		if (userIp.startsWith("::ffff:127.0.0.1")) {
			userIp = "8.8.8.8"; // Google DNS
		}

		console.log(`🌍 Отримано IP: ${userIp}`);

		// 2️⃣ Отримуємо країну користувача
		const countryResponse = await fetch(
			`https://ipinfo.io/${userIp}/json?token=${process.env.API_KEY}`
		);
		const countryData = await countryResponse.json();

		console.log("📍 Відповідь API:", countryData);

		// Перевіряємо, чи є країна
		let userCountry = countryData.country || "❌ Не знайдено";

		console.log(`🌍 Визначена країна: ${userCountry}`);

		// 4️⃣ Оновлюємо MongoDB
		const updatedUser = await User.findOneAndUpdate(
			{ id: userId },
			{
				$set: {
					"location.latitude": location.latitude,
					"location.longitude": location.longitude,
					country: userCountry,
					ip: userIp,
				},
			},
			{ new: true, upsert: true }
		);

		console.log("✅ Оновлено користувача в БД:", updatedUser);

		// 5️⃣ Відправляємо користувачу підтвердження
		await ctx.reply(`✅ Ваша країна: ${userCountry}\n🖥 Ваш IP: ${userIp}`);
	} catch (error) {
		console.error("❌ Помилка отримання IP/країни:", error);
		await ctx.reply("⚠️ Виникла помилка при визначенні країни та IP.");
	}
});

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

// Отримуємо IP користувача
app.get("/get-ip", (req, res) => {
	const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
	console.log(`🌍 Отримано IP: ${userIp}`);
	res.json({ ip: userIp });
});

// Отримуємо країну за IP
app.get("/get-location", async (req, res) => {
	try {
		const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
		console.log(`🌍 Запит геолокації для IP: ${userIp}`);

		const response = await fetch(`https://ipapi.co/${userIp}/json/`);
		const data = await response.json();

		if (data && data.country_name) {
			res.json({ country: data.country_name });
		} else {
			res.status(404).json({ error: "Не вдалося визначити країну" });
		}
	} catch (error) {
		console.error("❌ Помилка отримання країни:", error);
		res.status(500).json({ error: "Помилка сервера" });
	}
});

// 📌 Запускаємо сервер Express та Telegram-бота

app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
	bot.start();
});
