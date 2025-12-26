export {};
declare const supabase: any;
declare const pdfMake: any;

interface Team {
  id: string | number;
  name?: string;
  members?: (string | number)[];
  captain?: string | number;
  locked?: boolean;
}

interface Student {
  id: string | number;
  name: string;
  gender?: string;
  department?: string;
  email?: string;
  isCaptain?: boolean;
  admissionNumber?: string;
}

let allTeams: Team[] = [];
let allStudents: Student[] = [];
let currentEditingTeam: Team | null = null;
let currentAssigningStudent: string | number | null = null;
let selectedTeamForAssignment: string | number | null = null;
let captainChanges: Map<string | number, boolean> = new Map(); // true = remove, false = add

document.addEventListener("DOMContentLoaded", function () {
  loadTeamsAndStudents();
  setupEventListeners();
});

function setupEventListeners(): void {
  const teamSearch = document.getElementById("teamSearch") as HTMLInputElement;
  if (teamSearch) {
    teamSearch.addEventListener("input", function (e) {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      filterTeams(query);
    });
  }

  const saveTeamChanges = document.getElementById("saveTeamChanges");
  if (saveTeamChanges) {
    saveTeamChanges.addEventListener("click", saveTeamChangesHandler);
  }

  const confirmAssignStudent = document.getElementById("confirmAssignStudent");
  if (confirmAssignStudent) {
    confirmAssignStudent.addEventListener("click", confirmAssignStudentHandler);
  }

  const createTeamBtn = document.getElementById("createTeamBtn");
  if (createTeamBtn) {
    createTeamBtn.addEventListener("click", openCreateTeamModal);
  }
  const printpdfbtn = document.getElementById("printpdfbtn");
  if (printpdfbtn) {
    printpdfbtn.addEventListener("click", exportTeamsPDF);
  }

  const manageCaptainsBtn = document.getElementById("manageCaptainsBtn");
  if (manageCaptainsBtn) {
    manageCaptainsBtn.addEventListener("click", openManageCaptainsModal);
  }

  const confirmCreateTeam = document.getElementById("confirmCreateTeam");
  if (confirmCreateTeam) {
    confirmCreateTeam.addEventListener("click", confirmCreateTeamHandler);
  }

  const fillTeamsBtn = document.getElementById("fillTeamsBtn");
  if (fillTeamsBtn) {
    fillTeamsBtn.addEventListener("click", openFillTeamsModal);
  }

  const confirmFillTeams = document.getElementById("confirmFillTeams");
  if (confirmFillTeams) {
    confirmFillTeams.addEventListener("click", confirmFillTeamsHandler);
  }

  const createTeamSearch = document.getElementById(
    "createTeamSearch"
  ) as HTMLInputElement;
  if (createTeamSearch) {
    createTeamSearch.addEventListener("input", function (e) {
      filterAllStudents((e.target as HTMLInputElement).value);
    });
  }

  const studentSearch = document.getElementById(
    "studentSearch"
  ) as HTMLInputElement;
  if (studentSearch) {
    studentSearch.addEventListener("input", function (e) {
      filterAvailableStudents((e.target as HTMLInputElement).value);
    });
  }

  const assignTeamSearch = document.getElementById(
    "assignTeamSearch"
  ) as HTMLInputElement;
  if (assignTeamSearch) {
    assignTeamSearch.addEventListener("input", function (e) {
      filterAssignTeams((e.target as HTMLInputElement).value);
    });
  }

  const addCaptainBtn = document.getElementById("addCaptainBtn");
  if (addCaptainBtn) {
    addCaptainBtn.addEventListener("click", openAddCaptainModal);
  }

  const addCaptainSearch = document.getElementById(
    "addCaptainSearch"
  ) as HTMLInputElement;
  if (addCaptainSearch) {
    addCaptainSearch.addEventListener("input", function (e) {
      filterAvailableCaptains((e.target as HTMLInputElement).value);
    });
  }

  const saveCaptainChanges = document.getElementById("saveChangesCaptan");
  if (saveCaptainChanges) {
    saveCaptainChanges.addEventListener("click", saveCaptainChangesHandler);
  }

  // Create Team Modal event listeners
  const closeCreateTeamBtn = document.getElementById("closeCreateTeamModal");
  if (closeCreateTeamBtn) {
    closeCreateTeamBtn.addEventListener("click", closeCreateTeamModal);
  }

  const cancelCreateTeamBtn = document.getElementById("cancelCreateTeam");
  if (cancelCreateTeamBtn) {
    cancelCreateTeamBtn.addEventListener("click", closeCreateTeamModal);
  }

  // Event delegation for add buttons in create team modal
  document.addEventListener("click", function (e) {
    const target = e.target as HTMLElement;

    // Handle add student buttons in create team modal
    if (
      target.classList.contains("btn-primary") &&
      target.textContent.trim() === "Add" &&
      target.closest("#allStudentsList")
    ) {
      const memberItem = target.closest(".member-item");
      if (memberItem) {
        const studentId = memberItem.getAttribute("data-student-id");
        if (studentId) {
          addStudentToNewTeam(studentId);
        }
      }
    }

    // Handle remove student buttons in create team modal
    if (
      target.classList.contains("btn-danger") &&
      target.textContent.trim() === "Remove" &&
      target.closest("#newTeamMembers")
    ) {
      const memberItem = target.closest(".member-item");
      if (memberItem) {
        const studentId = memberItem.getAttribute("data-student-id");
        if (studentId) {
          removeStudentFromNewTeam(studentId);
        }
      }
    }
  });
}

