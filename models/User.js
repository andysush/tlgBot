const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	id: { type: Number, unique: true, required: true },
	username: { type: String, default: "No username" },
	first_name: { type: String, required: true },
	last_name: { type: String, default: "" },
	user_lang: { type: String, default: "" },
	is_premium: { type: Boolean, default: false },
	is_bot: { type: Boolean, default: false },
	location: {
		latitude: Number,
		longitude: Number,
	},
	country: String,
	date: { type: Date, default: Date.now },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
