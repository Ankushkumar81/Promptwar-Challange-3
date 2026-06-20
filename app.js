// Carbon Footprint Awareness Platform Logic - Advanced Version with AI Advisor

// --- Global State ---
let state = {
  ecoPoints: 120,
  co2Saved: 15.4, // in kg
  xp: 45,
  level: 1,
  
  // Tab/Dashboard Metric State
  currentMetric: 'carbon', // 'carbon', 'water', 'land', 'plastic'
  
  // Footprint Metrics (Calculated dynamically)
  carbonScore: 4.5, // in Metric Tons CO2e/year
  waterScore: 1250000, // in Liters/year
  landScore: 2.8, // in Global Hectares (gha)/year
  plasticScore: 28, // in kg/year
  
  carbonCategories: { transport: 1.8, energy: 1.4, food: 0.9, waste: 0.4 },
  waterCategories: { transport: 0, energy: 400000, food: 700000, waste: 150000 },
  landCategories: { transport: 0.6, energy: 0.7, food: 1.3, waste: 0.2 },
  plasticCategories: { transport: 0, energy: 0, food: 8, waste: 20 },
  
  calculatorAnswers: {
    carDistance: 100,
    carType: 'gas-mid',
    publicTransit: 2,
    flights: 1,
    electricityBill: 80,
    gasBill: 50,
    cleanEnergy: 0,
    showerTime: 10,
    diet: 'medium-meat',
    localFood: 20,
    recycle: 'some',
    plasticPack: 'some',
    compost: 'no'
  },
  dailyActions: {
    'bike-commute': false,
    'vegetarian-day': false,
    'unplug-standby': false,
    'reusable-cup': false,
    'dry-clothes': false
  },
  completedChallenges: [],
  unlockedBadges: ['novice'],
  activeGoal: {
    targetPercent: 15,
    pointsTotal: 100,
    pointsCurrent: 45
  },
  quizHistory: {
    taken: false,
    score: 0
  },
  weeklySavings: [12.4, 14.1, 13.5, 15.4, 16.8],
  fundedProjects: 0,
  
  // AI Chat History
  chatHistory: [
    { sender: 'bot', text: "Hello! I am your AI Sustainability Advisor. I can analyze your environmental profile, recommend target reductions, and explain environmental indicators. Ask me a question or click one of the quick analysis chips below!" }
  ]
};

// --- Constant Definitions ---
const CO2_STANDARDS = {
  globalAverage: 4.7,
  usAverage: 16.0,
  indiaAverage: 1.8
};

const METRIC_DEFAULTS = {
  carbon: { max: 16.0, label: "Carbon Score", unit: "Tons CO₂e/yr", color: "var(--accent-emerald)" },
  water: { max: 2000000, label: "Water Footprint", unit: "Liters/yr", color: "var(--accent-water)" },
  land: { max: 5.0, label: "Land Footprint", unit: "gha/yr", color: "var(--accent-land)" },
  plastic: { max: 50, label: "Plastic Waste", unit: "kg/yr", color: "var(--accent-plastic)" }
};

const DAILY_ACTIONS_DB = [
  { id: 'bike-commute', label: 'Commuted by bike/walk', impact: 2.4, points: 15, xp: 10, icon: 'navigation' },
  { id: 'vegetarian-day', label: 'Ate vegetarian/vegan today', impact: 4.1, points: 20, xp: 15, icon: 'heart' },
  { id: 'unplug-standby', label: 'Unplugged unused devices', impact: 0.8, points: 10, xp: 5, icon: 'power' },
  { id: 'reusable-cup', label: 'Used reusable bags & cups', impact: 0.5, points: 8, xp: 5, icon: 'package' },
  { id: 'dry-clothes', label: 'Line-dried clothes', impact: 1.2, points: 12, xp: 8, icon: 'sun' }
];

const CHALLENGES_DB = [
  {
    id: 'ch-clean-power',
    difficulty: 'medium',
    title: 'Green Energy Switch',
    desc: 'Slide clean energy share to 100% in the calculator.',
    reward: 50,
    xp: 30,
    check: (ans) => parseInt(ans.cleanEnergy) === 100
  },
  {
    id: 'ch-car-free',
    difficulty: 'hard',
    title: 'Car-Free Commuter',
    desc: 'Set weekly car mileage to 0 miles in the calculator.',
    reward: 80,
    xp: 50,
    check: (ans) => parseInt(ans.carDistance) === 0
  },
  {
    id: 'ch-vegan-shift',
    difficulty: 'medium',
    title: 'Plant-Powered Warrior',
    desc: 'Change dietary habit to Vegan in the calculator.',
    reward: 60,
    xp: 40,
    check: (ans) => ans.diet === 'vegan'
  },
  {
    id: 'ch-zero-waste',
    difficulty: 'hard',
    title: 'Composting Champion',
    desc: 'Set Composting to Yes and Recycling to Recycle All.',
    reward: 90,
    xp: 60,
    check: (ans) => ans.compost === 'yes' && ans.recycle === 'always'
  },
  {
    id: 'ch-local-first',
    difficulty: 'easy',
    title: 'Eat Local Patron',
    desc: 'Purchase at least 80% local/seasonal food in the calculator.',
    reward: 30,
    xp: 20,
    check: (ans) => parseInt(ans.localFood) >= 80
  },
  {
    id: 'ch-daily-warrior',
    difficulty: 'easy',
    title: 'Action Habit Starter',
    desc: 'Complete at least 3 daily action logs at the same time.',
    reward: 40,
    xp: 25,
    check: () => {
      let count = 0;
      for (let key in state.dailyActions) {
        if (state.dailyActions[key]) count++;
      }
      return count >= 3;
    }
  }
];

const BADGES_DB = {
  'novice': { name: 'Eco Starter', icon: 'award', desc: 'Signed up and took your first step towards climate awareness.' },
  'calculator': { name: 'Impact Analyst', icon: 'cpu', desc: 'Completed your first carbon, water, and land footprint calculations.' },
  'quiz-master': { name: 'Climate Sage', icon: 'book-open', desc: 'Answered all 5 questions correctly in the Carbon Trivia Quiz.' },
  'challenge-claimed': { name: 'Action Taker', icon: 'zap', desc: 'Claimed your first Eco Challenge reward.' },
  'offset-buyer': { name: 'Carbon Neutralizer', icon: 'shopping-bag', desc: 'Funded your first offset sustainability project.' },
  'level-three': { name: 'Earth Guardian', icon: 'shield', desc: 'Reached Eco-Level 3.' }
};

const MARKETPLACE_DB = [
  {
    id: 'proj-reforest',
    title: 'Amazon Canopy Reforestation',
    desc: 'Sponsors native seed planting in deforested sectors of Brazil. Offsets carbon & restores ecosystems.',
    price: 150,
    offset: '250 kg CO₂e',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'proj-solar',
    title: 'Community Clean Solar Grid',
    desc: 'Funds residential micro-solar assemblies in regional communities, replacing dirty coal generation.',
    price: 250,
    offset: '500 kg CO₂e',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'proj-plastic',
    title: 'Great Barrier Reef Plastic Sweep',
    desc: 'Employs marine sweepers to recover microplastics and ghost nets from fragile coral shoals.',
    price: 200,
    offset: '15 kg Plastic',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'proj-well',
    title: 'Sub-Saharan Clean Water Wells',
    desc: 'Builds solar-pumped deep wells, eliminating wood-fuel boiling and conserving water resource systems.',
    price: 180,
    offset: '50,000 Liters Water',
    image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=300&auto=format&fit=crop'
  }
];

const LEADERBOARD_INITIAL_MOCKS = [
  { name: "Alex Rivera", points: 340, level: 3, avatar: "AR" },
  { name: "Sarah Jenkins", points: 290, level: 2, avatar: "SJ" },
  { name: "You", points: 120, level: 1, avatar: "U" },
  { name: "Liam Chen", points: 180, level: 2, avatar: "LC" },
  { name: "Sophia Martinez", points: 95, level: 1, avatar: "SM" }
];

const QUIZ_QUESTIONS = [
  {
    question: "Which sector contributes the most greenhouse gas emissions globally?",
    options: ["Transportation", "Electricity & Heat Production", "Agriculture & Forestry", "Manufacturing & Industry"],
    correctIndex: 1,
    explanation: "Electricity and heat production accounts for roughly 25% of global emissions, followed closely by agriculture/forestry (24%) and industry (21%)."
  },
  {
    question: "How much carbon dioxide does a single mature tree absorb per year on average?",
    options: ["About 5 kg (11 lbs)", "About 22 kg (48 lbs)", "About 100 kg (220 lbs)", "About 500 kg (1100 lbs)"],
    correctIndex: 1,
    explanation: "An average mature tree absorbs about 22 kg (48 lbs) of carbon dioxide annually, helping filter our atmosphere."
  },
  {
    question: "What percentage of food produced globally is wasted or lost?",
    options: ["Around 5%", "Around 12%", "Around 33%", "Around 55%"],
    correctIndex: 2,
    explanation: "Nearly one-third (33%) of all food produced globally goes to waste. When food rots in landfills, it emits methane, a very potent greenhouse gas."
  },
  {
    question: "Which of these individual actions is recognized as having the largest carbon reduction impact?",
    options: ["Switching plastic shopping bags to canvas bags", "Eating a plant-based diet", "Unplugging phone chargers when not in use", "Recycling all standard household paper"],
    correctIndex: 1,
    explanation: "While all actions help, eating a plant-based diet is one of the most effective personal choices due to the high resource requirements and emissions of livestock farming."
  },
  {
    question: "What is the global target limit of temperature rise set by the Paris Climate Agreement?",
    options: ["1.0°C", "1.5°C", "2.0°C", "3.0°C"],
    correctIndex: 1,
    explanation: "The Paris Agreement aims to limit global warming to well below 2°C, and preferably to 1.5°C, compared to pre-industrial levels."
  }
];

