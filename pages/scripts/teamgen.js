let generatedTeams = [];
let allStudents = [];
const supabase = window.supabase;

document.addEventListener("DOMContentLoaded", function () {
  loadStudents();
  setupEventListeners();
  setupCaptainModal(); // Add this line
});

function setupEventListeners() {
  document
    .getElementById("generateBtn")
    .addEventListener("click", generateTeams);
  document.getElementById("resetBtn").addEventListener("click", resetSettings);
  document.getElementById("publishBtn").addEventListener("click", publishTeams);
  document.getElementById("editCaptainsBtn").addEventListener("click", openCaptainEditor); // Add this line

  const teamSizeSlider = document.getElementById("teamSize");
  const teamSizeValue = document.getElementById("teamSizeValue");
  teamSizeSlider.addEventListener("input", (e) => {
    teamSizeValue.textContent = e.target.value;
    updateSummary();
  });

  document.getElementById("mixBranches").addEventListener("change", (e) => {
    if (e.target.checked) document.getElementById("sameBranch").checked = false;
    updateSummary();
  });
  document.getElementById("sameBranch").addEventListener("change", (e) => {
    if (e.target.checked)
      document.getElementById("mixBranches").checked = false;
    updateSummary();
  });

  document.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("change", updateSummary);
  });
}

// Add this new function to set up captain modal
function setupCaptainModal() {
  document.getElementById("closeModalBtn").addEventListener("click", closeCaptainEditor);
  document.getElementById("addCaptainBtn").addEventListener("click", addNewCaptain);
  document.getElementById("saveCaptainsBtn").addEventListener("click", saveCaptainChanges);
}

