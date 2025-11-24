function initializeDashboard() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  try {
    const username = currentUser.username;
    const userData = JSON.parse(localStorage.getItem("user_" + username));
    const isAdmin = currentUser.isAdmin;

    setUserRole(isAdmin ? "admin" : "student");

    document.getElementById("userName").textContent =
      currentUser.username || "User";

    if (isAdmin) {
      document.getElementById("userRole").textContent = "Administrator";
      loadSection("dashboard");
    } else {
      document.getElementById("userRole").textContent = "Student";
      loadSection("myTeam");
    }

    //loadSection("dashboard");
  } catch (error) {
    console.error("Error initializing dashboard:", error);
    window.location.href = "login.html";
  }
}

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

function loadSection(sectionName) {
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  document
    .querySelectorAll(".bottom-nav-item")
    .forEach((item) => item.classList.remove("active"));
  document
    .querySelectorAll(`[data-section="${sectionName}"]`)
    .forEach((item) => item.classList.add("active"));

  const titles = {
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
  document.getElementById("pageTitle").textContent =
    titles[sectionName] || "Dashboard";

  document
    .querySelectorAll(".content-section")
    .forEach((sec) => sec.classList.remove("active"));
  document
    .querySelectorAll(".section-frame")
    .forEach((frame) => frame.classList.remove("active"));

  if (sectionName === "dashboard") {
    document.getElementById("sectionDashboard").classList.add("active");
    loadDashboardStats();
  } else {
    const frameId =
      "frame" + sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    const frame = document.getElementById(frameId);
    if (frame) {
      if (!frame.src || frame.src === "about:blank") {
        frame.src = frame.dataset.src;
      }
      frame.classList.add("active");
    }
  }

  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

function setUserRole(role) {
  document.body.dataset.userRole = role;

  document.querySelectorAll("[data-role]").forEach((el) => {
    if (el.dataset.role === role || !el.dataset.role) {
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });

  document.querySelectorAll(".bottom-nav-item[data-role]").forEach((item) => {
    if (item.dataset.role === role) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });

  const currentSection =
    document.querySelector(".content-section.active")?.dataset.section ||
    document
      .querySelector(".section-frame.active")
      ?.id.replace("frame", "")
      .toLowerCase();

  const adminSections = [
    "teamGeneration",
    "teamManagement",
    "studentManagement",
    "analytics",
    "systemSettings",
  ];
  const studentSections = ["myTeam", "myTasks", "teamProgress", "resources"];

  if (
    (role === "student" && adminSections.includes(currentSection)) ||
    (role === "admin" && studentSections.includes(currentSection))
  ) {
    loadSection("dashboard");
  }
}

async function logout() {
    try {

  logoutUser();
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        window.location.href = 'login.html';
    }
    
    return false;
}
document.addEventListener("DOMContentLoaded", function () {
  initializeDashboard();
});

//   async function loadDashboardStats() {
//     try {
//       const db = firebase.firestore();

//       const studentsSnapshot = await db.collection("members").get();
//       const totalStudents = studentsSnapshot.size;
//       document.getElementById("totalStudents").textContent = totalStudents;

//       const teamsSnapshot = await db.collection("Teams").get();
//       const totalTeams = teamsSnapshot.size;
//       document.getElementById("totalTeams").textContent = totalTeams;

//       let publishedTeams = 0;
//       teamsSnapshot.forEach((doc) => {
//         const teamData = doc.data();
//         if (teamData.published === true) {
//           publishedTeams++;
//         }
//       });
//       document.getElementById("publishedTeams").textContent =
//         publishedTeams;
//     } catch (error) {
//       console.error("Error loading dashboard stats:", error);
//       document.getElementById("totalTeams").textContent = "0";
//       document.getElementById("totalStudents").textContent = "0";
//       document.getElementById("publishedTeams").textContent = "0";
//     }
//   }

async function loadDashboardStats() {
  const loadingElement = document.getElementById("statsLoading");
  const statsContainer = document.getElementById("statsContainer");
  console.log("supabase variable:", typeof supabase);
  console.log("supabaseClient variable:", typeof supabaseClient);
  console.log("window.supabase:", typeof window.supabase);

  try {
    loadingElement.style.display = "block";
    statsContainer.style.display = "none";

    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*", { count: "exact" });

    const totalStudents = members ? members.length : 0;
    document.getElementById("totalStudents").textContent = totalStudents;

    const { data: teams, error: teamsError } = await supabase
      .from("Teams")
      .select("*", { count: "exact" });

    const totalTeams = teams ? teams.length : 0;
    document.getElementById("totalTeams").textContent = totalTeams;

    //   let publishedTeams = 0;
    //   teamsSnapshot.forEach((doc) => {
    //     const teamData = doc.data();
    //     if (teamData.published === true) {
    //       publishedTeams++;
    //     }
    //   });
    //   document.getElementById("publishedTeams").textContent =
    //     publishedTeams;

    loadingElement.style.display = "none";
    statsContainer.style.display = "block";
  } catch (error) {
    console.error("Error loading dashboard stats:", error);

    document.getElementById("totalTeams").textContent = "0";
    document.getElementById("totalStudents").textContent = "0";
    document.getElementById("publishedTeams").textContent = "0";

    loadingElement.style.display = "none";
    statsContainer.style.display = "block";

    window.href.location = window.href.location;
  }
}