const ARTICLES_DB = [
  {
    title: "Understanding CO₂e (Carbon Equivalent)",
    desc: "Why is methane or nitrous oxide measured in 'carbon equivalent'? Dive into the chemistry of global warming potentials.",
    category: "Science",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop"
  },
  {
    title: "10 Easy Ways to Lower Energy Bills",
    desc: "Save up to $300 a year and shave half a ton off your footprint with simple, free adjustments around the house.",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop"
  },
  {
    title: "The Environmental Impact of Beef",
    desc: "Explore why meat products demand so much land, feed, and water, and how simple dietary shifts generate huge carbon savings.",
    category: "Food",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop"
  },
  {
    title: "The Myth of Plastic Recycling",
    desc: "Only 9% of plastic waste is actually recycled. Read about why zero-waste and reduction are far more crucial than sorting.",
    category: "Waste",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=400&auto=format&fit=crop"
  }
];

// --- App Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initThemeToggle();
  initTabNavigation();
  initCalculatorForm();
  initQuiz();
  renderArticles();
  
  // Initial evaluation
  performEvaluationMath();
  
  // Render initial widgets
  renderAllWidgets();
  runSimulation(); // initialize simulator with current baseline
  renderChatMessages(); // load chat history
  
  feather.replace();
});

// --- State Management ---
function saveState() {
  localStorage.setItem("ecotrace_advanced_state", JSON.stringify(state));
}

function loadState() {
  const stored = localStorage.getItem("ecotrace_advanced_state");
  if (stored) {
    try {
      state = JSON.parse(stored);
      if (!state.unlockedBadges) state.unlockedBadges = ['novice'];
      if (!state.completedChallenges) state.completedChallenges = [];
      if (!state.dailyActions) state.dailyActions = {};
      if (state.fundedProjects === undefined) state.fundedProjects = 0;
      if (!state.theme) state.theme = 'dark';
      if (!state.chatHistory) {
        state.chatHistory = [
          { sender: 'bot', text: "Hello! I am your AI Sustainability Advisor. I can analyze your environmental profile, recommend target reductions, and explain environmental indicators. Ask me a question or click one of the quick analysis chips below!" }
        ];
      }
    } catch (e) {
      console.error("Error loading localStorage state:", e);
    }
  }
}

// --- Theme Management ---
function initThemeToggle() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (!themeToggleBtn) return;
  
  if (!state.theme) state.theme = 'dark';
  applyTheme(state.theme);
  
  themeToggleBtn.addEventListener("click", () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = nextTheme;
    applyTheme(nextTheme);
    saveState();
  });
}

function applyTheme(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  
  if (theme === 'light') {
    document.body.classList.add("light-theme");
    btn.innerHTML = `<i data-feather="moon"></i>`;
  } else {
    document.body.classList.remove("light-theme");
    btn.innerHTML = `<i data-feather="sun"></i>`;
  }
  feather.replace();
}


