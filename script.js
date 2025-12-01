// const students = {
//     aiml: [],
//     cse: [],
//     ds: [],
//     ise: [],
//     iot: [],
//     ece: [],
//     mechanical: [],
//     eee: [],
//     civil: []
// };
// displayStudents() ;
// const captains = {
//     aiml: [],
//     cse: [],
//     ds: [],
//     ise: [],
//     iot: [],
//     ece: [],
//     mechanical: [],
//     eee: [],
//     civil: []
// };

// const branchNames = {
//     aiml: 'AI/ML',
//     cse: 'CSE',
//     ds: 'Data Science',
//     ise: 'ISE',
//     iot: 'IoT',
//     ece: 'ECE',
//     mechanical: 'Mechanical',
//     eee: 'EEE',
//     civil: 'Civil'
// };

// function addStudent() {
//     const branch = document.getElementById('branchSelect').value;
//     const name = document.getElementById('studentName').value.trim();
//     const isCaptain = document.getElementById('isCaptain').checked;
    
//     if (!name) {
//         alert('Please enter a student name');
//         return;
//     }
    
//     const studentInfo = {
//         display: name,
//         name: name,
//         campusId: 'XXXX',
//         branch: branch,
//         isCaptain: isCaptain
//     };
    
//     const existsInStudents = students[branch].some(s => s.name === name);
//     const existsInCaptains = captains[branch].some(s => s.name === name);
    
//     if (existsInStudents || existsInCaptains) {
//         alert('Student already exists in this branch');
//         return;
//     }
    
//     if (isCaptain) {
//         captains[branch].push(studentInfo);
//     } else {
//         students[branch].push(studentInfo);
//     }
    
//     document.getElementById('studentName').value = '';
//     document.getElementById('isCaptain').checked = false;
//     displayStudents();
// }

// function removeStudent(branch, index, isCaptain = false) {
//     if (isCaptain) {
//         if (index > -1 && index < captains[branch].length) {
//             captains[branch].splice(index, 1);
//             displayStudents();
//         }
//     } else {
//         if (index > -1 && index < students[branch].length) {
//             students[branch].splice(index, 1);
//             displayStudents();
//         }
//     }
// }

// // function displayStudents() {
// //     const container = document.getElementById('studentsList');
// //     container.innerHTML = '';
    
// //     for (const [branch, studentList] of Object.entries(students)) {
// //         const captainList = captains[branch] || [];
// //         const totalCount = studentList.length + captainList.length;
        
// //         if (totalCount > 0) {
// //             const branchDiv = document.createElement('div');
// //             branchDiv.className = 'branch-group';
            
// //             const allStudents = [
// //                 ...captainList.map((student, index) => ({ ...student, index, isCaptain: true })),
// //                 ...studentList.map((student, index) => ({ ...student, index, isCaptain: false }))
// //             ];
            
// //             branchDiv.innerHTML = `
// //                 <div class="branch-title">${branchNames[branch]} (${totalCount})</div>
// //                 <div class="student-list">
// //                     ${allStudents.map(student => `
// //                         <span class="student-tag ${student.isCaptain ? 'captain' : ''}">
// //                             ${student.display || student.name}
// //                             <span class="remove-btn" onclick="removeStudent('${branch}', ${student.index}, ${student.isCaptain})">&times;</span>
// //                         </span>
// //                     `).join('')}
// //                 </div>
// //             `;
            
// //             container.appendChild(branchDiv);
// //         }
// //     }
// // }


// // async function displayStudents() {
// //     const container = document.getElementById('studentsList');
// //     container.innerHTML = '';
    
// //     try {
// //         const db = firebase.firestore();
// //         const membersSnapshot = await db.collection('members').get();
        
// //         if (membersSnapshot.empty) {
// //             container.innerHTML = '<div class="no-students">No students found</div>';
// //             return;
// //         }
        
// //         const branchGroups = {};
        
// //         membersSnapshot.forEach(doc => {
// //             const studentData = doc.data();
// //             const branch = studentData.department;
            
// //             if (!branchGroups[branch]) {
// //                 branchGroups[branch] = [];
// //             }
            
// //             const displayString = `${studentData.name} | ${studentData.admissionNumber} | ${studentData.section} | ${studentData.department}`;
            
// //             branchGroups[branch].push({
// //                 display: displayString,
// //                 name: studentData.name,
// //                 admissionNumber: studentData.admissionNumber,
// //                 section: studentData.section,
// //                 department: studentData.department,
// //                 id: doc.id
// //             });
// //         });
        
// //         for (const [branch, studentList] of Object.entries(branchGroups)) {
// //             const totalCount = studentList.length;
            
// //             const branchDiv = document.createElement('div');
// //             branchDiv.className = 'branch-group';
            
// //             branchDiv.innerHTML = `
// //                 <div class="branch-title">${branch} (${totalCount})</div>
// //                 <div class="student-list">
// //                     ${studentList.map(student => `
// //                         <span class="student-tag">
// //                             ${student.display}
// //                             <span class="remove-btn" onclick="removeStudent('${student.id}')">&times;</span>
// //                         </span>
// //                     `).join('')}
// //                 </div>
// //             `;
            
// //             container.appendChild(branchDiv);
// //         }
        
// //     } catch (error) {
// //         console.error('Error loading students:', error);
// //         container.innerHTML = '<div class="error">Error loading students</div>';
// //     }
// // }

// let allStudents = []; // Global variable to store students

// async function displayStudents() {
//     const container = document.getElementById('studentsList');
//     container.innerHTML = '';
    
//     try {
//         const supabaseUrl = 'YOUR_SUPABASE_URL';
//         const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
//         const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
        
//         const { data: members, error } = await supabase
//             .from('members')
//             .select('*');
        
//         if (error || !members || members.length === 0) {
//             container.innerHTML = '<div class="no-students">No students found</div>';
//             return [];
//         }
        
//         allStudents = [];
//         const branchGroups = {};
        
//         members.forEach(member => {
//             const studentData = member;
//             const branch = studentData.department;
            
//             if (!branchGroups[branch]) {
//                 branchGroups[branch] = [];
//             }
            
//             const studentWithId = {
//                 ...studentData,
//                 id: member.id,
//                 display: `${studentData.name} | ${studentData.admissionNumber} | ${studentData.section} | ${studentData.department}`
//             };
            