async function loadStudents() {
  try {
    showLoading(true);

    const { data: students, error } = await supabase
      .from("members")
      .select("*");

    if (error) {
      throw error;
    }

    allStudents = students
      ? students.map((student) => ({
          id: student.id,
          ...student,
        }))
      : [];

    updateSummary();
    console.log(`Loaded ${allStudents.length} students`);
  } catch (error) {
    console.error("Error loading students:", error);
    alert("Error loading student data");
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  const teamPreviewContainer = document.getElementById("teamPreviewContainer");

  if (show) {
    loadingIndicator.style.display = "block";
    teamPreviewContainer.style.display = "none";
  } else {
    loadingIndicator.style.display = "none";
    teamPreviewContainer.style.display = "block";
  }
}

function generateTeams() {
  if (allStudents.length === 0) {
    alert("No students loaded. Please wait or refresh the page.");
    return;
  }

  const teamSize = parseInt(document.getElementById("teamSize").value);
  const minMale = parseInt(document.getElementById("minMale").value) || 0;
  const minFemale = parseInt(document.getElementById("minFemale").value) || 0;
  const mixBranches = document.getElementById("mixBranches").checked;
  const mixSections = document.getElementById("mixSections").checked;

  if (allStudents.length < teamSize) {
    alert(
      `Not enough students (${allStudents.length}) for team size of ${teamSize}`
    );
    return;
  }

  let teams = generateBalancedTeams(
    teamSize,
    minMale,
    minFemale,
    mixBranches,
    mixSections
  );

  generatedTeams = teams;
  displayTeamPreview(teams);
  updatePublishButton();
}

function generateBalancedTeams(
  teamSize,
  minMale,
  minFemale,
  mixBranches,
  mixSections
) {
  const sameBranchOnly = document.getElementById("sameBranch").checked;

  const captains = allStudents.filter((s) => s.isCaptain === true);
  const regularStudents = allStudents.filter((s) => s.isCaptain !== true);

  console.log(
    `Found ${captains.length} captains and ${regularStudents.length} regular students`
  );

  if (captains.length === 0) {
    alert(
      "No captains found! Please mark some students as captains before generating teams."
    );
    return [];
  }

  let teams = captains.map((captain, index) => ({
    id: index + 1,
    name: `Team ${index + 1}`,
    members: [captain],
    captain: captain.id,
    published: false,
  }));

  teams.forEach((team) => {
    const captain = team.members[0];
    const captainDept = captain.department || "Unknown";

    let availableStudents = regularStudents.filter(
      (student) => !teams.flatMap((t) => t.members).includes(student)
    );

    if (sameBranchOnly) {
      availableStudents = availableStudents.filter(
        (student) => student.department === captainDept
      );
    }

    let currentMaleCount = team.members.filter(
      (m) => String(m.gender).toUpperCase() === "M"
    ).length;
    let currentFemaleCount = team.members.filter(
      (m) => String(m.gender).toUpperCase() === "F"
    ).length;

    while (
      currentMaleCount < minMale &&
      team.members.length < teamSize &&
      availableStudents.length > 0
    ) {
      const maleStudent = availableStudents.find(
        (s) => String(s.gender).toUpperCase() === "M"
      );
      if (maleStudent) {
        team.members.push(maleStudent);
        availableStudents = availableStudents.filter((s) => s !== maleStudent);
        currentMaleCount++;
      } else {
        console.warn(
          `Not enough male students in ${captainDept} department for ${team.name}`
        );
        break;
      }
    }

    while (
      currentFemaleCount < minFemale &&
      team.members.length < teamSize &&
      availableStudents.length > 0
    ) {
      const femaleStudent = availableStudents.find(
        (s) => String(s.gender).toUpperCase() === "F"
      );
      if (femaleStudent) {
        team.members.push(femaleStudent);
        availableStudents = availableStudents.filter(
          (s) => s !== femaleStudent
        );
        currentFemaleCount++;
      } else {
        console.warn(
          `Not enough female students in ${captainDept} department for ${team.name}`
        );
        break;
      }
    }
  });

  let allAssignedStudents = teams.flatMap((t) => t.members);
  let remainingStudents = [...regularStudents].filter(
    (student) => !allAssignedStudents.includes(student)
  );

  let maxIterations = teams.length * 50;
  let iterations = 0;
  let changed = true;

  while (
    remainingStudents.length > 0 &&
    changed &&
    iterations < maxIterations
  ) {
    changed = false;

    for (let team of teams) {
      if (remainingStudents.length === 0) break;
      if (team.members.length >= teamSize) continue;

      const captain = team.members.find((m) => m.isCaptain === true);
      const captainDept = captain ? captain.department : "Unknown";

      const suitableStudentIndex = remainingStudents.findIndex((student) => {
        const studentDept = student.department || "Unknown";
        return !sameBranchOnly || captainDept === studentDept;
      });

      if (suitableStudentIndex !== -1) {
        const student = remainingStudents[suitableStudentIndex];
        team.members.push(student);
        remainingStudents.splice(suitableStudentIndex, 1);
        changed = true;
      }
    }

    iterations++;
  }

  console.log("Unassigned students:", remainingStudents.length);

  return teams;
}

function generateRandomTeams(teamSize) {
  const shuffledStudents = [...allStudents].sort(() => Math.random() - 0.5);
  const teamCount = Math.ceil(shuffledStudents.length / teamSize);
  const teams = [];

  for (let i = 0; i < teamCount; i++) {
    const start = i * teamSize;
    const end = start + teamSize;
    const members = shuffledStudents.slice(start, end);

    teams.push({
      id: i + 1,
      name: `Team ${i + 1}`,
      members: members,
      published: false,
    });
  }

  return teams;
}

function generateSkillBasedTeams(teamSize) {
  alert("Skill-based team generation will be available in a future update");
  return generateBalancedTeams(teamSize, 0, 0, true, true);
}

function assignCaptains(teams, captainMethod) {
  return teams.map((team) => {
    const captain = team.members.find((member) => member.isCaptain === true);
    if (captain) {
      return { ...team, captain: captain.id };
    }
    return team;
  });
}

function displayTeamPreview(teams) {
  const container = document.getElementById("teamPreviewContainer");

  if (teams.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <p>No teams generated yet.<br>Configure settings above and click "Generate Teams".</p>
            </div>
        `;
    return;
  }

  const unassignedStudents = allStudents.filter(
    (student) => !teams.flatMap((team) => team.members).includes(student)
  );

  const captainsWithoutTeams = allStudents.filter(
    (student) =>
      student.isCaptain === true &&
      !teams.flatMap((team) => team.members).includes(student)
  );

  let html = `
        <div class="preview-header" style="margin-bottom: 15px;">
            <div>
                <strong>Generated ${teams.length} teams</strong>
                <span style="font-size: 12px; color: var(--text-light); margin-left: 10px;">
                    ${unassignedStudents.length} students not assigned
                </span>
            </div>
            <div style="font-size: 12px; color: var(--text-light); display: flex; gap: 15px; align-items: center;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="color: #3498db; font-weight: bold;">M</span> Male
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="color: #e91e63; font-weight: bold;">F</span> Female
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="color: #9b59b6; font-weight: bold;">O</span> Other
                </div>
            </div>
        </div>
    `;

  if (captainsWithoutTeams.length > 0) {
    html += `
            <div class="card" style="background: #f8d7da; border-color: #f5c6cb; margin-bottom: 15px;">
                <strong>⚠️ ${
                  captainsWithoutTeams.length
                } Captains Without Teams:</strong>
                <div style="margin-top: 8px; font-size: 13px;">
                    ${captainsWithoutTeams.map((s) => s.name).join(", ")}
                </div>
                <small style="color: #721c24;">These students are marked as captains but are not in any team.</small>
            </div>
        `;
  }

  if (unassignedStudents.length > 0 && captainsWithoutTeams.length === 0) {
    html += `
            <div class="card" style="background: #fff3cd; border-color: #ffeaa7; margin-bottom: 15px;">
                <strong>⚠️ ${
                  unassignedStudents.length
                } Students Not Assigned:</strong>
                <div style="margin-top: 8px; font-size: 13px;">
                    ${unassignedStudents
                      .map(
                        (s) => `
                        <span style="display: inline-block; margin: 2px 4px 2px 0; padding: 2px 6px; border-radius: 4px; font-size: 11px; background: ${getGenderColor(
                          s.gender
                        )}; color: white;">
                            ${s.name} (${getGenderSymbol(s.gender)})
                        </span>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  html += `<div class="team-preview-grid">`;

  teams.forEach((team) => {
    const maleCount = team.members.filter(
      (m) => String(m.gender).toUpperCase() === "M"
    ).length;
    const femaleCount = team.members.filter(
      (m) => String(m.gender).toUpperCase() === "F"
    ).length;
    const otherCount = team.members.length - maleCount - femaleCount;
    const captain = team.members.find((m) => m.id === team.captain);
    const isExistingCaptain = captain && captain.isCaptain === true;

    html += `
            <div class="team-preview-card">
                <div class="team-name">
                    <span>${team.name}</span>
                    <span class="status-badge status-draft">Draft</span>
                </div>
                <div class="team-stats">
                    <span>${team.members.length} members</span>
                    <span style="display: flex; gap: 8px;">
                        <span style="color: #3498db;">${maleCount}M</span>
                        <span style="color: #e91e63;">${femaleCount}F</span>
                        ${
                          otherCount > 0
                            ? `<span style="color: #9b59b6;">${otherCount}O</span>`
                            : ""
                        }
                    </span>
                </div>
                <div class="team-members">
                    ${team.members
                      .map((member) => {
                        const genderSymbol = getGenderSymbol(member.gender);
                        const genderColor = getGenderColor(member.gender);
                        const isCaptain = team.captain === member.id;
                        const isExistingCaptainFlag = member.isCaptain === true;

                        return `
                        <div class="member-item" style="border-left: 3px solid ${genderColor}; padding-left: 8px;">
                            <span>
                                ${member.name}
                                <span style="color: ${genderColor}; font-weight: bold; margin-left: 5px;">
                                    ${genderSymbol}
                                </span>
                            </span>
                            ${
                              isCaptain
                                ? `<span class="member-badge captain">${
                                    isExistingCaptainFlag
                                      ? "Team Captain"
                                      : "Assigned Captain"
                                  }</span>`
                                : isExistingCaptainFlag
                                ? '<span class="member-badge" style="background: #ffc107; color: #000;">Captain Role</span>'
                                : '<span class="member-badge">' +
                                  (member.department || "Unknown") +
                                  "</span>"
                            }
                        </div>
                    `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function getGenderSymbol(gender) {
  const genderStr = String(gender).toUpperCase();
  if (genderStr === "M") return "M";
  if (genderStr === "F") return "F";
  return "O";
}

function getGenderColor(gender) {
  const genderStr = String(gender).toUpperCase();
  if (genderStr === "M") return "#3498db";
  if (genderStr === "F") return "#e91e63";
  return "#9b59b6";
}

async function publishTeams() {
  if (generatedTeams.length === 0) {
    alert("No teams to publish. Please generate teams first.");
    return;
  }

  if (!confirm(`Publish ${generatedTeams.length} teams to students?`)) {
    return;
  }

  try {
    console.log("Clearing existing team assignments...");
    
    const publishBtn = document.getElementById("publishBtn");
    const originalText = publishBtn.textContent;
    publishBtn.textContent = "Publishing...";
    publishBtn.disabled = true;

    console.log("Clearing existing team assignments...");
    const { error: clearError } = await supabase
      .from("members")
      .update({ teamId: null , teamname: null})
      .not("teamId", "is", null);

    if (clearError) {
      throw clearError;
    }

    console.log("Deleting existing teams...");
    const { error: deleteError } = await supabase
      .from("Teams")
      .delete()
      .gte("id", 0);

    if (deleteError) {
      throw deleteError;
    }

    console.log("Inserting new teams...");
    const teamsToInsert = generatedTeams.map((team) => ({
      id: team.id.toString(),
      name: team.name,
      members: team.members.map((m) => m.id),
      captain: team.captain,
    }));

    const { data, error: insertError } = await supabase
      .from("Teams")
      .insert(teamsToInsert);

    if (insertError) {
      throw insertError;
    }

    console.log("Updating student team assignments...");
    const studentUpdates = [];
    for (const team of generatedTeams) {
      for (const member of team.members) {
        studentUpdates.push(
          supabase
            .from("members")
            .update({ teamId: team.id, teamname: team.name })
            .eq("id", member.id)
        );
      }
    }
    
    await Promise.all(studentUpdates);
    console.log("All student updates completed");

    alert(`Successfully published ${generatedTeams.length} teams!`);
    publishBtn.textContent = originalText;

    document.getElementById("publishBtn").disabled = true;
    displayTeamPreview(
      generatedTeams.map((team) => ({ ...team, published: true }))
    );
    
  } catch (error) {
    console.error("Error publishing teams:", error);
    publishBtn.textContent = originalText;
    publishBtn.disabled = false;
    alert("Error publishing teams. Please try again.");
  }
}

function resetSettings() {
  if (!confirm("Reset all settings to default?")) return;

  document.getElementById("teamSize").value = 4;
  document.getElementById("teamSizeValue").textContent = "4";
  document.getElementById("minMale").value = "0";
  document.getElementById("minFemale").value = "0";
  document.getElementById("mixBranches").checked = true;
  document.getElementById("sameBranch").checked = false;
  document.getElementById("mixSections").checked = true;

  generatedTeams = [];
  displayTeamPreview([]);
  updatePublishButton();
  updateSummary();
}

function updatePublishButton() {
  const publishBtn = document.getElementById("publishBtn");
  publishBtn.disabled = generatedTeams.length === 0;
}

function updateSummary() {
  const totalStudents = allStudents.length;
  const teamSize = parseInt(document.getElementById("teamSize").value);
  const estimatedTeams = Math.ceil(totalStudents / teamSize);

  document.getElementById("summarySize").textContent = teamSize + " members";

  const minM = document.getElementById("minMale").value || 0;
  const minF = document.getElementById("minFemale").value || 0;
  document.getElementById("summaryGender").textContent =
    minM > 0 || minF > 0 ? `Min ${minM}M / ${minF}F` : "No constraints";

  const sameBranch = document.getElementById("sameBranch").checked;
  document.getElementById("summaryBranch").textContent = sameBranch
    ? "Same department only"
    : "Mixed departments";

  document.getElementById(
    "summaryTeams"
  ).textContent = `${estimatedTeams} teams (est.)`;
}

// CAPTAIN FUNCTIONS

function openCaptainEditor() {
  const modal = document.getElementById("captainModal");
  modal.style.display = "flex";
  loadCaptainEditor();
}

function closeCaptainEditor() {
  const modal = document.getElementById("captainModal");
  modal.style.display = "none";
}

async function loadCaptainEditor() {
  if (allStudents.length === 0) {
    showLoading(true);
    setTimeout(() => {
      if (allStudents.length > 0) {
        showLoading(false);
        loadCaptainEditorContent();
      }
    }, 1000);
    return;
  }

  loadCaptainEditorContent();
}

function loadCaptainEditorContent() {
  const currentCaptains = allStudents.filter((s) => s.isCaptain === true);
  const currentCaptainsList = document.getElementById("currentCaptainsList");

  if (currentCaptains.length === 0) {
    currentCaptainsList.innerHTML =
      '<p style="color: #666; font-style: italic;">No captains yet</p>';
  } else {
    currentCaptainsList.innerHTML = currentCaptains
      .map((student) => {
        const genderSymbol = getGenderSymbol(student.gender);
        const genderColor = getGenderColor(student.gender);

        return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
          <div>
            <div style="font-weight: 500;">${student.name}</div>
            <div style="font-size: 12px; color: #666;">
              <span style="color: ${genderColor}; font-weight: bold;">${genderSymbol}</span> • 
              ${student.department || "Unknown"}
            </div>
          </div>
          <button class="btn" onclick="removeCaptain('${
            student.id
          }')" style="background: #e74c3c; color: white; padding: 4px 8px; font-size: 12px;">Remove</button>
        </div>
      `;
      })
      .join("");
  }

  const nonCaptains = allStudents
    .filter((s) => s.isCaptain !== true)
    .sort((a, b) => a.name.localeCompare(b.name));

  const studentSelect = document.getElementById("studentSelect");
  studentSelect.innerHTML =
    '<option value="">Select a student...</option>' +
    nonCaptains
      .map((student) => {
        const genderSymbol = getGenderSymbol(student.gender);
        return `<option value="${student.id}">${student.name} (${student.department}) ${genderSymbol}</option>`;
      })
      .join("");
}

async function addNewCaptain() {
  const studentSelect = document.getElementById("studentSelect");
  const studentId = studentSelect.value;

  if (!studentId) {
    alert("Please select a student first!");
    return;
  }

  const student = allStudents.find((s) => s.id === parseInt(studentId));
  // Check if already a captain
  if (student.isCaptain === true) {
    alert("This student is already a captain!");
    return;
  }

  try {
    // Update in database immediately
    const { error } = await supabase
      .from("members")
      .update({ 
        isCaptain: true,
      })
      .eq("id", studentId);

    if (error) throw error;

    // Update local state
    student.isCaptain = true;
    
    // Refresh the modal display
    loadCaptainEditorContent();
    studentSelect.value = "";
    
    console.log(`Added ${student.name} as captain`);
    
  } catch (error) {
    console.error("Error adding captain:", error);
    alert("Error adding captain. Please try again.");
  }
}
async function removeCaptain(studentId) {
  const student = allStudents.find((s) => s.id === studentId);
  if (student) {
    try {
      // Update in database immediately
      const { error } = await supabase
        .from("members")
        .update({ 
          isCaptain: false,
        })
        .eq("id", studentId);

      if (error) throw error;

      // Update local state
      student.isCaptain = false;
      loadCaptainEditorContent();
      
    } catch (error) {
      console.error("Error removing captain:", error);
      alert("Error removing captain. Please try again.");
    }
  }
}

async function saveCaptainChanges() {
  try {
    const now = new Date().toISOString();
    const updates = [];

    for (const student of allStudents) {
      updates.push(
        supabase
          .from("members")
          .update({
            isCaptain: student.isCaptain === true,
          })
          .eq("id", student.id)
      );
    }

    await Promise.all(updates);
    alert("Captain changes saved successfully!");
    closeCaptainEditor();

    // Reload students to get fresh data
    await loadStudents();
  } catch (error) {
    console.error("Error saving captain changes:", error);
    alert("Error saving changes. Please try again.");
  }
}