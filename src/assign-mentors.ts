export {};

declare const supabase: any;
declare const pdfMake: any;

/* =======================
   Interfaces
======================= */

interface Mentor {
  id: string | number;
  name: string;
  email?: string;
  department?: string;
  phone?: string;
}

interface Team {
  id: string | number;
  name?: string;
  mentor_id?: string | number | null;
}

/* =======================
   State
======================= */

let allMentors: Mentor[] = [];
let allTeams: Team[] = [];
let selectedMentorForTeam: string | number | null = null;

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

function setupEventListeners(): void {
  const addMentorBtn = document.getElementById("addMentorBtn");
  addMentorBtn?.addEventListener("click", openMentorModal);

  document
    .getElementById("confirmAddMentor")
    ?.addEventListener("click", addMentorHandler);

  document
    .getElementById("mentorSearch")
    ?.addEventListener("input", (e) =>
      filterMentors((e.target as HTMLInputElement).value)
    );

  document
    .getElementById("teamSearch")
    ?.addEventListener("input", (e) =>
      filterTeams((e.target as HTMLInputElement).value)
    );
  document
    .getElementById("AutoAssignbtn")
    ?.addEventListener("click", autoAssignMentors);

  const printpdfbtn = document.getElementById("printpdfbtn");
  if (printpdfbtn) {
    printpdfbtn.addEventListener("click", exportMentorWisePDF);
  }
  document
    .getElementById("printpdfbtnModded")
    ?.addEventListener("click", exportMentorWisePDFModded);
}

/* =======================
   Loaders
======================= */

