let currentTeam = null;
let teamMembers = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    loadTeamData();
    setupEventListeners();
});

function setupEventListeners() {
    const teamInput = document.getElementById('teamNameInput');
    teamInput.addEventListener('blur', saveTeamName);
    teamInput.addEventListener('keypress', e => e.key === 'Enter' && e.target.blur());
}

async function loadTeamData() {
    try {
        showLoading();
        currentUser = await getCurrentUser();
        
        if (!currentUser) {
            showError("Please log in to view your team");
            return;
        }
        
        await loadUserTeam();
        currentTeam ? await loadTeamMembers() : showNoTeamMessage();
        displayTeamData();
    } catch (error) {
        showError("Failed to load team data: " + (error.message || 'Network error'));
    } finally {
        hideLoading();
    }
}

async function loadTeamMembers() {
    if (!currentTeam?.members?.length) {
        teamMembers = [];
        return;
    }

    const memberIds = currentTeam.members.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (memberIds.length === 0) {
        teamMembers = [];
        return;
    }

    const { data: members, error } = await supabase
        .from('members')
        .select('*')
        .in('id', memberIds);

    if (error) throw error;
    teamMembers = members || [];
}

async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return {
        id: session.user.id,
        name: session.user.email,
        email: session.user.email,
        isAdmin: false
    };

    const userData = JSON.parse(storedUser);
    const admissionNumber = userData.admissionNumber;

    const { data: userDb } = await supabase
        .from("members")
        .select("*")
        .eq("id", admissionNumber)
        .single();

    return userDb ? {
        id: userData.id || session.user.id,
        name: userData.name || session.user.email,
        email: userData.email || session.user.email,
        admissionNumber: admissionNumber,
        department: userDb.department,
        section: userDb.section,
        gender: userDb.gender,
        isAdmin: userData.isAdmin || false
    } : null;
}

async function loadUserTeam() {
    if (!currentUser) return;

    const { data: userData } = await supabase
        .from('members')
        .select('teamId')
        .eq('id', currentUser.admissionNumber)
        .single();

    if (userData?.teamId) {
        const { data: teamData } = await supabase
            .from('Teams')
            .select('*')
            .eq('id', userData.teamId)
            .single();
        currentTeam = teamData;
    }
}

function displayTeamData() {
    if (!currentTeam) return;

    const isCaptain = currentTeam.captain === currentUser.admissionNumber;
    
    document.getElementById('teamNameInput').value = currentTeam.name || `Team ${currentTeam.id}`;
    
    const nameButtons = document.getElementById('teamNameButtons');
    if (isCaptain) {
        nameButtons.style.display = 'flex';
        setupTeamNameEditing();
    } else {
        nameButtons.style.display = 'none';
        document.getElementById('teamNameInput').disabled = true;
    }
    
    updateTeamSubtitle();
    updateTeamStats();
    displayTeamMembers();
    loadDeadlines();
}


function setupTeamNameEditing() {
    const nameInput = document.getElementById('teamNameInput');
    const editBtn = document.getElementById('editTeamBtn');
    const saveBtn = document.getElementById('saveTeamBtn');
    const cancelBtn = document.getElementById('cancelTeamBtn');
    let originalName = nameInput.value;

    editBtn.addEventListener('click', () => {
        nameInput.disabled = false;
        nameInput.focus();
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
    });

    cancelBtn.addEventListener('click', () => {
        nameInput.value = originalName;
        nameInput.disabled = true;
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    });

    saveBtn.addEventListener('click', saveTeamName);
    
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveTeamName();
        }
    });
}
function updateTeamSubtitle() {
    const memberCount = teamMembers.length;
    document.getElementById('teamSubtitle').textContent = `${memberCount} Member${memberCount !== 1 ? 's' : ''}`;
}

function updateTeamStats() {
    const memberCount = teamMembers.length;
    const maleCount = teamMembers.filter(m => m.gender === 'M').length;
    const femaleCount = teamMembers.filter(m => m.gender === 'F').length;
    
    document.getElementById('memberCount').textContent = memberCount;
    document.getElementById('maleCount').textContent = maleCount;
    document.getElementById('femaleCount').textContent = femaleCount;
}

function displayTeamMembers() {
    const memberGrid = document.getElementById('memberGrid');
    
    if (teamMembers.length === 0) {
        memberGrid.innerHTML = '<div class="empty-state">No team members found</div>';
        return;
    }

    memberGrid.innerHTML = teamMembers.map(member => {
        const isCaptain = currentTeam.captain === member.id;
        const isCurrentUser = currentUser && member.id === currentUser.id;
        
        return `
            <div class="member-card ${isCaptain ? 'captain' : ''}">
                <div class="member-info">
                    <div class="member-name">
                        ${member.name}
                        ${isCaptain ? '<span class="badge badge-captain">Captain</span>' : ''}
                        ${isCurrentUser ? '<span class="badge badge-you">You</span>' : ''}
                    </div>
                    <div class="member-role">
                        ${member.department || 'Unknown'} • Section ${member.section || 'N/A'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function saveTeamName() {
    if (!currentTeam) return;

    const nameInput = document.getElementById('teamNameInput');
    const editBtn = document.getElementById('editTeamBtn');
    const saveBtn = document.getElementById('saveTeamBtn');
    const cancelBtn = document.getElementById('cancelTeamBtn');
    
    const newName = nameInput.value.trim();
    const originalName = currentTeam.name || `Team ${currentTeam.id}`;

    if (!newName) {
        showError("Team name cannot be empty");
        nameInput.value = originalName;
        return;
    }

    if (newName === originalName) {
        // No changes, just reset UI
        nameInput.disabled = true;
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        return;
    }

    try {
        showLoading();

        const { data: existingTeams } = await supabase
            .from('Teams')
            .select('id')
            .eq('name', newName)
            .neq('id', currentTeam.id);

        if (existingTeams && existingTeams.length > 0) {
            throw new Error('Team name already taken');
        }

        const { error: teamError } = await supabase
            .from('Teams')
            .update({ 
                name: newName,
            })
            .eq('id', currentTeam.id);

        if (teamError) throw teamError;


        const { error: memberError } = await supabase
            .from('members')
            .update({ 
                teamname: newName,
            })
            .eq('teamId', currentTeam.id);

        if (memberError) throw memberError;

        currentTeam.name = newName;
        teamMembers.forEach(member => {
            member.teamname = newName;
        });

      
        nameInput.disabled = true;
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        
        showSuccess('Team name updated successfully!');

    } catch (error) {
        console.error("Error updating team name:", error);
        showError(error.message === 'Team name already taken' 
            ? "Team name already taken. Please choose a different name."
            : "Failed to update team name"
        );
        nameInput.value = originalName;
        nameInput.disabled = true;
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    } finally {
        hideLoading();
    }
}

function loadDeadlines() {
    document.getElementById('deadlinesList').innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
}

function showNoTeamMessage() {
    document.querySelector('body[data-section="myTeam"]').innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
            <h2>No Team Assigned</h2>
            <p>You are not currently assigned to any team.</p>
            <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
        </div>
    `;
}

function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingScreen').style.display = 'none';
}

function showSuccess(message) {
    showNotification(message, 'var(--success)');
}

function showError(message) {
    showNotification(message, 'var(--danger)');
}

function showNotification(message, color) {
    const notification = document.createElement('div');
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