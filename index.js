require("dotenv").config();
const { Bot, InputFile, GrammyError, HttpError } = require("grammy");
const fs = require("fs");
const path = require("path");

const bot = new Bot(process.env.BOT_API_KEY);
const filePath = path.join(__dirname, "data", "users.json");

bot.api.setMyCommands([
	{
		command: "start",
		description: "start bot",
	},
	// {
	// 	command: "help",
	// 	description: "request for help",
	// },
]);

bot.command("start", async (ctx) => {
	await ctx.replyWithPhoto(new InputFile("./media/gcg_bcgrnd.jpg"), {
		caption: "Welcome to GCG_LAB",
	});
	const userData = {
		id: ctx.from.id,
		username: ctx.from.username || "No username",
		first_name: ctx.from.first_name,
		last_name: ctx.from.last_name || "",
		date: new Date().toISOString(),
	};
	if (!fs.existsSync(path.dirname(filePath))) {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
	}

	let users = [];

	if (fs.existsSync(filePath)) {
		const data = fs.readFileSync(filePath, "utf8");
		users = JSON.parse(data);
	}

	if (!users.some((user) => user.id === userData.id)) {
		users.push(userData);
		fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
		console.log("New user was added:", userData);
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

// bot.command("help", async (ctx) => {
// 	await ctx.replyWithPhoto(new InputFile("./media/gcg_bcgrnd.jpg"), {
// 		caption: "Welcome to GCG_LAB",
// 	});
// });

// bot.on("message", async (ctx) => {
// 	await ctx.reply("Зачекайте будь-ласка...");
// });

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;

	if (e instanceof HttpError) {
		console.error("Coukd not contact with Telegram server:", e);
	} else if (e instanceof GrammyError) {
		console.error("Error in request:", e.description);
	} else {
		console.error("Unknown error:", e);
	}
});

bot.start();