async function loadTeamsAndStudents(): Promise<void> {
  try {
    const { data: teams, error: teamsError } = await supabase
      .from("Teams")
      .select("*");

    if (teamsError) {
      throw teamsError;
    }

    allTeams = teams
      ? teams.map((team: any) => ({
          id: team.id,
          ...team,
        }))
      : [];

    const { data: students, error: studentsError } = await supabase
      .from("members")
      .select("*");

    if (studentsError) {
      throw studentsError;
    }

    allStudents = students
      ? students.map((student: any) => ({
          id: student.id,
          ...student,
        }))
      : [];

    displayTeams();
    displayUnassignedStudents();
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Error loading team data");
  }
}
function displayTeams(): void {
  const teamGrid = document.getElementById("teamGrid");
  if (!teamGrid) return;

  if (allTeams.length === 0) {
    teamGrid.innerHTML = `
      <div class="empty-state">
        <p>No teams found. Generate teams first.</p>
      </div>
    `;
    return;
  }

  const sortedTeams = [...allTeams].sort((a, b) => {
    const nameA = (a.name || `Team ${a.id}`).toLowerCase();
    const nameB = (b.name || `Team ${b.id}`).toLowerCase();

    const numA = nameA.match(/\d+/);
    const numB = nameB.match(/\d+/);

    if (numA && numB) {
      return parseInt(numA[0]) - parseInt(numB[0]);
    }

    return nameA.localeCompare(nameB);
  });

  teamGrid.innerHTML = sortedTeams
    .map((team) => {
      const maleCount = team.members
        ? team.members.filter((memberId) => {
            const member = allStudents.find((s) => s.id === memberId);
            return member && String(member.gender).toUpperCase() === "M";
          }).length
        : 0;

      const femaleCount = team.members
        ? team.members.filter((memberId) => {
            const member = allStudents.find((s) => s.id === memberId);
            return member && String(member.gender).toUpperCase() === "F";
          }).length
        : 0;

      const isLocked = team.locked === true;

      return `
        <div class="team-card" data-team-id="${team.id}">
          <div class="team-card-header">
            <div class="team-name">
              ${team.name || `Team ${team.id}`}
              ${
                isLocked
                  ? ' <span style="color: #f39c12; font-size: 12px;">🔒</span>'
                  : ""
              }
            </div>
          </div>
          <div class="team-card-body">
            <div class="team-stats">
              <div class="team-stat">
                <div class="team-stat-value">${
                  team.members ? team.members.length : 0
                }</div>
                <div class="team-stat-label">Members</div>
              </div>
              <div class="team-stat">
                <div class="team-stat-value">${maleCount}/${femaleCount}</div>
                <div class="team-stat-label">M/F</div>
              </div>
            </div>
            <div class="team-card-actions">
              <button class="btn btn-sm btn-secondary" onclick="openTeamManagement(${JSON.stringify(
                team.id
              )})">Manage</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTeam('${
                team.id
              }')" ${
        isLocked ? 'disabled style="opacity: 0.5;"' : ""
      }>Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}
function displayUnassignedStudents(): void {
  const unassignedContainer = document.getElementById("unassignedStudents");
  if (!unassignedContainer) return;

  const assignedStudentIds = new Set();
  allTeams.forEach((team) => {
    if (team.members) {
      team.members.forEach((memberId) => assignedStudentIds.add(memberId));
    }
  });

  const unassignedStudents = allStudents.filter(
    (student) => !assignedStudentIds.has(student.id)
  );

  if (unassignedStudents.length === 0) {
    unassignedContainer.innerHTML = `
      <div class="empty-state">
        <p>All students are assigned to teams!</p>
      </div>
    `;
    return;
  }

  unassignedContainer.innerHTML = `
    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
      <strong>${unassignedStudents.length}</strong> unassigned students available
    </div>
    <div class="unassigned-grid">
      ${unassignedStudents
        .map(
          (student) => `
          <div class="unassigned-student" onclick="openAssignStudentModal('${student.id}')">
            <div class="student-name">${student.name}</div>
            <div class="student-details">
              ${student.gender} • ${student.department || "Unknown"}
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}



function filterTeams(query: string): void {
  const teamCards = document.querySelectorAll(".team-card");
  const searchTerm = query.toLowerCase();

  teamCards.forEach((card) => {
    const teamName =
      card.querySelector(".team-name")?.textContent?.toLowerCase() || "";
    const teamId = card.getAttribute("data-team-id");
    const team = allTeams.find((t) => t.id == teamId);

    let hasMatchingStudent = false;

    if (team && team.members) {
      hasMatchingStudent = team.members.some((memberId) => {
        const student = allStudents.find((s) => s.id === memberId);
        return student && student.name.toLowerCase().includes(searchTerm);
      });
    }

    if (teamName.includes(searchTerm) || hasMatchingStudent) {
      (card as HTMLElement).style.display = "";
    } else {
      (card as HTMLElement).style.display = "none";
    }
  });
}

function openTeamManagement(teamId: string | number): void {
  currentEditingTeam = allTeams.find((team) => team.id === teamId) || null;
  if (!currentEditingTeam) return;

  const teamManagementTitle = document.getElementById("teamManagementTitle");
  if (teamManagementTitle) {
    teamManagementTitle.textContent = `Manage ${
      currentEditingTeam.name || `Team ${currentEditingTeam.id}`
    }`;
  }
  updateLockButtonState();
  const currentTeamHeader = document.getElementById("currentTeamHeader");
  if (currentTeamHeader) {
    currentTeamHeader.innerHTML = `
      <input type="text" id="editingTeamName" value="${
        currentEditingTeam.name || `Team ${currentEditingTeam.id}`
      }" class="team-name-input">
    `;
  }

  const currentTeamMembersContainer =
    document.getElementById("currentTeamMembers");
  if (currentTeamMembersContainer) {
    if (currentEditingTeam.members && currentEditingTeam.members.length > 0) {
      currentTeamMembersContainer.innerHTML = currentEditingTeam.members
        .map((memberId) => {
          const member = allStudents.find((s) => s.id === memberId);
          if (!member) return "";

          const isCaptain = currentEditingTeam!.captain === memberId;

          return `
            <div class="member-item ${isCaptain ? "captain-highlight" : ""}">
              <div class="member-info">
                <div class="member-name">
                  ${member.name}
                  ${
                    isCaptain
                      ? '<span class="captain-badge">🏆 Captain</span>'
                      : ""
                  }
                </div>
                <div class="member-details">
                  ${member.department || "Unknown Dept"} • ${
            member.gender || "?"
          }
                </div>
              </div>
              <div class="member-actions">
                ${
                  !isCaptain
                    ? `
                  <button class="btn btn-sm btn-danger" onclick="removeMemberFromTeam('${memberId}')">Remove</button>
                  <button class="btn btn-sm btn-secondary" onclick="setAsCaptain('${memberId}')">Make Captain</button>
                `
                    : '<span class="captain-label">Team Captain</span>'
                }
              </div>
            </div>
          `;
        })
        .join("");
    } else {
      currentTeamMembersContainer.innerHTML =
        '<div class="empty-state">No team members</div>';
    }
  }

  const availableStudentsSection = document.getElementById(
    "availableStudentsSection"
  );
  if (availableStudentsSection) {
    availableStudentsSection.style.display = "none";
  }

  const addMemberBtn = document.getElementById(
    "addMemberBtn"
  ) as HTMLButtonElement;
  if (addMemberBtn) {
    addMemberBtn.onclick = openAddMemberModal;
  }

  const teamManagementModal = document.getElementById("teamManagementModal");
  if (teamManagementModal) {
    teamManagementModal.classList.add("active");
  }

  const saveTeamChanges = document.getElementById(
    "saveTeamChanges"
  ) as HTMLButtonElement;
  if (saveTeamChanges) {
    saveTeamChanges.textContent = "Save Changes";
    saveTeamChanges.onclick = saveTeamChangesHandler;
  }

  const discardTeamChanges = document.getElementById("discardTeamChanges");
  if (discardTeamChanges) {
    discardTeamChanges.onclick = closeTeamManagementModal;
  }
}

async function setAsCaptain(studentId: string | number): Promise<void> {
  if (!currentEditingTeam) return;

  try {
    if (currentEditingTeam.captain) {
      const { error: removeCaptainError } = await supabase
        .from("members")
        .update({
          isCaptain: false,
        })
        .eq("id", currentEditingTeam.captain);

      if (removeCaptainError) {
        throw removeCaptainError;
      }
    }

    const { error } = await supabase
      .from("Teams")
      .update({
        captain: studentId,
      })
      .eq("id", currentEditingTeam.id);

    if (error) {
      throw error;
    }

    const { error: studentError } = await supabase
      .from("members")
      .update({
        isCaptain: true,
      })
      .eq("id", studentId);

    if (studentError) {
      throw studentError;
    }

    currentEditingTeam.captain = studentId;
    openTeamManagement(currentEditingTeam.id);
  } catch (error) {
    console.error("Error setting captain:", error);
    alert("Error setting captain. Please try again.");
  }
}

function removeMemberFromTeam(studentId: string | number): void {
  if (!currentEditingTeam) return;

  const memberIdToRemove =
    currentEditingTeam.members && currentEditingTeam.members.length > 0
      ? typeof currentEditingTeam.members[0] === "number"
        ? Number(studentId)
        : studentId
      : studentId;

  if (currentEditingTeam.captain === memberIdToRemove) {
    alert("Cannot remove the team captain. Please assign a new captain first.");
    return;
  }

  if (currentEditingTeam.members) {
    currentEditingTeam.members = currentEditingTeam.members.filter(
      (id) => id !== memberIdToRemove
    );
  }

  openTeamManagement(currentEditingTeam.id);
}


async function saveTeamChangesHandler(): Promise<void> {
  if (!currentEditingTeam) return;

  try {
    const teamNameInput = document.getElementById(
      "editingTeamName"
    ) as HTMLInputElement;
    const newTeamName = teamNameInput
      ? teamNameInput.value.trim()
      : currentEditingTeam.name;

    if (!newTeamName) {
      alert("Please enter a team name");
      return;
    }

    // Update team in Teams table
    const { error: updateError } = await supabase
      .from("Teams")
      .update({
        name: newTeamName,
        members: currentEditingTeam.members || [],
        captain: currentEditingTeam.captain || null,
      })
      .eq("id", currentEditingTeam.id);

    if (updateError) {
      throw updateError;
    }

    // Get previous team data to find removed members
    const previousTeam = allTeams.find(t => t.id === currentEditingTeam!.id);
    
    if (previousTeam && previousTeam.members) {
      // Find members that were removed from the team
      const removedMembers = previousTeam.members.filter(
        memberId => !currentEditingTeam!.members?.includes(memberId)
      );
      
      // Clear captain status for removed members
      for (const memberId of removedMembers) {
        // Check if this member was the captain
        if (memberId === previousTeam.captain) {
          await supabase
            .from("members")
            .update({
              isCaptain: false,
            })
            .eq("id", memberId);
        }
      }
    }

    // Update captain status for current members
    for (const memberId of currentEditingTeam.members || []) {
      try {
        const isCaptain = currentEditingTeam.captain === memberId;
        const { error: studentUpdateError } = await supabase
          .from("members")
          .update({
            isCaptain: isCaptain,
          })
          .eq("id", memberId);

        if (studentUpdateError) {
          throw studentUpdateError;
        }
      } catch (error) {
        console.error(`Error updating student ${memberId}:`, error);
      }
    }

    alert("Team changes saved successfully!");
    closeTeamManagementModal();
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error saving team changes:", error);
    alert("Error saving team changes. Please try again.");
  }
}

function closeTeamManagementModal(): void {
  const teamManagementModal = document.getElementById("teamManagementModal");
  if (teamManagementModal) {
    teamManagementModal.classList.remove("active");
  }
  currentEditingTeam = null;
  loadTeamsAndStudents();
}

function openAddMemberModal(): void {
  if (!currentEditingTeam) return;

  populateAvailableStudentsList();

  const addMemberModal = document.getElementById("addMemberModal");
  if (addMemberModal) {
    addMemberModal.classList.add("active");
  }
}

function closeAddMemberModal(): void {
  const addMemberModal = document.getElementById("addMemberModal");
  if (addMemberModal) {
    addMemberModal.classList.remove("active");
  }
}

function populateAvailableStudentsList(): void {
  const availableStudentsList = document.getElementById(
    "availableStudentsList"
  );
  if (!availableStudentsList) return;

  const assignedStudentIds = new Set();
  allTeams.forEach((team) => {
    if (team.members) {
      team.members.forEach((memberId) => assignedStudentIds.add(memberId));
    }
  });

  const unassignedStudents = allStudents.filter(
    (student) => !assignedStudentIds.has(student.id)
  );

  if (unassignedStudents.length === 0) {
    availableStudentsList.innerHTML =
      '<div class="empty-state">No available students</div>';
    return;
  }

  availableStudentsList.innerHTML = unassignedStudents
    .map((student) => {
      return `
        <div class="member-item">
          <div class="member-info">
            <div class="member-name">${student.name}</div>
            <div class="member-details">
              ${student.department || "Unknown Dept"} • ${
        student.gender || "?"
      } • ${student.email || "No email"}
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="addMemberFromModal('${
            student.id
          }')">Add</button>
        </div>
      `;
    })
    .join("");
}

function filterAvailableStudents(query: string): void {
  const studentItems = document.querySelectorAll(
    "#availableStudentsList .member-item"
  );
  const searchTerm = query.toLowerCase();

  studentItems.forEach((item) => {
    const studentName =
      item.querySelector(".member-name")?.textContent?.toLowerCase() || "";
    (item as HTMLElement).style.display = studentName.includes(searchTerm)
      ? ""
      : "none";
  });
}

function addMemberFromModal(studentId: string | number): void {
  if (!currentEditingTeam) return;

  const memberId =
    typeof studentId === "string" ? parseInt(studentId) : studentId;

  if (!currentEditingTeam.members) {
    currentEditingTeam.members = [];
  }

  if (currentEditingTeam.members.includes(memberId)) {
    return;
  }

  currentEditingTeam.members.push(memberId);
  closeAddMemberModal();
  openTeamManagement(currentEditingTeam.id);
}

function openAssignStudentModal(studentId: string | number): void {
  currentAssigningStudent = studentId;
  selectedTeamForAssignment = null;

  const student = allStudents.find((s) => s.id === studentId);
  if (!student) return;

  const assignStudentTitle = document.getElementById("assignStudentTitle");
  if (assignStudentTitle) {
    assignStudentTitle.textContent = `Assign ${student.name} to Team`;
  }

  populateTeamsList();

  const assignStudentModal = document.getElementById("assignStudentModal");
  if (assignStudentModal) {
    assignStudentModal.classList.add("active");
  }
}

function closeAssignStudentModal(): void {
  const assignStudentModal = document.getElementById("assignStudentModal");
  if (assignStudentModal) {
    assignStudentModal.classList.remove("active");
  }
  currentAssigningStudent = null;
  selectedTeamForAssignment = null;
}

function populateTeamsList(): void {
  const assignTeamsList = document.getElementById("assignTeamsList");
  if (!assignTeamsList) return;

  if (allTeams.length === 0) {
    assignTeamsList.innerHTML =
      '<div class="empty-state">No teams available</div>';
    return;
  }

  assignTeamsList.innerHTML = allTeams
    .map((team) => {
      const captain = allStudents.find((s) => s.id === team.captain);
      const isSelected = selectedTeamForAssignment === team.id;

      return `
        <div class="member-item selectable ${
          isSelected ? "selected" : ""
        }" onclick="selectTeamForAssignment('${team.id}')">
          <div class="member-info">
            <div class="member-name">${team.name || `Team ${team.id}`}</div>
            <div class="member-details">
              Captain: ${captain ? captain.name : "N/A"} • ${
        captain?.department || "Unknown"
      } • ${captain?.gender || "?"}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function selectTeamForAssignment(teamId: string | number): void {
  selectedTeamForAssignment = teamId;
  populateTeamsList();
}

function filterAssignTeams(query: string): void {
  const teamItems = document.querySelectorAll("#assignTeamsList .member-item");
  const searchTerm = query.toLowerCase();

  teamItems.forEach((item) => {
    const teamName =
      item.querySelector(".member-name")?.textContent?.toLowerCase() || "";
    const captainName =
      item.querySelector(".member-details")?.textContent?.toLowerCase() || "";
    (item as HTMLElement).style.display =
      teamName.includes(searchTerm) || captainName.includes(searchTerm)
        ? ""
        : "none";
  });
}

async function confirmAssignStudentHandler(): Promise<void> {
  if (!currentAssigningStudent || !selectedTeamForAssignment) {
    alert("Please select a team");
    return;
  }

  try {
    const team = allTeams.find((t) => t.id === selectedTeamForAssignment);
    if (!team) return;

    const updatedMembers = [...(team.members || []), currentAssigningStudent];

    const { error: teamUpdateError } = await supabase
      .from("Teams")
      .update({
        members: updatedMembers,
      })
      .eq("id", selectedTeamForAssignment);

    if (teamUpdateError) {
      throw teamUpdateError;
    }

    alert("Student assigned to team successfully!");
    closeAssignStudentModal();
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error assigning student:", error);
    alert("Error assigning student to team. Please try again.");
  }
}

async function deleteTeam(teamId: string | number): Promise<void> {
  if (
    !confirm(
      "Are you sure you want to delete this team? This will remove all team assignments for its members."
    )
  ) {
    return;
  }

  try {
    const team = allTeams.find((t) => t.id === teamId);
   

    const { error: deleteError } = await supabase
      .from("Teams")
      .delete()
      .eq("id", teamId);

    if (deleteError) {
      throw deleteError;
    }

    alert("Team deleted successfully!");
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error deleting team:", error);
    alert("Error deleting team. Please try again.");
  }
}

function openCreateTeamModal(): void {
  const createTeamModal = document.getElementById("createTeamModal");
  if (createTeamModal) {
    createTeamModal.classList.add("active");
  }

  // Initialize with empty state
  const newTeamMembers = document.getElementById("newTeamMembers");
  if (newTeamMembers) {
    newTeamMembers.innerHTML =
      '<div class="no-members-selected">No members selected</div>';
  }

  const teamCaptainSelect = document.getElementById(
    "teamCaptainSelect"
  ) as HTMLSelectElement;
  if (teamCaptainSelect) {
    teamCaptainSelect.innerHTML = '<option value="">Select captain...</option>';
  }

  const newTeamName = document.getElementById(
    "newTeamName"
  ) as HTMLInputElement;
  if (newTeamName) {
    newTeamName.value = "";
  }

  populateAllStudentsList();
}

function closeCreateTeamModal(): void {
  const createTeamModal = document.getElementById("createTeamModal");
  if (createTeamModal) {
    createTeamModal.classList.remove("active");
  }
}
function populateAllStudentsList(): void {
  const allStudentsList = document.getElementById("allStudentsList");
  if (!allStudentsList) return;

  const assignedStudentIds = new Set();
  allTeams.forEach((team) => {
    if (team.members) {
      team.members.forEach((memberId) => assignedStudentIds.add(memberId));
    }
  });

  const unassignedStudents = allStudents.filter(
    (student) => !assignedStudentIds.has(student.id)
  );

  if (unassignedStudents.length === 0) {
    allStudentsList.innerHTML =
      '<div class="empty-state">No available students</div>';
    return;
  }

  allStudentsList.innerHTML = unassignedStudents
    .map((student) => {
      return `
        <div class="member-item" data-student-id="${student.id}">
          <div class="member-info">
            <div class="member-name">${student.name}</div>
            <div class="member-details">
              ${student.department || "Unknown Dept"} • ${student.gender || "?"}
            </div>
          </div>
          <button class="btn btn-sm btn-primary">Add</button>
        </div>
      `;
    })
    .join("");
}

function filterAllStudents(query: string): void {
  const studentItems = document.querySelectorAll(
    "#allStudentsList .member-item"
  );
  const searchTerm = query.toLowerCase();

  studentItems.forEach((item) => {
    const studentName =
      item.querySelector(".member-name")?.textContent?.toLowerCase() || "";
    (item as HTMLElement).style.display = studentName.includes(searchTerm)
      ? ""
      : "none";
  });
}
function addStudentToNewTeam(studentId: string | number): void {
  console.log("addStudentToNewTeam called with:", studentId);

  // Convert to number if it's a string
  const processedStudentId =
    typeof studentId === "string" ? parseInt(studentId) : studentId;

  const student = allStudents.find((s) => s.id === processedStudentId);
  console.log("Found student:", student);
  if (!student) {
    console.error("Student not found");
    return;
  }

  const newTeamMembers = document.getElementById("newTeamMembers");
  console.log("newTeamMembers element:", newTeamMembers);
  if (!newTeamMembers) {
    console.error("newTeamMembers element not found");
    return;
  }

  const currentContent = newTeamMembers.innerHTML;
  console.log("Current content:", currentContent);

  if (currentContent.includes("no-members-selected")) {
    console.log("Clearing 'no-members-selected' placeholder");
    newTeamMembers.innerHTML = "";
  }

  const memberElement = document.createElement("div");
  memberElement.className = "member-item";
  memberElement.setAttribute("data-student-id", studentId.toString());
  memberElement.innerHTML = `
    <div class="member-info">
      <div class="member-name">${student.name}</div>
    </div>
    <button class="btn btn-sm btn-danger">Remove</button>
  `;

  console.log("Adding member element to DOM");
  newTeamMembers.appendChild(memberElement);

  // Add event listener for remove button
  const removeBtn = memberElement.querySelector("button");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      removeStudentFromNewTeam(studentId);
    });
  }

  const captainSelect = document.getElementById(
    "teamCaptainSelect"
  ) as HTMLSelectElement;
  console.log("captainSelect element:", captainSelect);

  if (captainSelect) {
    const alreadyExists = Array.from(captainSelect.options).some(
      (opt) => opt.value === studentId.toString()
    );
    console.log("Captain option already exists:", alreadyExists);

    if (!alreadyExists) {
      const option = document.createElement("option");
      option.value = studentId.toString();
      option.textContent = student.name;
      captainSelect.appendChild(option);
      console.log("Added captain option:", student.name);
    }
  }

  const studentElement = document.querySelector(
    `[data-student-id="${studentId}"]`
  );
  console.log("Found student element in available list:", studentElement);

  // Only remove from available list if there's more than one
  const allStudentsList = document.getElementById("allStudentsList");
  if (allStudentsList) {
    const itemsInList = allStudentsList.querySelectorAll("[data-student-id]");
    console.log("Items in available list:", itemsInList.length);

    if (itemsInList.length > 1) {
      const specificElement = allStudentsList.querySelector(
        `[data-student-id="${studentId}"]`
      );
      if (specificElement) {
        console.log("Removing from available list");
        specificElement.remove();
      }
    }
  }

  console.log("addStudentToNewTeam completed successfully");
}
function removeStudentFromNewTeam(studentId: string | number): void {
  const student = allStudents.find((s) => s.id === studentId);
  if (!student) return;

  const memberElement = document
    .querySelector(`[onclick="removeStudentFromNewTeam('${studentId}')"]`)
    ?.closest(".member-item");
  if (memberElement) {
    memberElement.remove();
  }

  const allStudentsList = document.getElementById("allStudentsList");
  if (allStudentsList) {
    const studentElement = document.createElement("div");
    studentElement.className = "member-item";
    studentElement.innerHTML = `
      <div class="member-info">
        <div class="member-name">${student.name}</div>
      </div>
      <button class="btn btn-sm btn-primary" onclick="addStudentToNewTeam('${student.id}')">Add</button>
    `;
    allStudentsList.appendChild(studentElement);
  }

  const captainSelect = document.getElementById(
    "teamCaptainSelect"
  ) as HTMLSelectElement;
  if (captainSelect) {
    const optionToRemove = Array.from(captainSelect.options).find(
      (opt) => opt.value === studentId.toString()
    );
    if (optionToRemove) {
      captainSelect.removeChild(optionToRemove);
    }
  }

  const newTeamMembers = document.getElementById("newTeamMembers");
  if (newTeamMembers && newTeamMembers.children.length === 0) {
    newTeamMembers.innerHTML =
      '<div class="no-members-selected">No members selected</div>';
  }
}
async function confirmCreateTeamHandler(): Promise<void> {
  const newTeamName = document.getElementById(
    "newTeamName"
  ) as HTMLInputElement;
  const teamCaptainSelect = document.getElementById(
    "teamCaptainSelect"
  ) as HTMLSelectElement;
  const newTeamMembers = document.getElementById("newTeamMembers");

  if (!newTeamName || !teamCaptainSelect || !newTeamMembers) return;

  const teamName = newTeamName.value.trim();
  const captainId = teamCaptainSelect.value;

  // Get member IDs from data-student-id attributes
  const newTeamMembersArray: (string | number)[] = [];
  Array.from(
    newTeamMembers.querySelectorAll(".member-item[data-student-id]")
  ).forEach((item) => {
    const studentId = item.getAttribute("data-student-id");
    if (studentId) {
      newTeamMembersArray.push(
        isNaN(Number(studentId)) ? studentId : Number(studentId)
      );
    }
  });

  console.log("Members array:", newTeamMembersArray);
  console.log("Captain ID:", captainId);

  if (!teamName) {
    alert("Please enter a team name");
    return;
  }

  if (newTeamMembersArray.length === 0) {
    alert("Please add at least one member to the team");
    return;
  }

  if (!captainId) {
    alert("Please select a team captain");
    return;
  }

  // Ensure captain is in the members list
  const captainIdProcessed = isNaN(Number(captainId))
    ? captainId
    : Number(captainId);
  if (!newTeamMembersArray.includes(captainIdProcessed)) {
    alert("Team captain must be one of the team members");
    return;
  }

  try {
    const now = new Date().toISOString();

    // Create team data - ensure proper data types
    const teamData = {
      name: teamName,
      members: newTeamMembersArray,
      captain: captainIdProcessed,
    };
    if ("id" in teamData) {
      delete teamData.id;
    }
    console.log("=== DEBUG TEAM DATA ===");
    console.log("Team data object:", teamData);
    console.log("Has id property?", "id" in teamData);
    console.log("Object keys:", Object.keys(teamData));
    console.log("JSON stringified:", JSON.stringify(teamData));
    console.log("=== END DEBUG ===");

    let { data: newTeam, error: insertError } = await supabase
      .from("Teams")
      .insert(teamData)
      .select()
      .single();

    // If we get a duplicate key error, manually find the next available ID
    if (insertError?.code === "23505") {
      console.log("Duplicate key error detected, finding next available ID...");

      // Get all existing team IDs
      const { data: existingTeams, error: fetchError } = await supabase
        .from("Teams")
        .select("id")
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;

      // Find the next available ID
      const existingIds =
        existingTeams?.map((team: { id: any }) => Number(team.id)) || [];
      let nextId = 1;
      while (existingIds.includes(nextId)) {
        nextId++;
      }

      console.log("Next available ID:", nextId);

      // Insert with manual ID
      const teamDataWithId = {
        id: nextId,
        ...teamData,
      };

      ({ data: newTeam, error: insertError } = await supabase
        .from("Teams")
        .insert(teamDataWithId)
        .select()
        .single());
    }

    if (insertError) {
      console.error("Team creation error:", insertError);
      throw insertError;
    }

    console.log("Team created successfully:", newTeam);

    // Update all team members
    const updatePromises = newTeamMembersArray.map(async (studentId) => {
      const isCaptain = studentId === captainIdProcessed;
      const updateData = {
        isCaptain: isCaptain,
      };

      console.log(`Updating student ${studentId} with:`, updateData);

      const { error } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", studentId);

      if (error) {
        console.error(`Error updating student ${studentId}:`, error);
        throw error;
      }
    });

    // Wait for all student updates to complete
    await Promise.all(updatePromises);

    alert("Team created successfully!");
    closeCreateTeamModal();
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error creating team:", error);
    alert(
      "Error creating team. Please check the console for details and try again."
    );
  }
}
function openManageCaptainsModal(): void {
  captainChanges.clear();
  populateCaptainsList();
  const manageCaptainsModal = document.getElementById("manageCaptainsModal");
  if (manageCaptainsModal) {
    manageCaptainsModal.classList.add("active");
  }
}

