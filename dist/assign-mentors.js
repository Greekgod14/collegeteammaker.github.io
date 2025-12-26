var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* =======================
   State
======================= */
let allMentors = [];
let allTeams = [];
let selectedMentorForTeam = null;
/* =======================
   Init
======================= */
document.addEventListener("DOMContentLoaded", () => {
    loadMentors();
    loadTeams();
    setupEventListeners();
});
/* =======================
   Event Listeners
======================= */
function setupEventListeners() {
    var _a, _b, _c, _d, _e;
    const addMentorBtn = document.getElementById("addMentorBtn");
    addMentorBtn === null || addMentorBtn === void 0 ? void 0 : addMentorBtn.addEventListener("click", openMentorModal);
    (_a = document
        .getElementById("confirmAddMentor")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", addMentorHandler);
    (_b = document
        .getElementById("mentorSearch")) === null || _b === void 0 ? void 0 : _b.addEventListener("input", (e) => filterMentors(e.target.value));
    (_c = document
        .getElementById("teamSearch")) === null || _c === void 0 ? void 0 : _c.addEventListener("input", (e) => filterTeams(e.target.value));
    (_d = document
        .getElementById("AutoAssignbtn")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", autoAssignMentors);
    const printpdfbtn = document.getElementById("printpdfbtn");
    if (printpdfbtn) {
        printpdfbtn.addEventListener("click", exportMentorWisePDF);
    }
    (_e = document
        .getElementById("printpdfbtnModded")) === null || _e === void 0 ? void 0 : _e.addEventListener("click", exportMentorWisePDFModded);
}
/* =======================
   Loaders
======================= */
export function exportMentorWisePDF() {
    return __awaiter(this, void 0, void 0, function* () {
        const padAdmission = (value) => value == null ? "-" : String(value).padStart(4, "0");
        const formatGender = (value) => {
            if (!value)
                return "-";
            const v = value.toLowerCase();
            if (v === "m" || v === "male")
                return "Male";
            if (v === "f" || v === "female")
                return "Female";
            return value;
        };
        // ---- Fetch data ----
        const [{ data: mentors }, { data: teams }, { data: members }] = yield Promise.all([
            supabase.from("Mentors").select("*").order("name", { ascending: true }),
            supabase.from("Teams").select("*"),
            supabase.from("members").select("*"),
        ]);
        if (!mentors || !teams || !members) {
            throw new Error("Failed to load data");
        }
        // ---- Lookups ----
        const teamMap = new Map();
        teams.forEach((t) => teamMap.set(t.id, t));
        const memberMap = new Map();
        members.forEach((m) => memberMap.set(m.id, m));
        const content = [];
        // ---- Title ----
        content.push({
            text: "Mentor-wise Team Allocation Report",
            style: "title",
            margin: [0, 0, 0, 25],
        });
        // ---- Mentors ----
        mentors.forEach((mentor, mentorIndex) => {
            const mentorTeams = Array.isArray(mentor.teams)
                ? mentor.teams
                : [];
            if (mentorTeams.length === 0)
                return;
            // Mentor Header
            content.push({
                text: `${mentorIndex + 1}. Mentor: ${mentor.name || "Unnamed Mentor"}`,
                style: "mentorHeader",
                margin: [0, 20, 0, 10],
            });
            content.push({
                text: `${mentor.department || "—"} • ${mentor.email || "No email"}`,
                fontSize: 10,
                margin: [0, 0, 0, 12],
                color: "#555",
            });
            mentorTeams.forEach((teamId, teamIndex) => {
                const team = teamMap.get(teamId);
                if (!team)
                    return;
                content.push({
                    text: `Team ${teamIndex + 1}: ${team.name || `Team ${team.id}`}`,
                    style: "teamHeader",
                    margin: [0, 12, 0, 8],
                });
                const tableBody = [
                    [
                        { text: "S.No", style: "tableHeader" },
                        { text: "Name", style: "tableHeader" },
                        { text: "Department", style: "tableHeader" },
                        { text: "Admission No", style: "tableHeader" },
                        { text: "Gender", style: "tableHeader" },
                    ],
                ];
                const teamMembers = (team.members || [])
                    .map((id) => memberMap.get(id))
                    .filter(Boolean)
                    .sort((a, b) => {
                    const aCap = team.captain === a.id || a.isCaptain === true;
                    const bCap = team.captain === b.id || b.isCaptain === true;
                    return Number(bCap) - Number(aCap);
                });
                let serial = 1;
                teamMembers.forEach((m) => {
                    const isCaptain = team.captain === m.id || m.isCaptain === true;
                    tableBody.push([
                        { text: serial++, alignment: "center" },
                        {
                            text: isCaptain ? `${m.name} (Captain)` : m.name,
                            bold: isCaptain,
                        },
                        m.department || "-",
                        padAdmission(m.admissionNumber),
                        formatGender(m.gender),
                    ]);
                });
                content.push({
                    table: {
                        headerRows: 1,
                        widths: [30, "*", "*", "*", "*"],
                        body: tableBody,
                    },
                    layout: {
                        fillColor: (rowIndex, node) => {
                            var _a, _b;
                            if (rowIndex === 0)
                                return "#eeeeee";
                            const row = node.table.body[rowIndex];
                            if ((_b = (_a = row[1]) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.includes("(Captain)"))
                                return "#fff3cd";
                            return rowIndex % 2 === 0 ? "#fafafa" : null;
                        },
                        hLineColor: "#dddddd",
                        vLineColor: "#dddddd",
                    },
                    margin: [0, 0, 0, 10],
                });
                content.push({
                    canvas: [
                        {
                            type: "line",
                            x1: 0,
                            y1: 0,
                            x2: 515,
                            y2: 0,
                            lineWidth: 2,
                            lineColor: "#bbbbbb",
                        },
                    ],
                    margin: [0, 20, 0, 20],
                });
            });
        });
        // ---- Document ----
        const docDefinition = {
            pageSize: "A4",
            pageMargins: [40, 60, 40, 60],
            content,
            styles: {
                title: {
                    fontSize: 18,
                    bold: true,
                    alignment: "center",
                },
                mentorHeader: {
                    fontSize: 15,
                    bold: true,
                },
                teamHeader: {
                    fontSize: 13,
                    bold: true,
                },
                tableHeader: {
                    bold: true,
                    fillColor: "#eeeeee",
                },
            },
            footer: (currentPage, pageCount) => ({
                text: `Page ${currentPage} of ${pageCount}`,
                alignment: "center",
                fontSize: 9,
                margin: [0, 10, 0, 0],
            }),
        };
        pdfMake.createPdf(docDefinition).download("mentor-wise-team-report.pdf");
    });
}
function loadMentors() {
    return __awaiter(this, void 0, void 0, function* () {
        const list = document.getElementById("mentorsList");
        if (!list)
            return;
        try {
            const { data, error } = yield supabase.from("Mentors").select("*");
            if (error)
                throw error;
            allMentors = data || [];
            renderMentors(allMentors);
            renderMentorAssignments();
        }
        catch (err) {
            console.error(err);
            list.innerHTML = `<div class="empty-state">Failed to load mentors</div>`;
        }
    });
}
function loadTeams() {
    return __awaiter(this, void 0, void 0, function* () {
        const list = document.getElementById("teamsList");
        if (!list)
            return;
        try {
            const { data, error } = yield supabase.from("Teams").select("*");
            if (error)
                throw error;
            allTeams = data || [];
            renderTeams(allTeams);
            renderMentorAssignments();
        }
        catch (err) {
            console.error(err);
            list.innerHTML = `<div class="empty-state">Failed to load teams</div>`;
        }
    });
}
/* =======================
   Renderers
======================= */
function renderMentorAssignments() {
    const container = document.getElementById("mentorAssignments");
    const unassignedContainer = document.getElementById("unassignedTeams");
    if (!container || !unassignedContainer)
        return;
    const teamMap = new Map();
    allTeams.forEach(t => teamMap.set(Number(t.id), t));
    const assignedTeamIds = new Set();
    // ---- Mentor sections ----
    const mentorHTML = allMentors.map(mentor => {
        const teamIds = Array.isArray(mentor.teams)
            ? mentor.teams.map((id) => Number(id)).filter(Boolean)
            : [];
        if (teamIds.length === 0) {
            return `
        <div class="member-item">
          <div class="member-info">
            <div class="member-name">${mentor.name}</div>
            <div class="member-details">No teams assigned</div>
          </div>
        </div>
      `;
        }
        const teamsHTML = teamIds.map((id) => {
            assignedTeamIds.add(id);
            const team = teamMap.get(id);
            return `
        <div class="member-details">
          • ${(team === null || team === void 0 ? void 0 : team.name) || `Team ${id}`}
        </div>
      `;
        }).join("");
        return `
      <div class="member-item">
        <div class="member-info">
          <div class="member-name">${mentor.name}</div>
          ${teamsHTML}
        </div>
        <span class="mentor-badge">${teamIds.length} team(s)</span>
      </div>
    `;
    }).join("");
    container.innerHTML =
        mentorHTML || `<div class="empty-state">No mentors found</div>`;
    // ---- Unassigned teams ----
    const unassigned = allTeams.filter(t => !assignedTeamIds.has(Number(t.id)));
    if (unassigned.length === 0) {
        unassignedContainer.innerHTML =
            `<div class="empty-state">All teams are assigned</div>`;
        return;
    }
    unassignedContainer.innerHTML = unassigned.map(t => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-name">${t.name || `Team ${t.id}`}</div>
        <div class="member-details">Unassigned</div>
      </div>
    </div>
  `).join("");
}
function renderMentors(mentors) {
    const list = document.getElementById("mentorsList");
    if (!list)
        return;
    if (mentors.length === 0) {
        list.innerHTML = `<div class="empty-state">No mentors added</div>`;
        return;
    }
    list.innerHTML = mentors
        .map((m) => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-details">
          ${m.department || "—"} • ${m.email || "No email"}
        </div>
      </div>
      <span class="mentor-badge">Mentor</span>
    </div>
  `)
        .join("");
}
function renderTeams(teams) {
    const list = document.getElementById("teamsList");
    if (!list)
        return;
    if (teams.length === 0) {
        list.innerHTML = `<div class="empty-state">No teams found</div>`;
        return;
    }
    list.innerHTML = teams
        .map((team) => {
        const mentor = allMentors.find((m) => m.id === team.mentor_id);
        return `
      <div class="member-item selectable" onclick="assignMentorToTeam('${team.id}')">
        <div class="member-info">
          <div class="member-name">${team.name || `Team ${team.id}`}</div>
          <div class="member-details">
            Mentor: ${mentor ? mentor.name : "Unassigned"}
          </div>
        </div>
      </div>
    `;
    })
        .join("");
}
function openMentorModal() {
    var _a;
    (_a = document.getElementById("addMentorModal")) === null || _a === void 0 ? void 0 : _a.classList.add("active");
}
function closeMentorModal() {
    var _a;
    (_a = document.getElementById("addMentorModal")) === null || _a === void 0 ? void 0 : _a.classList.remove("active");
    clearMentorForm();
}
function clearMentorForm() {
    document.getElementById("mentorName").value = "";
    document.getElementById("mentorEmail").value = "";
    document.getElementById("mentorDepartment").value = "";
    document.getElementById("mentorPhone").value = "";
}
function addMentorHandler() {
    return __awaiter(this, void 0, void 0, function* () {
        const name = document.getElementById("mentorName").value.trim();
        if (!name) {
            alert("Mentor name is required");
            return;
        }
        const mentorData = {
            name,
            email: document.getElementById("mentorEmail").value.trim(),
            department: document.getElementById("mentorDepartment").value.trim(),
            phone: document.getElementById("mentorPhone").value.trim(),
            assignamount: document.getElementById("mentorAssign").value.trim(),
        };
        try {
            const { error } = yield supabase.from("Mentors").insert(mentorData);
            if (error)
                throw error;
            closeMentorModal();
            loadMentors();
        }
        catch (err) {
            console.error(err);
            alert("Failed to add mentor");
        }
    });
}
/* =======================
   Assignment Logic
======================= */
function assignMentorToTeam(teamId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (allMentors.length === 0) {
            alert("Add mentors first");
            return;
        }
        const mentorName = prompt("Enter mentor name to assign:\n" +
            allMentors.map((m) => `• ${m.name}`).join("\n"));
        if (!mentorName)
            return;
        const mentor = allMentors.find((m) => m.name.toLowerCase() === mentorName.toLowerCase());
        if (!mentor) {
            alert("Mentor not found");
            return;
        }
        try {
            const { error } = yield supabase
                .from("Teams")
                .update({ mentor_id: mentor.id })
                .eq("id", teamId);
            if (error)
                throw error;
            loadTeams();
        }
        catch (err) {
            console.error(err);
            alert("Failed to assign mentor");
        }
    });
}
function filterMentors(query) {
    const q = query.toLowerCase();
    renderMentors(allMentors.filter((m) => m.name.toLowerCase().includes(q)));
}
function filterTeams(query) {
    const q = query.toLowerCase();
    renderTeams(allTeams.filter((t) => (t.name || "").toLowerCase().includes(q)));
}
function autoAssignMentors() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Fetch mentors (unlocked only)
            const { data: mentors, error: mentorErr } = yield supabase
                .from("Mentors")
                .select("*")
                .eq("locked", false);
            if (mentorErr)
                throw mentorErr;
            if (!mentors || mentors.length === 0) {
                alert("No available mentors to assign");
                return;
            }
            // 2. Fetch teams
            const { data: teams, error: teamErr } = yield supabase
                .from("Teams")
                .select("*");
            if (teamErr)
                throw teamErr;
            if (!teams || teams.length === 0) {
                alert("No teams available");
                return;
            }
            // 3. Collect already assigned team IDs from ALL mentors
            const alreadyAssignedTeamIds = new Set();
            mentors.forEach((m) => {
                if (Array.isArray(m.teams)) {
                    m.teams.forEach((id) => {
                        const numId = Number(id);
                        if (!isNaN(numId))
                            alreadyAssignedTeamIds.add(numId);
                    });
                }
            });
            // 4. Prepare mentors with capacity
            const mentorPool = mentors
                .map((m) => (Object.assign(Object.assign({}, m), { capacity: Number(m.assignamount) || 0, assigned: [] })))
                .filter((m) => m.capacity > 0);
            if (mentorPool.length === 0) {
                alert("No mentors have assign amount set");
                return;
            }
            // 5. Filter & sort teams
            const sortedTeams = teams
                .filter((t) => t.progress !== null && !alreadyAssignedTeamIds.has(Number(t.id)))
                .sort((a, b) => { var _a, _b; return ((_a = a.progress) !== null && _a !== void 0 ? _a : 0) - ((_b = b.progress) !== null && _b !== void 0 ? _b : 0); });
            if (sortedTeams.length === 0) {
                alert("All teams are already assigned");
                return;
            }
            // 6. Round-robin distribution
            let mentorIndex = 0;
            for (const team of sortedTeams) {
                let tries = 0;
                while (tries < mentorPool.length) {
                    const mentor = mentorPool[mentorIndex];
                    if (mentor.assigned.length < mentor.capacity) {
                        mentor.assigned.push(Number(team.id));
                        break;
                    }
                    mentorIndex = (mentorIndex + 1) % mentorPool.length;
                    tries++;
                }
                mentorIndex = (mentorIndex + 1) % mentorPool.length;
            }
            // 7. Write updates to DB (SAFE)
            for (const mentor of mentorPool) {
                if (mentor.assigned.length === 0)
                    continue;
                // Merge with existing teams instead of overwrite
                const existingTeams = Array.isArray(mentor.teams)
                    ? mentor.teams.map((id) => Number(id)).filter(Boolean)
                    : [];
                const updatedTeams = [...new Set([...existingTeams, ...mentor.assigned])];
                // Update mentor
                yield supabase
                    .from("Mentors")
                    .update({ teams: updatedTeams })
                    .eq("id", mentor.id);
                // Update teams one-by-one (avoids Supabase IN bug)
                for (const teamId of mentor.assigned) {
                    yield supabase
                        .from("Teams")
                        .update({ mentor_id: mentor.id })
                        .eq("id", teamId);
                }
            }
            // 8. Refresh UI
            yield loadMentors();
            yield loadTeams();
            alert("Auto assignment completed successfully");
        }
        catch (err) {
            console.error(err);
            alert("Auto assignment failed");
        }
    });
}
export function exportMentorWisePDFModded() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Generating modded mentor-wise PDF...");
        let printedMentorCount = 0;
        const padAdmission = (value) => value == null ? "-" : String(value).padStart(4, "0");
        const formatGender = (value) => {
            if (!value)
                return "-";
            const v = value.toLowerCase();
            if (v === "m" || v === "male")
                return "Male";
            if (v === "f" || v === "female")
                return "Female";
            return value;
        };
        // ---- Fetch data ----
        const [{ data: mentors }, { data: teams }, { data: members }] = yield Promise.all([
            supabase.from("Mentors").select("*").order("name", { ascending: true }),
            supabase.from("Teams").select("*"),
            supabase.from("members").select("*"),
        ]);
        if (!mentors || !teams || !members) {
            throw new Error("Failed to load data");
        }
        // ---- Lookups ----
        const teamMap = new Map();
        teams.forEach((t) => teamMap.set(t.id, t));
        const memberMap = new Map();
        members.forEach((m) => memberMap.set(m.id, m));
        const content = [];
        // ---- Title ----
        content.push({
            text: "Mentor-wise Team Allocation Report",
            style: "title",
            margin: [0, 0, 0, 25],
        });
        // ---- Mentors ----
        mentors.forEach((mentor, mentorIndex) => {
            const mentorTeams = Array.isArray(mentor.teams)
                ? mentor.teams
                : [];
            if (mentorTeams.length === 0)
                return;
            if (printedMentorCount > 0) {
                content.push({
                    text: "",
                    pageBreak: "before"
                });
            }
            printedMentorCount++;
            content.push({
                text: `${printedMentorCount}. Mentor: ${mentor.name || "Unnamed Mentor"}`,
                style: "mentorHeader",
                margin: [0, 20, 0, 10],
            });
            mentorTeams.forEach((teamId, teamIndex) => {
                const team = teamMap.get(teamId);
                if (!team)
                    return;
                content.push({
                    text: `Team ${teamIndex + 1}: ${team.name || `Team ${team.id}`}`,
                    style: "teamHeader",
                    margin: [0, 12, 0, 8],
                });
                const tableBody = [
                    [
                        { text: "S.No", style: "tableHeader" },
                        { text: "Name", style: "tableHeader" },
                        { text: "Department", style: "tableHeader" },
                        { text: "Admission No", style: "tableHeader" },
                        { text: "Gender", style: "tableHeader" },
                    ],
                ];
                const teamMembers = (team.members || [])
                    .map((id) => memberMap.get(id))
                    .filter(Boolean)
                    .sort((a, b) => {
                    const aCap = team.captain === a.id || a.isCaptain === true;
                    const bCap = team.captain === b.id || b.isCaptain === true;
                    return Number(bCap) - Number(aCap);
                });
                let serial = 1;
                teamMembers.forEach((m) => {
                    const isCaptain = team.captain === m.id || m.isCaptain === true;
                    tableBody.push([
                        { text: serial++, alignment: "center" },
                        {
                            text: isCaptain ? `${m.name} (Captain)` : m.name,
                            bold: isCaptain,
                        },
                        m.department || "-",
                        padAdmission(m.admissionNumber),
                        formatGender(m.gender),
                    ]);
                });
                content.push({
                    table: {
                        headerRows: 1,
                        widths: [30, "*", "*", "*", "*"],
                        body: tableBody,
                    },
                    layout: {
                        fillColor: (rowIndex, node) => {
                            var _a, _b;
                            if (rowIndex === 0)
                                return "#eeeeee";
                            const row = node.table.body[rowIndex];
                            if ((_b = (_a = row[1]) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.includes("(Captain)"))
                                return "#fff3cd";
                            return rowIndex % 2 === 0 ? "#fafafa" : null;
                        },
                        hLineColor: "#dddddd",
                        vLineColor: "#dddddd",
                    },
                    margin: [0, 0, 0, 10],
                });
                // Only add separator if not the last team
                if (teamIndex < mentorTeams.length - 1) {
                    content.push({
                        canvas: [
                            {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 515,
                                y2: 0,
                                lineWidth: 2,
                                lineColor: "#bbbbbb",
                            },
                        ],
                        margin: [0, 20, 0, 20],
                    });
                }
            });
        });
        // ---- Create PDF ----
        const docDefinition = {
            pageSize: "A4",
            pageMargins: [40, 60, 40, 60],
            content,
            styles: {
                title: {
                    fontSize: 18,
                    bold: true,
                    alignment: "center",
                },
                mentorHeader: {
                    fontSize: 15,
                    bold: true,
                },
                teamHeader: {
                    fontSize: 13,
                    bold: true,
                },
                tableHeader: {
                    bold: true,
                    fillColor: "#eeeeee",
                },
            },
            footer: (currentPage, pageCount) => ({
                text: `Page ${currentPage} of ${pageCount}`,
                alignment: "center",
                fontSize: 9,
                margin: [0, 10, 0, 0],
            }),
        };
        pdfMake.createPdf(docDefinition).download("mentor-wise-team-report.pdf");
    });
}
window.assignMentorToTeam = assignMentorToTeam;
window.closeMentorModal = closeMentorModal;
window.exportMentorWisePDF = exportMentorWisePDF;
window.exportMentorWisePDFModded = exportMentorWisePDFModded;
window.filterMentors = filterMentors;
window.filterTeams = filterTeams;