//             branchGroups[branch].push(studentWithId);
//             allStudents.push(studentWithId);
//         });
        
//          for (const [branch, studentList] of Object.entries(branchGroups)) {
//             const totalCount = studentList.length;
            
//             const branchDiv = document.createElement('div');
//             branchDiv.className = 'branch-group';
            
//             branchDiv.innerHTML = `
//                 <div class="branch-title">${branch} (${totalCount})</div>
//                 <div class="student-list">
//                     ${studentList.map(student => `
//                         <span class="student-tag">
//                             ${student.display}
//                             <span class="remove-btn" onclick="removeStudent('${student.id}')">&times;</span>
//                         </span>
//                     `).join('')}
//                 </div>
//             `;
            
//             container.appendChild(branchDiv);
//         }
        
        
//         return allStudents; 
        
//     } catch (error) {
//         console.error('Error loading students:', error);
//         return [];
//     }
// }

// function shuffleArray(array) {
//     const shuffled = [...array];
//     for (let i = shuffled.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//     }
//     return shuffled;
// }

// function generateTeams() {
//     const teamSize = parseInt(document.getElementById('teamSize').value);
//     const maleCount = parseInt(document.getElementById('maleCount').value) || 0;
//     const femaleCount = parseInt(document.getElementById('femaleCount').value) || 0;
    
//     if (teamSize < 2) {
//         alert('Team size must be at least 2');
//         return;
//     }
    
//     if (maleCount + femaleCount > teamSize) {
//         alert('Male + Female count cannot exceed team size');
//         return;
//     }
    
//     // Get all students and captains with their branches
//     const allStudents = [];
//     const allCaptains = [];
    
//     for (const [branch, studentList] of Object.entries(students)) {
//         studentList.forEach(student => {
//             if (typeof student === 'string') {
//                 allStudents.push({ name: student, campusId: 'XXXX', branch, isCaptain: false, gender: 'Unknown' });
//             } else {
//                 allStudents.push({ 
//                     name: student.name, 
//                     campusId: student.campusId || 'XXXX', 
//                     branch,
//                     isCaptain: false,
//                     gender: student.gender || 'Unknown'
//                 });
//             }
//         });
//     }
    
//     for (const [branch, captainList] of Object.entries(captains)) {
//         captainList.forEach(captain => {
//             if (typeof captain === 'string') {
//                 allCaptains.push({ name: captain, campusId: 'XXXX', branch, isCaptain: true, gender: 'Unknown' });
//             } else {
//                 allCaptains.push({ 
//                     name: captain.name, 
//                     campusId: captain.campusId || 'XXXX', 
//                     branch,
//                     isCaptain: true,
//                     gender: captain.gender || 'Unknown'
//                 });
//             }
//         });
//     }
    
//     const totalStudents = allStudents.length + allCaptains.length;
    
//     if (totalStudents === 0) {
//         alert('Please add some students first');
//         return;
//     }
    
//     if (totalStudents < teamSize) {
//         alert(`Not enough students. You have ${totalStudents} students but need ${teamSize} per team.`);
//         return;
//     }
    
//     // Create diverse teams with captains and gender constraints
//     const teams = createDiverseTeamsWithCaptains([...allStudents, ...allCaptains], teamSize, allCaptains, maleCount, femaleCount);
//     const remainingStudents = [];
    
//     // Calculate remaining students
//     const usedStudents = teams.flat();
//     [...allStudents, ...allCaptains].forEach(student => {
//         if (!usedStudents.some(used => used.name === student.name && used.branch === student.branch)) {
//             remainingStudents.push(student);
//         }
//     });
    
//     displayTeams(teams, remainingStudents);
// }

// function createDiverseTeamsWithCaptains(allStudents, teamSize, captains, maleCount = 0, femaleCount = 0) {
//     const teams = [];
//     const totalStudents = allStudents.length;
//     const totalTeams = Math.floor(totalStudents / teamSize);
    
//     // Separate captains and regular students
//     const shuffledCaptains = shuffleArray([...captains]);
//     const regularStudents = allStudents.filter(s => !s.isCaptain);
    
//     // Create branch distribution for regular students
//     const branchCounts = {};
//     regularStudents.forEach(student => {
//         branchCounts[student.branch] = (branchCounts[student.branch] || 0) + 1;
//     });
    
//     const branches = Object.keys(branchCounts);
//     const studentsPerBranch = {};
    
//     // Shuffle and distribute regular students by branch
//     branches.forEach(branch => {
//         const branchStudents = regularStudents.filter(s => s.branch === branch);
//         studentsPerBranch[branch] = shuffleArray(branchStudents);
//     });
    
//     // Create teams with captains first
//     for (let teamIndex = 0; teamIndex < totalTeams; teamIndex++) {
//         const team = [];
        
//         // Add captain if available
//         if (teamIndex < shuffledCaptains.length) {
//             team.push(shuffledCaptains[teamIndex]);
//         }
        
//         // Fill remaining positions with gender constraints
//         const targetBranches = shuffleArray([...branches]);
        
//         // Count current genders in team
//         let currentMales = team.filter(m => m.gender === 'Male').length;
//         let currentFemales = team.filter(m => m.gender === 'Female').length;
        
//         for (let position = team.length; position < teamSize; position++) {
//             let selectedStudent = null;
            
//             // Determine required gender for this position (only if constraints are set)
//             let requiredGender = null;
//             if (maleCount > 0 || femaleCount > 0) {
//                 if (maleCount > 0 && currentMales < maleCount) {
//                     requiredGender = 'Male';
//                 } else if (femaleCount > 0 && currentFemales < femaleCount) {
//                     requiredGender = 'Female';
//                 }
//             }
            
//             // Try to get student from different branch than already in team
//             const usedBranches = team.map(member => member.branch);
            
//             // Find branches not yet used in this team
//             const availableBranches = targetBranches.filter(branch => 
//                 !usedBranches.includes(branch) && studentsPerBranch[branch] && studentsPerBranch[branch].length > 0
//             );
            
//             // Try unused branches first
//             for (const branch of availableBranches) {
//                 const candidates = studentsPerBranch[branch].filter(s => 
//                     !requiredGender || s.gender === requiredGender
//                 );
//                 if (candidates.length > 0) {
//                     selectedStudent = candidates[Math.floor(Math.random() * candidates.length)];
//                     studentsPerBranch[branch] = studentsPerBranch[branch].filter(s => s !== selectedStudent);
//                     break;
//                 }
//             }
            
