export {};
let allTeams: any[] = [];

interface Student {
  id: number;
  name: string;
  admissionNumber: string | number;
  department?: string;
  section?: string;
  gender?: string;
  email?: string;
  isCaptain?: boolean;

  // ⚠ These no longer exist in your DB but your JS uses them.
  // To avoid breaking your logic, they are kept optional:
  teamId?: string | number | null;
  teamid?: string | number | null; // You used teamid (lowercase i) once
  teamname?: string | null;
}

let allStudents: Student[] = [];
let currentPage: number = 1;
const studentsPerPage: number = 10;
let filteredStudents: Student[] = [];

document.addEventListener("DOMContentLoaded", function () {
  loadStudents();
  setupEventListeners();
});

function setupEventListeners(): void {
  document
    .getElementById("studentSearch")!
    .addEventListener("input", function () {
      filterStudents();
    });

  document.getElementById("filterBranch")!.addEventListener("change", filterStudents);
  document.getElementById("filterSection")!.addEventListener("change", filterStudents);
  document.getElementById("filterGender")!.addEventListener("change", filterStudents);
  document.getElementById("filterStatus")!.addEventListener("change", filterStudents);
}

let currentEditingStudentId: number | null = null;

async function loadStudents() {
  try {
    document.getElementById("loadingScreen")!.style.display = "flex";

    // Fetch all teams first
    const { data: teams, error: teamError } = await (window as any).supabase
      .from("Teams")
      .select("*");

    if (teamError) throw teamError;
    allTeams = teams || [];

    // Fetch all students
    const { data: students, error } = await (window as any).supabase
      .from("members")
      .select("*")
      .order("name");

    if (error) throw error;

    allStudents = students || [];
    filteredStudents = [...allStudents];

    updateStats();
    displayStudents();
  } catch (error) {
    console.error("Error loading students:", error);
    alert("Error loading student data");
  } finally {
    document.getElementById("loadingScreen")!.style.display = "none";
  }
}

function getStudentTeamName(student: Student): string | null {
  if (!student.admissionNumber) return null;

  const adm = String(student.admissionNumber);

  const team = allTeams.find(t => 
    Array.isArray(t.members) &&
    t.members.map(String).includes(adm)
  );

  return team ? team.name : null;
}



function updateStats(): void {
  const totalStudents = allStudents.length;
  const assignedStudents = allStudents.filter((s) => s.teamId).length;
  const unassignedStudents = totalStudents - assignedStudents;
  const captainCount = allStudents.filter((s) => s.isCaptain).length;

  (document.getElementById("totalStudents") as HTMLElement).textContent = String(totalStudents);
  (document.getElementById("assignedStudents") as HTMLElement).textContent = String(assignedStudents);
  (document.getElementById("unassignedStudents") as HTMLElement).textContent = String(unassignedStudents);
  (document.getElementById("captainCount") as HTMLElement).textContent = String(captainCount);
}

function filterStudents(): void {
  const searchTerm = (document.getElementById('studentSearch') as HTMLInputElement).value.toLowerCase();
  const branchFilter = (document.getElementById('filterBranch') as HTMLSelectElement).value;
  const sectionFilter = (document.getElementById('filterSection') as HTMLSelectElement).value;
  const genderFilter = (document.getElementById('filterGender') as HTMLSelectElement).value;
  const statusFilter = (document.getElementById('filterStatus') as HTMLSelectElement).value;

  filteredStudents = allStudents.filter(student => {
    const matchesSearch =
      !searchTerm ||
      student.name.toLowerCase().includes(searchTerm) ||
      String(student.admissionNumber).toLowerCase().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm);

    const matchesBranch = !branchFilter || student.department === branchFilter;
    const matchesSection = !sectionFilter || student.section === sectionFilter;
    const matchesGender =
      !genderFilter ||
      (genderFilter === "male" && student.gender === "M") ||
      (genderFilter === "female" && student.gender === "F") ||
      (genderFilter === "other" &&
        student.gender !== "M" &&
        student.gender !== "F");

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "assigned" && student.teamId) ||
      (statusFilter === "unassigned" && !student.teamId) ||
      (statusFilter === "captain" && student.isCaptain);

    return matchesSearch && matchesBranch && matchesSection && matchesGender && matchesStatus;
  });

  currentPage = 1;
  displayStudents();
}