function closeManageCaptainsModal(): void {
  const manageCaptainsModal = document.getElementById("manageCaptainsModal");
  if (manageCaptainsModal) {
    manageCaptainsModal.classList.remove("active");
  }
  captainChanges.clear();
}

function populateCaptainsList(): void {
  const captainsList = document.getElementById("captainsList");
  if (!captainsList) return;

  const captains = allStudents.filter((s) => s.isCaptain === true);

  if (captains.length === 0) {
    captainsList.innerHTML =
      '<div class="empty-state">No captains assigned</div>';
    return;
  }

  captainsList.innerHTML = captains
    .map((captain) => {
      return `
        <div class="member-item">
          <div class="member-info">
            <div class="member-name">${captain.name}</div>
            <div class="member-details">
              ${captain.department || "Unknown Dept"} • ${
        captain.gender || "?"
      } • ${captain.admissionNumber || "N/A"}
            </div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="removeCaptain('${
            captain.id
          }')">Remove Captain</button>
        </div>
      `;
    })
    .join("");
}

function removeCaptain(studentId: string | number): void {
  captainChanges.set(studentId, true);
  populateCaptainsList();
}

function openAddCaptainModal(): void {
  populateAvailableCaptainsList();
  const addCaptainModal = document.getElementById("addCaptainModal");
  if (addCaptainModal) {
    addCaptainModal.classList.add("active");
  }
}