// --- Tab Swapping Navigation ---
function initTabNavigation() {
  const navItems = document.querySelectorAll(".sidebar .nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".sidebar .nav-item").forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  document.querySelectorAll(".tab-panel").forEach(panel => {
    if (panel.id === tabId) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  if (tabId === 'dashboard') {
    renderAllWidgets();
  } else if (tabId === 'challenges') {
    renderChallenges();
    renderBadges();
  } else if (tabId === 'learn') {
    renderSuggestions();
  } else if (tabId === 'simulator') {
    runSimulation();
  } else if (tabId === 'advisor') {
    renderChatMessages();
  }
}

// --- Dashboard Switch Metrics ---
function switchImpactMetric(metric) {
  state.currentMetric = metric;
  
  document.querySelectorAll(".impact-tab-btn").forEach(btn => {
    if (btn.classList.contains(metric)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  renderGauge();
  renderCategoryBreakdownList();
  saveState();
}

// --- Widget Renderers ---
function renderAllWidgets() {
  updateUserStatsUI();
  renderGauge();
  renderCategoryBreakdownList();
  renderGoalTracker();
  renderDailyActionsList();
  renderWeeklyChart();
  renderLeaderboard();
  renderMarketplace();
}

function updateUserStatsUI() {
  document.getElementById("user-level").innerText = `Lvl ${state.level}`;
  document.getElementById("xp-current-val").innerText = `${state.xp} XP`;
  
  const xpPercent = Math.min(100, (state.xp / 100) * 100);
  document.getElementById("xp-fill").style.width = `${xpPercent}%`;
  
  document.getElementById("header-points").innerText = state.ecoPoints;
  document.getElementById("header-co2-saved").innerText = `${state.co2Saved.toFixed(1)} kg`;
  
  document.getElementById("stats-challenges-count").innerText = state.completedChallenges.length;
  
  let actionsCount = 0;
  for (let key in state.dailyActions) {
    if (state.dailyActions[key]) actionsCount++;
  }
  document.getElementById("stats-actions-count").innerText = actionsCount;
  document.getElementById("offset-funded-count").innerText = state.fundedProjects;
  
  renderSidebarBadges();
}

function renderSidebarBadges() {
  const container = document.getElementById("sidebar-badges");
  container.innerHTML = "";
  
  state.unlockedBadges.forEach(badgeId => {
    const badge = BADGES_DB[badgeId];
    if (badge) {
      const div = document.createElement("div");
      div.className = "badge-item unlocked";
      div.title = `${badge.name}: ${badge.desc}`;
      div.style.padding = "0.4rem 0.2rem";
      div.innerHTML = `
        <i class="badge-icon" data-feather="${badge.icon}" style="width: 14px; height: 14px; margin-bottom: 0;"></i>
      `;
      container.appendChild(div);
    }
  });
  
  if (state.unlockedBadges.length === 0) {
    container.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">None yet</span>`;
  }
  feather.replace();
}

function renderGauge() {
  const gaugeFill = document.getElementById("dashboard-gauge");
  const valueDisplay = document.getElementById("dashboard-carbon-val");
  const unitDisplay = document.getElementById("dashboard-gauge-unit");
  const ratingDisplay = document.getElementById("dashboard-rating");
  const descDisplay = document.getElementById("dashboard-rating-desc");
  const iconIndicator = document.getElementById("gauge-icon-indicator");
  const titleIndicator = document.getElementById("gauge-title-indicator");
  
  const metric = state.currentMetric;
  const config = METRIC_DEFAULTS[metric];
  
  titleIndicator.innerText = config.label;
  unitDisplay.innerText = config.unit;
  
  let score = 0;
  if (metric === 'carbon') {
    score = state.carbonScore;
    iconIndicator.setAttribute("data-feather", "activity");
  } else if (metric === 'water') {
    score = state.waterScore;
    iconIndicator.setAttribute("data-feather", "droplet");
  } else if (metric === 'land') {
    score = state.landScore;
    iconIndicator.setAttribute("data-feather", "map");
  } else if (metric === 'plastic') {
    score = state.plasticScore;
    iconIndicator.setAttribute("data-feather", "trash-2");
  }
  
  if (metric === 'water') {
    valueDisplay.innerText = score >= 1000000 ? `${(score / 1000000).toFixed(2)}M` : `${(score / 1000).toFixed(0)}k`;
  } else {
    valueDisplay.innerText = score.toFixed(1);
  }
  
  gaugeFill.style.stroke = config.color;
  
  const percent = Math.min(1.0, score / config.max);
  const dashoffset = 565 - (percent * 565);
  gaugeFill.style.strokeDashoffset = dashoffset;
  
  if (metric === 'carbon') {
    if (score < 3.0) {
      ratingDisplay.innerText = "Low Carbon 🌱";
      ratingDisplay.style.color = "var(--accent-emerald)";
      descDisplay.innerText = "Excellent! Your carbon footprint is highly sustainable compared to national levels.";
    } else if (score <= 6.5) {
      ratingDisplay.innerText = "Moderate Footprint ⚠️";
      ratingDisplay.style.color = "var(--accent-teal)";
      descDisplay.innerText = "Your carbon emissions are close to global averages. Try solar switches or ride-sharing.";
    } else {
      ratingDisplay.innerText = "High Carbon Footprint 🔥";
      ratingDisplay.style.color = "var(--accent-rose)";
      descDisplay.innerText = "Your emissions are high. Switch off standby power, eat less meat, and audit energy loss.";
    }
  } else if (metric === 'water') {
    if (score < 600000) {
      ratingDisplay.innerText = "Conservationist 💧";
      ratingDisplay.style.color = "var(--accent-water)";
      descDisplay.innerText = "Exceptional water efficiency. Your plant-based choices and fast showers conserve massive reserves.";
    } else if (score <= 1300000) {
      ratingDisplay.innerText = "Average Intake 🌊";
      ratingDisplay.style.color = "var(--accent-teal)";
      descDisplay.innerText = "Standard household water draw. Reduce shower times and beef intake to drop this quickly.";
    } else {
      ratingDisplay.innerText = "High Water Footprint 🌪️";
      ratingDisplay.style.color = "var(--accent-rose)";
      descDisplay.innerText = "Beef farming and high energy use draw huge hidden virtual water. Try Meatless Mondays!";
    }
  } else if (metric === 'land') {
    if (score < 1.0) {
      ratingDisplay.innerText = "Low Land Demand 🌍";
      ratingDisplay.style.color = "var(--accent-land)";
      descDisplay.innerText = "Your lifestyle requires very few global hectares to sustain. Outstanding ecological profile!";
    } else if (score <= 3.0) {
      ratingDisplay.innerText = "Moderate Land Use 🪵";
      ratingDisplay.style.color = "var(--accent-teal)";
      descDisplay.innerText = "Within normal ecological bounds, but requires more than 1.5 Earths if everyone lived like you.";
    } else {
      ratingDisplay.innerText = "High Land Footprint 🏜️";
      ratingDisplay.style.color = "var(--accent-rose)";
      descDisplay.innerText = "High animal product diets and large cars demand massive productive land space.";
    }
  } else if (metric === 'plastic') {
    if (score < 15) {
      ratingDisplay.innerText = "Eco Packaging 🛡️";
      ratingDisplay.style.color = "var(--accent-plastic)";
      descDisplay.innerText = "Minimal single-use plastic waste. Excellent container recycling and minimal packaging buys.";
    } else if (score <= 35) {
      ratingDisplay.innerText = "Standard Throwaway 🥤";
      ratingDisplay.style.color = "var(--accent-teal)";
      descDisplay.innerText = "Average household plastic output. Try buying bulk foods and recycling clean cardboard/metals.";
    } else {
      ratingDisplay.innerText = "Excessive Waste 🗑️";
      ratingDisplay.style.color = "var(--accent-rose)";
      descDisplay.innerText = "Significant plastic packaging waste. Bring reusable canvas bags to grocery shopping.";
    }
  }
  
  feather.replace();
}

function renderCategoryBreakdownList() {
  const container = document.getElementById("dashboard-breakdown-list");
  container.innerHTML = "";
  
  const metric = state.currentMetric;
  
  let cats = state.carbonCategories;
  let total = state.carbonScore || 0.1;
  let unit = "T";
  
  if (metric === 'water') {
    cats = state.waterCategories;
    total = state.waterScore || 0.1;
    unit = "L";
  } else if (metric === 'land') {
    cats = state.landCategories;
    total = state.landScore || 0.1;
    unit = "gha";
  } else if (metric === 'plastic') {
    cats = state.plasticCategories;
    total = state.plasticScore || 0.1;
    unit = "kg";
  }
  
  const displayConfig = [
    { key: 'transport', label: 'Transportation', icon: 'truck', class: 'transport' },
    { key: 'energy', label: 'Household Energy', icon: 'zap', class: 'energy' },
    { key: 'food', label: 'Diet & Food Sourcing', icon: 'heart', class: 'food' },
    { key: 'waste', label: 'Waste & Packaging', icon: 'trash-2', class: 'waste' }
  ];
  
  displayConfig.forEach(cat => {
    const val = cats[cat.key] || 0;
    const pct = Math.round((val / total) * 100);
    
    let formattedVal = "";
    if (metric === 'water') {
      formattedVal = val >= 1000000 ? `${(val / 1000000).toFixed(2)}M L` : `${(val / 1000).toFixed(0)}k L`;
    } else {
      formattedVal = `${val.toFixed(1)} ${unit}`;
    }
    
    const div = document.createElement("div");
    div.className = "stat-row";
    div.innerHTML = `
      <div class="stat-row-label">
        <div class="stat-row-icon ${cat.class}">
          <i data-feather="${cat.icon}"></i>
        </div>
        <div>
          <span style="font-weight: 500; display: block; font-size: 0.9rem;">${cat.label}</span>
        </div>
      </div>
      <div class="stat-row-value-container">
        <div class="stat-row-value">${formattedVal}</div>
        <div class="stat-row-percent">${pct}% of total</div>
      </div>
    `;
    container.appendChild(div);
  });
  
  feather.replace();
}

function renderGoalTracker() {
  const container = document.getElementById("active-goal-container");
  container.innerHTML = "";
  
  const baseScore = state.carbonScore;
  const targetReduction = state.activeGoal.targetPercent;
  const targetScore = baseScore * (1 - targetReduction/100);
  
  const currentPoints = state.activeGoal.pointsCurrent;
  const totalPoints = state.activeGoal.pointsTotal;
  const progressPercent = Math.min(100, Math.round((currentPoints / totalPoints) * 100));
  
  container.innerHTML = `
    <div style="margin-top: 0.5rem;">
      <h4 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem;">
        Reduce emissions by ${targetReduction}%
      </h4>
      <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
        Target: <strong class="text-accent-teal">${targetScore.toFixed(1)} Tons</strong> / year (Current: ${baseScore.toFixed(1)} Tons). Achieve this by completing eco challenges and daily actions.
      </p>
    </div>
    
    <div class="goal-progress-container">
      <div class="goal-meta">
        <span>Goal Progress</span>
        <span>${progressPercent}%</span>
      </div>
      <div class="goal-bar-bg">
        <div class="goal-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>
      <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">
        Earn ${totalPoints - currentPoints} more Eco-Points to complete this goal.
      </span>
    </div>
  `;
}

function renderDailyActionsList() {
  const container = document.getElementById("daily-actions-list");
  container.innerHTML = "";
  
  DAILY_ACTIONS_DB.forEach(action => {
    const isChecked = state.dailyActions[action.id] || false;
    
    const div = document.createElement("div");
    div.className = "action-item";
    div.setAttribute("data-id", action.id);
    div.innerHTML = `
      <div class="action-item-left">
        <input type="checkbox" class="action-checkbox" ${isChecked ? 'checked' : ''} onchange="toggleDailyAction('${action.id}', this)">
        <div class="action-details">
          <span class="action-name">${action.label}</span>
          <span class="action-impact">-${action.impact.toFixed(1)} kg CO₂e</span>
        </div>
      </div>
      <span class="action-points">+${action.points} XP</span>
    `;
    container.appendChild(div);
  });
}

function toggleDailyAction(actionId, checkbox) {
  const action = DAILY_ACTIONS_DB.find(a => a.id === actionId);
  if (!action) return;
  
  const wasChecked = state.dailyActions[actionId] || false;
  const isChecked = checkbox.checked;
  
  if (isChecked && !wasChecked) {
    state.dailyActions[actionId] = true;
    state.ecoPoints += action.points;
    state.co2Saved += action.impact;
    state.activeGoal.pointsCurrent = Math.min(state.activeGoal.pointsTotal, state.activeGoal.pointsCurrent + 10);
    addXP(action.xp);
  } else if (!isChecked && wasChecked) {
    state.dailyActions[actionId] = false;
    state.ecoPoints = Math.max(0, state.ecoPoints - action.points);
    state.co2Saved = Math.max(0, state.co2Saved - action.impact);
    state.activeGoal.pointsCurrent = Math.max(0, state.activeGoal.pointsCurrent - 10);
    state.xp = Math.max(0, state.xp - action.xp);
  }
  
  saveState();
  updateUserStatsUI();
  renderGoalTracker();
  checkAutoChallenges();
  renderLeaderboard();
  
  state.weeklySavings[state.weeklySavings.length - 1] = parseFloat(state.co2Saved.toFixed(1));
  renderWeeklyChart();
}

// --- Interactive SVG Chart ---
function renderWeeklyChart() {
  const container = document.getElementById("carbon-chart-wrapper");
  if (!container) return;
  
  container.innerHTML = `<div class="chart-tooltip" id="chart-tooltip"></div>`;
  
  const width = 450;
  const height = 200;
  const padding = 30;
  
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "bar-chart-svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  
  const data = state.weeklySavings;
  const maxVal = Math.max(...data, 20);
  
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = 45;
  const barGap = (chartWidth - barWidth * data.length) / (data.length - 1);
  
  const gridLinesCount = 4;
  for (let i = 0; i <= gridLinesCount; i++) {
    const yVal = padding + (chartHeight / gridLinesCount) * i;
    const gridValue = (maxVal - (maxVal / gridLinesCount) * i).toFixed(0);
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding);
    line.setAttribute("y1", yVal);
    line.setAttribute("x2", width - padding);
    line.setAttribute("y2", yVal);
    line.setAttribute("stroke", "rgba(255, 255, 255, 0.04)");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", padding - 5);
    text.setAttribute("y", yVal + 4);
    text.setAttribute("fill", "var(--text-secondary)");
    text.setAttribute("font-size", "10");
    text.setAttribute("text-anchor", "end");
    text.textContent = `${gridValue}kg`;
    svg.appendChild(text);
  }
  
  data.forEach((val, index) => {
    const barHeight = (val / maxVal) * chartHeight;
    const x = padding + index * (barWidth + barGap);
    const y = padding + chartHeight - barHeight;
    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("class", "bar-rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", barHeight);
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", index === data.length - 1 ? "url(#activeBarGrad)" : "rgba(16, 185, 129, 0.3)");
    rect.setAttribute("stroke", index === data.length - 1 ? "var(--accent-mint)" : "rgba(16, 185, 129, 0.5)");
    rect.setAttribute("stroke-width", "1");
    
    rect.addEventListener("mouseenter", (e) => {
      const tooltip = document.getElementById("chart-tooltip");
      tooltip.style.opacity = "1";
      tooltip.innerHTML = `<strong>Week ${index + 1}</strong><br>${val.toFixed(1)} kg CO₂ avoided`;
      
      const parentRect = container.getBoundingClientRect();
      const rectBounds = e.target.getBoundingClientRect();
      
      tooltip.style.left = `${rectBounds.left - parentRect.left + barWidth/2 - tooltip.offsetWidth/2}px`;
      tooltip.style.top = `${rectBounds.top - parentRect.top - tooltip.offsetHeight - 8}px`;
    });
    
    rect.addEventListener("mouseleave", () => {
      document.getElementById("chart-tooltip").style.opacity = "0";
    });
    
    svg.appendChild(rect);
    
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + barWidth/2);
    text.setAttribute("y", height - padding + 16);
    text.setAttribute("fill", "var(--text-secondary)");
    text.setAttribute("font-size", "10");
    text.setAttribute("text-anchor", "middle");
    text.textContent = index === data.length - 1 ? "This Wk" : `Wk ${index + 1}`;
    svg.appendChild(text);
  });
  
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  grad.setAttribute("id", "activeBarGrad");
  grad.setAttribute("x1", "0%");
  grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "0%");
  grad.setAttribute("y2", "100%");
  
  const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "var(--accent-mint)");
  
  const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "rgba(16, 185, 129, 0.15)");
  
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);
  
  container.appendChild(svg);
}