function displayStudents(): void {
  displayDesktopTable();
  displayMobileCards();
  updatePagination();
}

function displayDesktopTable(): void {
  const tableBody = document.getElementById("studentTableBody")!;
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage);

  if (paginatedStudents.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
          No students found matching your criteria
        </td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = paginatedStudents
    .map((student) => {
      const teamName = getStudentTeamName(student);
const teamBadge = teamName
  ? `<span class="badge badge-assigned">${teamName}</span>`
  : `<span class="badge badge-unassigned">Unassigned</span>`;


      const captainBadge = student.isCaptain
        ? `<span class="badge badge-captain">Captain</span>`
        : "";

      return `
      <tr data-student-id="${student.id}">
        <td>
          <div class="student-info">
            <div>
              <div class="student-name">${student.name}</div>
              <div class="student-email">${student.email || "No email"}</div>
            </div>
          </div>
        </td>
        <td>${student.admissionNumber || "N/A"}</td>
        <td><span class="badge badge-branch">${student.department || "Unknown"}</span></td>
        <td>${student.section || "N/A"}</td>
        <td>${getGenderDisplay(student.gender)}</td>
        <td>${teamBadge} ${captainBadge}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-secondary" onclick="editStudent('${student.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')">🗑️</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

function displayMobileCards(): void {
  const mobileCards = document.getElementById("mobileCards")!;
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage);

  if (paginatedStudents.length === 0) {
    mobileCards.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        No students found matching your criteria
      </div>`;
    return;
  }

  mobileCards.innerHTML = paginatedStudents
    .map((student) => {
    const teamName = getStudentTeamName(student);
const teamBadge = teamName
  ? `<span class="badge badge-assigned">${teamName}</span>`
  : `<span class="badge badge-unassigned">Unassigned</span>`;

      return `
      <div class="student-card" data-student-id="${student.id}">
        <div class="student-card-header">
          <div class="student-info">
            <div>
              <div class="student-name">${student.name}</div>
              <div class="student-email">${student.admissionNumber || "N/A"}</div>
            </div>
          </div>
        </div>
        <div class="student-card-body">
          <div><div class="student-card-label">Branch</div><span class="badge badge-branch">${student.department || "Unknown"}</span></div>
          <div><div class="student-card-label">Section</div>${student.section || "N/A"}</div>
          <div><div class="student-card-label">Gender</div>${getGenderDisplay(student.gender)}</div>
          <div><div class="student-card-label">Team</div>${teamBadge}</div>
        </div>
        <div class="student-card-actions">
          <button class="btn btn-sm btn-secondary" style="flex:1;" onclick="editStudent('${student.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')">🗑️</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function updatePagination(): void {
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const pagination = document.querySelector(".pagination") as HTMLElement;

  if (totalPages <= 1) {
    pagination.style.display = "none";
    return;
  }

  pagination.style.display = "flex";

  let paginationHTML = "";

  paginationHTML += `<button class="page-btn" ${currentPage === 1 ? "disabled" : ""} onclick="changePage(${currentPage - 1})">←</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHTML += `<button class="page-btn ${i === currentPage ? "active" : ""}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<button class="page-btn" disabled>...</button>`;
    }
  }

  paginationHTML += `<button class="page-btn" ${currentPage === totalPages ? "disabled" : ""} onclick="changePage(${currentPage + 1})">→</button>`;

  pagination.innerHTML = paginationHTML;
}

function changePage(page: number): void {
  currentPage = page;
  displayStudents();
}

function getGenderDisplay(gender: string | undefined): string {
  const genderStr = String(gender || "").toUpperCase();
  if (genderStr === "M") return "Male";
  if (genderStr === "F") return "Female";
  return "Other";
}

function deleteStudent(studentId: string): void {
  if (!confirm("Are you sure you want to delete this student?")) return;

  console.log("Delete student:", studentId);
}

function openImportModal(): void {
  document.getElementById("importModal")!.classList.add("active");
}

function closeImportModal(): void {
  document.getElementById("importModal")!.classList.remove("active");
}

function closeAddModal(): void {
  document.getElementById("addModal")!.classList.remove("active");
  clearAddModalForm();
}

// Upload handling
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput") as HTMLInputElement | null;

if (uploadArea && fileInput) {
  uploadArea.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
  });
}