function closeAddCaptainModal(): void {
  const addCaptainModal = document.getElementById("addCaptainModal");
  if (addCaptainModal) {
    addCaptainModal.classList.remove("active");
  }
}

function populateAvailableCaptainsList(): void {
  const availableCaptainsList = document.getElementById(
    "availableCaptainsList"
  );
  if (!availableCaptainsList) return;

  const currentCaptainIds = new Set(
    allStudents.filter((s) => s.isCaptain).map((s) => s.id)
  );

  const availableStudents = allStudents.filter(
    (student) => !currentCaptainIds.has(student.id)
  );

  if (availableStudents.length === 0) {
    availableCaptainsList.innerHTML =
      '<div class="empty-state">No available students</div>';
    return;
  }

  availableCaptainsList.innerHTML = availableStudents
    .map((student) => {
      return `
        <div class="member-item">
          <div class="member-info">
            <div class="member-name">${student.name}</div>
            <div class="member-details">
              ${student.department || "Unknown Dept"} • ${
        student.gender || "?"
      } • ${student.admissionNumber || "N/A"}
            </div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="addCaptainFromModal('${
            student.id
          }')">Add Captain</button>
        </div>
      `;
    })
    .join("");
}

function filterAvailableCaptains(query: string): void {
  const studentItems = document.querySelectorAll(
    "#availableCaptainsList .member-item"
  );
  const searchTerm = query.toLowerCase();

  studentItems.forEach((item) => {
    const studentName =
      item.querySelector(".member-name")?.textContent?.toLowerCase() || "";
    (item as HTMLElement).style.display = studentName.includes(searchTerm)
      ? ""
      : "none";
  });
}

