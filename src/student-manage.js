let allStudents = [];
let currentPage = 1;
const studentsPerPage = 10;
let filteredStudents = [];

document.addEventListener("DOMContentLoaded", function () {
  loadStudents();
  setupEventListeners();
});

function setupEventListeners() {
  document
    .getElementById("studentSearch")
    .addEventListener("input", function (e) {
      filterStudents();
    });

  document
    .getElementById("filterBranch")
    .addEventListener("change", filterStudents);
  document
    .getElementById("filterSection")
    .addEventListener("change", filterStudents);
  document
    .getElementById("filterGender")
    .addEventListener("change", filterStudents);
  document
    .getElementById("filterStatus")
    .addEventListener("change", filterStudents);
}
let currentEditingStudentId = null;



async function loadStudents() {
  try {
    document.getElementById("loadingScreen").style.display = "flex";

    const { data: students, error } = await supabase
      .from("members")
      .select("*")
      .order("name");

    if (error) {
      throw error;
    }

    allStudents = students || [];
    filteredStudents = [...allStudents];

    updateStats();
    displayStudents();
  } catch (error) {
    console.error("Error loading students:", error);
    alert("Error loading student data");
  } finally {
    document.getElementById("loadingScreen").style.display = "none";
  }
}

function updateStats() {
  const totalStudents = allStudents.length;
  const assignedStudents = allStudents.filter((s) => s.teamId).length;
  const unassignedStudents = totalStudents - assignedStudents;
  const captainCount = allStudents.filter((s) => s.isCaptain).length;

  document.getElementById("totalStudents").textContent = totalStudents;
  document.getElementById("assignedStudents").textContent = assignedStudents;
  document.getElementById("unassignedStudents").textContent =
    unassignedStudents;
  document.getElementById("captainCount").textContent = captainCount;
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const branchFilter = document.getElementById('filterBranch').value;
    const sectionFilter = document.getElementById('filterSection').value;
    const genderFilter = document.getElementById('filterGender').value;
    const statusFilter = document.getElementById('filterStatus').value;

    filteredStudents = allStudents.filter(student => {
        const matchesSearch = !searchTerm || 
            student.name.toLowerCase().includes(searchTerm) ||
            String(student.admissionNumber).toLowerCase().includes(searchTerm) || 
            student.email?.toLowerCase().includes(searchTerm);

        const matchesBranch = !branchFilter || student.department === branchFilter;
        const matchesSection = !sectionFilter || student.section === sectionFilter;
        const matchesGender = !genderFilter || 
            (genderFilter === 'male' && student.gender === 'M') ||
            (genderFilter === 'female' && student.gender === 'F') ||
            (genderFilter === 'other' && student.gender !== 'M' && student.gender !== 'F');
        const matchesStatus = !statusFilter ||
            (statusFilter === 'assigned' && student.teamId) ||
            (statusFilter === 'unassigned' && !student.teamId) ||
            (statusFilter === 'captain' && student.isCaptain);

        return matchesSearch && matchesBranch && matchesSection && matchesGender && matchesStatus;
    });

    currentPage = 1;
    displayStudents();
}

function displayStudents() {
  displayDesktopTable();
  displayMobileCards();
  updatePagination();
}

function displayDesktopTable() {
  const tableBody = document.getElementById("studentTableBody");
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  if (paginatedStudents.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    No students found matching your criteria
                </td>
            </tr>
        `;
    return;
  }

  tableBody.innerHTML = paginatedStudents
    .map((student) => {
const teamBadge = student.teamid ? 
    `<span class="badge badge-assigned">${student.teamname || student.teamId}</span>` : 
    `<span class="badge badge-unassigned">Unassigned</span>`;

      const captainBadge = student.isCaptain
        ? '<span class="badge badge-captain">Captain</span>'
        : "";

      return `
            <tr data-student-id="${student.id}">
                <td>
                    <div class="student-info">
                        <div>
                            <div class="student-name">${student.name}</div>
                            <div class="student-email">${
                              student.email || "No email"
                            }</div>
                        </div>
                    </div>
                </td>
                <td>${student.admissionNumber || "N/A"}</td>
                <td><span class="badge badge-branch">${
                  student.department || "Unknown"
                }</span></td>
                <td>${student.section || "N/A"}</td>
                <td>${getGenderDisplay(student.gender)}</td>
                <td>${teamBadge} ${captainBadge}</td>
                <td class="actions-cell">
<button class="btn btn-sm btn-secondary" onclick="editStudent('${
        student.id
      }')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${
                      student.id
                    }')">🗑️</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

