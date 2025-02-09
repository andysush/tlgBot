document.addEventListener("DOMContentLoaded", async function () {
	const searchInput = document.getElementById("search");
	const filterLang = document.getElementById("filter-lang");
	const filterPremium = document.getElementById("filter-premium");
	const filterBot = document.getElementById("filter-bot");
	const userTable = document.getElementById("user-table");

	if (!userTable) {
		console.error("❌ Таблиця не знайдена!");
		return;
	}

	let allUsers = [];

	// Функція рендерингу користувачів
	function renderUsers(users) {
		userTable.innerHTML = "";
		users.forEach((user) => {
			const row = document.createElement("tr");
			row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.user_lang}</td>
                <td>${user.is_premium ? "✅" : "❌"}</td>
                <td>${user.is_bot ? "🤖" : "👤"}</td>
            `;
			userTable.appendChild(row);
		});
	}

	// Отримання даних із сервера
	async function fetchUsers() {
		try {
			const response = await fetch("/api/users");
			allUsers = await response.json();
			populateFilters(allUsers);
			renderUsers(allUsers);
		} catch (error) {
			console.error("❌ Error fetching users:", error);
		}
	}

	// Заповнення фільтрів унікальними значеннями
	function populateFilters(users) {
		const languages = [
			...new Set(users.map((user) => user.user_lang).filter(Boolean)),
		];
		filterLang.innerHTML = '<option value="">All Languages</option>';
		languages.forEach((lang) => {
			const option = document.createElement("option");
			option.value = lang;
			option.textContent = lang;
			filterLang.appendChild(option);
		});
	}

	// Фільтрація користувачів
	function filterUsers() {
		const searchText = searchInput.value.toLowerCase();
		const selectedLang = filterLang.value;
		const selectedPremium = filterPremium.value;
		const selectedBot = filterBot.value;

		const filteredUsers = allUsers.filter((user) => {
			return (
				(user.username.toLowerCase().includes(searchText) ||
					user.first_name.toLowerCase().includes(searchText) ||
					user.last_name.toLowerCase().includes(searchText)) &&
				(selectedLang === "" || user.user_lang === selectedLang) &&
				(selectedPremium === "" ||
					user.is_premium.toString() === selectedPremium) &&
				(selectedBot === "" || user.is_bot.toString() === selectedBot)
			);
		});

		renderUsers(filteredUsers);
	}

	// Додаємо обробники подій
	searchInput.addEventListener("input", filterUsers);
	filterLang.addEventListener("change", filterUsers);
	filterPremium.addEventListener("change", filterUsers);
	filterBot.addEventListener("change", filterUsers);

	// Завантаження користувачів при старті
	await fetchUsers();
});
