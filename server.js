require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Bot, InputFile } = require("grammy");
const User = require("./models/User");
const path = require("path");

const PORT = process.env.PORT || 3001;
const app = express();

app.set("trust proxy", true);
app.use(cors());
app.use(express.json());

// 📌 Віддаємо статичні файли (фронтенд)
app.use(express.static(path.join(__dirname, "public")));

// 📌 Віддаємо index.html при заході на головну
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📌 Ініціалізація бота
const bot = new Bot(process.env.BOT_API_KEY);

// 📌 Підключення до MongoDB
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

	await ctx.reply("Щоб покращити роботу, поділися своєю геолокацією:", {
		reply_markup: {
			keyboard: [
				[{ text: "📍 Поділитися геолокацією", request_location: true }],
			],
			resize_keyboard: true,
			one_time_keyboard: true,
		},
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
		const existingUser = await User.findOneAndUpdate(
			{ id: ctx.from.id },
			{ $set: userData },
			{ new: true, upsert: true }
		);
		console.log("✅ Користувач оновлений або створений:", existingUser);
	} catch (error) {
		console.error("❌ Помилка збереження користувача:", error);
	}
});

// 📌 Обробка геолокації користувача
bot.on("message:location", async (ctx) => {
	const userId = ctx.from.id;
	const location = ctx.message.location;

	console.log(
		`📍 Отримано координати: ${location.latitude}, ${location.longitude}`
	);
	try {
		// Виконуємо запит до Nominatim API для отримання країни за координатами
		const countryResponse = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=3&addressdetails=1`
		);
		const countryData = await countryResponse.json();

		// Отримуємо назву країни
		const userCountry =
			countryData.address && countryData.address.country
				? countryData.address.country
				: "Не знайдено";

		console.log(`🌍 Визначена країна: ${userCountry}`);

		// Оновлення користувача в БД
		const updatedUser = await User.findOneAndUpdate(
			{ id: userId },
			{
				$set: {
					"location.latitude": location.latitude,
					"location.longitude": location.longitude,
					country: userCountry,
				},
			},
			{ new: true, upsert: true }
		);

		console.log("✅ Оновлено користувача в БД:", updatedUser);

		// Відправляємо користувачу підтвердження
		await ctx.reply(`✅ Ваша країна: ${userCountry}`);
	} catch (error) {
		console.error("❌ Помилка отримання країни:", error);
		await ctx.reply("⚠️ Виникла помилка при визначенні країни.");
	}
});
//📌 API для отримання списку юзерів (для сайту)
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