function displayMobileCards() {
  const mobileCards = document.getElementById("mobileCards");
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  if (paginatedStudents.length === 0) {
    mobileCards.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                No students found matching your criteria
            </div>
        `;
    return;
  }

  mobileCards.innerHTML = paginatedStudents
    .map((student) => {
const teamBadge = student.teamId ? 
    `<span class="badge badge-assigned">${student.teamname || student.teamId}</span>` : 
    `<span class="badge badge-unassigned">Unassigned</span>`;

      return `
            <div class="student-card" data-student-id="${student.id}">
                <div class="student-card-header">
                    <div class="student-info">
                        <div>
                            <div class="student-name">${student.name}</div>
                            <div class="student-email">${
                              student.admissionNumber || "N/A"
                            }</div>
                        </div>
                    </div>
                </div>
                <div class="student-card-body">
                    <div><div class="student-card-label">Branch</div><span class="badge badge-branch">${
                      student.department || "Unknown"
                    }</span></div>
                    <div><div class="student-card-label">Section</div>${
                      student.section || "N/A"
                    }</div>
                    <div><div class="student-card-label">Gender</div>${getGenderDisplay(
                      student.gender
                    )}</div>
                    <div><div class="student-card-label">Team</div>${teamBadge}</div>
                </div>
                <div class="student-card-actions">
<button class="btn btn-sm btn-secondary" style="flex:1;" onclick="editStudent('${
        student.id
      }')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${
                      student.id
                    }')">🗑️</button>
                </div>
            </div>
        `;
    })
    .join("");
}

function updatePagination() {
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const pagination = document.querySelector(".pagination");

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";

  let paginationHTML = "";

  paginationHTML += `<button class="page-btn" ${
    currentPage === 1 ? "disabled" : ""
  } onclick="changePage(${currentPage - 1})">←</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      paginationHTML += `<button class="page-btn ${
        i === currentPage ? "active" : ""
      }" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<button class="page-btn" disabled>...</button>`;
    }
  }

  paginationHTML += `<button class="page-btn" ${
    currentPage === totalPages ? "disabled" : ""
  } onclick="changePage(${currentPage + 1})">→</button>`;

  pagination.innerHTML = paginationHTML;
}

function changePage(page) {
  currentPage = page;
  displayStudents();
}

function getGenderDisplay(gender) {
  const genderStr = String(gender).toUpperCase();
  if (genderStr === "M") return "Male";
  if (genderStr === "F") return "Female";
  return "Other";
}


function deleteStudent(studentId) {
  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  console.log("Delete student:", studentId);
}

function openImportModal() {
  document.getElementById("importModal").classList.add("active");
}
function closeImportModal() {
  document.getElementById("importModal").classList.remove("active");
}

function closeAddModal() {
  document.getElementById("addModal").classList.remove("active");
  clearAddModalForm();
}

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
if (uploadArea && fileInput) {
  uploadArea.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () =>
    uploadArea.classList.remove("dragover")
  );
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
  });
}

async function saveStudent() {
  const name = document.getElementById("studentName").value.trim();
  const admissionNumber = document
    .getElementById("admissionNumber")
    .value.trim();
  const department = document.getElementById("department").value;
  const section = document.getElementById("section").value;
  const gender = document.getElementById("gender").value;

  if (!name) {
    alert("Please enter student name");
    return;
  }
  if (!admissionNumber) {
    alert("Please enter admission number");
    return;
  }
  if (!department) {
    alert("Please select department");
    return;
  }
  if (!section) {
    alert("Please select section");
    return;
  }

  try {
    const studentData = {
      name: name,
      admissionNumber: admissionNumber,
      department: department,
      section: section,
      gender: gender,
    };

    let result;

    if (currentEditingStudentId) {
      const { data, error } = await supabase
        .from("members")
        .update(studentData)
        .eq("id", currentEditingStudentId)
        .select();

      if (error) throw error;
      result = data;
    } else {
      studentData.teamId = null;
      studentData.teamName = null;
      studentData.isCaptain = false;

      const { data, error } = await supabase
        .from("members")
        .insert([studentData])
        .select();

      if (error) throw error;
      result = data;
    }

    alert(
      `Student ${currentEditingStudentId ? "updated" : "added"} successfully!`
    );
    closeAddModal();
    clearAddModalForm();

    loadStudents();
  } catch (error) {
    console.error("Error saving student:", error);
    alert("Error saving student: " + error.message);
  }
}

function clearAddModalForm() {
  document.getElementById("studentName").value = "";
  document.getElementById("admissionNumber").value = "";
  document.getElementById("department").value = "";
  document.getElementById("section").value = "";
  document.getElementById("gender").value = "M";
  currentEditingStudentId = null;
  document.getElementById("addModalTitle").textContent = "Add Student";
}
function editStudent(studentId) {
    var sid = parseInt(studentId);

  const student = allStudents.find((s) => s.id === sid);
  if (!student) {
    console.log("Student not found:", studentId);
    return;}

    console.log("Editing student:", student);
  currentEditingStudentId = sid;

  document.getElementById("addModalTitle").textContent = "Edit Student";

 document.getElementById("studentName").value = student.name || "";
  document.getElementById("admissionNumber").value =
    student.admissionNumber || "";
  document.getElementById("department").value = student.department || "";
  document.getElementById("section").value = student.section || "";
  document.getElementById("gender").value = student.gender || "M";

  openAddModal();
}
function openAddModal() {
    document.getElementById('addModal').classList.add('active');
}