// --- Leaderboard ---
function renderLeaderboard() {
  const container = document.getElementById("leaderboard-container");
  if (!container) return;
  
  container.innerHTML = "";
  
  const board = LEADERBOARD_INITIAL_MOCKS.map(m => {
    if (m.name === "You") {
      return { ...m, points: state.ecoPoints, level: state.level };
    }
    return m;
  });
  
  board.sort((a, b) => b.points - a.points);
  
  board.forEach((member, index) => {
    const isUser = member.name === "You";
    const rank = index + 1;
    
    let rankClass = "rank-other";
    if (rank === 1) rankClass = "rank-1";
    else if (rank === 2) rankClass = "rank-2";
    else if (rank === 3) rankClass = "rank-3";
    
    const row = document.createElement("div");
    row.className = `leaderboard-row ${isUser ? 'user-highlight' : ''}`;
    row.innerHTML = `
      <div class="leaderboard-rank-badge ${rankClass}">
        ${rank <= 3 ? '<i data-feather="star" style="width:10px;height:10px;"></i>' : rank}
      </div>
      <div class="leaderboard-profile-info">
        <div class="leaderboard-avatar">${member.avatar}</div>
        <span class="leaderboard-name">${member.name} ${isUser ? '<span style="font-size:0.7rem; opacity:0.6;">(You)</span>' : ''}</span>
      </div>
      <div style="display: flex; gap: 1rem; align-items:center;">
        <span style="font-size: 0.75rem; color: var(--text-secondary);">Lvl ${member.level}</span>
        <span class="leaderboard-score">${member.points} pts</span>
      </div>
    `;
    container.appendChild(row);
  });
  
  feather.replace();
}