export async function exportMentorWisePDF(): Promise<void> {
  const padAdmission = (value: number | null | undefined) =>
    value == null ? "-" : String(value).padStart(4, "0");

  const formatGender = (value: string | null | undefined) => {
    if (!value) return "-";
    const v = value.toLowerCase();
    if (v === "m" || v === "male") return "Male";
    if (v === "f" || v === "female") return "Female";
    return value;
  };

  // ---- Fetch data ----
  const [{ data: mentors }, { data: teams }, { data: members }] =
    await Promise.all([
      supabase.from("Mentors").select("*").order("name", { ascending: true }),
      supabase.from("Teams").select("*"),
      supabase.from("members").select("*"),
    ]);

  if (!mentors || !teams || !members) {
    throw new Error("Failed to load data");
  }

  // ---- Lookups ----
  const teamMap = new Map<number, any>();
  teams.forEach((t: any) => teamMap.set(t.id, t));

  const memberMap = new Map<number, any>();
  members.forEach((m: any) => memberMap.set(m.id, m));

  const content: any[] = [];

  // ---- Title ----
  content.push({
    text: "Mentor-wise Team Allocation Report",
    style: "title",
    margin: [0, 0, 0, 25],
  });

  // ---- Mentors ----
  mentors.forEach((mentor: any, mentorIndex: number) => {
    const mentorTeams: number[] = Array.isArray(mentor.teams)
      ? mentor.teams
      : [];

    if (mentorTeams.length === 0) return;

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

    mentorTeams.forEach((teamId: number, teamIndex: number) => {
      const team = teamMap.get(teamId);
      if (!team) return;

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
        .map((id: number) => memberMap.get(id))
        .filter(Boolean)
        .sort((a: any, b: any) => {
          const aCap = team.captain === a.id || a.isCaptain === true;
          const bCap = team.captain === b.id || b.isCaptain === true;
          return Number(bCap) - Number(aCap);
        });

      let serial = 1;

      teamMembers.forEach((m: any) => {
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
          fillColor: (rowIndex: number, node: any) => {
            if (rowIndex === 0) return "#eeeeee";
            const row = node.table.body[rowIndex];
            if (row[1]?.text?.includes("(Captain)")) return "#fff3cd";
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
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 10, 0, 0],
    }),
  };

  pdfMake.createPdf(docDefinition).download("mentor-wise-team-report.pdf");
}

async function loadMentors(): Promise<void> {
  const list = document.getElementById("mentorsList");
  if (!list) return;

  try {
    const { data, error } = await supabase.from("Mentors").select("*");
    if (error) throw error;

    allMentors = data || [];
    renderMentors(allMentors);
    renderMentorAssignments();
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="empty-state">Failed to load mentors</div>`;
  }
}

async function loadTeams(): Promise<void> {
  const list = document.getElementById("teamsList");
  if (!list) return;

  try {
    const { data, error } = await supabase.from("Teams").select("*");
    if (error) throw error;

    allTeams = data || [];
    renderTeams(allTeams);
    renderMentorAssignments();
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="empty-state">Failed to load teams</div>`;
  }
}

/* =======================
   Renderers
======================= */
function renderMentorAssignments(): void {
  const container = document.getElementById("mentorAssignments");
  const unassignedContainer = document.getElementById("unassignedTeams");
  if (!container || !unassignedContainer) return;

  const teamMap = new Map<number, Team>();
  allTeams.forEach((t) => teamMap.set(Number(t.id), t));

  const assignedTeamIds = new Set<number>();

  // ---- Mentor sections ----
  const mentorHTML = allMentors
    .map((mentor) => {
      const teamIds = Array.isArray((mentor as any).teams)
        ? (mentor as any).teams.map((id: any) => Number(id)).filter(Boolean)
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

      const teamsHTML = teamIds
        .map((id: number) => {
          assignedTeamIds.add(id);
          const team = teamMap.get(id);
          return `
        <div class="member-details">
          • ${team?.name || `Team ${id}`}
        </div>
      `;
        })
        .join("");

      return `
      <div class="member-item">
        <div class="member-info">
          <div class="member-name">${mentor.name}</div>
          ${teamsHTML}
        </div>
        <span class="mentor-badge">${teamIds.length} team(s)</span>
      </div>
    `;
    })
    .join("");

  container.innerHTML =
    mentorHTML || `<div class="empty-state">No mentors found</div>`;

  // ---- Unassigned teams ----
  const unassigned = allTeams.filter((t) => !assignedTeamIds.has(Number(t.id)));

  if (unassigned.length === 0) {
    unassignedContainer.innerHTML = `<div class="empty-state">All teams are assigned</div>`;
    return;
  }

  unassignedContainer.innerHTML = unassigned
    .map(
      (t) => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-name">${t.name || `Team ${t.id}`}</div>
        <div class="member-details">Unassigned</div>
      </div>
    </div>
  `
    )
    .join("");
}

function renderMentors(mentors: Mentor[]): void {
  const list = document.getElementById("mentorsList");
  if (!list) return;

  if (mentors.length === 0) {
    list.innerHTML = `<div class="empty-state">No mentors added</div>`;
    return;
  }

  list.innerHTML = mentors
    .map(
      (m) => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-details">
          ${m.department || "—"} • ${m.email || "No email"}
        </div>
      </div>
      <span class="mentor-badge">Mentor</span>
    </div>
  `
    )
    .join("");
}

function renderTeams(teams: Team[]): void {
  const list = document.getElementById("teamsList");
  if (!list) return;

  if (teams.length === 0) {
    list.innerHTML = `<div class="empty-state">No teams found</div>`;
    return;
  }

  list.innerHTML = teams
    .map((team) => {
      const mentor = allMentors.find((m) => m.id === team.mentor_id);

      return `
      <div class="member-item selectable" onclick="assignMentorToTeam('${
        team.id
      }')">
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
function openMentorModal(): void {
  document.getElementById("addMentorModal")?.classList.add("active");
}

function closeMentorModal(): void {
  document.getElementById("addMentorModal")?.classList.remove("active");
  clearMentorForm();
}

function clearMentorForm(): void {
  (document.getElementById("mentorName") as HTMLInputElement).value = "";
  (document.getElementById("mentorEmail") as HTMLInputElement).value = "";
  (document.getElementById("mentorDepartment") as HTMLInputElement).value = "";
  (document.getElementById("mentorPhone") as HTMLInputElement).value = "";
}

async function addMentorHandler(): Promise<void> {
  const name = (
    document.getElementById("mentorName") as HTMLInputElement
  ).value.trim();
  if (!name) {
    alert("Mentor name is required");
    return;
  }

  const mentorData = {
    name,
    email: (
      document.getElementById("mentorEmail") as HTMLInputElement
    ).value.trim(),
    department: (
      document.getElementById("mentorDepartment") as HTMLInputElement
    ).value.trim(),
    phone: (
      document.getElementById("mentorPhone") as HTMLInputElement
    ).value.trim(),
    assignamount: (
      document.getElementById("mentorAssign") as HTMLInputElement
    ).value.trim(),
  };

  try {
    const { error } = await supabase.from("Mentors").insert(mentorData);
    if (error) throw error;

    closeMentorModal();
    loadMentors();
  } catch (err) {
    console.error(err);
    alert("Failed to add mentor");
  }
}

/* =======================
   Assignment Logic
======================= */

async function assignMentorToTeam(teamId: string | number): Promise<void> {
  if (allMentors.length === 0) {
    alert("Add mentors first");
    return;
  }

  const mentorName = prompt(
    "Enter mentor name to assign:\n" +
      allMentors.map((m) => `• ${m.name}`).join("\n")
  );

  if (!mentorName) return;

  const mentor = allMentors.find(
    (m) => m.name.toLowerCase() === mentorName.toLowerCase()
  );

  if (!mentor) {
    alert("Mentor not found");
    return;
  }

  try {
    const { error } = await supabase
      .from("Teams")
      .update({ mentor_id: mentor.id })
      .eq("id", teamId);

    if (error) throw error;

    loadTeams();
  } catch (err) {
    console.error(err);
    alert("Failed to assign mentor");
  }
}
function filterMentors(query: string): void {
  const q = query.toLowerCase();
  renderMentors(allMentors.filter((m) => m.name.toLowerCase().includes(q)));
}

function filterTeams(query: string): void {
  const q = query.toLowerCase();
  renderTeams(allTeams.filter((t) => (t.name || "").toLowerCase().includes(q)));
}

async function autoAssignMentors(): Promise<void> {
  try {
    // 1. Fetch mentors (unlocked only)
    const { data: mentors, error: mentorErr } = await supabase
      .from("Mentors")
      .select("*")
      .eq("locked", false);

    if (mentorErr) throw mentorErr;
    if (!mentors || mentors.length === 0) {
      alert("No available mentors to assign");
      return;
    }

    // 2. Fetch teams
    const { data: teams, error: teamErr } = await supabase
      .from("Teams")
      .select("*");

    if (teamErr) throw teamErr;
    if (!teams || teams.length === 0) {
      alert("No teams available");
      return;
    }

    // 3. Collect already assigned team IDs from ALL mentors
    const alreadyAssignedTeamIds = new Set<number>();

    mentors.forEach((m: { teams: any[] }) => {
      if (Array.isArray(m.teams)) {
        m.teams.forEach((id: any) => {
          const numId = Number(id);
          if (!isNaN(numId)) alreadyAssignedTeamIds.add(numId);
        });
      }
    });

    // 4. Prepare mentors with capacity
    const mentorPool = mentors
      .map((m: { assignamount: any }) => ({
        ...m,
        capacity: Number(m.assignamount) || 0,
        assigned: [] as number[],
      }))
      .filter((m: { capacity: number }) => m.capacity > 0);

    if (mentorPool.length === 0) {
      alert("No mentors have assign amount set");
      return;
    }

    // 5. Filter & sort teams
    const sortedTeams = teams
      .filter(
        (t: { progress: null; id: any }) =>
          t.progress !== null && !alreadyAssignedTeamIds.has(Number(t.id))
      )
      .sort(
        (a: { progress: any }, b: { progress: any }) =>
          (a.progress ?? 0) - (b.progress ?? 0)
      );

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
      if (mentor.assigned.length === 0) continue;

      // Merge with existing teams instead of overwrite
      const existingTeams = Array.isArray(mentor.teams)
        ? mentor.teams.map((id: any) => Number(id)).filter(Boolean)
        : [];

      const updatedTeams = [...new Set([...existingTeams, ...mentor.assigned])];

      // Update mentor
      await supabase
        .from("Mentors")
        .update({ teams: updatedTeams })
        .eq("id", mentor.id);

      // Update teams one-by-one (avoids Supabase IN bug)
      for (const teamId of mentor.assigned) {
        await supabase
          .from("Teams")
          .update({ mentor_id: mentor.id })
          .eq("id", teamId);
      }
    }

    // 8. Refresh UI
    await loadMentors();
    await loadTeams();

    alert("Auto assignment completed successfully");
  } catch (err) {
    console.error(err);
    alert("Auto assignment failed");
  }
}

export async function exportMentorWisePDFModded(): Promise<void> {
  console.log("Generating modded mentor-wise PDF...");
  let printedMentorCount = 0;

  const padAdmission = (value: number | null | undefined) =>
    value == null ? "-" : String(value).padStart(4, "0");

  const formatGender = (value: string | null | undefined) => {
    if (!value) return "-";
    const v = value.toLowerCase();
    if (v === "m" || v === "male") return "Male";
    if (v === "f" || v === "female") return "Female";
    return value;
  };

  // ---- Fetch data ----
  const [{ data: mentors }, { data: teams }, { data: members }] =
    await Promise.all([
      supabase.from("Mentors").select("*").order("name", { ascending: true }),
      supabase.from("Teams").select("*"),
      supabase.from("members").select("*"),
    ]);

  if (!mentors || !teams || !members) {
    throw new Error("Failed to load data");
  }

  // ---- Lookups ----
  const teamMap = new Map<number, any>();
  teams.forEach((t: any) => teamMap.set(t.id, t));

  const memberMap = new Map<number, any>();
  members.forEach((m: any) => memberMap.set(m.id, m));

  const content: any[] = [];

  // ---- Title ----
  content.push({
    text: "Mentor-wise Team Allocation Report",
    style: "title",
    margin: [0, 0, 0, 25],
  });

  // ---- Mentors ----
  mentors.forEach((mentor: any, mentorIndex: number) => {
    const mentorTeams: number[] = Array.isArray(mentor.teams)
      ? mentor.teams
      : [];

    if (mentorTeams.length === 0) return;

    if (printedMentorCount > 0) {
      content.push({
        text: "",
        pageBreak: "before",
      });
    }
    printedMentorCount++;
    content.push({
      text: `${printedMentorCount}. Mentor: ${mentor.name || "Unnamed Mentor"}`,
      style: "mentorHeader",
      margin: [0, 20, 0, 10],
    });

    mentorTeams.forEach((teamId: number, teamIndex: number) => {
      const team = teamMap.get(teamId);
      if (!team) return;

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
        .map((id: number) => memberMap.get(id))
        .filter(Boolean)
        .sort((a: any, b: any) => {
          const aCap = team.captain === a.id || a.isCaptain === true;
          const bCap = team.captain === b.id || b.isCaptain === true;
          return Number(bCap) - Number(aCap);
        });

      let serial = 1;

      teamMembers.forEach((m: any) => {
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
          fillColor: (rowIndex: number, node: any) => {
            if (rowIndex === 0) return "#eeeeee";
            const row = node.table.body[rowIndex];
            if (row[1]?.text?.includes("(Captain)")) return "#fff3cd";
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
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 10, 0, 0],
    }),
  };

  pdfMake.createPdf(docDefinition).download("mentor-wise-team-report.pdf");
}

(window as any).assignMentorToTeam = assignMentorToTeam;
(window as any).closeMentorModal = closeMentorModal;
(window as any).exportMentorWisePDF = exportMentorWisePDF;
(window as any).exportMentorWisePDFModded = exportMentorWisePDFModded;
(window as any).filterMentors = filterMentors;
(window as any).filterTeams = filterTeams;
