var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let currentMentor = null;
// ---------- State ----------
let currentTeam = null;
let teamMembers = [];
let currentUser = null;
// ---------- DOM Loaded ----------
document.addEventListener("DOMContentLoaded", () => {
    loadTeamData();
    setupEventListeners();
});
// ---------- Event Listeners ----------
function setupEventListeners() {
    const teamInput = document.getElementById("teamNameInput");
    if (!teamInput)
        return;
    teamInput.addEventListener("blur", saveTeamName);
    teamInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter")
            e.target.blur();
    });
}
// ---------- Load User + Team ----------
function loadTeamData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            showLoading();
            currentUser = yield getCurrentUser();
            if (!currentUser) {
                showError("Please log in to view your team");
                return;
            }
            yield loadUserTeam();
            if (currentTeam) {
                yield loadTeamMembers();
                yield loadTeamMentor();
            }
            else {
                showNoTeamMessage();
            }
            displayTeamData();
        }
        catch (error) {
            showError("Failed to load team data: " + ((error === null || error === void 0 ? void 0 : error.message) || "Network error"));
        }
        finally {
            hideLoading();
        }
    });
}
// ---------- Load Team Members ----------
function loadTeamMembers() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!((_a = currentTeam === null || currentTeam === void 0 ? void 0 : currentTeam.members) === null || _a === void 0 ? void 0 : _a.length)) {
            teamMembers = [];
            return;
        }
        const memberIds = currentTeam.members
            .map((id) => parseInt(String(id)))
            .filter((id) => !isNaN(id));
        if (memberIds.length === 0) {
            teamMembers = [];
            return;
        }
        const { data: members, error } = yield supabase
            .from("members")
            .select("*")
            .in("id", memberIds);
        if (error)
            throw error;
        teamMembers = members || [];
    });
}
// ---------- Get Current User ----------
function getCurrentUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const { data: { session }, } = yield supabase.auth.getSession();
        if (!session)
            return null;
        // Get user from Users table (authentication info)
        const { data: authUser } = yield supabase
            .from("Users")
            .select("*")
            .eq("uuid", session.user.id)
            .single();
        if (!authUser)
            return null;
        // Ensure admissionNumber is properly formatted
        const admissionNumber = authUser.admissionNumber
            ? Number(authUser.admissionNumber)
            : null;
        // Get member details from members table
        const { data: memberData } = yield supabase
            .from("members")
            .select("*")
            .eq("admissionNumber", admissionNumber)
            .single();
        return {
            id: session.user.id,
            name: (memberData === null || memberData === void 0 ? void 0 : memberData.name) || authUser.username || session.user.email,
            email: authUser.email || session.user.email,
            admissionNumber: admissionNumber === null || admissionNumber === void 0 ? void 0 : admissionNumber.toString(),
            department: memberData === null || memberData === void 0 ? void 0 : memberData.department,
            section: memberData === null || memberData === void 0 ? void 0 : memberData.section,
            gender: memberData === null || memberData === void 0 ? void 0 : memberData.gender,
            isAdmin: authUser.isAdmin || false,
        };
    });
}
// ---------- Load User Team ----------
function loadUserTeam() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentUser || !currentUser.admissionNumber)
            return;
        // Get all teams and filter client-side
        const { data: allTeamsData, error } = yield supabase
            .from("Teams")
            .select("*");
        if (error) {
            console.error("Error loading teams:", error);
            currentTeam = null;
            return;
        }
        if (!allTeamsData) {
            currentTeam = null;
            return;
        }
        // Convert admission number to both string and number for comparison
        const admissionNumberStr = String(currentUser.admissionNumber);
        const admissionNumberNum = Number(currentUser.admissionNumber);
        // Find team where current user is a member
        currentTeam =
            allTeamsData.find((team) => {
                if (!team.members || !Array.isArray(team.members))
                    return false;
                return team.members.some((memberId) => {
                    // Handle both string and number comparisons
                    return (String(memberId) === admissionNumberStr ||
                        Number(memberId) === admissionNumberNum ||
                        memberId === currentUser.admissionNumber);
                });
            }) || null;
    });
}
// ---------- Display All Team Info ----------
function displayTeamData() {
    if (!currentTeam || !currentUser)
        return;
    const isCaptain = currentTeam.captain == currentUser.admissionNumber;
    const input = document.getElementById("teamNameInput");
    const nameButtons = document.getElementById("teamNameButtons");
    if (!input)
        return;
    input.value = currentTeam.name || `Team ${currentTeam.id}`;
    if (isCaptain) {
        // Enable editing for captain
        if (nameButtons)
            nameButtons.style.display = "block";
        input.disabled = false;
    }
    else {
        if (nameButtons)
            nameButtons.style.display = "none";
        input.disabled = true;
    }
    updateTeamSubtitle();
    updateTeamStats();
    displayTeamMembers();
    loadDeadlines();
}
// ---------- Team Subtitle ----------
function updateTeamSubtitle() {
    const memberCount = teamMembers.length;
    const el = document.getElementById("teamSubtitle");
    if (el)
        el.textContent = `${memberCount} Member${memberCount !== 1 ? "s" : ""}`;
}
// ---------- Stats ----------
function updateTeamStats() {
    const memberCount = teamMembers.length;
    const maleCount = teamMembers.filter((m) => m.gender === "M").length;
    const femaleCount = teamMembers.filter((m) => m.gender === "F").length;
    const memberCountEl = document.getElementById("memberCount");
    const maleCountEl = document.getElementById("maleCount");
    const femaleCountEl = document.getElementById("femaleCount");
    if (memberCountEl)
        memberCountEl.textContent = String(memberCount);
    if (maleCountEl)
        maleCountEl.textContent = String(maleCount);
    if (femaleCountEl)
        femaleCountEl.textContent = String(femaleCount);
}
// ---------- Member Grid ----------
function displayTeamMembers() {
    const grid = document.getElementById("memberGrid");
    if (!grid)
        return;
    if (teamMembers.length === 0) {
        grid.innerHTML = '<div class="empty-state">No team members found</div>';
        return;
    }
    grid.innerHTML = teamMembers
        .map((member) => {
        var _a;
        const isCaptain = (currentTeam === null || currentTeam === void 0 ? void 0 : currentTeam.captain) === member.admissionNumber;
        const isSelf = currentUser && member.admissionNumber === currentUser.admissionNumber;
        return `
            <div class="member-card ${isCaptain ? "captain" : ""}">
                <div class="member-info">
                    <div class="member-name">
                        ${member.name}
                        ${isCaptain
            ? '<span class="badge badge-captain">Captain</span>'
            : ""}
                        ${isSelf
            ? '<span class="badge badge-you">You</span>'
            : ""}
                    </div>
                    <div class="member-role">
                        ${member.department || "Unknown"} • Section ${(_a = member.section) !== null && _a !== void 0 ? _a : "N/A"}
                    </div>
                    <div class="member-id">
                        Admission: ${member.admissionNumber || "N/A"}
                    </div>
                </div>
            </div>
        `;
    })
        .join("");
}
// ---------- Save Team Name ----------
function saveTeamName() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentTeam)
            return;
        const nameInput = document.getElementById("teamNameInput");
        const editBtn = document.getElementById("editTeamBtn");
        const saveBtn = document.getElementById("saveTeamBtn");
        const cancelBtn = document.getElementById("cancelTeamBtn");
        if (!nameInput)
            return;
        const newName = nameInput.value.trim();
        const originalName = currentTeam.name || `Team ${currentTeam.id}`;
        if (!newName) {
            showError("Team name cannot be empty");
            nameInput.value = originalName;
            return;
        }
        if (newName === originalName) {
            nameInput.disabled = true;
            if (editBtn)
                editBtn.style.display = "inline-block";
            if (saveBtn)
                saveBtn.style.display = "none";
            if (cancelBtn)
                cancelBtn.style.display = "none";
            return;
        }
        // Check if team is locked
        if (currentTeam.locked) {
            showError("Team is locked and cannot be modified");
            nameInput.value = originalName;
            return;
        }
        try {
            showLoading();
            const { data: existingTeams } = yield supabase
                .from("Teams")
                .select("id")
                .eq("name", newName)
                .neq("id", currentTeam.id);
            if ((existingTeams === null || existingTeams === void 0 ? void 0 : existingTeams.length) > 0) {
                throw new Error("Team name already taken");
            }
            const { error } = yield supabase
                .from("Teams")
                .update({ name: newName })
                .eq("id", currentTeam.id);
            if (error)
                throw error;
            currentTeam.name = newName;
            nameInput.disabled = true;
            if (editBtn)
                editBtn.style.display = "inline-block";
            if (saveBtn)
                saveBtn.style.display = "none";
            if (cancelBtn)
                cancelBtn.style.display = "none";
            showSuccess("Team name updated successfully!");
        }
        catch (error) {
            showError(error.message === "Team name already taken"
                ? "Team name already taken. Choose a different name."
                : "Failed to update team name");
            nameInput.value = originalName;
            nameInput.disabled = true;
            if (editBtn)
                editBtn.style.display = "inline-block";
            if (saveBtn)
                saveBtn.style.display = "none";
            if (cancelBtn)
                cancelBtn.style.display = "none";
        }
        finally {
            hideLoading();
        }
    });
}
// ---------- Deadlines Placeholder ----------
function loadDeadlines() {
    const list = document.getElementById("deadlinesList");
    if (list)
        list.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
}
// ---------- No Team ----------
function showNoTeamMessage() {
    const body = document.querySelector('body[data-section="myTeam"]');
    if (!body)
        return;
    body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
            <h2>No Team Assigned</h2>
            <p>You are not currently assigned to any team.</p>
            <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
        </div>
    `;
}
// ---------- UI Helpers ----------
function showLoading() {
    const el = document.getElementById("loadingScreen");
    if (el)
        el.style.display = "flex";
}
function hideLoading() {
    const el = document.getElementById("loadingScreen");
    if (el)
        el.style.display = "none";
}
function showSuccess(message) {
    showNotification(message, "var(--success)");
}
function showError(message) {
    showNotification(message, "var(--danger)");
}
function showNotification(message, color) {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 12px 20px;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        z-index: 10000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
// ---------- Load Team Mentor ----------
function loadTeamMentor() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const container = document.getElementById("mentorContent");
        if (!container || !currentTeam)
            return;
        // default loading state
        container.innerHTML = `
    <div class="empty-state" style="text-align:center;padding:40px;color:#666">
      Loading mentor…
    </div>
  `;
        const { data: mentors, error } = yield supabase.from("Mentors").select("*");
        if (error || !mentors) {
            container.innerHTML = `<div class="empty-state">Failed to load mentor</div>`;
            return;
        }
        const teamIdStr = String(currentTeam.id);
        const teamIdNum = Number(currentTeam.id);
        currentMentor =
            mentors.find((mentor) => {
                if (!mentor.teams || !Array.isArray(mentor.teams))
                    return false;
                return mentor.teams.some((t) => String(t) === teamIdStr || Number(t) === teamIdNum);
            }) || null;
        if (!currentMentor) {
            container.innerHTML = `<div class="empty-state">Mentor not assigned</div>`;
            return;
        }
        container.innerHTML = `
    <div class="mentor-name">
      ${(_a = currentMentor.name) !== null && _a !== void 0 ? _a : "Unnamed Faculty"}
    </div>
  `;
    });
}
export {};