// --- Offset Marketplace ---
function renderMarketplace() {
  const container = document.getElementById("marketplace-container");
  if (!container) return;
  
  container.innerHTML = "";
  
  MARKETPLACE_DB.forEach(proj => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-header-img" style="background-image: url('${proj.image}');"></div>
      <div class="project-body">
        <h4 class="project-title">${proj.title}</h4>
        <p class="project-desc">${proj.desc}</p>
        <div class="project-action-row">
          <span class="project-price">${proj.price} Pts</span>
          <button class="project-btn" onclick="fundMarketplaceProject('${proj.id}')">Fund Offset</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function fundMarketplaceProject(projId) {
  const proj = MARKETPLACE_DB.find(p => p.id === projId);
  if (!proj) return;
  
  if (state.ecoPoints < proj.price) {
    showAchievementModal("Insufficient Points", `You need ${proj.price} Eco-Points to fund this project, but you currently have ${state.ecoPoints} points. Complete daily actions, eco challenges, and quizzes to earn more!`, "alert-triangle");
    return;
  }
  
  state.ecoPoints -= proj.price;
  state.fundedProjects += 1;
  
  unlockBadge('offset-buyer');
  saveState();
  
  renderAllWidgets();
  
  showAchievementModal("Project Funded! 🌳", `Thank you! You spent ${proj.price} points to fund the "${proj.title}". Your offset has been verified and applied to our global projects count.`, "shopping-bag");
}

// --- Calculator logic ---
let currentCalcStep = 1;

function initCalculatorForm() {
  const sliders = document.querySelectorAll("#footprint-form input[type='range']");
  sliders.forEach(slider => {
    slider.addEventListener("input", () => {
      const valSpan = document.getElementById(`val-${slider.id.replace('calc-', '')}`);
      if (valSpan) valSpan.innerText = slider.value;
    });
  });
  
  const radioCards = document.querySelectorAll(".radio-card");
  radioCards.forEach(card => {
    card.addEventListener("click", () => {
      const groupName = card.getAttribute("data-group");
      document.querySelectorAll(`.radio-card[data-group="${groupName}"]`).forEach(c => {
        c.classList.remove("selected");
      });
      card.classList.add("selected");
      const radioInput = card.querySelector("input[type='radio']");
      if (radioInput) radioInput.checked = true;
    });
  });
  
  restoreCalculatorInputs();
}

function restoreCalculatorInputs() {
  const ans = state.calculatorAnswers;
  
  setSliderValue("calc-car-distance", ans.carDistance);
  setSliderValue("calc-public-transit", ans.publicTransit);
  setSliderValue("calc-flights", ans.flights);
  setSliderValue("calc-electricity-bill", ans.electricityBill);
  setSliderValue("calc-gas-bill", ans.gasBill);
  setSliderValue("calc-clean-energy", ans.cleanEnergy);
  setSliderValue("calc-shower-time", ans.showerTime || 10);
  setSliderValue("calc-local-food", ans.localFood);
  
  setRadioSelected("car-type", ans.carType);
  setRadioSelected("diet", ans.diet);
  setRadioSelected("recycle", ans.recycle);
  setRadioSelected("plastic-pack", ans.plasticPack || 'some');
  setRadioSelected("compost", ans.compost);
}

function setSliderValue(id, val) {
  const slider = document.getElementById(id);
  if (slider) {
    slider.value = val;
    const valSpan = document.getElementById(`val-${id.replace('calc-', '')}`);
    if (valSpan) valSpan.innerText = val;
  }
}

function setRadioSelected(groupName, value) {
  const cards = document.querySelectorAll(`.radio-card[data-group="${groupName}"]`);
  cards.forEach(card => {
    const radio = card.querySelector("input[type='radio']");
    if (radio && radio.value === value) {
      card.classList.add("selected");
      radio.checked = true;
    } else {
      card.classList.remove("selected");
    }
  });
}

function changeCalcStep(direction) {
  const prevStep = document.querySelector(`.calc-step[data-step="${currentCalcStep}"]`);
  if (prevStep) prevStep.classList.remove("active");
  
  currentCalcStep += direction;
  
  const stepTitles = [
    "Step 1: Transportation",
    "Step 2: Home Energy & Water",
    "Step 3: Diet & Food",
    "Step 4: Consumption & Waste",
    "Step 5: Calculator Results"
  ];
  document.getElementById("calc-step-title").innerText = stepTitles[currentCalcStep - 1] || "";
  
  const nextStep = document.querySelector(`.calc-step[data-step="${currentCalcStep}"]`);
  if (nextStep) nextStep.classList.add("active");
  
  const dots = document.querySelectorAll("#calc-progress-dots .calc-dot");
  dots.forEach((dot, index) => {
    if (index + 1 === currentCalcStep) {
      dot.className = "calc-dot active";
    } else if (index + 1 < currentCalcStep) {
      dot.className = "calc-dot completed";
    } else {
      dot.className = "calc-dot";
    }
  });
  
  const btnPrev = document.getElementById("btn-calc-prev");
  const btnNext = document.getElementById("btn-calc-next");
  const navBar = document.getElementById("calc-nav-buttons-container");
  
  btnPrev.disabled = currentCalcStep === 1;
  
  if (currentCalcStep === 4) {
    btnNext.innerText = "Evaluate Impacts";
    btnNext.className = "btn btn-primary";
  } else if (currentCalcStep === 5) {
    navBar.style.display = "none";
    performCalculatorFormEvaluation();
  } else {
    navBar.style.display = "flex";
    btnNext.innerText = "Next Step";
    btnNext.className = "btn btn-primary";
  }
}

function resetCalculatorForm() {
  currentCalcStep = 1;
  const activeStep = document.querySelector(".calc-step.active");
  if (activeStep) activeStep.classList.remove("active");
  
  document.querySelector('.calc-step[data-step="1"]').classList.add("active");
  document.getElementById("calc-step-title").innerText = "Step 1: Transportation";
  document.getElementById("calc-nav-buttons-container").style.display = "flex";
  
  const dots = document.querySelectorAll("#calc-progress-dots .calc-dot");
  dots.forEach((dot, index) => {
    dot.className = index === 0 ? "calc-dot active" : "calc-dot";
  });
  
  document.getElementById("btn-calc-prev").disabled = true;
  document.getElementById("btn-calc-next").innerText = "Next Step";
  
  restoreCalculatorInputs();
}

function performCalculatorFormEvaluation() {
  const carDistance = parseInt(document.getElementById("calc-car-distance").value);
  const carType = document.querySelector('input[name="car-type"]:checked').value;
  const publicTransit = parseInt(document.getElementById("calc-public-transit").value);
  const flights = parseInt(document.getElementById("calc-flights").value);
  const electricityBill = parseInt(document.getElementById("calc-electricity-bill").value);
  const gasBill = parseInt(document.getElementById("calc-gas-bill").value);
  const cleanEnergy = parseInt(document.getElementById("calc-clean-energy").value);
  const showerTime = parseInt(document.getElementById("calc-shower-time").value);
  const diet = document.querySelector('input[name="diet"]:checked').value;
  const localFood = parseInt(document.getElementById("calc-local-food").value);
  const recycle = document.querySelector('input[name="recycle"]:checked').value;
  const plasticPack = document.querySelector('input[name="plastic-pack"]:checked').value;
  const compost = document.querySelector('input[name="compost"]:checked').value;
  
  state.calculatorAnswers = {
    carDistance, carType, publicTransit, flights,
    electricityBill, gasBill, cleanEnergy, showerTime,
    diet, localFood, recycle, plasticPack, compost
  };
  
  performEvaluationMath();
  
  unlockBadge('calculator');
  saveState();
  
  document.getElementById("result-co2-val").innerText = state.carbonScore.toFixed(1);
  document.getElementById("comp-user-val").innerText = state.carbonScore.toFixed(1);
  
  const userBarPercent = Math.min(100, (state.carbonScore / CO2_STANDARDS.usAverage) * 100);
  document.getElementById("comp-bar-user").style.width = `${userBarPercent}%`;
  
  checkAutoChallenges();
  renderAllWidgets();
}

function performEvaluationMath() {
  const ans = state.calculatorAnswers;
  
  // --- 1. CARBON FOOTPRINT (CO2e Metric Tons / Year) ---
  let carEmissionFactor = 0.35;
  if (ans.carType === 'gas-suv') carEmissionFactor = 0.404;
  if (ans.carType === 'hybrid') carEmissionFactor = 0.20;
  if (ans.carType === 'ev') carEmissionFactor = 0.08;
  
  const carCarbon = (ans.carDistance * 52 * carEmissionFactor) / 1000;
  const transitCarbon = (ans.publicTransit * 20 * 52 * 0.06) / 1000;
  const flightCarbon = (ans.flights * 300) / 1000;
  const totalTransportCarbon = carCarbon + transitCarbon + flightCarbon;
  
  const electricityCarbon = (ans.electricityBill * 12 * 0.5 * (1 - ans.cleanEnergy/100)) / 1000;
  const gasCarbon = (ans.gasBill * 12 * 0.8) / 1000;
  const totalEnergyCarbon = electricityCarbon + gasCarbon;
  
  let dietBaseCarbon = 2.2;
  if (ans.diet === 'heavy-meat') dietBaseCarbon = 2.8;
  if (ans.diet === 'vegetarian') dietBaseCarbon = 1.5;
  if (ans.diet === 'vegan') dietBaseCarbon = 1.1;
  const totalFoodCarbon = dietBaseCarbon * (1 - (0.15 * ans.localFood/100));
  
  let wasteBaseCarbon = 0.4;
  if (ans.recycle === 'always') wasteBaseCarbon = 0.2;
  if (ans.recycle === 'none') wasteBaseCarbon = 0.6;
  if (ans.compost === 'yes') wasteBaseCarbon = Math.max(0.05, wasteBaseCarbon - 0.1);
  const totalWasteCarbon = wasteBaseCarbon;
  
  state.carbonScore = totalTransportCarbon + totalEnergyCarbon + totalFoodCarbon + totalWasteCarbon;
  state.carbonCategories = {
    transport: parseFloat(totalTransportCarbon.toFixed(2)),
    energy: parseFloat(totalEnergyCarbon.toFixed(2)),
    food: parseFloat(totalFoodCarbon.toFixed(2)),
    waste: parseFloat(totalWasteCarbon.toFixed(2))
  };

  // --- 2. WATER FOOTPRINT (Liters / Year) ---
  let dietWater = 1100000;
  if (ans.diet === 'heavy-meat') dietWater = 1500000;
  if (ans.diet === 'vegetarian') dietWater = 600000;
  if (ans.diet === 'vegan') dietWater = 400000;
  const totalFoodWater = dietWater * (1 - (0.05 * ans.localFood/100));
  
  const totalWasteWater = ans.showerTime * 9 * 365;
  const totalEnergyWater = ans.electricityBill * 12 * 5 * (1 - ans.cleanEnergy/100);
  const totalTransportWater = ans.carDistance * 52 * 0.15;
  
  state.waterScore = totalTransportWater + totalEnergyWater + totalFoodWater + totalWasteWater;
  state.waterCategories = {
    transport: parseFloat(totalTransportWater.toFixed(0)),
    energy: parseFloat(totalEnergyWater.toFixed(0)),
    food: parseFloat(totalFoodWater.toFixed(0)),
    waste: parseFloat(totalWasteWater.toFixed(0))
  };

  // --- 3. ECOLOGICAL LAND USE (gha / Year) ---
  let dietLand = 1.3;
  if (ans.diet === 'heavy-meat') dietLand = 1.8;
  if (ans.diet === 'vegetarian') dietLand = 0.7;
  if (ans.diet === 'vegan') dietLand = 0.4;
  const totalFoodLand = dietLand;
  
  const energyLand = (ans.electricityBill + ans.gasBill) * 12 * 0.0008 * (1 - ans.cleanEnergy/100);
  const transportLand = ans.carDistance * 52 * 0.0001;
  const wasteLand = ans.recycle === 'none' ? 0.3 : ans.recycle === 'some' ? 0.15 : 0.05;
  
  state.landScore = totalFoodLand + energyLand + transportLand + wasteLand;
  state.landCategories = {
    transport: parseFloat(transportLand.toFixed(2)),
    energy: parseFloat(energyLand.toFixed(2)),
    food: parseFloat(totalFoodLand.toFixed(2)),
    waste: parseFloat(wasteLand.toFixed(2))
  };

  // --- 4. PLASTIC WASTE (kg / Year) ---
  let basePlastic = 45;
  if (ans.plasticPack === 'minimal') basePlastic = 12;
  
  let recycleFactor = 0.8;
  if (ans.recycle === 'always') recycleFactor = 0.15;
  if (ans.recycle === 'some') recycleFactor = 0.45;
  
  const totalWastePlastic = basePlastic * recycleFactor;
  const totalFoodPlastic = basePlastic * (1 - recycleFactor) * 0.4;
  
  state.plasticScore = totalWastePlastic + totalFoodPlastic;
  state.plasticCategories = {
    transport: 0,
    energy: 0,
    food: parseFloat(totalFoodPlastic.toFixed(1)),
    waste: parseFloat(totalWastePlastic.toFixed(1))
  };
}

// --- Eco-Simulator Sandbox Engine ---
function runSimulation() {
  const commuteRedPct = parseInt(document.getElementById("sim-commute-slider").value);
  const meatRedPct = parseInt(document.getElementById("sim-meat-slider").value);
  const useSolar = document.getElementById("sim-solar-toggle").checked;
  const showerRedMin = parseInt(document.getElementById("sim-shower-slider").value);
  const zeroPlastic = document.getElementById("sim-plastic-toggle").checked;

  document.getElementById("sim-val-commute").innerText = `${commuteRedPct}%`;
  document.getElementById("sim-val-meat").innerText = `${meatRedPct}%`;
  document.getElementById("sim-val-shower").innerText = showerRedMin > 0 ? `-${showerRedMin} min` : "No Change";

  const baseC = state.carbonScore;
  const baseW = state.waterScore;
  const baseL = state.landScore;
  const baseP = state.plasticScore;

  let simC_transport = state.carbonCategories.transport * (1 - commuteRedPct/100);
  let simC_energy = useSolar ? state.carbonCategories.energy * 0.2 : state.carbonCategories.energy;
  let simC_food = state.carbonCategories.food;
  if (meatRedPct > 0) {
    const veganFoodC = 1.1 * (1 - (0.15 * state.calculatorAnswers.localFood/100));
    simC_food = state.carbonCategories.food - ((state.carbonCategories.food - veganFoodC) * (meatRedPct/100));
  }
  let simC_waste = zeroPlastic ? state.carbonCategories.waste * 0.6 : state.carbonCategories.waste;
  const simC = simC_transport + simC_energy + simC_food + simC_waste;

  let simW_energy = useSolar ? state.waterCategories.energy * 0.1 : state.waterCategories.energy;
  let simW_food = state.waterCategories.food;
  if (meatRedPct > 0) {
    const veganFoodW = 400000 * (1 - (0.05 * state.calculatorAnswers.localFood/100));
    simW_food = state.waterCategories.food - ((state.waterCategories.food - veganFoodW) * (meatRedPct/100));
  }
  const showerReductionLiters = showerRedMin * 9 * 365;
  let simW_waste = Math.max(10000, state.waterCategories.waste - showerReductionLiters);
  const simW = state.waterCategories.transport + simW_energy + simW_food + simW_waste;

  let simL_transport = state.landCategories.transport * (1 - commuteRedPct/100);
  let simL_energy = useSolar ? state.landCategories.energy * 0.1 : state.landCategories.energy;
  let simL_food = state.landCategories.food;
  if (meatRedPct > 0) {
    simL_food = state.landCategories.food - ((state.landCategories.food - 0.4) * (meatRedPct/100));
  }
  let simL_waste = zeroPlastic ? state.landCategories.waste * 0.3 : state.landCategories.waste;
  const simL = simL_transport + simL_energy + simL_food + simL_waste;

  let simP = baseP;
  if (zeroPlastic) {
    simP = 12 * 0.15;
  }

  document.getElementById("sim-lbl-c-base").innerText = baseC.toFixed(1);
  document.getElementById("sim-lbl-c-sim").innerText = simC.toFixed(1);
  const carbonBarPct = Math.max(10, Math.round((simC / baseC) * 100));
  document.getElementById("sim-bar-carbon-pct").style.width = `${carbonBarPct}%`;

  document.getElementById("sim-lbl-w-base").innerText = baseW >= 1000000 ? `${(baseW / 1000000).toFixed(2)}M` : `${(baseW / 1000).toFixed(0)}k`;
  document.getElementById("sim-lbl-w-sim").innerText = simW >= 1000000 ? `${(simW / 1000000).toFixed(2)}M` : `${(simW / 1000).toFixed(0)}k`;
  const waterBarPct = Math.max(10, Math.round((simW / baseW) * 100));
  document.getElementById("sim-bar-water-pct").style.width = `${waterBarPct}%`;

  document.getElementById("sim-lbl-l-base").innerText = baseL.toFixed(1);
  document.getElementById("sim-lbl-l-sim").innerText = simL.toFixed(1);
  const landBarPct = Math.max(10, Math.round((simL / baseL) * 100));
  document.getElementById("sim-bar-land-pct").style.width = `${landBarPct}%`;

  document.getElementById("sim-lbl-p-base").innerText = baseP.toFixed(0);
  document.getElementById("sim-lbl-p-sim").innerText = simP.toFixed(0);
  const plasticBarPct = Math.max(10, Math.round((simP / baseP) * 100));
  document.getElementById("sim-bar-plastic-pct").style.width = `${plasticBarPct}%`;

  const reductionC = ((baseC - simC) / baseC) * 0.7;
  const reductionP = ((baseP - simP) / baseP) * 0.3;
  const combinedReduction = Math.round((reductionC + reductionP) * 100);
  
  document.getElementById("sim-reduction-pct").innerText = `${combinedReduction}%`;
}

function applySimulationToCalculator() {
  const commuteRedPct = parseInt(document.getElementById("sim-commute-slider").value);
  const meatRedPct = parseInt(document.getElementById("sim-meat-slider").value);
  const useSolar = document.getElementById("sim-solar-toggle").checked;
  const showerRedMin = parseInt(document.getElementById("sim-shower-slider").value);
  const zeroPlastic = document.getElementById("sim-plastic-toggle").checked;

  const ans = state.calculatorAnswers;

  ans.carDistance = Math.max(0, Math.round(ans.carDistance * (1 - commuteRedPct/100)));
  
  if (useSolar) {
    ans.cleanEnergy = 100;
  }
  
  ans.showerTime = Math.max(2, ans.showerTime - showerRedMin);
  
  if (meatRedPct >= 75) {
    ans.diet = 'vegan';
  } else if (meatRedPct >= 50) {
    ans.diet = 'vegetarian';
  }
  
  if (zeroPlastic) {
    ans.plasticPack = 'minimal';
    ans.recycle = 'always';
  }

  state.calculatorAnswers = ans;
  
  performEvaluationMath();
  saveState();
  
  renderAllWidgets();
  switchTab('dashboard');
  
  showAchievementModal("Simulator Settings Applied!", "Your baseline calculations have been updated with your simulator settings. Check your dashboard to view your new scores!", "sliders");
}

// --- AI Sustainability Advisor Chat Engine ---
function renderChatMessages() {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;
  
  container.innerHTML = "";
  state.chatHistory.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${msg.sender}`;
    bubble.innerHTML = formatChatMarkdown(msg.text);
    container.appendChild(bubble);
  });
  
  container.scrollTop = container.scrollHeight;
  feather.replace();
}

function formatChatMarkdown(text) {
  // Convert basic markdown tags like bold and lists into HTML for rich formatting
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  return formatted;
}

function handleChatSubmit(event) {
  if (event) event.preventDefault();
  
  const inputNode = document.getElementById("chat-user-msg");
  const text = inputNode.value.trim();
  if (!text) return;
  
  inputNode.value = "";
  
  // Add user message to history
  state.chatHistory.push({ sender: 'user', text: text });
  renderChatMessages();
  
  triggerBotResponse(text);
}

function sendPromptChip(promptText) {
  state.chatHistory.push({ sender: 'user', text: promptText });
  renderChatMessages();
  
  triggerBotResponse(promptText);
}

function triggerBotResponse(userQuery) {
  const container = document.getElementById("chat-messages-container");
  
  // 1. Show Typing Indicator bubble
  const typingBubble = document.createElement("div");
  typingBubble.className = "chat-bubble bot typing-indicator-wrapper";
  typingBubble.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(typingBubble);
  container.scrollTop = container.scrollHeight;
  
  // 2. Generate custom AI response contextually after a 1.2s delay
  setTimeout(() => {
    // Remove typing bubble
    if (typingBubble.parentNode) {
      typingBubble.parentNode.removeChild(typingBubble);
    }
    
    const responseText = generateAIResponseText(userQuery);
    
    state.chatHistory.push({ sender: 'bot', text: responseText });
    renderChatMessages();
    
    // Reward points for consulting the AI (cap or just award minor points)
    state.ecoPoints += 2;
    addXP(1);
    saveState();
    updateUserStatsUI();
  }, 1200);
}

function generateAIResponseText(query) {
  const q = query.toLowerCase();
  const ans = state.calculatorAnswers;
  
  if (q.includes("analyze") || q.includes("footprint")) {
    const isHighCarbon = state.carbonScore > 6.5;
    const isHighWater = state.waterScore > 1300000;
    
    let advice = `🔍 **Personalized Footprint Audit:**\n\n`;
    advice += `Your Carbon Score is **${state.carbonScore.toFixed(1)} Tons CO₂e/yr** (US Average: 16t, Global sustainable benchmark: <3t). `;
    
    if (ans.carDistance > 150) {
      advice += `Your car driving rate (**${ans.carDistance} mi/week** in a **${ans.carType.replace('-', ' ')}**) contributes **${state.carbonCategories.transport.toFixed(1)} Tons** of carbon. Reducing your travel by 30% cuts over **400 kg** of greenhouse gases. \n\n`;
    } else {
      advice += `Your transportation footprint is highly conservative at **${state.carbonCategories.transport.toFixed(1)} Tons**! Outstanding job.\n\n`;
    }
    
    advice += `💧 **Water Footprint**: You consume **${(state.waterScore / 1000).toFixed(0)}k Liters/yr**. `;
    if (ans.diet.includes("meat")) {
      advice += `Meat farming accounts for **${(state.waterCategories.food / 1000).toFixed(0)}k Liters** of virtual water due to livestock feed irrigation. Shifting to vegetarian meals even 2 days a week saves roughly **200,000 Liters** of freshwater yearly! \n\n`;
    } else {
      advice += `Your food water impact is low thanks to your plant-based diet!\n\n`;
    }
    
    advice += `🌍 **Land Footprint**: Your lifestyle requires **${state.landScore.toFixed(1)} global hectares (gha)**. `;
    if (ans.cleanEnergy < 50) {
      advice += `Your land use is elevated due to fossil energy generation. Switching to a clean energy supplier (Slide energy to 100%) mitigates land degradation.\n\n`;
    } else {
      advice += `Your green energy choice helps keep land footprint low.\n\n`;
    }
    
    advice += `**AI Action Plan Suggestion:** I suggest starting with the **Green Energy Switch** challenge. It is the single highest carbon-mitigation option in your profile!`;
    return advice;
  }
  
  if (q.includes("carbon") || q.includes("co2") || q.includes("greenhouse")) {
    return `💡 **Carbon Mitigation Advice:**\n\nTo drop your carbon footprint fast, target these 3 areas:\n\n1. **Renewable Energy Switch**: Changing your home electric contract to 100% wind/solar removes the largest energy carbon contributor. \n2. **Phantom Loads**: Unplug idle TV, phone chargers, and desktop rigs. (Saves up to 100kg CO₂e/yr).\n3. **Dietary Shifting**: Replace beef with poultry or plant proteins. Beef produces 30x more carbon emissions per gram than beans!`;
  }
  
  if (q.includes("water") || q.includes("shower") || q.includes("droplet")) {
    return `💧 **Water Conservation Guidelines:**\n\nWater footprint comprises both direct use (showers, taps) and virtual use (water needed to make food and energy):\n\n1. **Shower Length**: Reducing your daily shower from **${ans.showerTime} minutes** to **6 minutes** conserves over **13,000 Liters** of clean water annually.\n2. **Virtual Food Water**: 1 kg of beef requires 15,000 Liters of water! Eating plant meals conserves massive agricultural water reservoirs.\n3. **Laundry Loads**: Only wash full loads of clothes, using cold water settings.`;
  }
  
  if (q.includes("land") || q.includes("gha") || q.includes("ecological")) {
    return `🌍 **Understanding Ecological Land Use (gha):**\n\nGlobal Hectares (gha) measures the biological capacity of productive land and water required to support your consumption and absorb waste. \n\n* Earth's biocapacity limit is roughly **1.6 gha per person**.\n* If everyone lived like the average US citizen (requiring 8.0 gha), we would need **5 Earths**.\n* **How to lower gha**: Lower your beef consumption (animal farming takes massive pasture fields) and buy locally-sourced food (**${ans.localFood}%** currently) to reduce transport boundaries.`;
  }
  
  if (q.includes("plastic") || q.includes("waste") || q.includes("recycle")) {
    return `🥤 **Plastic Reduction & Waste Tips:**\n\nYour plastic waste output is **${state.plasticScore.toFixed(0)} kg/year**.\n\n1. **Zero Packaging**: Buy loose vegetables and dry goods in bulk rather than pre-wrapped boxes. This drops waste instantly.\n2. **Organic Composting**: Composting your kitchen scraps stops organic waste from rotting anaerobically in landfills, which releases methane gas.\n3. **Recycling Truth**: Focus on *reducing* packaging buy rates. Standard plastic recycling has a low success rate, whereas cardboard and metal recycling are highly effective.`;
  }
  
  // Default fallback response
  return `🤖 I am ready to advise you! You can ask me:\n\n* "Analyze my footprints" (scans your current calculator answers)\n* "Give me carbon saving ideas"\n* "How can I conserve water?"\n* "What does global hectares mean?"\n\nOr ask any specific question about lowering your carbon, plastic, or waste impact!`;
}

// --- Challenges & Achievements ---
function renderChallenges() {
  const container = document.getElementById("challenges-grid-container");
  container.innerHTML = "";
  
  CHALLENGES_DB.forEach(ch => {
    const isCompleted = state.completedChallenges.includes(ch.id);
    const canClaim = !isCompleted && ch.check(state.calculatorAnswers);
    
    let buttonHtml = '';
    if (isCompleted) {
      buttonHtml = `<button class="challenge-status-btn completed" disabled><i data-feather="check" style="width: 14px; height: 14px; vertical-align: middle;"></i> Claimed</button>`;
    } else if (canClaim) {
      buttonHtml = `<button class="challenge-status-btn" style="background-color: var(--accent-mint); color: var(--bg-primary);" onclick="claimChallengeReward('${ch.id}')">Claim Reward</button>`;
    } else {
      buttonHtml = `<button class="challenge-status-btn" onclick="switchTab('calculator')">Go to Calc</button>`;
    }
    
    const div = document.createElement("div");
    div.className = `challenge-card filter-${ch.difficulty}`;
    div.innerHTML = `
      <div class="challenge-card-info">
        <div class="challenge-icon ${ch.difficulty}">
          <i data-feather="${ch.difficulty === 'easy' ? 'smile' : ch.difficulty === 'medium' ? 'zap' : 'shield'}"></i>
        </div>
        <div class="challenge-details">
          <h4>${ch.title}</h4>
          <p>${ch.desc}</p>
        </div>
      </div>
      <div class="challenge-action">
        <div class="challenge-reward">
          <i data-feather="award" style="width: 12px; height: 12px;"></i>
          <span>+${ch.reward} Pts</span>
        </div>
        ${buttonHtml}
      </div>
    `;
    container.appendChild(div);
  });
  
  feather.replace();
}

function filterChallenges(difficulty) {
  document.querySelectorAll(".challenge-tab").forEach(tab => {
    if (tab.innerText.toLowerCase().includes(difficulty)) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  
  const cards = document.querySelectorAll(".challenge-card");
  cards.forEach(card => {
    if (difficulty === 'all') {
      card.style.display = "flex";
    } else {
      if (card.classList.contains(`filter-${difficulty}`)) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    }
  });
}

function checkAutoChallenges() {
  CHALLENGES_DB.forEach(ch => {
    if (!state.completedChallenges.includes(ch.id) && ch.check(state.calculatorAnswers)) {
      renderChallenges();
    }
  });
}

function claimChallengeReward(challengeId) {
  const ch = CHALLENGES_DB.find(c => c.id === challengeId);
  if (!ch || state.completedChallenges.includes(challengeId)) return;
  
  state.completedChallenges.push(challengeId);
  state.ecoPoints += ch.reward;
  
  addXP(ch.xp);
  
  unlockBadge('challenge-claimed');
  saveState();
  
  renderChallenges();
  updateUserStatsUI();
  renderLeaderboard();
  
  showAchievementModal(ch.title, `Challenge complete! You earned ${ch.reward} Eco-Points and ${ch.xp} XP!`, "award");
}

function addXP(amount) {
  state.xp += amount;
  if (state.xp >= 100) {
    state.level += 1;
    state.xp -= 100;
    
    setTimeout(() => {
      showAchievementModal(`Eco Level Up!`, `Congratulations! You reached Level ${state.level}! You are becoming a true Guardian of the Earth.`, "zap");
    }, 400);
    
    if (state.level >= 3) {
      unlockBadge('level-three');
    }
  }
}

// --- Achievement Modals ---
function showAchievementModal(title, description, icon) {
  document.getElementById("modal-badge-title").innerText = title;
  document.getElementById("modal-badge-desc").innerText = description;
  
  const iconNode = document.getElementById("modal-badge-icon");
  iconNode.setAttribute("data-feather", icon);
  
  document.getElementById("achievement-modal").classList.add("active");
  feather.replace();
}

function closeAchievementModal() {
  document.getElementById("achievement-modal").classList.remove("active");
}

function renderBadges() {
  const container = document.getElementById("challenges-badges-list");
  container.innerHTML = "";
  
  for (let key in BADGES_DB) {
    const badge = BADGES_DB[key];
    const isUnlocked = state.unlockedBadges.includes(key);
    
    const div = document.createElement("div");
    div.className = `badge-item ${isUnlocked ? 'unlocked' : ''}`;
    div.innerHTML = `
      <i class="badge-icon" data-feather="${badge.icon}"></i>
      <span class="badge-name">${badge.name}</span>
    `;
    div.title = `${badge.name}: ${badge.desc} (${isUnlocked ? 'Unlocked' : 'Locked'})`;
    container.appendChild(div);
  }
  
  feather.replace();
}

function unlockBadge(badgeId) {
  if (!state.unlockedBadges.includes(badgeId)) {
    state.unlockedBadges.push(badgeId);
    saveState();
    
    const badge = BADGES_DB[badgeId];
    if (badge) {
      setTimeout(() => {
        showAchievementModal(`Badge Unlocked: ${badge.name}`, badge.desc, badge.icon);
      }, 800);
    }
  }
}

// --- Goals Target Form ---
function setCarbonGoal() {
  const slider = document.getElementById("goal-target-slider");
  const targetPercent = parseInt(slider.value);
  
  state.activeGoal = {
    targetPercent,
    pointsTotal: targetPercent * 8,
    pointsCurrent: 0
  };
  
  saveState();
  updateUserStatsUI();
  renderGoalTracker();
  
  showAchievementModal("Reduction Target Set!", `You've set a target to reduce emissions by ${targetPercent}%! Log actions to fulfill it.`, "target");
}

// --- Tab 4 Subpanel Swapping ---
function switchInsightTab(subTabId) {
  document.querySelectorAll(".insight-tab-card").forEach(card => {
    if (card.id === `insight-tab-${subTabId}`) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  document.querySelectorAll(".insight-subpanel").forEach(panel => {
    if (panel.id === `insight-content-${subTabId}`) {
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  });
  
  if (subTabId === 'suggestions') {
    renderSuggestions();
  }
}

function renderSuggestions() {
  const container = document.getElementById("personalized-suggestions-list");
  container.innerHTML = "";
  
  const ans = state.calculatorAnswers;
  const suggestions = [];
  
  if (parseInt(ans.carDistance) > 150) {
    suggestions.push({
      impact: "high",
      title: "Consider Ridesharing or Rail Transit",
      desc: `Your car travel distance is currently ${ans.carDistance} miles/week. Transitioning just 50 miles of driving to public transport or pooling cuts emissions by ~500 kg CO₂e yearly!`,
      actionLabel: "Try Commute Challenge",
      action: () => switchTab('challenges')
    });
  }
  if (ans.carType === 'gas-suv') {
    suggestions.push({
      impact: "medium",
      title: "Evaluate Hybrid or EV Replacements",
      desc: "Large gasoline cars or SUVs generate over 0.4 kg CO₂ per mile. Upgrading to a hybrid or electric vehicle cuts transport footprint by 50% to 80%.",
      actionLabel: "Re-calculate Car type",
      action: () => { switchTab('calculator'); resetCalculatorForm(); }
    });
  }
  if (parseInt(ans.flights) >= 3) {
    suggestions.push({
      impact: "high",
      title: "Optimize Long-Distance Flights",
      desc: `Taking ${ans.flights} flights/year contributes heavily to carbon release. Explore high-speed rail for short trips, or offset flight carbon emissions through verified offset groups.`,
      actionLabel: "Read Travel Guide",
      action: () => switchInsightTab('articles')
    });
  }
  if (parseInt(ans.cleanEnergy) < 50) {
    suggestions.push({
      impact: "high",
      title: "Upgrade to Clean Renewable Energy",
      desc: "Switching electricity bills to a green supplier sourcing 100% solar/wind bypasses power grid greenhouse outputs completely.",
      actionLabel: "Update Clean Share",
      action: () => { switchTab('calculator'); resetCalculatorForm(); changeCalcStep(1); }
    });
  }
  if (parseInt(ans.electricityBill) > 120 || parseInt(ans.gasBill) > 100) {
    suggestions.push({
      impact: "medium",
      title: "Audit Household Energy Loss",
      desc: "Simple insulation upgrades, smart thermostats, and LED bulb replacements easily drop heating and electric bills by 10-15%.",
      actionLabel: "Read Energy Tips",
      action: () => switchInsightTab('articles')
    });
  }
  if (ans.diet === 'heavy-meat' || ans.diet === 'medium-meat') {
    suggestions.push({
      impact: "medium",
      title: "Begin a 'Meatless Monday' Habit",
      desc: "Reducing red meat intake even slightly makes a larger personal impact than standard recycling. Replacing one meat dish daily saves ~800 kg CO₂ annually.",
      actionLabel: "Log Vegan Meal Today",
      action: () => { switchTab('dashboard'); }
    });
  }
  if (ans.recycle === 'none' || ans.recycle === 'some') {
    suggestions.push({
      impact: "low",
      title: "Expand Household Waste Sorting",
      desc: "Set up separate bins for glass, metal, and cardboard. Diverting paper and cardboards alone stops landfill gas degradation.",
      actionLabel: "Read Recycling Myths",
      action: () => switchInsightTab('articles')
    });
  }
  if (ans.compost === 'no') {
    suggestions.push({
      impact: "medium",
      title: "Initialize Backyard Composting",
      desc: "Composting organic waste stops anaerobical decomposition which releases high levels of toxic methane in general trash heaps.",
      actionLabel: "Learn Composting Basics",
      action: () => switchInsightTab('articles')
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      impact: "low",
      title: "Support Global Tree Planting Projects",
      desc: "Your footprint is highly sustainable. Promote environmental awareness in your community or sponsor verified carbon removal and tree-planting actions.",
      actionLabel: "Read Sustainability Guide",
      action: () => switchInsightTab('articles')
    });
  }
  
  suggestions.forEach(s => {
    const div = document.createElement("div");
    div.className = "suggestion-card";
    div.innerHTML = `
      <div class="suggestion-icon ${s.impact === 'high' ? 'high-impact' : ''}">
        <i data-feather="${s.impact === 'high' ? 'alert-triangle' : 'info'}"></i>
      </div>
      <div class="suggestion-info">
        <div class="suggestion-header">
          <h4>${s.title}</h4>
          <span class="suggestion-impact-pill ${s.impact}">${s.impact} Impact</span>
        </div>
        <p>${s.desc}</p>
        <div class="suggestion-actions">
          <button class="suggestion-action-btn" id="btn-sug-act-${Math.random().toString(36).substr(2, 5)}">${s.actionLabel}</button>
        </div>
      </div>
    `;
    
    const btn = div.querySelector(".suggestion-action-btn");
    btn.addEventListener("click", s.action);
    
    container.appendChild(div);
  });
  
  feather.replace();
}

// --- Trivia Quiz Engine ---
let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

function initQuiz() {
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const qCounter = document.getElementById("quiz-question-counter");
  const qText = document.getElementById("quiz-question-text");
  const optionsBox = document.getElementById("quiz-options-container");
  const explanationBox = document.getElementById("quiz-explanation");
  const nextBtn = document.getElementById("btn-quiz-next");
  const restartBtn = document.getElementById("btn-quiz-restart");
  
  explanationBox.style.display = "none";
  nextBtn.style.display = "none";
  restartBtn.style.display = "none";
  quizAnswered = false;
  
  if (currentQuizIndex >= QUIZ_QUESTIONS.length) {
    qCounter.innerText = "Trivia Quiz Complete!";
    qText.innerText = `You finished the quiz with a score of ${quizScore} out of ${QUIZ_QUESTIONS.length}!`;
    optionsBox.innerHTML = "";
    
    if (quizScore === QUIZ_QUESTIONS.length) {
      qText.innerHTML += `<br><span style="color: var(--accent-amber); font-weight: 700; display: block; margin-top: 1rem;"><i data-feather="star" style="vertical-align: middle;"></i> Quiz Master! Earned +40 points and XP!</span>`;
      state.ecoPoints += 40;
      addXP(25);
      unlockBadge('quiz-master');
      saveState();
      updateUserStatsUI();
    } else {
      qText.innerHTML += `<br><span style="color: var(--accent-mint); font-weight: 600; display: block; margin-top: 1rem;">Earned +${quizScore * 5} points for correct answers!</span>`;
      state.ecoPoints += quizScore * 5;
      addXP(quizScore * 3);
      saveState();
      updateUserStatsUI();
    }
    
    restartBtn.style.display = "block";
    renderLeaderboard();
    feather.replace();
    return;
  }
  
  const q = QUIZ_QUESTIONS[currentQuizIndex];
  qCounter.innerText = `Question ${currentQuizIndex + 1} of ${QUIZ_QUESTIONS.length}`;
  qText.innerText = q.question;
  
  optionsBox.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.innerText = opt;
    btn.onclick = () => selectQuizOption(idx, btn);
    optionsBox.appendChild(btn);
  });
}

function selectQuizOption(idx, optionBtn) {
  if (quizAnswered) return;
  quizAnswered = true;
  
  const q = QUIZ_QUESTIONS[currentQuizIndex];
  const allBtns = document.querySelectorAll("#quiz-options-container .quiz-option");
  
  if (idx === q.correctIndex) {
    optionBtn.classList.add("correct");
    quizScore++;
  } else {
    optionBtn.classList.add("incorrect");
    allBtns[q.correctIndex].classList.add("correct");
  }
  
  const expBox = document.getElementById("quiz-explanation");
  expBox.innerText = q.explanation;
  expBox.style.display = "block";
  
  document.getElementById("btn-quiz-next").style.display = "block";
}

function nextQuizQuestion() {
  currentQuizIndex++;
  renderQuizQuestion();
}

function restartQuiz() {
  currentQuizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
}

// --- Educational Articles ---
function renderArticles() {
  const container = document.getElementById("articles-grid-container");
  container.innerHTML = "";
  
  ARTICLES_DB.forEach(art => {
    const div = document.createElement("div");
    div.className = "article-card";
    div.innerHTML = `
      <div class="article-image" style="background-image: url('${art.image}');">
        <span class="article-category">${art.category}</span>
      </div>
      <div class="article-content">
        <h4 class="article-title">${art.title}</h4>
        <p class="article-desc">${art.desc}</p>
        <a href="#learn" class="article-read-btn" onclick="showArticleModal('${art.title.replace(/'/g, "\\'")}')">Read Article <i data-feather="arrow-right"></i></a>
      </div>
    `;
    container.appendChild(div);
  });
}

function showArticleModal(title) {
  const article = ARTICLES_DB.find(a => a.title === title);
  if (!article) return;
  
  showAchievementModal(article.title, `${article.desc}\n\n[Full article mock content]: Environmental research shows that individual behavior combined with policy change is key to solving the greenhouse challenge. By shifting consumption profiles, reducing red meats, conserving heating electricity, and using electric or shared transits, citizens drive lower demands on fossil infrastructures. Shifting just 10% of global diet footprints stops gigatons of methane release. Thank you for learning about this today!`, "book-open");
}
