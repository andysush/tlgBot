require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { Bot, InputFile, GrammyError, HttpError } = require("grammy");
const path = require("path");

const bot = new Bot(process.env.BOT_API_KEY);
const filePath = path.join(__dirname, "data", "users.json");

async function connectDB() {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log("✅ Connected to MongoDB");
	} catch (error) {
		console.error("❌ Error connecting to MongoDB:", error);
		process.exit(1);
	}
}
connectDB();

bot.api.setMyCommands([
	{
		command: "start",
		description: "start bot",
	},
]);

bot.command("start", async (ctx) => {
	console.log(ctx);
	await ctx.replyWithPhoto(new InputFile("./media/gcg_bcgrnd.jpg"), {
		caption: "Welcome to GCG_LAB",
	});
	const userData = {
		id: ctx.from.id,
		username: ctx.from.username || "No username",
		first_name: ctx.from.first_name,
		last_name: ctx.from.last_name || "",
		user_lang: ctx.from.language_code || "",
		is_premium: ctx.from.is_premium || "false",
		is_bot: ctx.from.is_bot || "false",
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

bot.on("msg", async (ctx) => {
	await ctx.reply(
		`Hello, ${ctx.from.first_name}! Your Id is <span class="tg-spoiler">${ctx.from.id}</span>`,
		{
			parse_mode: "HTML",
		}
	);
});

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;

	if (e instanceof HttpError) {
		console.error("Could not contact with Telegram server:", e);
	} else if (e instanceof GrammyError) {
		console.error("Error in request:", e.description);
	} else {
		console.error("Unknown error:", e);
	}
});

bot.start();