//             // If no suitable student found in unused branches, try all branches
//             if (!selectedStudent) {
//                 for (const branch of branches) {
//                     if (studentsPerBranch[branch] && studentsPerBranch[branch].length > 0) {
//                         const candidates = studentsPerBranch[branch].filter(s => 
//                             !requiredGender || s.gender === requiredGender
//                         );
//                         if (candidates.length > 0) {
//                             selectedStudent = candidates[Math.floor(Math.random() * candidates.length)];
//                             studentsPerBranch[branch] = studentsPerBranch[branch].filter(s => s !== selectedStudent);
//                             break;
//                         }
//                     }
//                 }
//             }
            
//             if (selectedStudent) {
//                 team.push(selectedStudent);
//                 if (selectedStudent.gender === 'Male') currentMales++;
//                 if (selectedStudent.gender === 'Female') currentFemales++;
//             } else {
//                 break;
//             }
//         }
        
//         if (team.length === teamSize) {
//             teams.push(team);
//         }
//     }
    
//     // Add remaining captains to student pool for additional teams
//     const remainingCaptains = shuffledCaptains.slice(totalTeams);
//     remainingCaptains.forEach(captain => {
//         if (studentsPerBranch[captain.branch]) {
//             studentsPerBranch[captain.branch].push(captain);
//         } else {
//             studentsPerBranch[captain.branch] = [captain];
//         }
//     });
    
//     return teams;
// }

// function displayTeams(teams, remainingStudents = []) {
//     const container = document.getElementById('teamsDisplay');
//     const header = document.getElementById('teamsHeader');
//     const shuffleBtn = document.getElementById('shuffleBtn');
//     container.innerHTML = '';
    
//     if (teams.length === 0) {
//         container.innerHTML = '<p>No complete teams could be formed with the current team size.</p>';
//         header.style.display = 'none';
//         shuffleBtn.style.display = 'none';
//         document.getElementById('studentSearch').style.display = 'none';
//         return;
//     }
    
//     header.style.display = 'block';
//     shuffleBtn.style.display = 'inline-block';
//     document.getElementById('studentSearch').style.display = 'block';
    
//     teams.forEach((team, index) => {
//         const teamDiv = document.createElement('div');
//         teamDiv.className = 'team';
//         teamDiv.id = `team-${index}`;
//         teamDiv.style.animationDelay = `${index * 0.1}s`;
        
//         // Find captain in the team
//         const captain = team.find(student => student.isCaptain);
//         const captainName = captain ? `(Capt. ${captain.name})` : '';
        
//         teamDiv.innerHTML = `
//             <div class="team-header">
//                 <span>Team ${index + 1}</span>
//                 <span class="captain-name">${captainName}</span>
//                 <div class="team-actions">
//                     <button onclick="toggleAddStudent(${index})" class="add-student-btn" id="addBtn-${index}">ADD</button>
//                     <button onclick="toggleMemberSelection(${index})" class="select-btn" id="selectBtn-${index}">SELECT</button>
//                     <button onclick="copyTeam(${index})" class="copy-btn">COPY</button>
//                     <button onclick="deleteTeam(${index})" class="delete-btn">DELETE</button>
//                 </div>
//             </div>
//             <div class="team-members" id="teamMembers-${index}">
//                 ${team.map((student, memberIndex) => `
//                     <div class="member ${student.isCaptain ? 'captain' : ''} ${student.gender === 'Male' ? 'male' : student.gender === 'Female' ? 'female' : ''}" style="animation-delay: ${(index * 0.1) + (memberIndex * 0.05)}s">
//                         <input type="checkbox" class="member-checkbox" id="member-${index}-${memberIndex}" style="display: none;" onchange="updateRemoveButton(${index})">
//                         <div class="member-content">
//                             <div class="member-name">${student.name}</div>
//                             <div class="member-id">${student.campusId}</div>
//                             <div class="member-branch">${branchNames[student.branch]}</div>
//                         </div>
//                     </div>
//                 `).join('')}
//             </div>
//             <div class="remove-selected" id="removeSection-${index}" style="display: none;">
//                 <button onclick="removeSelectedMembers(${index})" class="remove-btn" id="removeBtn-${index}">REMOVE SELECTED (0)</button>
//                 <button onclick="cancelSelection(${index})" class="cancel-selection-btn">CANCEL</button>
//             </div>
//             <div class="add-student-section" id="addSection-${index}" style="display: none;">
//                 <select id="addStudentSelect-${index}" class="add-student-select">
//                     <option value="">SELECT STUDENT TO ADD</option>
//                 </select>
//                 <button onclick="addStudentToTeam(${index})" class="add-to-team-btn">ADD TO TEAM</button>
//                 <button onclick="cancelAddStudent(${index})" class="cancel-add-btn">CANCEL</button>
//             </div>
//         `;
        
//         container.appendChild(teamDiv);
//     });
    
//     if (remainingStudents.length > 0) {
//         const remainingDiv = document.createElement('div');
//         remainingDiv.className = 'remaining-students';
//         remainingDiv.style.animationDelay = `${teams.length * 0.1}s`;
        
//         remainingDiv.innerHTML = `
//             <div class="remaining-header">
//                 Students Not Assigned (${remainingStudents.length})
//                 <div class="remaining-actions">
//                     ${remainingStudents.length >= parseInt(document.getElementById('teamSize').value) ? 
//                         `<button onclick="createTeamFromRemaining()" class="create-team-btn">CREATE NEW TEAM</button>` : ''}
//                     <button onclick="copyRemaining()" class="copy-btn">COPY</button>
//                 </div>
//             </div>
//             <div class="remaining-list">
//                 ${remainingStudents.map((student, index) => `
//                     <div class="remaining-member ${student.isCaptain ? 'captain' : ''} ${student.gender === 'Male' ? 'male' : student.gender === 'Female' ? 'female' : ''}" style="animation-delay: ${(teams.length * 0.1) + (index * 0.05)}s">
//                         <div class="member-name">${student.name}</div>
//                         <div class="member-id">${student.campusId}</div>
//                         <div class="member-branch">${branchNames[student.branch]}</div>
//                     </div>
//                 `).join('')}
//             </div>
//         `;
        
//         container.appendChild(remainingDiv);
//     }