function addCaptainFromModal(studentId: string | number): void {
  captainChanges.set(studentId, false);
  closeAddCaptainModal();
  populateCaptainsList();
}
async function saveCaptainChangesHandler(): Promise<void> {
  if (captainChanges.size === 0) {
    alert("No changes to save");
    return;
  }

  try {
    for (const [studentId, isRemoval] of captainChanges) {
      if (isRemoval) {
        // Find team where this student is a member (by checking Teams.members JSONB array)
        const team = allTeams.find(t => 
          t.members && t.members.some(memberId => memberId === studentId)
        );
        
        if (team) {
          // Check if this student is the captain of the team
          if (team.captain === studentId) {
            // Remove captain from the team
            await supabase
              .from("Teams")
              .update({
                captain: null,
              })
              .eq("id", team.id);
          }
        }

        // Remove captain status from student in members table
        await supabase
          .from("members")
          .update({
            isCaptain: false,
          })
          .eq("id", studentId);
      } else {
        // Add captain status to student
        await supabase
          .from("members")
          .update({
            isCaptain: true,
          })
          .eq("id", studentId);
      }
    }

    alert("Captain changes saved successfully!");
    captainChanges.clear();
    closeManageCaptainsModal();
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error saving captain changes:", error);
    alert("Error saving captain changes. Please try again.");
  }
}
//locking
function updateLockButtonState(): void {
  if (!currentEditingTeam) return;

  const lockIcon = document.getElementById("lockIcon");
  const lockText = document.getElementById("lockText");
  const lockTeamBtn = document.getElementById(
    "lockTeamBtn"
  ) as HTMLButtonElement;

  if (lockIcon && lockText && lockTeamBtn) {
    const isLocked = currentEditingTeam.locked === true;

    if (isLocked) {
      lockIcon.textContent = "🔒";
      lockText.textContent = "Locked";
      lockTeamBtn.classList.remove("btn-secondary");
      lockTeamBtn.classList.add("btn-warning");
    } else {
      lockIcon.textContent = "🔓";
      lockText.textContent = "Unlocked";
      lockTeamBtn.classList.remove("btn-warning");
      lockTeamBtn.classList.add("btn-secondary");
    }
  }
}

