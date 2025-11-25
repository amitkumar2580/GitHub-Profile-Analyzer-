const usernameInput = document.getElementById("username");
const analyzeBtn = document.getElementById("analyzeBtn");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const profile = document.getElementById("profile");

let langChart = null;

// Language colors
const langColors = {
  JavaScript: "#f1e05a", TypeScript: "#2b7489", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", HTML: "#e34c26",
  CSS: "#563d7c", Ruby: "#701516", PHP: "#4F5D95", "C++": "#f34b7d",
  C: "#555555", "C#": "#178600", Swift: "#ffac45", Kotlin: "#F18E33",
  Shell: "#89e051", Dockerfile: "#384d54"
};

async function analyzeProfile() {
  const username = usernameInput.value.trim();
  if (!username) return alert("Please enter a GitHub username");

  // Reset
  profile.classList.add("hidden");
  error.classList.add("hidden");
  loading.classList.remove("hidden");

  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error("User not found");
    const user = await userRes.json();

    const reposRes = await fetch(`${user.repos_url}?per_page=100&sort=stars`);
    const repos = await reposRes.json();

    displayProfile(user, repos);
    loading.classList.add("hidden");
    profile.classList.remove("hidden");
  } catch (err) {
    loading.classList.add("hidden");
    error.classList.remove("hidden");
  }
}

function displayProfile(user, repos) {
  // Basic info
  document.getElementById("avatar").src = user.avatar_url;
  document.getElementById("name").textContent = user.name || user.login;
  document.getElementById("login").textContent = `@${user.login}`;
  document.getElementById("bio").textContent = user.bio || "No bio available";
  document.getElementById("repos").textContent = user.public_repos;
  document.getElementById("followers").textContent = user.followers;
  document.getElementById("following").textContent = user.following;

  // Total stars
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  document.getElementById("totalStars").textContent = totalStars;

  // Languages
  const langCount = {};
  repos.forEach(repo => {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
  });

  const sortedLangs = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Chart
  const ctx = document.getElementById("langChart").getContext("2d");
  if (langChart) langChart.destroy();

  langChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: sortedLangs.map(l => l[0]),
      datasets: [{
        data: sortedLangs.map(l => l[1]),
        backgroundColor: sortedLangs.map(l => langColors[l[0]] || "#8b949e"),
        borderWidth: 2,
        borderColor: "#0d1117"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  // Language list
  document.getElementById("langList").innerHTML = sortedLangs.map(([lang, count]) => `
    <div class="lang-item">
      <span><span class="lang-color" style="background:${langColors[lang] || '#8b949e'}"></span>${lang}</span>
      <span>${count} repos</span>
    </div>
  `).join("");

  // Top repos
  const topRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  document.getElementById("topRepos").innerHTML = topRepos.map(repo => `
    <div class="repo">
      <div class="repo-name">
        <a href="${repo.html_url}" target="_blank">${repo.name}</a>
      </div>
      <div class="repo-desc">${repo.description || "No description"}</div>
      <div class="repo-stats">
        <span>Stars: ${repo.stargazers_count}</span>
        <span>${repo.language || ""}</span>
      </div>
    </div>
  `).join("");

  // Contribution graph
  document.getElementById("contribImg").src = `https://ghchart.rrethy.dev/${user.login}`;
}

// Event Listeners
analyzeBtn.addEventListener("click", analyzeProfile);
usernameInput.addEventListener("keypress", e => {
  if (e.key === "Enter") analyzeProfile();
});