//     window.currentTeams = teams;
//     window.currentRemaining = remainingStudents;
    

// }

// function bulkAddStudents() {
//     const bulkText = document.getElementById('bulkStudents').value.trim();
//     const button = event.target;
    
//     if (!bulkText) {
//         alert('Please paste student data in the text area');
//         return;
//     }
    
//     // Add loading animation
//     button.classList.add('loading');
//     button.textContent = 'PARSING...';
    
//     setTimeout(() => {
//         const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line);
//         let addedCount = 0;
//         let errorCount = 0;
        
//         lines.forEach(line => {
//             const parsed = parseStudentLine(line);
//             if (parsed) {
//                 // Check if this person already exists as captain or student (by name or campus ID)
//                 let existsAsCaptain = false;
//                 let existsAsStudent = false;
                
//                 for (const [branch, captainList] of Object.entries(captains)) {
//                     if (captainList.some(c => c.name === parsed.name || c.campusId === parsed.campusId)) {
//                         existsAsCaptain = true;
//                         break;
//                     }
//                 }
                
//                 if (!existsAsCaptain) {
//                     existsAsStudent = students[parsed.branch].some(s => s.name === parsed.name || s.campusId === parsed.campusId);
//                 }
                
//                 if (existsAsCaptain) {
//                     // Skip adding as regular student, keep as captain
//                     return;
//                 }
                
//                 const displayText = parsed.section ? 
//                     `${parsed.section}// ${parsed.name} (${parsed.campusId}) [${parsed.gender}] - ${branchNames[parsed.branch]}` :
//                     `${parsed.name} (${parsed.campusId}) [${parsed.gender}] - ${branchNames[parsed.branch]}`;
                
//                 const studentInfo = {
//                     display: displayText,
//                     name: parsed.name,
//                     campusId: parsed.campusId,
//                     branch: parsed.branch,
//                     section: parsed.section,
//                     gender: parsed.gender
//                 };
                
//                 if (!existsAsStudent) {
//                     students[parsed.branch].push(studentInfo);
//                     addedCount++;
//                 }
//             } else {
//                 errorCount++;
//             }
//         });
        
//         document.getElementById('bulkStudents').value = '';
//         displayStudents();
        
//         // Remove loading animation
//         button.classList.remove('loading');
//         button.textContent = 'PARSE AND ADD STUDENTS';
        
//         alert(`Added ${addedCount} students${errorCount > 0 ? ` (${errorCount} lines couldn't be parsed)` : ''}`);
//     }, 500);
// }

// function parseStudentLine(line) {
//     const text = line.trim();
//     if (!text) return null;
    
//     // Branch patterns - with specialization detection
//     const branchPatterns = {
//         // Specialized branches (check first)
//         'iot': /CSE\s*\(\s*IoT\s*\)|IoT|Internet\s*of\s*Things/i,
//         'ds': /CSE\s*\(\s*DS\s*\)|CSE\s*\(\s*Data\s*Science\s*\)|Data\s*Science|DS\b/i,
//         'aiml': /CSE\s*\(\s*AI\s*&?\s*ML\s*\)|AI\s*&?\s*ML?|Artificial\s*Intelligence|Machine\s*Learning/i,
//         // General branches (check after specializations)
//         'cse': /CSE|Computer\s*Science|CS\b/i,
//         'ise': /ISE|Information\s*Science|IS\b/i,
//         'ece': /ECE|Electronics|Electrical\s*&\s*Communication/i,
//         'mechanical': /Mechanical|ME\b|Mech/i,
//         'eee': /EEE|Electrical\s*&\s*Electronics|Electrical\s*Engineering/i,
//         'civil': /Civil|CE\b/i
//     };
    
//     // Find campus ID (3-4 digits)
//     const campusIdMatch = text.match(/\b\d{3,4}\b/);
//     const campusId = campusIdMatch ? campusIdMatch[0] : 'XXXX';
    
//     // Find branch - prioritize specializations
//     let detectedBranch = 'cse'; // default
//     let branchText = '';
    
//     // Check for specializations first (IoT, DS, AI/ML with CSE prefix)
//     const specializationPatterns = {
//         'iot': /CSE\s*\(\s*IoT\s*\)|IoT/i,
//         'ds': /CSE\s*\(\s*DS\s*\)|CSE\s*\(\s*Data\s*Science\s*\)|Data\s*Science/i,
//         'aiml': /CSE\s*\(\s*AI\s*&?\s*ML\s*\)|AI\s*&?\s*ML?/i
//     };
    
//     // First check for specializations
//     for (const [branch, pattern] of Object.entries(specializationPatterns)) {
//         const match = text.match(pattern);
//         if (match) {
//             detectedBranch = branch;
//             branchText = match[0];
//             break;
//         }
//     }
    
//     // If no specialization found, check general patterns
//     if (!branchText) {
//         for (const [branch, pattern] of Object.entries(branchPatterns)) {
//             const match = text.match(pattern);
//             if (match) {
//                 detectedBranch = branch;
//                 branchText = match[0];
//                 break;
//             }
//         }
//     }
    
//     // Handle pipe-separated format: A | NAME | BRANCH | ID GENDER
//     let name = text;
//     if (text.includes('|')) {
//         const parts = text.split('|').map(p => p.trim());
//         if (parts.length >= 2) {
//             name = parts[1]; // Second part is the name
//         }
//     } else {
//         // Remove section pattern (A-01, B-02, etc.)
//         name = name.replace(/^[A-Z]-?\d+\s*/i, '');
        
//         // Remove campus ID
//         if (campusIdMatch) {
//             name = name.replace(new RegExp('\\b' + campusId + '\\b'), '');
//         }
        
//         // Remove branch text
//         if (branchText) {
//             name = name.replace(new RegExp(branchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
//         }
//     }
    
//     // Clean up name
//     name = name.replace(/\s+/g, ' ').trim();
    
//     // If name is too short or empty, try alternative parsing
//     if (!name || name.length < 2) {
//         const words = text.split(/\s+/);
//         const nameWords = words.filter(word => {
//             // Keep words that look like names (not IDs, sections, or branches)
//             return !/^[A-Z]-?\d+$/i.test(word) && // not section
//                    !/^\d{3,4}$/.test(word) && // not campus ID
//                    !Object.values(branchPatterns).some(pattern => pattern.test(word)); // not branch
//         });
//         name = nameWords.join(' ');
//     }
    