// Toggle team lock status
async function toggleTeamLock(): Promise<void> {
  if (!currentEditingTeam) return;

  try {
    const newLockStatus = !currentEditingTeam.locked;

    // Update in Supabase immediately
    const { error } = await supabase
      .from("Teams")
      .update({
        locked: newLockStatus,
      })
      .eq("id", currentEditingTeam.id);

    if (error) {
      throw error;
    }
    // Update local state
    currentEditingTeam.locked = newLockStatus;

    const teamIndex = allTeams.findIndex(
      (team) => team.id === currentEditingTeam!.id
    );
    if (teamIndex !== -1) {
      allTeams[teamIndex].locked = newLockStatus;
    }

    updateLockButtonState();

    const status = newLockStatus ? "locked" : "unlocked";
    showLockStatusMessage(`Team ${status} successfully!`);
  } catch (error) {
    console.error("Error toggling team lock:", error);
    alert("Error updating team lock status. Please try again.");
  }
}

function showLockStatusMessage(message: string): void {
  let statusElement = document.getElementById("lockStatusMessage");
  if (!statusElement) {
    statusElement = document.createElement("div");
    statusElement.id = "lockStatusMessage";
    statusElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(statusElement);
  }

  statusElement.textContent = message;
  statusElement.style.display = "block";

  // Hide after 2 seconds
  setTimeout(() => {
    statusElement!.style.display = "none";
  }, 2000);
}

