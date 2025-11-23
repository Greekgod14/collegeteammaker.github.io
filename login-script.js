// function handleLogin() {
//   const username = document.getElementById("username").value;
//   const password = document.getElementById("password").value;

//   if (!username || !password) {
//     alert("Please enter username and password");
//     return;
//   }

//   // Check hardcoded admin first
//   if (username === "admin" && password === "admin123") {
//     localStorage.setItem("currentUser", JSON.stringify({ username: "admin" }));
//     showTempleGateAnimation();
//     setTimeout(() => {
//       window.location.href = "index.html";
//     }, 3000);
//     return;
//   }

//   // Check registered users
//   var storedUser = localStorage.getItem("user_" + username);
//   var user = null;
//   if (storedUser) {
//     user = JSON.parse(storedUser);
//     if (user.password !== password) {
//       user = null;
//     }
//   }

//   if (user) {
//     localStorage.setItem("currentUser", JSON.stringify(user));
//     showTempleGateAnimation();
//     setTimeout(() => {
//       window.location.href = "index.html";
//     }, 3000);
//   } else {
//     alert("Invalid credentials!");
//   }
// }

// const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// if (!currentUser) {
//   showLogin();
// } else {
//   const username = currentUser.username;
//   const hasCompletedSecondStep = currentUser.completedSecondStep;
//   const isadmin = currentUser.isAdmin;
//   if (isadmin) {
//     window.location.href = "dashboard.html";
//   } else {
//     if (hasCompletedSecondStep) {
//       window.location.href = "signupprocess.html";
//     } else {
//       window.location.href = "index.html";}
//   }
// }

showLogin();

function showSignup() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
  document.getElementById("headerTitle").textContent = "Sign Up";
}

function showLogin() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("headerTitle").textContent = "Login";
}
async function login(username, password) {
  try {
    console.log("=== Login Attempt ===");
    console.log("Username:", username);

    // Step 1: Query user by username
    const { data: users, error: queryError } = await window.supabase
      .from("Users")
      .select("*")
      .eq("username", username)
      .limit(1);

    if (queryError) {
      console.error("User query failed:", queryError);
      return { success: false, error: "Database error. Please try again." };
    }

    if (!users || users.length === 0) {
      console.error("User not found");
      return { success: false, error: "Username not found" };
    }

    const userData = users[0];
    const userEmail = userData.email;
    console.log("Found user email:", userEmail);

    // Step 2: Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await window.supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

    if (authError) {
      console.error("Auth error:", authError.message);
      return { success: false, error: "Invalid password" };
    }

    if (!authData?.user || !authData?.session) {
      console.error("No auth data returned");
      return { success: false, error: "Authentication failed" };
    }

    console.log("Auth successful, user ID:", authData.user.id);

    // Step 3: Ensure session is set
    console.log("Setting session...");
    await window.supabase.auth.setSession(authData.session);
    
    // Step 4: Wait for session to persist
    console.log("Waiting for session to persist...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 5: Store minimal user data in localStorage
    const userCacheData = {
      id: authData.user.id,
      uuid: authData.user.id,
      username: userData.username,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      verified: userData.verified || false,
      admissionNumber: userData.admissionNumber || "",
    };

    localStorage.setItem("currentUser", JSON.stringify(userCacheData));
    console.log("Login completed successfully, user data stored");

    return {
      success: true,
      user: authData.user,
      userData: userData,
    };

  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "An error occurred during login" };
  }
}

async function handleLogin(e) {
  e.preventDefault();
  clearError(false);

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("Please fill all fields", false);
    return;
  }

  setButtonState("loginBtn", true, "Logging in...");

  const result = await login(username, password);

  if (result.success) {
    console.log("Login successful, showing animation...");
    showTempleGateAnimation();
    
    // Wait for animation to complete, then trigger firestore redirect logic
    setTimeout(() => {
      console.log("Animation complete, initializing auth...");
      window.initializeAuth();
    }, 3000);
    
  } else {
    console.error("Login failed:", result.error);
    showError("Login failed: " + result.error, false);
    setButtonState("loginBtn", false, "Login");
  }
}


