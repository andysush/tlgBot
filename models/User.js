const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	id: { type: Number, unique: true, required: true },
	username: { type: String, default: "No username" },
	first_name: { type: String, required: true },
	last_name: { type: String, default: "" },
	date: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
