

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  window.location.href = "login.html"; 
} else {
  const username = currentUser.username;
  const hasCompletedSecondStep = currentUser.completedSecondStep;
  const isadmin = currentUser.isAdmin;
  if (isadmin) {
    window.location.href = "dashboard.html";
  } else {
    if (!hasCompletedSecondStep) {
      window.location.href = "dashboard.html";} 
      else{
      document.getElementById(
        "welcomeMessage"
      ).textContent = `${username}さん - 追加情報 - Please complete your profile`;
      }
  }
}

async function logout() {
    localStorage.removeItem('currentUser');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_')) {
            localStorage.removeItem(key);
        }
    });
    
    await window.supabase.auth.signOut();
    
    window.location.href = 'login.html';
    
    return false; 
}

async function handleSubmitInfo(event) {
    event.preventDefault();
    
    const admissionNumber = document.getElementById('admissionNumber').value;
    const section = document.getElementById('section').value;
    const department = document.getElementById('department').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    
    const genderCode = gender === 'male' ? 'M' : 'F';
    
    try {
        
        const { data: members, error: queryError } = await window.supabase
            .from('members')
            .select('*')
            .eq('admissionNumber', admissionNumber)
            .limit(1);
        
        if (queryError || !members || members.length === 0) {
            showMessage('Cannot find member with this admission number. Please check your information.', true);
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'login.html';
            }, 3000);
            return;
        }
        
        const memberData = members[0];
        
        const detailsMatch = 
            memberData.section === section &&
            memberData.department === department &&
            memberData.gender === genderCode;
        
        if (!detailsMatch) {
            showMessage('Details do not match our records. Please check your information.', true);
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'login.html';
            }, 3000);
            return;
        }
        
        const confirmed = confirm(`Is this you?\n\nAdmission: ${memberData.admissionNumber}\nName: ${memberData.name}\nSection: ${memberData.section}\nDepartment: ${memberData.department}\nGender: ${memberData.gender}\n\nClick OK to confirm, Cancel if this is not you.`);
        
        if (confirmed) {
            const { data: { user: currentUser } } = await window.supabase.auth.getUser();
            
            if (!currentUser) {
                showMessage('User not authenticated', true);
                return;
            }
            
            const { error: updateError } = await supabase
                .from('Users')
                .update({ admissionNumber: admissionNumber , verified: true })
                .eq('uuid', currentUser.id);
            
            if (updateError) {
                showMessage('Error updating user: ' + updateError.message, true);
                return;
            }
            
            showMessage('Member verification successful! Redirecting...', false);
            onSecondStepComplete();
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } else {
            showMessage('Member verification cancelled. Redirecting to login...', true);
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'login.html';
            }, 3000);
        }
        
    } catch (error) {
        console.error('Submit info error:', error);
        showMessage('Error verifying member: ' + error.message, true);
    }
}

function showMessage(message, isError) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${isError ? '#fef2f2' : '#f0f9ff'};
        border: 2px solid ${isError ? '#fecaca' : '#bae6fd'};
        color: ${isError ? '#dc2626' : '#0369a1'};
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-family: 'Noto Sans JP', sans-serif;
    `;
    messageBox.textContent = message;
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        if (document.body.contains(messageBox)) {
            document.body.removeChild(messageBox);
        }
    }, 5000);
}


async function onSecondStepComplete() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    currentUser.completedSecondStep = false;
    currentUser.admissionNumber = "someNumber"; 
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    if (user) {
        await supabase
            .from('Users')
            .update({
                admissionNumber: "someNumber",
                verified: true
            })
            .eq('uuid', user.id);
    }
}

document.getElementById('infoForm').addEventListener('submit', handleSubmitInfo);