//     if (!name || name.length < 2) return null;
    
//     // Find section (A-01, B-02, etc.)
//     const sectionMatch = text.match(/^[A-Z]-?\d+/i);
//     const section = sectionMatch ? sectionMatch[0] : '';
    
//     // Find gender anywhere in text (MALE/FEMALE after section)
//     const genderMatch = text.match(/\b(MALE|FEMALE|Male|Female|M|F)\b/i);
//     let gender = 'Unknown';
//     if (genderMatch) {
//         const g = genderMatch[0].toUpperCase();
//         gender = (g === 'MALE' || g === 'M') ? 'Male' : 'Female';
//     }
    
//     // Remove gender from name extraction
//     if (genderMatch) {
//         name = name.replace(new RegExp('\\b' + genderMatch[0] + '\\b', 'gi'), '').trim();
//     }
    
//     return {
//         section: section,
//         campusId: campusId,
//         name: name,
//         branch: detectedBranch,
//         gender: gender
//     };
// }

// function toggleBulkImport() {
//     const section = document.getElementById('bulkImportSection');
//     const btn = document.getElementById('bulkImportBtn');
    
//     if (section.style.display === 'none' || section.style.display === '') {
//         section.style.display = 'block';
//         btn.innerHTML = 'BULK IMPORT ▲';
//     } else {
//         section.style.display = 'none';
//         btn.innerHTML = 'BULK IMPORT ▼';
//     }
// }

// function copyTeam(teamIndex) {
//     const team = window.currentTeams[teamIndex];
//     let text = `Team ${teamIndex + 1}:\n`;
//     team.forEach(student => {
//         text += `• ${student.name} (${student.campusId}) - ${branchNames[student.branch]}\n`;
//     });
    
//     navigator.clipboard.writeText(text);
// }

// function copyRemaining() {
//     const remaining = window.currentRemaining;
//     let text = `Students Not Assigned (${remaining.length}):\n`;
//     remaining.forEach(student => {
//         text += `• ${student.name} (${student.campusId}) - ${branchNames[student.branch]}\n`;
//     });
    
//     navigator.clipboard.writeText(text);
// }

// function deleteTeam(teamIndex) {
//     if (!window.currentTeams || teamIndex >= window.currentTeams.length) return;
    
//     const deletedTeam = window.currentTeams[teamIndex];
    
//     // Add deleted team members to remaining students
//     deletedTeam.forEach(student => {
//         window.currentRemaining.push(student);
//     });
    
//     // Remove team from current teams
//     window.currentTeams.splice(teamIndex, 1);
    
//     // If no teams left, clear everything
//     if (window.currentTeams.length === 0) {
//         document.getElementById('teamsDisplay').innerHTML = '';
//         document.getElementById('teamsHeader').style.display = 'none';
//         document.getElementById('shuffleBtn').style.display = 'none';
//         window.currentTeams = [];
//         window.currentRemaining = [];
//     } else {
//         // Refresh display with updated indices
//         displayTeams(window.currentTeams, window.currentRemaining);
//     }
    
//     displayStudents();
// }

// function shuffleTeams() {
//     generateTeams();
// }

// function clearAllTeams() {
//     // Return all team members to students pool
//     if (window.currentTeams) {
//         window.currentTeams.forEach(team => {
//             team.forEach(student => {
//                 const studentObj = {
//                     name: student.name,
//                     campusId: student.campusId,
//                     branch: student.branch,
//                     display: `${student.name} (${student.campusId}) - ${branchNames[student.branch]}`
//                 };
//                 students[student.branch].push(studentObj);
//             });
//         });
//     }
    
//     // Return remaining students to pool
//     if (window.currentRemaining) {
//         window.currentRemaining.forEach(student => {
//             const studentObj = {
//                 name: student.name,
//                 campusId: student.campusId,
//                 branch: student.branch,
//                 display: `${student.name} (${student.campusId}) - ${branchNames[student.branch]}`
//             };
//             students[student.branch].push(studentObj);
//         });
//     }
    
//     // Clear display
//     document.getElementById('teamsDisplay').innerHTML = '';
//     document.getElementById('teamsHeader').style.display = 'none';
//     document.getElementById('shuffleBtn').style.display = 'none';
    
//     // Clear stored teams
//     window.currentTeams = [];
//     window.currentRemaining = [];
    
//     displayStudents();
// }

// function toggleMemberSelection(teamIndex) {
//     const checkboxes = document.querySelectorAll(`#teamMembers-${teamIndex} .member-checkbox`);
//     const selectBtn = document.getElementById(`selectBtn-${teamIndex}`);
//     const removeSection = document.getElementById(`removeSection-${teamIndex}`);
    
//     const isSelecting = selectBtn.textContent === 'SELECT';
    
//     if (isSelecting) {
//         checkboxes.forEach(cb => cb.style.display = 'block');
//         selectBtn.textContent = 'DONE';
//         selectBtn.className = 'select-btn active';
//         removeSection.style.display = 'block';
//     } else {
//         cancelSelection(teamIndex);
//     }
// }

// function cancelSelection(teamIndex) {
//     const checkboxes = document.querySelectorAll(`#teamMembers-${teamIndex} .member-checkbox`);
//     const selectBtn = document.getElementById(`selectBtn-${teamIndex}`);
//     const removeSection = document.getElementById(`removeSection-${teamIndex}`);
    
//     checkboxes.forEach(cb => {
//         cb.style.display = 'none';
//         cb.checked = false;
//     });
//     selectBtn.textContent = 'SELECT';
//     selectBtn.className = 'select-btn';
//     removeSection.style.display = 'none';
// }

// function updateRemoveButton(teamIndex) {
//     const checkboxes = document.querySelectorAll(`#teamMembers-${teamIndex} .member-checkbox:checked`);
//     const removeBtn = document.getElementById(`removeBtn-${teamIndex}`);
    
//     const count = checkboxes.length;
//     removeBtn.textContent = `REMOVE SELECTED (${count})`;
//     removeBtn.disabled = count === 0;
// }

// function removeSelectedMembers(teamIndex) {
//     const checkboxes = document.querySelectorAll(`#teamMembers-${teamIndex} .member-checkbox`);
//     const selectedIndices = [];
    
//     checkboxes.forEach((cb, index) => {
//         if (cb.checked) {
//             selectedIndices.push(index);
//         }
//     });
    