async function saveStudent(): Promise<void> {
  const name = (document.getElementById("studentName") as HTMLInputElement).value.trim();
  const admissionNumber = (document.getElementById("admissionNumber") as HTMLInputElement).value.trim();
  const department = (document.getElementById("department") as HTMLSelectElement).value;
  const section = (document.getElementById("section") as HTMLSelectElement).value;
  const gender = (document.getElementById("gender") as HTMLSelectElement).value;

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
    const studentData: any = {
      name: name,
      admissionNumber: admissionNumber,
      department: department,
      section: section,
      gender: gender,
    };

    let result;

    if (currentEditingStudentId) {
      const { data, error } = await (window as any).supabase
        .from("members")
        .update(studentData)
        .eq("id", currentEditingStudentId)
        .select();

      if (error) throw error;
      result = data;
    } else {
      
     studentData.id = studentData.admissionNumber; // Set id to admissionNumber for new student
      studentData.isCaptain = false;

      const { data, error } = await (window as any).supabase
        .from("members")
        .insert([studentData])
        .select();

      if (error) throw error;
      result = data;

      // if (i) throw error;
      // result = data;
    }

    alert(`Student ${currentEditingStudentId ? "updated" : "added"} successfully!`);
    closeAddModal();
    clearAddModalForm();

    loadStudents();
  } catch (error: any) {
    console.error("Error saving student:", error);
    alert("Error saving student: " + error.message);
  }
}

function clearAddModalForm(): void {
  (document.getElementById("studentName") as HTMLInputElement).value = "";
  (document.getElementById("admissionNumber") as HTMLInputElement).value = "";
  (document.getElementById("department") as HTMLSelectElement).value = "";
  (document.getElementById("section") as HTMLSelectElement).value = "";
  (document.getElementById("gender") as HTMLSelectElement).value = "M";

  currentEditingStudentId = null;
  document.getElementById("addModalTitle")!.textContent = "Add Student";
}

function editStudent(studentId: string): void {
  const sid = parseInt(studentId);
  const student = allStudents.find((s) => s.id === sid);

  if (!student) {
    console.log("Student not found:", studentId);
    return;
  }

  console.log("Editing student:", student);
  currentEditingStudentId = sid;

  document.getElementById("addModalTitle")!.textContent = "Edit Student";

  (document.getElementById("studentName") as HTMLInputElement).value = student.name || "";
  (document.getElementById("admissionNumber") as HTMLInputElement).value = String(student.admissionNumber || "");
  (document.getElementById("department") as HTMLSelectElement).value = student.department || "";
  (document.getElementById("section") as HTMLSelectElement).value = student.section || "";
  (document.getElementById("gender") as HTMLSelectElement).value = student.gender || "M";

  openAddModal();
}

function openAddModal(): void {
  document.getElementById("addModal")!.classList.add("active");
}

declare global {
  interface Window {
    supabase: any;
    editStudent: (id: string) => void;
    deleteStudent: (id: string) => void;
    changePage: (page: number) => void;
  }
}

(window as any).editStudent = editStudent;
(window as any).deleteStudent = deleteStudent;
(window as any).changePage = changePage;
(window as any).closeAddModal = closeAddModal;
(window as any).saveStudent = saveStudent;
(window as any).clearAddModalForm = clearAddModalForm;
(window as any).openAddModal = openAddModal;
``