function openFillTeamsModal(): void {
  const fillTeamsModal = document.getElementById("fillTeamsModal");
  if (fillTeamsModal) {
    fillTeamsModal.classList.add("active");
  }

  // Reset fill amount to default
  const fillAmount = document.getElementById("fillAmount") as HTMLInputElement;
  if (fillAmount) {
    fillAmount.value = "5";
  }
}

// Close Fill Teams Modal
function closeFillTeamsModal(): void {
  const fillTeamsModal = document.getElementById("fillTeamsModal");
  if (fillTeamsModal) {
    fillTeamsModal.classList.remove("active");
  }
}

// Main function to fill teams with unassigned students
async function confirmFillTeamsHandler(): Promise<void> {
  const fillAmountInput = document.getElementById(
    "fillAmount"
  ) as HTMLInputElement;
  if (!fillAmountInput) return;

  const maxStudentsPerTeam = parseInt(fillAmountInput.value);

  if (!maxStudentsPerTeam || maxStudentsPerTeam < 1) {
    alert("Please enter a valid number of students per team");
    return;
  }

  try {
    // Get unassigned students
    const assignedStudentIds = new Set();
    allTeams.forEach((team) => {
      if (team.members) {
        team.members.forEach((memberId) => assignedStudentIds.add(memberId));
      }
    });

    const unassignedStudents = allStudents.filter(
      (student) => !assignedStudentIds.has(student.id)
    );

    if (unassignedStudents.length === 0) {
      alert("No unassigned students available to fill teams");
      closeFillTeamsModal();
      return;
    }

    // Get unlocked teams that need filling
    const teamsNeedingFilling = allTeams.filter(
      (team) =>
        !team.locked && // Only unlocked teams
        team.members &&
        team.members.length < maxStudentsPerTeam
    );

    if (teamsNeedingFilling.length === 0) {
      alert(
        "No unlocked teams need filling. All teams are either locked or already have enough members."
      );
      closeFillTeamsModal();
      return;
    }

    // Show loading state
    const confirmButton = document.getElementById(
      "confirmFillTeams"
    ) as HTMLButtonElement;
    if (confirmButton) {
      confirmButton.textContent = "Filling...";
      confirmButton.disabled = true;
    }

    // Distribute unassigned students to teams
    const distributionResult = await distributeStudentsToTeams(
      unassignedStudents,
      teamsNeedingFilling,
      maxStudentsPerTeam
    );

    // Update UI
    closeFillTeamsModal();
    loadTeamsAndStudents();

    // Show results
    showFillTeamsResult(distributionResult);
  } catch (error) {
    console.error("Error filling teams:", error);
    alert("Error filling teams. Please try again.");

    // Reset button state
    const confirmButton = document.getElementById(
      "confirmFillTeams"
    ) as HTMLButtonElement;
    if (confirmButton) {
      confirmButton.textContent = "Fill Teams";
      confirmButton.disabled = false;
    }
  }
}

// Distribute students to teams algorithm
async function distributeStudentsToTeams(
  unassignedStudents: Student[],
  teams: Team[],
  maxPerTeam: number
): Promise<{ assigned: number; teamsFilled: number; remaining: number }> {
  let assignedCount = 0;
  let teamsFilled = 0;

  // Sort teams by current member count (fill teams with fewer members first)
  const sortedTeams = [...teams].sort((a, b) => {
    const aCount = a.members ? a.members.length : 0;
    const bCount = b.members ? b.members.length : 0;
    return aCount - bCount;
  });

  // Create a copy of unassigned students to work with
  const availableStudents = [...unassignedStudents];

  // Distribute students round-robin style
  let teamIndex = 0;
  let studentIndex = 0;

  while (
    studentIndex < availableStudents.length &&
    teamIndex < sortedTeams.length
  ) {
    const team = sortedTeams[teamIndex];
    const student = availableStudents[studentIndex];

    // Check if team can accept more students
    const currentMemberCount = team.members ? team.members.length : 0;
    if (currentMemberCount < maxPerTeam) {
      try {
        // Add student to team in database
        const updatedMembers = [...(team.members || []), student.id];

        const { error: teamUpdateError } = await supabase
          .from("Teams")
          .update({
            members: updatedMembers,
          })
          .eq("id", team.id);

        if (teamUpdateError) {
          throw teamUpdateError;
        }

        team.members = updatedMembers;
        assignedCount++;

        // Move to next student
        studentIndex++;

        // Check if team is now full
        if (team.members.length >= maxPerTeam) {
          teamsFilled++;
          teamIndex++; // Move to next team
        } else {
          // Continue with same team for next student
          teamIndex = (teamIndex + 1) % sortedTeams.length;
        }
      } catch (error) {
        console.error(
          `Error assigning student ${student.id} to team ${team.id}:`,
          error
        );
        // Skip this student and continue
        studentIndex++;
      }
    } else {
      // Team is full, move to next team
      teamIndex++;
    }

    // If we've gone through all teams but still have students, start over
    if (
      teamIndex >= sortedTeams.length &&
      studentIndex < availableStudents.length
    ) {
      teamIndex = 0;
    }
  }

  return {
    assigned: assignedCount,
    teamsFilled: teamsFilled,
    remaining: availableStudents.length - studentIndex,
  };
}

// Show fill teams result
function showFillTeamsResult(result: {
  assigned: number;
  teamsFilled: number;
  remaining: number;
}): void {
  let message = `Successfully assigned ${result.assigned} students to teams.`;

  if (result.teamsFilled > 0) {
    message += ` ${result.teamsFilled} teams reached the maximum size.`;
  }

  if (result.remaining > 0) {
    message += ` ${result.remaining} students remain unassigned (no available space in teams).`;
  }

  // Create result modal or use alert
  const resultModal = document.createElement("div");
  resultModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
    text-align: center;
  `;

  resultModal.innerHTML = `
    <h3 style="margin-bottom: 15px; color: var(--primary);">Fill Teams Complete</h3>
    <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
    <button class="btn btn-primary" onclick="this.closest('div').remove()">OK</button>
  `;

  // Add overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
  `;

  overlay.onclick = () => {
    resultModal.remove();
    overlay.remove();
  };

  document.body.appendChild(overlay);
  document.body.appendChild(resultModal);
}