//     if (selectedIndices.length === 0) return;
    
//     const team = window.currentTeams[teamIndex];
//     const removedStudents = [];
    
//     // Remove from back to front to maintain indices
//     selectedIndices.reverse().forEach(memberIndex => {
//         const removedStudent = team.splice(memberIndex, 1)[0];
//         removedStudents.push(removedStudent);
//     });
    
//     // Add removed students to remaining students
//     removedStudents.forEach(student => {
//         window.currentRemaining.push(student);
//     });
    
//     // If team is empty, remove it
//     if (team.length === 0) {
//         window.currentTeams.splice(teamIndex, 1);
//     }
    
//     // Refresh displays
//     displayTeams(window.currentTeams, window.currentRemaining);
//     displayStudents();
// }

// function copyAllTeams() {
//     const teams = window.currentTeams;
//     const remaining = window.currentRemaining;
//     let text = '';
    
//     teams.forEach((team, index) => {
//         text += `Team ${index + 1}:\n`;
//         team.forEach(student => {
//             text += `• ${student.name} (${student.campusId}) - ${branchNames[student.branch]}\n`;
//         });
//         text += '\n';
//     });
    
//     if (remaining && remaining.length > 0) {
//         text += `Students Not Assigned (${remaining.length}):\n`;
//         remaining.forEach(student => {
//             text += `• ${student.name} (${student.campusId}) - ${branchNames[student.branch]}\n`;
//         });
//     }
    
//     navigator.clipboard.writeText(text);
// }

// function generateLink() {
//     if (!window.currentTeams || window.currentTeams.length === 0) {
//         alert('No teams to share. Please generate teams first.');
//         return;
//     }
    
//     const shareData = JSON.stringify({ teams: window.currentTeams });
//     const encodedData = btoa(shareData);
//     const shareUrl = 'shared-teams.html?data=' + encodedData;
    
//     prompt('Copy this link to share with students:', shareUrl);
// }

// function copyRemoved() {
//     const removed = window.removedStudents;
//     let text = `Removed Students (${removed.length}):\n`;
//     removed.forEach(student => {
//         text += `• ${student.name} (${student.campusId}) - ${branchNames[student.branch]}\n`;
//     });
    
//     navigator.clipboard.writeText(text);
// }

// function toggleAddStudent(teamIndex) {
//     const addSection = document.getElementById(`addSection-${teamIndex}`);
//     const addBtn = document.getElementById(`addBtn-${teamIndex}`);
//     const select = document.getElementById(`addStudentSelect-${teamIndex}`);
    
//     const isAdding = addBtn.textContent === 'ADD';
    
//     if (isAdding) {
//         // Populate select with available students
//         populateAvailableStudents(teamIndex);
//         addSection.style.display = 'block';
//         addBtn.textContent = 'DONE';
//         addBtn.className = 'add-student-btn active';
//     } else {
//         cancelAddStudent(teamIndex);
//     }
// }

// function populateAvailableStudents(teamIndex) {
//     const select = document.getElementById(`addStudentSelect-${teamIndex}`);
//     select.innerHTML = '<option value="">SELECT STUDENT TO ADD</option>';
    
//     const allOptions = [];
    
//     // Only collect remaining students (unassigned)
//     if (window.currentRemaining) {
//         window.currentRemaining.forEach((student, studentIndex) => {
//             allOptions.push({
//                 value: `remaining-${studentIndex}`,
//                 text: `${student.name} (${student.campusId}) - ${branchNames[student.branch]}`,
//                 name: student.name
//             });
//         });
//     }
    
//     // Collect removed students
//     if (window.removedStudents) {
//         window.removedStudents.forEach((student, studentIndex) => {
//             allOptions.push({
//                 value: `removed-${studentIndex}`,
//                 text: `${student.name} (${student.campusId}) - ${branchNames[student.branch]} [REMOVED]`,
//                 name: student.name
//             });
//         });
//     }
    
//     // Sort alphabetically by name
//     allOptions.sort((a, b) => a.name.localeCompare(b.name));
    
//     // Add sorted options to select
//     allOptions.forEach(optionData => {
//         const option = document.createElement('option');
//         option.value = optionData.value;
//         option.textContent = optionData.text;
//         select.appendChild(option);
//     });
// }

// function addStudentToTeam(teamIndex) {
//     const select = document.getElementById(`addStudentSelect-${teamIndex}`);
//     const selectedValue = select.value;
    
//     if (!selectedValue) return;
    
//     const [source, ...params] = selectedValue.split('-');
//     let studentToAdd = null;
    
//     if (source === 'pool') {
//         const branch = params[0];
//         const studentIndex = parseInt(params[1]);
//         studentToAdd = students[branch][studentIndex];
        
//         // Convert to team format
//         if (typeof studentToAdd === 'string') {
//             studentToAdd = { name: studentToAdd, campusId: 'XXXX', branch };
//         } else {
//             studentToAdd = { name: studentToAdd.name, campusId: studentToAdd.campusId, branch };
//         }
        
//         // Remove from pool
//         students[branch].splice(studentIndex, 1);
//     } else if (source === 'remaining') {
//         const studentIndex = parseInt(params[0]);
//         studentToAdd = window.currentRemaining[studentIndex];
//         window.currentRemaining.splice(studentIndex, 1);
//     } else if (source === 'removed') {
//         const studentIndex = parseInt(params[0]);
//         studentToAdd = window.removedStudents[studentIndex];
//         window.removedStudents.splice(studentIndex, 1);
//     }
    
//     if (studentToAdd) {
//         // Check if student is already in another team
//         for (let i = 0; i < window.currentTeams.length; i++) {
//             if (i !== teamIndex) {
//                 const existingStudent = window.currentTeams[i].find(member => 
//                     member.name === studentToAdd.name || member.campusId === studentToAdd.campusId
//                 );
//                 if (existingStudent) {
//                     alert(`${studentToAdd.name} is already assigned to Team ${i + 1}. Please remove them from that team first.`);
//                     return;
//                 }
//             }
//         }
        
//         window.currentTeams[teamIndex].push(studentToAdd);
//         displayTeams(window.currentTeams, window.currentRemaining);
//         displayStudents();
//     }
// }

