export {};

declare const supabase: any;

interface Member {
    id: number | string;
    name: string;
    email?: string;
    department?: string;
    section?: string;
    gender?: string;
    admissionNumber?: number | string;
    isCaptain?: boolean;
}

interface Team {
    id: number | string;
    name?: string;
    members?: (number | string)[];
    captain?: number | string;
    locked?: boolean;
}

interface User {
    id: string | number;
    name: string;
    email: string;
    isAdmin: boolean;
    admissionNumber?: number | string;
    department?: string;
    section?: string;
    gender?: string;
}

// ---------- State ----------
let currentTeam: Team | null = null;
let teamMembers: Member[] = [];
let currentUser: User | null = null;

// ---------- DOM Loaded ----------
document.addEventListener("DOMContentLoaded", () => {
    loadTeamData();
    setupEventListeners();
});

// ---------- Event Listeners ----------
function setupEventListeners(): void {
    const teamInput = document.getElementById('teamNameInput') as HTMLInputElement | null;
    if (!teamInput) return;

    teamInput.addEventListener('blur', saveTeamName);
    teamInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    });
}

// ---------- Load User + Team ----------
async function loadTeamData(): Promise<void> {
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

    } catch (error: any) {
        showError("Failed to load team data: " + (error?.message || "Network error"));
    } finally {
        hideLoading();
    }
}

// ---------- Load Team Members ----------
async function loadTeamMembers(): Promise<void> {
    if (!currentTeam?.members?.length) {
        teamMembers = [];
        return;
    }

    const memberIds = currentTeam.members
        .map(id => parseInt(String(id)))
        .filter(id => !isNaN(id));

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

// ---------- Get Current User ----------
async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // Get user from Users table (authentication info)
  const { data: authUser } = await supabase
    .from('Users')
    .select('*')
    .eq('uuid', session.user.id)
    .single();

  if (!authUser) return null;

  // Ensure admissionNumber is properly formatted
  const admissionNumber = authUser.admissionNumber ? 
    Number(authUser.admissionNumber) : null;

  // Get member details from members table
  const { data: memberData } = await supabase
    .from('members')
    .select('*')
    .eq('admissionNumber', admissionNumber)
    .single();

  return {
    id: session.user.id,
    name: memberData?.name || authUser.username || session.user.email,
    email: authUser.email || session.user.email,
    admissionNumber: admissionNumber?.toString() ,
    department: memberData?.department,
    section: memberData?.section,
    gender: memberData?.gender,
    isAdmin: authUser.isAdmin || false
  };
}
// ---------- Load User Team ----------
async function loadUserTeam(): Promise<void> {
  if (!currentUser || !currentUser.admissionNumber) return;

  // Get all teams and filter client-side
  const { data: allTeamsData, error } = await supabase
    .from('Teams')
    .select('*');

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
  currentTeam = allTeamsData.find((team: { members: (string | number | undefined)[]; }) => {
    if (!team.members || !Array.isArray(team.members)) return false;
    
    return team.members.some((memberId: string | number | undefined) => {
      // Handle both string and number comparisons
      return String(memberId) === admissionNumberStr || 
             Number(memberId) === admissionNumberNum ||
             memberId === currentUser!.admissionNumber;
    });
  }) || null;
}

// ---------- Display All Team Info ----------
function displayTeamData(): void {
    if (!currentTeam || !currentUser) return;

    const isCaptain = currentTeam.captain == currentUser.admissionNumber;
    const input = document.getElementById('teamNameInput') as HTMLInputElement | null;
    const nameButtons = document.getElementById('teamNameButtons') as HTMLElement | null;

    if (!input) return;

    input.value = currentTeam.name || `Team ${currentTeam.id}`;

    if (isCaptain) {
        // Enable editing for captain
        if (nameButtons) nameButtons.style.display = "block";
        input.disabled = false;
    } else {
        if (nameButtons) nameButtons.style.display = "none";
        input.disabled = true;
    }

    updateTeamSubtitle();
    updateTeamStats();
    displayTeamMembers();
    loadDeadlines();
}

// ---------- Team Subtitle ----------
function updateTeamSubtitle(): void {
    const memberCount = teamMembers.length;
    const el = document.getElementById('teamSubtitle');
    if (el) el.textContent = `${memberCount} Member${memberCount !== 1 ? "s" : ""}`;
}

