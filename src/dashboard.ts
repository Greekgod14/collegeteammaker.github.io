export {};
declare const logoutUser: any;
declare const supabase: any;

interface User {
  username?: string;
  isAdmin?: boolean;
}

interface DashboardTitles {
  [key: string]: string;
}

// Constants - using const for better optimization
const DASHBOARD_TITLES: DashboardTitles = {
  dashboard: "Dashboard",
  teamGeneration: "Generate Teams",
  teamManagement: "Manage Teams",
  studentManagement: "Student Database",
  analytics: "Analytics",
  systemSettings: "System Settings",
  myTeam: "My Team",
  myTasks: "My Tasks",
  teamProgress: "Team Progress",
  resources: "Resources",
};

const ADMIN_SECTIONS = new Set([
  "teamGeneration",
  "teamManagement",
  "studentManagement",
  "analytics",
  "systemSettings",
]);

const STUDENT_SECTIONS = new Set(["myTeam", "myTasks", "teamProgress", "resources"]);

// DOM Elements cache with more specific typing
let elements: {
  menuToggle: HTMLElement | null;
  sidebar: HTMLElement | null;
  overlay: HTMLElement | null;
  userName: HTMLElement | null;
  userRole: HTMLElement | null;
  pageTitle: HTMLElement | null;
} = {
  menuToggle: null,
  sidebar: null,
  overlay: null,
  userName: null,
  userRole: null,
  pageTitle: null,
};

// Cache frequently used selectors
let cachedSelectors: {
  navItems: NodeListOf<Element> | null;
  contentSections: NodeListOf<Element> | null;
  roleElements: NodeListOf<HTMLElement> | null;
} = {
  navItems: null,
  contentSections: null,
  roleElements: null,
};

// Initialize dashboard with early returns
function initializeDashboard(): void {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirectToLogin();
    return;
  }

  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    try {
      setupDashboard(currentUser);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      redirectToLogin();
    }
  });
}

// Optimized helper functions
function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

function redirectToLogin(): void {
  window.location.href = "login.html";
}

function setupDashboard(currentUser: User): void {
  cacheDOMElements();
  cacheFrequentSelectors();
  setupEventListeners();
  setupNavigationEventDelegation(); // Add this line

  const username = currentUser.username || "User";
  const isAdmin = Boolean(currentUser.isAdmin);
  const userRole = isAdmin ? "admin" : "student";

  setUserRole(userRole);
  setUserInfo(username, isAdmin);
  loadInitialSection(isAdmin);
}

function cacheDOMElements(): void {
  elements.menuToggle = document.getElementById("menuToggle");
  elements.sidebar = document.getElementById("sidebar");
  elements.overlay = document.getElementById("overlay");
  elements.userName = document.getElementById("userName");
  elements.userRole = document.getElementById("userRole");
  elements.pageTitle = document.getElementById("pageTitle");
}

function cacheFrequentSelectors(): void {
  cachedSelectors.navItems = document.querySelectorAll(".nav-item, .bottom-nav-item");
  cachedSelectors.contentSections = document.querySelectorAll(".content-section, .section-frame");
  cachedSelectors.roleElements = document.querySelectorAll<HTMLElement>("[data-role]");
}

function setupEventListeners(): void {
  // Use passive event listeners for better scrolling performance
  if (elements.menuToggle && elements.sidebar && elements.overlay) {
    elements.menuToggle.addEventListener("click", toggleSidebar, { passive: true });
    elements.overlay.addEventListener("click", closeSidebar, { passive: true });
  }
}

function toggleSidebar(): void {
  if (elements.sidebar && elements.overlay) {
    elements.sidebar.classList.toggle("active");
    elements.overlay.classList.toggle("active");
  }
}

function closeSidebar(): void {
  if (elements.sidebar && elements.overlay) {
    elements.sidebar.classList.remove("active");
    elements.overlay.classList.remove("active");
  }
}

function setUserInfo(username: string, isAdmin: boolean): void {
  if (elements.userName) {
    elements.userName.textContent = username;
  }
  if (elements.userRole) {
    elements.userRole.textContent = isAdmin ? "Administrator" : "Student";
  }
}

function loadInitialSection(isAdmin: boolean): void {
  loadSection(isAdmin ? "dashboard" : "myTeam");
}

// Optimized section management
function loadSection(sectionName: string): void {
  if (!elements.pageTitle) return;

  updateNavigation(sectionName);
  updatePageTitle(sectionName);
  updateContentSections(sectionName);
  closeSidebar();
}

function updateNavigation(sectionName: string): void {
  if (!cachedSelectors.navItems) return;

  // Batch DOM updates
  const fragment = document.createDocumentFragment();
  
  cachedSelectors.navItems.forEach((item) => {
    const clone = item.cloneNode(true) as Element;
    clone.classList.remove("active");
    if ((clone as HTMLElement).dataset.section === sectionName) {
      clone.classList.add("active");
    }
    fragment.appendChild(clone);
  });

  // Replace in bulk (this would need actual DOM structure adjustment)
  // For now, using the original approach but optimized
  cachedSelectors.navItems.forEach((item) => {
    item.classList.remove("active");
  });

  document.querySelectorAll(`[data-section="${sectionName}"]`).forEach((item) => {
    item.classList.add("active");
  });
}

function updatePageTitle(sectionName: string): void {
  if (elements.pageTitle) {
    // Use faster string assignment
    elements.pageTitle.textContent = DASHBOARD_TITLES[sectionName] || "Dashboard";
  }
}