// function cancelAddStudent(teamIndex) {
//     const addSection = document.getElementById(`addSection-${teamIndex}`);
//     const addBtn = document.getElementById(`addBtn-${teamIndex}`);
    
//     addSection.style.display = 'none';
//     addBtn.textContent = 'ADD';
//     addBtn.className = 'add-student-btn';
// }

// function returnToPool() {
//     if (!window.removedStudents || window.removedStudents.length === 0) return;
    
//     // Add removed students back to pool
//     window.removedStudents.forEach(student => {
//         const studentObj = {
//             name: student.name,
//             campusId: student.campusId,
//             branch: student.branch,
//             display: `${student.name} (${student.campusId}) - ${branchNames[student.branch]}`
//         };
//         students[student.branch].push(studentObj);
//     });
    
//     // Clear removed students
//     window.removedStudents = [];
    
//     // Refresh displays
//     displayTeams(window.currentTeams || [], window.currentRemaining || []);
//     displayStudents();
// }

// function toggleCaptainImport() {
//     const section = document.getElementById('captainImportSection');
//     const btn = document.getElementById('captainImportBtn');
    
//     if (section.style.display === 'none' || section.style.display === '') {
//         section.style.display = 'block';
//         btn.textContent = 'CAPTAIN IMPORT ▲';
//     } else {
//         section.style.display = 'none';
//         btn.textContent = 'CAPTAIN IMPORT ▼';
//     }
// }

// function bulkAddCaptains() {
//     const text = document.getElementById('bulkCaptains').value.trim();
//     if (!text) {
//         alert('Please enter captain data');
//         return;
//     }
    
//     const lines = text.split('\n').filter(line => line.trim());
//     let addedCount = 0;
    
//     lines.forEach(line => {
//         const parsed = parseStudentLine(line.trim());
//         if (parsed && parsed.name) {
//             const displayText = parsed.section ? 
//                 `${parsed.section}// ${parsed.name} (${parsed.campusId}) [${parsed.gender}] - ${branchNames[parsed.branch]}` :
//                 `${parsed.name} (${parsed.campusId}) [${parsed.gender}] - ${branchNames[parsed.branch]}`;
            
//             const captainInfo = {
//                 display: displayText,
//                 name: parsed.name,
//                 campusId: parsed.campusId,
//                 branch: parsed.branch,
//                 section: parsed.section,
//                 gender: parsed.gender,
//                 isCaptain: true
//             };
            
//             // Check if already exists as captain
//             const existsInCaptains = captains[parsed.branch].some(s => s.name === parsed.name || s.campusId === parsed.campusId);
            
//             if (existsInCaptains) {
//                 // Already a captain, skip
//                 return;
//             }
            
//             // Check if exists as student - if so, promote to captain
//             const studentIndex = students[parsed.branch].findIndex(s => s.name === parsed.name || s.campusId === parsed.campusId);
            
//             if (studentIndex !== -1) {
//                 // Remove from students and add as captain
//                 students[parsed.branch].splice(studentIndex, 1);
//                 captains[parsed.branch].push(captainInfo);
//                 addedCount++;
//             } else {
//                 // New captain, add directly
//                 captains[parsed.branch].push(captainInfo);
//                 addedCount++;
//             }
//         }
//     });
    
//     document.getElementById('bulkCaptains').value = '';
//     displayStudents();
//     alert(`Added ${addedCount} captains successfully!`);
// }

// function searchStudent() {
//     const query = document.getElementById('searchInput').value.trim().toLowerCase();
//     const resultDiv = document.getElementById('searchResult');
    
//     if (!query) {
//         resultDiv.style.display = 'none';
//         return;
//     }
    
//     if (!window.currentTeams || window.currentTeams.length === 0) {
//         resultDiv.innerHTML = 'No teams generated yet.';
//         resultDiv.style.display = 'block';
//         return;
//     }
    
//     // Search in teams
//     let found = false;
//     for (let teamIndex = 0; teamIndex < window.currentTeams.length; teamIndex++) {
//         const team = window.currentTeams[teamIndex];
//         for (let memberIndex = 0; memberIndex < team.length; memberIndex++) {
//             const student = team[memberIndex];
//             if (student.name.toLowerCase().includes(query) || student.campusId.includes(query)) {
//                 resultDiv.innerHTML = `Found: <strong>${student.name}</strong> (${student.campusId}) in <strong>Team ${teamIndex + 1}</strong>`;
//                 resultDiv.style.display = 'block';
                
//                 // Highlight the team
//                 const teamElement = document.getElementById(`team-${teamIndex}`);
//                 if (teamElement) {
//                     teamElement.classList.add('search-highlight');
//                     teamElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//                     setTimeout(() => teamElement.classList.remove('search-highlight'), 3000);
//                 }
//                 found = true;
//                 return;
//             }
//         }
//     }
    
//     // Search in remaining students
//     if (!found && window.currentRemaining) {
//         for (const student of window.currentRemaining) {
//             if (student.name.toLowerCase().includes(query) || student.campusId.includes(query)) {
//                 resultDiv.innerHTML = `Found: <strong>${student.name}</strong> (${student.campusId}) in <strong>Unassigned Students</strong>`;
//                 resultDiv.style.display = 'block';
//                 found = true;
//                 return;
//             }
//         }
//     }
    
//     if (!found) {
//         resultDiv.innerHTML = `Student "${query}" not found in any team.`;
//         resultDiv.style.display = 'block';
//     }
// }

// // Allow Enter key to add student
// document.getElementById('studentName').addEventListener('keypress', function(e) {
//     if (e.key === 'Enter') {
//         addStudent();
//     }
// });

// // Allow Enter key to search student
// document.addEventListener('DOMContentLoaded', function() {
//     document.getElementById('searchInput').addEventListener('keypress', function(e) {
//         if (e.key === 'Enter') {
//             searchStudent();
//         }
//     });
// });

// // Event Management
// let currentEvent = 'default';
// let events = {
//     default: {
//         name: 'Default Event',
//         students: {},
//         captains: {},
//         teams: []
//     }
// };

// function createNewEvent() {
//     const eventName = prompt('Enter event name:');
//     if (eventName) {
//         const eventId = 'event_' + Date.now();
//         events[eventId] = {
//             name: eventName,
//             students: JSON.parse(JSON.stringify(students)),
//             captains: JSON.parse(JSON.stringify(captains)),
//             teams: []
//         };
        