// ---------- Stats ----------
function updateTeamStats(): void {
    const memberCount = teamMembers.length;
    const maleCount = teamMembers.filter(m => m.gender === 'M').length;
    const femaleCount = teamMembers.filter(m => m.gender === 'F').length;

    const memberCountEl = document.getElementById('memberCount');
    const maleCountEl = document.getElementById('maleCount');
    const femaleCountEl = document.getElementById('femaleCount');

    if (memberCountEl) memberCountEl.textContent = String(memberCount);
    if (maleCountEl) maleCountEl.textContent = String(maleCount);
    if (femaleCountEl) femaleCountEl.textContent = String(femaleCount);
}

// ---------- Member Grid ----------
function displayTeamMembers(): void {
    const grid = document.getElementById('memberGrid');
    if (!grid) return;

    if (teamMembers.length === 0) {
        grid.innerHTML = '<div class="empty-state">No team members found</div>';
        return;
    }

    grid.innerHTML = teamMembers.map(member => {
        const isCaptain = currentTeam?.captain === member.admissionNumber;
        const isSelf = currentUser && member.admissionNumber === currentUser.admissionNumber;

        return `
            <div class="member-card ${isCaptain ? 'captain' : ''}">
                <div class="member-info">
                    <div class="member-name">
                        ${member.name}
                        ${isCaptain ? '<span class="badge badge-captain">Captain</span>' : ''}
                        ${isSelf ? '<span class="badge badge-you">You</span>' : ''}
                    </div>
                    <div class="member-role">
                        ${member.department || 'Unknown'} • Section ${member.section ?? 'N/A'}
                    </div>
                    <div class="member-id">
                        Admission: ${member.admissionNumber || 'N/A'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ---------- Save Team Name ----------
async function saveTeamName(): Promise<void> {
    if (!currentTeam) return;

    const nameInput = document.getElementById('teamNameInput') as HTMLInputElement | null;
    const editBtn = document.getElementById('editTeamBtn') as HTMLElement | null;
    const saveBtn = document.getElementById('saveTeamBtn') as HTMLElement | null;
    const cancelBtn = document.getElementById('cancelTeamBtn') as HTMLElement | null;

    if (!nameInput) return;

    const newName = nameInput.value.trim();
    const originalName = currentTeam.name || `Team ${currentTeam.id}`;

    if (!newName) {
        showError("Team name cannot be empty");
        nameInput.value = originalName;
        return;
    }

    if (newName === originalName) {
        nameInput.disabled = true;
        if (editBtn) editBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
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

        const { data: existingTeams } = await supabase
            .from('Teams')
            .select('id')
            .eq('name', newName)
            .neq('id', currentTeam.id);

        if (existingTeams?.length > 0) {
            throw new Error('Team name already taken');
        }

        const { error } = await supabase
            .from('Teams')
            .update({ name: newName })
            .eq('id', currentTeam.id);

        if (error) throw error;

        currentTeam.name = newName;

        nameInput.disabled = true;
        if (editBtn) editBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';

        showSuccess("Team name updated successfully!");

    } catch (error: any) {
        showError(
            error.message === "Team name already taken"
                ? "Team name already taken. Choose a different name."
                : "Failed to update team name"
        );

        nameInput.value = originalName;
        nameInput.disabled = true;

        if (editBtn) editBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
    } finally {
        hideLoading();
    }
}

// ---------- Deadlines Placeholder ----------
function loadDeadlines(): void {
    const list = document.getElementById('deadlinesList');
    if (list) list.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
}

// ---------- No Team ----------
function showNoTeamMessage(): void {
    const body = document.querySelector('body[data-section="myTeam"]') as HTMLElement | null;
    if (!body) return;

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
function showLoading(): void {
    const el = document.getElementById('loadingScreen');
    if (el) el.style.display = 'flex';
}

function hideLoading(): void {
    const el = document.getElementById('loadingScreen');
    if (el) el.style.display = 'none';
}

function showSuccess(message: string): void {
    showNotification(message, 'var(--success)');
}

function showError(message: string): void {
    showNotification(message, 'var(--danger)');
}

function showNotification(message: string, color: string): void {
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