declare global {
  function openTeamManagement(teamId: string | number): void;
  function deleteTeam(teamId: string | number): void;
  function openAssignStudentModal(studentId: string | number): void;
  function setAsCaptain(studentId: string | number): void;
  function removeMemberFromTeam(studentId: string | number): void;
  function addMemberFromModal(studentId: string | number): void;
  function addStudentToNewTeam(studentId: string | number): void;
  function removeStudentFromNewTeam(studentId: string | number): void;
  function selectTeamForAssignment(teamId: string | number): void;
  function removeCaptain(studentId: string | number): void;
  function addCaptainFromModal(studentId: string | number): void;
  function toggleTeamLock(): void;
  function openFillTeamsModal(): void;
  function closeFillTeamsModal(): void;
}

const lockButtonStyle = document.createElement("style");
lockButtonStyle.textContent = `
  .btn-warning {
    background: #f39c12;
    color: white;
  }
  .btn-warning:hover {
    background: #e67e22;
  }
`;

export async function exportTeamsPDF(
): Promise<void> {
const padAdmission = (value: number | null | undefined) =>
  value == null ? "-" : String(value).padStart(4, "0");

const formatGender = (value: string | null | undefined) => {
  if (!value) return "-";
  const v = value.toLowerCase();
  if (v === "m" || v === "male") return "Male";
  if (v === "f" || v === "female") return "Female";
  return value; // fallback for any unexpected value
};

  // ---- Fetch data ----
  const { data: teams, error: teamsError } = await supabase
    .from("Teams")
    .select("*");

  if (teamsError) throw teamsError;

  const { data: members, error: membersError } = await supabase
    .from("members")
    .select("*");

  if (membersError) throw membersError;

  // ---- Build member lookup ----
  const memberMap = new Map<number, any>();
  members.forEach((m: any) => memberMap.set(m.id, m));

  // ---- Track assigned members ----
  const assignedIds = new Set<number>();
  teams.forEach((t: any) => {
    if (Array.isArray(t.members)) {
      t.members.forEach((id: number) => assignedIds.add(id));
    }
  });

  const content: any[] = [];

  // ---- Title ----
  content.push({
    text: "Team Allocation Report",
    style: "title",
    margin: [0, 0, 0, 20]
  });

  // ---- Teams ----
  teams.forEach((team: any, index: number) => {
    content.push({
      text: `Team ${index + 1}: ${team.name || "Unnamed Team"}`,
      style: "teamHeader",
      margin: [0, 25, 0, 12]

    });

    const tableBody = [
   [
  { text: "S.No", style: "tableHeader" },
  { text: "Name", style: "tableHeader" },
  { text: "Department", style: "tableHeader" },
  { text: "Admission No", style: "tableHeader" },
  { text: "Gender", style: "tableHeader" }
]

    ];

   const teamMembers = (team.members || [])
  .map((id: number) => memberMap.get(id))
  .filter(Boolean)
  .sort((a: any, b: any) => {
    const aCap = team.captain === a.id || a.isCaptain === true;
    const bCap = team.captain === b.id || b.isCaptain === true;
    return Number(bCap) - Number(aCap); // captains first
  });

let serial = 1;

teamMembers.forEach((m: any) => {
  const isCaptain =
    team.captain === m.id || m.isCaptain === true;

  tableBody.push([
    { text: serial++, alignment: "center" },
    {
      text: isCaptain ? `${m.name} (Captain)` : m.name,
      bold: true
    },
    m.department || "-",
    padAdmission(m.admissionNumber),
    formatGender(m.gender)
  ]);
});


    content.push({
      table: {
        headerRows: 1,
widths: [30, "*", "*", "*", "*"],
        body: tableBody
      },
      layout: {
 fillColor: (rowIndex: number, node: any) => {
  if (rowIndex === 0) return "#eeeeee"; // header
  const row = node.table.body[rowIndex];
  if (row[1]?.text?.includes("(Captain)")) return "#fff3cd"; 
  return rowIndex % 2 === 0 ? "#fafafa" : null;
},

  hLineColor: "#dddddd",
  vLineColor: "#dddddd"
}

    });
  });

  content.push({
  canvas: [
    {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 515,
      y2: 0,
      lineWidth: 1,
      lineColor: "#cccccc"
    }
  ],
  margin: [0, 12, 0, 12]
});

  // ---- Unassigned Members ----
  content.push({
    text: "Unassigned Students",
    style: "teamHeader",
    margin: [0, 25, 0, 10],
    pageBreak: "before"
  });

  const unassignedBody = [
    [
      { text: "Name", style: "tableHeader" },
      { text: "Department", style: "tableHeader" },
      { text: "Admission No", style: "tableHeader" },
      { text: "Gender", style: "tableHeader" }
    ]
  ];

  members
    .filter((m: any) => !assignedIds.has(m.id))
    .forEach((m: any) => {
      unassignedBody.push([
        m.name || "-",
        m.department || "-",
padAdmission(m.admissionNumber),
formatGender(m.gender)
      ]);
    });

  content.push({
    table: {
      headerRows: 1,
      widths: ["*", "*", "*", "*"],
      body: unassignedBody
    },
    layout: "lightHorizontalLines"
  });

  // ---- Document definition ----
  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],
    content,
    styles: {
      title: {
        fontSize: 18,
        bold: true,
        alignment: "center"
      },
      teamHeader: {
        fontSize: 14,
        bold: true
      },
      tableHeader: {
        bold: true,
        fillColor: "#eeeeee"
      }
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 10, 0, 0]
    })
  };

  // ---- Generate PDF ----
  pdfMake.createPdf(docDefinition).download(
    "team-allocation-report.pdf"
  );
}


document.head.appendChild(lockButtonStyle);

(window as any).toggleTeamLock = toggleTeamLock;
(window as any).openTeamManagement = openTeamManagement;
(window as any).deleteTeam = deleteTeam;
(window as any).openAssignStudentModal = openAssignStudentModal;
(window as any).setAsCaptain = setAsCaptain;
(window as any).removeMemberFromTeam = removeMemberFromTeam;
(window as any).addMemberFromModal = addMemberFromModal;
(window as any).addStudentToNewTeam = addStudentToNewTeam;
(window as any).removeStudentFromNewTeam = removeStudentFromNewTeam;
(window as any).selectTeamForAssignment = selectTeamForAssignment;
(window as any).removeCaptain = removeCaptain;
(window as any).addCaptainFromModal = addCaptainFromModal;
(window as any).closeCreateTeamModal = closeCreateTeamModal;
(window as any).closeAddMemberModal = closeAddMemberModal;
(window as any).closeManageCaptainsModal = closeManageCaptainsModal;
(window as any).closeAssignStudentModal = closeAssignStudentModal;
(window as any).closeTeamManagementModal = closeTeamManagementModal;
(window as any).openFillTeamsModal = openFillTeamsModal;
(window as any).closeFillTeamsModal = closeFillTeamsModal;
(window as any).exportTeamsPDF = exportTeamsPDF;