function setButtonState(buttonId, loading = false, text = null) {
  const btn = document.getElementById(buttonId);
  if (loading) {
    btn.disabled = true;
    btn.textContent = text || "Loading...";
    btn.style.opacity = "0.6";
  } else {
    btn.disabled = false;
    btn.textContent = text || (buttonId === "loginBtn" ? "Login" : "Sign Up");
    btn.style.opacity = "1";
  }
}

function setupStyleToggle() {
    const styleToggle = document.getElementById('styleToggle');
    const currentStyle = localStorage.getItem('style') || 'style1';
    
    setStyle(currentStyle);
    
    styleToggle.addEventListener('click', () => {
        const newStyle = document.getElementById('theme-style').getAttribute('href').includes('style2') ? 'style1' : 'style2';
        setStyle(newStyle);
    });
}

function setStyle(style) {
    const link = document.getElementById('theme-style');
    
    if (style === 'style2') {
        link.setAttribute('href', 'style/login-style2.css');
        localStorage.setItem('style', 'style2');
    } else {
        link.setAttribute('href', 'style/login-style.css');
        localStorage.setItem('style', 'style1');
    }
}
document.addEventListener("DOMContentLoaded", function() {
    setupStyleToggle(); 
});

function showTempleGateAnimation() {
  const templeGate = document.getElementById("templeGate");
  const loadingOverlay = document.getElementById("loadingOverlay");

  if (templeGate) {
    templeGate.classList.add("active");
  }

  setTimeout(() => {
    if (templeGate) {
      templeGate.classList.remove("active");
    }
    if (loadingOverlay) {
      loadingOverlay.classList.add("active");
    }
  }, 2000);
}

async function handleSignup() {
  //alert("Sign up clicked!");

  var username = document.getElementById("newUsername").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("newPassword").value;
  var confirmPassword = document.getElementById("confirmPassword").value;

  // alert(
  //   "Values: " +
  //     username +
  //     ", " +
  //     email +
  //     ", " +
  //     password +
  //     ", " +
  //     confirmPassword
  // );

  if (password.length < 6) {
    showError("Password must be at least 6 characters long");
    return;
  }
  if (
    username === "" ||
    email === "" ||
    password === "" ||
    confirmPassword === ""
  ) {
    alert("Please fill all fields");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  var newUser = {
    username: username,
    email: email,
    password: password,
  };

  const result = await signup(email, password, username);
  if (result.success) {
    window.location.href = "/signupprocess.html";
  } else {
    showError("Sign up failed: ", result.error);
    return;
  }

  localStorage.setItem(
    "user_" + username,
    JSON.stringify({
      ...newUser,
      completedSecondStep: false,
    })
  );
}

async function signup(email, password, username) {
  try {
    const supabaseClient = window.supabase || supabase;

    const { data: existingUsers, error: queryError } = await supabaseClient
      .from("Users")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (queryError) {
      console.error("Username check error:", queryError);
      return { success: false, error: "Database error checking username" };
    }

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Username already exists" };
    }

    const { data: authData, error: authError } =
      await supabaseClient.auth.signUp({
        email: email,
        password: password,
      });

    if (authError) {
      console.error("Auth error:", authError);
      return { success: false, error: authError.message };
    }

    const user = authData.user;

    const { error: insertError } = await supabaseClient.from("Users").insert({
      uuid: user.id,
      email: email,
      username: username,
      verified: false,
    });

    if (insertError) {
      console.error("User profile creation error:", insertError);

      try {
        await supabaseClient.from("Users").insert({
          uuid: user.id,
          email: email,
          username: username + "_failed_" + Date.now(),
        });
      } catch (cleanupError) {
        console.error("Cleanup also failed:", cleanupError);
      }

      return {
        success: false,
        error: "Account creation failed. Please try again.",
      };
    }

    return {
      success: true,
      user: user,
      message:
        "Account created successfully! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

function showError(message) {
  const errorLabel = document.getElementById("errorLabel");
  errorLabel.textContent = message;
  errorLabel.style.display = "block";
}

function clearError() {
  const errorLabel = document.getElementById("errorLabel");
  errorLabel.textContent = "";
  errorLabel.style.display = "none";
}

document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.getElementById("signupBtn").addEventListener("click", handleSignup);
document.getElementById("showSignupLink").addEventListener("click", showSignup);
document.getElementById("showLoginLink").addEventListener("click", showLogin);