//         const select = document.getElementById('eventSelect');
//         const option = document.createElement('option');
//         option.value = eventId;
//         option.textContent = eventName;
//         select.appendChild(option);
//         select.value = eventId;
//         currentEvent = eventId;
//     }
// }

// function saveCurrentEvent() {
//     if (events[currentEvent]) {
//         events[currentEvent].students = JSON.parse(JSON.stringify(students));
//         events[currentEvent].captains = JSON.parse(JSON.stringify(captains));
//         events[currentEvent].teams = window.currentTeams || [];
//         alert('Event saved successfully!');
//     }
// }

// function loadEvent() {
//     const eventId = document.getElementById('eventSelect').value;
//     if (events[eventId]) {
//         Object.assign(students, events[eventId].students);
//         Object.assign(captains, events[eventId].captains);
//         window.currentTeams = events[eventId].teams || [];
//         currentEvent = eventId;
//         displayStudents();
//         if (window.currentTeams.length > 0) {
//             displayTeams(window.currentTeams, []);
//         }
//         alert('Event loaded successfully!');
//     }
// }

// // Data Management
// function importFromFile() {
//     const file = document.getElementById('csvImport').files[0];
//     if (!file) return;
    
//     const reader = new FileReader();
//     reader.onload = function(e) {
//         const text = e.target.result;
//         const lines = text.split('\n').filter(line => line.trim());
//         let imported = 0;
        
//         lines.forEach((line, index) => {
//             if (index === 0) return; // Skip header
//             const parsed = parseStudentLine(line.replace(/,/g, ' '));
//             if (parsed) {
//                 const studentInfo = {
//                     display: `${parsed.name} (${parsed.campusId}) [${parsed.gender}] - ${branchNames[parsed.branch]}`,
//                     name: parsed.name,
//                     campusId: parsed.campusId,
//                     branch: parsed.branch,
//                     gender: parsed.gender
//                 };
                
//                 if (!students[parsed.branch].some(s => s.campusId === parsed.campusId)) {
//                     students[parsed.branch].push(studentInfo);
//                     imported++;
//                 }
//             }
//         });
        
//         displayStudents();
//         alert(`Imported ${imported} students successfully!`);
//     };
//     reader.readAsText(file);
// }

// function exportToCSV() {
//     let csv = 'Name,Campus ID,Branch,Gender,Type\n';
    
//     for (const [branch, studentList] of Object.entries(students)) {
//         studentList.forEach(student => {
//             csv += `${student.name},${student.campusId},${branch},${student.gender || 'Unknown'},Student\n`;
//         });
//     }
    
//     for (const [branch, captainList] of Object.entries(captains)) {
//         captainList.forEach(captain => {
//             csv += `${captain.name},${captain.campusId},${branch},${captain.gender || 'Unknown'},Captain\n`;
//         });
//     }
    
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
// }

// function exportToExcel() {
//     let html = '<table><tr><th>Name</th><th>Campus ID</th><th>Branch</th><th>Gender</th><th>Type</th></tr>';
    
//     for (const [branch, studentList] of Object.entries(students)) {
//         studentList.forEach(student => {
//             html += `<tr><td>${student.name}</td><td>${student.campusId}</td><td>${branch}</td><td>${student.gender || 'Unknown'}</td><td>Student</td></tr>`;
//         });
//     }
    
//     for (const [branch, captainList] of Object.entries(captains)) {
//         captainList.forEach(captain => {
//             html += `<tr><td>${captain.name}</td><td>${captain.campusId}</td><td>${branch}</td><td>${captain.gender || 'Unknown'}</td><td>Captain</td></tr>`;
//         });
//     }
    
//     html += '</table>';
    
//     const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `students_${new Date().toISOString().split('T')[0]}.xls`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
// }





// // Create Team from Remaining Students
// function createTeamFromRemaining() {
//     const teamSize = parseInt(document.getElementById('teamSize').value);
//     const maleCount = parseInt(document.getElementById('maleCount').value) || 0;
//     const femaleCount = parseInt(document.getElementById('femaleCount').value) || 0;
    
//     if (!window.currentRemaining || window.currentRemaining.length < teamSize) {
//         alert('Not enough remaining students to form a complete team');
//         return;
//     }
    
//     // Create new team from remaining students
//     const newTeam = [];
//     const availableStudents = [...window.currentRemaining];
    
//     // Try to meet gender requirements if specified
//     let malesAdded = 0;
//     let femalesAdded = 0;
    
//     // First, add students to meet gender requirements
//     if (maleCount > 0 || femaleCount > 0) {
//         // Add required males
//         while (malesAdded < maleCount && newTeam.length < teamSize) {
//             const maleIndex = availableStudents.findIndex(s => s.gender === 'Male');
//             if (maleIndex !== -1) {
//                 newTeam.push(availableStudents.splice(maleIndex, 1)[0]);
//                 malesAdded++;
//             } else {
//                 break;
//             }
//         }
        
//         // Add required females
//         while (femalesAdded < femaleCount && newTeam.length < teamSize) {
//             const femaleIndex = availableStudents.findIndex(s => s.gender === 'Female');
//             if (femaleIndex !== -1) {
//                 newTeam.push(availableStudents.splice(femaleIndex, 1)[0]);
//                 femalesAdded++;
//             } else {
//                 break;
//             }
//         }
//     }
    
//     // Fill remaining positions with any available students
//     while (newTeam.length < teamSize && availableStudents.length > 0) {
//         // Prioritize captains if available
//         const captainIndex = availableStudents.findIndex(s => s.isCaptain);
//         if (captainIndex !== -1 && !newTeam.some(m => m.isCaptain)) {
//             newTeam.push(availableStudents.splice(captainIndex, 1)[0]);
//         } else {
//             // Add first available student
//             newTeam.push(availableStudents.shift());
//         }
//     }
    
//     if (newTeam.length === teamSize) {
//         // Add new team to current teams
//         if (!window.currentTeams) {
//             window.currentTeams = [];
//         }
//         window.currentTeams.push(newTeam);
        
//         // Update remaining students
//         window.currentRemaining = availableStudents;
        
//         // Refresh display
//         displayTeams(window.currentTeams, window.currentRemaining);
        
//         alert(`New team created successfully with ${teamSize} members!`);
//     } else {
//         alert('Could not create a complete team with the specified requirements');
//     }
// }

window.location.href = 'dashboard.html';