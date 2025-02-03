require("dotenv").config();
const { Bot, GrammyError, HttpError } = require("grammy");

const bot = new Bot(process.env.BOT_API_KEY);

bot.command("start", async (ctx) => {
	await ctx.reply("welcome to GSG_LAB");
});

bot.on("message", async (ctx) => {
	await ctx.reply("Зачекайте будь-ласка...");
});

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