function updateContentSections(sectionName: string): void {
  if (!cachedSelectors.contentSections) return;

  // Hide all sections in one operation
  cachedSelectors.contentSections.forEach((section) => {
    section.classList.remove("active");
  });

  if (sectionName === "dashboard") {
    const dashboardSection = document.getElementById("sectionDashboard");
    if (dashboardSection) {
      dashboardSection.classList.add("active");
      // Defer stats loading for faster initial render
      setTimeout(() => loadDashboardStats(), 100);
    }
  } else {
    const frameId = `frame${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`;
    const frame = document.getElementById(frameId);

    if (frame) {
      loadFrameContent(frame);
      frame.classList.add("active");
    }
  }
}

function loadFrameContent(frame: HTMLElement): void {
  const iframe = frame as HTMLIFrameElement;
  if (!iframe.src || iframe.src === "about:blank") {
    // Use defer attribute equivalent for programmatic loading
    setTimeout(() => {
      iframe.src = iframe.dataset.src || "";
    }, 0);
  }
}

// Optimized user role management
function setUserRole(role: "admin" | "student"): void {
  document.body.dataset.userRole = role;
  updateRoleBasedVisibility(role);
  validateCurrentSection(role);
}

function updateRoleBasedVisibility(role: string): void {
  if (!cachedSelectors.roleElements) return;

  // Batch style updates
  cachedSelectors.roleElements.forEach((el) => {
    const shouldShow = !el.dataset.role || el.dataset.role === role;
    el.style.display = shouldShow ? "" : "none";
  });

  // Handle bottom nav items separately
  document.querySelectorAll<HTMLElement>(".bottom-nav-item[data-role]").forEach((item) => {
    item.style.display = item.dataset.role === role ? "flex" : "none";
  });
}

function validateCurrentSection(role: "admin" | "student"): void {
  const currentSection = getCurrentSection();
  const isValidSection = role === "admin" 
    ? !STUDENT_SECTIONS.has(currentSection)
    : !ADMIN_SECTIONS.has(currentSection);

  if (!isValidSection) {
    loadSection("dashboard");
  }
}

function getCurrentSection(): string {
  const activeContentSection = document.querySelector(".content-section.active") as HTMLElement;
  if (activeContentSection) {
    return activeContentSection.dataset.section || "";
  }

  const activeFrame = document.querySelector(".section-frame.active") as HTMLElement;
  if (activeFrame) {
    return activeFrame.id.replace("frame", "").toLowerCase();
  }

  return "";
}

// Optimized dashboard stats with caching
let statsCache: {
  students: number | null;
  teams: number | null;
  timestamp: number | null;
} = {
  students: null,
  teams: null,
  timestamp: null
};

const CACHE_DURATION = 30000; // 30 seconds

async function loadDashboardStats(): Promise<void> {
  const loadingElement = document.getElementById("statsLoading");
  const statsContainer = document.getElementById("statsContainer");

  if (!loadingElement || !statsContainer) return;

  // Check cache first
  const now = Date.now();
  if (statsCache.timestamp && (now - statsCache.timestamp) < CACHE_DURATION) {
    updateStatsDisplay(statsCache.students || 0, statsCache.teams || 0);
    showStats(statsContainer, loadingElement);
    return;
  }

  try {
    showLoadingState(loadingElement, statsContainer);

    // Use Promise.all for parallel requests
    const [totalStudents, totalTeams] = await Promise.all([
      getTotalStudents(),
      getTotalTeams(),
    ]);

    // Update cache
    statsCache = {
      students: totalStudents,
      teams: totalTeams,
      timestamp: now
    };

    updateStatsDisplay(totalStudents, totalTeams);
    showStats(statsContainer, loadingElement);
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    handleStatsError();
    showStats(statsContainer, loadingElement);
  }
}

function showLoadingState(loadingElement: HTMLElement, statsContainer: HTMLElement): void {
  loadingElement.style.display = "block";
  statsContainer.style.display = "none";
}

function showStats(statsContainer: HTMLElement, loadingElement: HTMLElement): void {
  loadingElement.style.display = "none";
  statsContainer.style.display = "block";
}

async function getTotalStudents(): Promise<number> {
  const { data: members, error, count } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

async function getTotalTeams(): Promise<number> {
  const { data: teams, error, count } = await supabase
    .from("Teams")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count || 0;
}

function updateStatsDisplay(students: number, teams: number): void {
  // Batch DOM updates
  const updates = [
    { id: "totalStudents", value: students },
    { id: "totalTeams", value: teams },
    { id: "publishedTeams", value: 0 } // Placeholder
  ];

  updates.forEach(({ id, value }) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value.toString();
  });
}

function handleStatsError(): void {
  updateStatsDisplay(0, 0);
}
// Add this function to your existing dashboard.ts
function setupNavigationEventDelegation(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Handle nav items with data-section
    const navItem = target.closest('[data-section]');
    if (navItem instanceof HTMLElement && navItem.dataset.section) {
      e.preventDefault();
      loadSection(navItem.dataset.section);
      return;
    }
    
    // Handle buttons with data-section
    const button = target.closest('button[data-section]');
    if (button instanceof HTMLElement && button.dataset.section) {
      e.preventDefault();
      loadSection(button.dataset.section);
      return;
    }
    
    // Handle logout
    const logoutItem = target.closest('.nav-item');
    if (logoutItem && logoutItem.textContent?.includes('Logout')) {
      e.preventDefault();
      logout();
      return;
    }
  });
}

// Optimized logout function
async function logout(): Promise<boolean> {
  try {
    if (typeof logoutUser === "function") {
      await logoutUser();
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    redirectToLogin();
  }
  return false;
}

// Use DOMContentLoaded with check for complete state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}