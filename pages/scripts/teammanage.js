let allTeams = [];
let allStudents = [];
let currentEditingTeam = null;
let currentAssigningStudent = null;

document.addEventListener("DOMContentLoaded", function () {
  loadTeamsAndStudents();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById("teamSearch").addEventListener("input", function (e) {
    const query = e.target.value.toLowerCase();
    filterTeams(query);
  });

  document
    .getElementById("saveTeamChanges")
    .addEventListener("click", saveTeamChanges);
  document
    .getElementById("confirmAssignStudent")
    .addEventListener("click", confirmAssignStudent);
}

async function loadTeamsAndStudents() {
  try {
    const { data: teams, error: teamsError } = await supabase
      .from("Teams")
      .select("*");

    if (teamsError) {
      throw teamsError;
    }

    allTeams = teams
      ? teams.map((team) => ({
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
      ? students.map((student) => ({
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

function displayTeams() {
  const teamGrid = document.getElementById("teamGrid");

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

      return `
            <div class="team-card" data-team-id="${team.id}">
                <div class="team-card-header">
                    <div class="team-name">${
                      team.name || `Team ${team.id}`
                    }</div>
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
                        }')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

function displayUnassignedStudents() {
  const unassignedContainer = document.getElementById("unassignedStudents");
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
        <div class="unassigned-grid">
            ${unassignedStudents
              .map(
                (student) => `
                <div class="unassigned-student" onclick="openAssignStudentModal('${
                  student.id
                }')">
                    <div style="font-weight: 500;">${student.name}</div>
                    <div style="font-size: 11px; color: #666;">
                        ${getGenderSymbol(student.gender)} • ${
                  student.department || "Unknown"
                }
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function filterTeams(query) {
  const teamCards = document.querySelectorAll(".team-card");
  const searchTerm = query.toLowerCase();
  
  teamCards.forEach((card) => {
    const teamName = card.querySelector(".team-name").textContent.toLowerCase();
    const teamId = card.getAttribute("data-team-id");
    const team = allTeams.find(t => t.id == teamId);
    
    let hasMatchingStudent = false;
    
    if (team && team.members) {
      hasMatchingStudent = team.members.some(memberId => {
        const student = allStudents.find(s => s.id === memberId);
        return student && student.name.toLowerCase().includes(searchTerm);
      });
    }
    
    if (teamName.includes(searchTerm) || hasMatchingStudent) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}
function openTeamManagement(teamId) {
  currentEditingTeam = allTeams.find((team) => team.id === teamId);
  if (!currentEditingTeam) return;

  document.getElementById(
    "managementModalTitle"
  ).textContent = `Manage ${currentEditingTeam.name}`;

  document.getElementById("currentTeamHeader").innerHTML = `
        <input type="text" id="editingTeamName" value="${
          currentEditingTeam.name || `Team ${currentEditingTeam.id}`
        }" 
               class="team-name-input">
    `;

  const currentTeamMembersContainer =
    document.getElementById("currentTeamMembers");
  if (currentEditingTeam.members && currentEditingTeam.members.length > 0) {
    currentTeamMembersContainer.innerHTML = currentEditingTeam.members
      .map((memberId) => {
        const member = allStudents.find((s) => s.id === memberId);
        if (!member) return "";

        const isCaptain = currentEditingTeam.captain === memberId;

        return `
                <div class="member-item ${
                  isCaptain ? "captain-highlight" : ""
                }">
                    <div class="member-info">
                        <div class="member-name">
                            ${member.name}
                            ${
                              isCaptain
                                ? '<span class="captain-badge">👑 Captain</span>'
                                : ""
                            }
                        </div>
                        <div class="member-details">
                            ${
                              member.department || "Unknown Dept"
                            } • ${getGenderSymbol(member.gender)}
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

  const availableStudentsSection = document.getElementById(
    "availableStudentsSection"
  );
  if (availableStudentsSection) {
    availableStudentsSection.style.display = "none";
  }

  document.getElementById("addMemberBtn").onclick = openAddMemberModal;

  document.getElementById("teamManagementModal").classList.add("active");
  document.getElementById("saveTeamChanges").textContent = "Save Changes";
  document.getElementById("saveTeamChanges").onclick = saveTeamChanges;
  document.getElementById("discardTeamChanges").onclick =
    closeTeamManagementModal;
}
async function setAsCaptain(studentId) {
  if (!currentEditingTeam) return;
  console.log("Setting captain:", studentId, "Type:", typeof studentId);
  
  try {
    if (currentEditingTeam.captain) {
      const { error: removeCaptainError } = await supabase
        .from("members")
        .update({ 
          isCaptain: false 
        })
        .eq("id", currentEditingTeam.captain);

      if (removeCaptainError) {
        throw removeCaptainError;
      }
    }

    const { error } = await supabase
      .from("Teams")
      .update({ 
        captain: studentId 
      })
      .eq("id", currentEditingTeam.id);

    if (error) {
      throw error;
    }

    const { error: studentError } = await supabase
      .from("members")
      .update({ 
        isCaptain: true 
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


function removeMemberFromTeam(studentId) {
  if (!currentEditingTeam) return;

  console.log("Removing member:", studentId, "Type:", typeof studentId);
  console.log("Current team members:", currentEditingTeam.members);

  const memberIdToRemove =
    typeof currentEditingTeam.members[0] === "number"
      ? Number(studentId)
      : studentId;

  if (currentEditingTeam.captain === memberIdToRemove) {
    alert("Cannot remove the team captain. Please assign a new captain first.");
    return;
  }

  currentEditingTeam.members = currentEditingTeam.members.filter(
    (id) => id !== memberIdToRemove
  );

  console.log("Members after removal:", currentEditingTeam.members);

  openTeamManagement(currentEditingTeam.id);
}

function debugStudentIds() {
  console.log("Checking student IDs in current team:");
  currentEditingTeam.members.forEach((memberId, index) => {
    const student = allStudents.find((s) => s.id === memberId);
    console.log(`Member ${index}:`, {
      memberId: memberId,
      type: typeof memberId,
      existsInAllStudents: !!student,
      studentData: student,
    });
  });
}
async function saveTeamChanges() {
  if (!currentEditingTeam) return;

  try {
    const editingTeam = { ...currentEditingTeam };

    const teamNameInput = document.getElementById("editingTeamName");
    const newTeamName = teamNameInput
      ? teamNameInput.value.trim()
      : currentEditingTeam.name;

    if (!newTeamName) {
      alert("Please enter a team name");
      return;
    }

    console.log(
      "Updating team:",
      currentEditingTeam.id,
      "with name:",
      newTeamName
    );

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

    console.log("Team updated successfully, now updating students...");

    for (const memberId of editingTeam.members) {
      try {
        console.log("Updating student:", memberId);

        if (
          !memberId ||
          (typeof memberId !== "string" && typeof memberId !== "number")
        ) {
          console.warn("Invalid memberId:", memberId);
          continue;
        }

        const isCaptain = currentEditingTeam.captain === memberId;

        const { error: studentUpdateError } = await supabase
          .from("members")
          .update({
            teamId: currentEditingTeam.id,
            teamname: newTeamName,
            isCaptain: isCaptain,
          })
          .eq("id", memberId);

        if (studentUpdateError) {
          throw studentUpdateError;
        }

        console.log("Successfully updated student:", memberId);
      } catch (error) {
        console.error(`Error updating student ${memberId}:`, error);
      }
    }

    const previousTeamMembers = allStudents.filter(
      (student) => student.teamId === currentEditingTeam.id
    );
    for (const student of previousTeamMembers) {
      if (!currentEditingTeam.members.includes(student.id)) {
        try {
          console.log("Clearing assignment for student:", student.id);

          if (!student.id || typeof student.id !== "string") {
            console.warn("Invalid student.id:", student.id);
            continue;
          }

          const { error: clearError } = await supabase
            .from("members")
            .update({
              teamId: null,
              teamname: null,
              isCaptain: false,
            })
            .eq("id", student.id);

          if (clearError) {
            throw clearError;
          }

          console.log(
            "Successfully cleared assignment for student:",
            student.id
          );
        } catch (error) {
          console.error(
            `Error clearing assignment for student ${student.id}:`,
            error
          );
        }
      }
    }

    alert("Team changes saved successfully!");
    closeTeamManagementModal();
    loadTeamsAndStudents(); 
  } catch (error) {
    console.error("Error saving team changes:", error);
    console.error("Full error object:", error);
    alert("Error saving team changes. Please try again.");
  }
}
function closeTeamManagementModal() {
  document.getElementById("teamManagementModal").classList.remove("active");
  currentEditingTeam = null;
  loadTeamsAndStudents();
}
function openAddMemberModal() {
  if (!currentEditingTeam) return;

  populateAvailableStudentsList();

  document
    .getElementById("studentSearch")
    .addEventListener("input", function (e) {
      filterAvailableStudents(e.target.value);
    });

  document.getElementById("addMemberModal").classList.add("active");
}

function closeAddMemberModal() {
  document.getElementById("addMemberModal").classList.remove("active");
}

function populateAvailableStudentsList() {
  const availableStudentsList = document.getElementById(
    "availableStudentsList"
  );
  const currentMemberIds = new Set(currentEditingTeam.members || []);

  const availableStudents = allStudents.filter(
    (student) => !currentMemberIds.has(student.id)
  );

  if (availableStudents.length === 0) {
    availableStudentsList.innerHTML =
      '<div class="empty-state">No available students</div>';
    return;
  }

  availableStudentsList.innerHTML = availableStudents
    .map((student) => {
      const isInOtherTeam = allTeams.some(
        (team) =>
          team.id !== currentEditingTeam.id &&
          team.members &&
          team.members.includes(student.id)
      );

      return `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-name">
                        ${student.name}
                        ${
                          isInOtherTeam
                            ? '<span style="color: #f39c12; font-size: 10px;">(other team)</span>'
                            : ""
                        }
                    </div>
                    <div class="member-details">
                        ${
                          student.department || "Unknown Dept"
                        } • ${getGenderSymbol(student.gender)} • ${
        student.email || "No email"
      }
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

function filterAvailableStudents(query) {
  const studentItems = document.querySelectorAll(
    "#availableStudentsList .member-item"
  );
  const searchTerm = query.toLowerCase();

  studentItems.forEach((item) => {
    const studentName = item
      .querySelector(".member-name")
      .textContent.toLowerCase();
    if (studentName.includes(searchTerm)) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });
}
document.getElementById("addMemberBtn").onclick = openAddMemberModal;
function addMemberFromModal(studentId) {
  if (!currentEditingTeam) return;

  const memberId = parseInt(studentId);

  console.log("Adding member:", memberId, "Type:", typeof memberId);

  if (!currentEditingTeam.members) {
    currentEditingTeam.members = [];
  }

  if (currentEditingTeam.members.includes(memberId)) {
    console.log("Member already in team");
    return;
  }

  currentEditingTeam.members.push(memberId);

  console.log("Updated members:", currentEditingTeam.members);

  closeAddMemberModal();
  openTeamManagement(currentEditingTeam.id);
}
const style = document.createElement("style");
style.textContent = `
    .captain-highlight {
        background-color: #fff3cd !important;
        border-left: 3px solid #ffc107 !important;
    }
    .captain-badge {
        background: #ffc107;
        color: #856404;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        margin-left: 8px;
        font-weight: bold;
    }
    .member-info {
        flex: 1;
    }
    .member-name {
        font-weight: 500;
        display: flex;
        align-items: center;
    }
    .member-details {
        font-size: 11px;
        color: #666;
        margin-top: 2px;
    }
    .member-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
    }
    .member-actions {
        display: flex;
        gap: 5px;
    }
    .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

const modalStyles = `
    .empty-state {
        padding: 40px 20px;
        text-align: center;
        color: #666;
        font-style: italic;
    }
    
    .team-name-input {
        border: 2px solid #ddd;
        padding: 12px;
        border-radius: 6px;
        width: 100%;
        font-size: 16px;
        font-weight: 600;
    }
    
    .team-name-input:focus {
        border-color: #007bff;
        outline: none;
    }
    
    .captain-label {
        color: #856404;
        font-weight: 600;
        font-size: 12px;
    }
`;

if (!document.getElementById("modal-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "modal-styles";
  styleSheet.textContent = modalStyles;
  document.head.appendChild(styleSheet);
}

function addMemberToTeam(studentId) {
  if (!currentEditingTeam) return;

  if (!currentEditingTeam.members) {
    currentEditingTeam.members = [];
  }

  currentEditingTeam.members.push(studentId);

  const memberElement = document
    .querySelector(`[onclick="addMemberToTeam('${studentId}')"]`)
    .closest(".member-item");
  memberElement.remove();

  const student = allStudents.find((s) => s.id === studentId);
  if (student) {
    const currentContainer = document.getElementById("currentTeamMembers");
    const newMemberElement = document.createElement("div");
    newMemberElement.className = "member-item";
    newMemberElement.innerHTML = `
            <span>${student.name}</span>
            <button class="btn btn-sm btn-danger" onclick="removeMemberFromTeam('${student.id}')">Remove</button>
        `;
    currentContainer.appendChild(newMemberElement);
  }
}

function openAssignStudentModal(studentId) {
  currentAssigningStudent = studentId;
  const student = allStudents.find((s) => s.id === studentId);

  if (!student) return;

  document.getElementById(
    "managementModalTitle"
  ).textContent = `Assign ${student.name} to Team`;

  const teamSelect = document.getElementById("teamSelect");
  teamSelect.innerHTML =
    '<option value="">Choose a team...</option>' +
    allTeams
      .map(
        (team) => `
            <option value="${team.id}">${
          team.name || `Team ${team.id}`
        }</option>
        `
      )
      .join("");

  document.getElementById("assignStudentModal").classList.add("active");
}

function closeAssignStudentModal() {
  document.getElementById("assignStudentModal").classList.remove("active");
  currentAssigningStudent = null;
}

async function confirmAssignStudent() {
  if (!currentAssigningStudent) return;

  const teamSelect = document.getElementById("teamSelect");
  const teamId = teamSelect.value;

  if (!teamId) {
    alert("Please select a team");
    return;
  }

  try {
    const team = allTeams.find((t) => t.id === teamId);

    if (!team) return;

    const updatedMembers = [...(team.members || []), currentAssigningStudent];

    const { error: teamUpdateError } = await supabase
      .from("Teams")
      .update({
        members: updatedMembers,
      })
      .eq("id", teamId);

    if (teamUpdateError) {
      throw teamUpdateError;
    }

    const { error: studentUpdateError } = await supabase
      .from("members")
      .update({
        teamId: teamId,
        teamname: team.name,
      })
      .eq("id", currentAssigningStudent);

    if (studentUpdateError) {
      throw studentUpdateError;
    }

    alert("Student assigned to team successfully!");
    closeAssignStudentModal();
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error assigning student:", error);
    alert("Error assigning student to team. Please try again.");
  }
}

async function deleteTeam(teamId) {
  if (
    !confirm(
      "Are you sure you want to delete this team? This will remove all team assignments for its members."
    )
  ) {
    return;
  }

  try {
    const team = allTeams.find((t) => t.id === teamId);
    if (team && team.members) {
      for (const memberId of team.members) {
        await supabase
          .from("members")
          .update({
            teamId: null,
            teamname: null,
          })
          .eq("id", memberId);
      }
    }

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

function getGenderSymbol(gender) {
  const genderStr = String(gender).toUpperCase();
  if (genderStr === "M") return "M";
  if (genderStr === "F") return "F";
  return "O";
}

//NEW TEAM AREA

document
  .getElementById("createTeamBtn")
  .addEventListener("click", openCreateTeamModal);
document
  .getElementById("confirmCreateTeam")
  .addEventListener("click", confirmCreateTeam);
function openCreateTeamModal() {
  document.getElementById("createTeamModal").classList.add("active");
  populateAllStudentsList();
  document.getElementById("newTeamName").value = "";
  document.getElementById("newTeamMembers").innerHTML =
    '<div style="padding: 20px; text-align: center; color: #666;">No members selected</div>';
  document.getElementById("teamCaptainSelect").innerHTML =
    '<option value="">Select captain...</option>';
}

function closeCreateTeamModal() {
  document.getElementById("createTeamModal").classList.remove("active");
}

function populateAllStudentsList() {
  const allStudentsList = document.getElementById("allStudentsList");
  allStudentsList.innerHTML = allStudents
    .map((student) => {
      const isInOtherTeam = allTeams.some(
        (team) => team.members && team.members.includes(student.id)
      );

      return `
            <div class="member-item">
                <span>
                    ${student.name}
                    ${
                      isInOtherTeam
                        ? '<span style="color: #f39c12; font-size: 10px;">(other team)</span>'
                        : ""
                    }
                </span>
                <button class="btn btn-sm btn-primary" onclick="addStudentToNewTeam('${
                  student.id
                }')">Add</button>
            </div>
        `;
    })
    .join("");
}

function addStudentToNewTeam(studentId) {
  const student = allStudents.find((s) => s.id === studentId);
  if (!student) return;

  const newTeamMembers = document.getElementById("newTeamMembers");
  const currentContent = newTeamMembers.innerHTML;

  if (currentContent.includes("No members selected")) {
    newTeamMembers.innerHTML = "";
  }

  const memberElement = document.createElement("div");
  memberElement.className = "member-item";
  memberElement.innerHTML = `
        <span>${student.name}</span>
        <button class="btn btn-sm btn-danger" onclick="removeStudentFromNewTeam('${student.id}')">Remove</button>
    `;
  newTeamMembers.appendChild(memberElement);

  const captainSelect = document.getElementById("teamCaptainSelect");
  if (
    !Array.from(captainSelect.options).some((opt) => opt.value === studentId)
  ) {
    const option = document.createElement("option");
    option.value = studentId;
    option.textContent = student.name;
    captainSelect.appendChild(option);
  }

  const studentElement = document
    .querySelector(`[onclick="addStudentToNewTeam('${studentId}')"]`)
    .closest(".member-item");
  studentElement.remove();
}

function removeStudentFromNewTeam(studentId) {
  const student = allStudents.find((s) => s.id === studentId);
  if (!student) return;

  const memberElement = document
    .querySelector(`[onclick="removeStudentFromNewTeam('${studentId}')"]`)
    .closest(".member-item");
  memberElement.remove();

  const allStudentsList = document.getElementById("allStudentsList");
  const isInOtherTeam = allTeams.some(
    (team) => team.members && team.members.includes(studentId)
  );

  const studentElement = document.createElement("div");
  studentElement.className = "member-item";
  studentElement.innerHTML = `
        <span>
            ${student.name}
            ${
              isInOtherTeam
                ? '<span style="color: #f39c12; font-size: 10px;">(other team)</span>'
                : ""
            }
        </span>
        <button class="btn btn-sm btn-primary" onclick="addStudentToNewTeam('${
          student.id
        }')">Add</button>
    `;
  allStudentsList.appendChild(studentElement);

  const captainSelect = document.getElementById("teamCaptainSelect");
  const optionToRemove = Array.from(captainSelect.options).find(
    (opt) => opt.value === studentId
  );
  if (optionToRemove) {
    captainSelect.removeChild(optionToRemove);
  }

  if (document.getElementById("newTeamMembers").children.length === 0) {
    document.getElementById("newTeamMembers").innerHTML =
      '<div style="padding: 20px; text-align: center; color: #666;">No members selected</div>';
  }
}

async function confirmCreateTeam() {
  const teamName = document.getElementById("newTeamName").value.trim();
  const captainId = document.getElementById("teamCaptainSelect").value;
  const newTeamMembers = Array.from(
    document.querySelectorAll("#newTeamMembers .member-item")
  ).map((item) => {
    const removeButton = item.querySelector("button");
    return removeButton.getAttribute("onclick").match(/'([^']+)'/)[1];
  });

  if (!teamName) {
    alert("Please enter a team name");
    return;
  }

  if (newTeamMembers.length === 0) {
    alert("Please add at least one member to the team");
    return;
  }

  if (!captainId) {
    alert("Please select a team captain");
    return;
  }

  try {
    const now = new Date().toISOString();
    const teamData = {
      name: teamName,
      members: newTeamMembers,
      captain: captainId,
    };

    const { data: newTeam, error: insertError } = await supabase
      .from("Teams")
      .insert(teamData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    for (const studentId of newTeamMembers) {
      await supabase
        .from("members")
        .update({
          teamId: newTeam.id,
          teamname: teamName,
          updatedAt: now,
        })
        .eq("id", studentId);
    }

    await supabase
      .from("members")
      .update({
        isCaptain: true,
                  teamName: teamName,
        
      })
      .eq("id", captainId);

    alert("Team created successfully!");
    closeCreateTeamModal();
    loadTeamsAndStudents();
  } catch (error) {
    console.error("Error creating team:", error);
    alert("Error creating team. Please try again.");
  }
}
