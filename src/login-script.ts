export {}; 
interface User {
  id?: string;
  uuid?: string;
  username?: string;
  email?: string;
  isAdmin?: boolean;
  verified?: boolean;
  admissionNumber?: string;
  completedSecondStep?: boolean;
  password?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: any;
  userData?: User;
  message?: string;
}

// Global declaration for Supabase (assuming it's available globally)
declare const supabase: any;

// DOM element getters with type safety
function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id '${id}' not found`);
  }
  return element as T;
}

function getInputValue(id: string): string {
  const element = getElementById<HTMLInputElement>(id);
  return element.value.trim();
}

// Function to handle login
async function handleLogin(e: Event): Promise<void> {
  e.preventDefault();
  clearError();

  const username = getInputValue("username");
  const password = getInputValue("password");

  if (!username || !password) {
    showError("Please fill all fields");
    return;
  }

  setButtonState("loginBtn", true, "Logging in...");

  const result = await login(username, password);

  if (result.success) {
    console.log("Login successful, showing animation...");
    showTempleGateAnimation();
    
    setTimeout(() => {
      console.log("Animation complete, initializing auth...");
      if (typeof (window as any).initializeAuth === 'function') {
        (window as any).initializeAuth();
      }
    }, 3000);
  } else {
    console.error("Login failed:", result.error);
    showError("Login failed: " + result.error);
    setButtonState("loginBtn", false, "Login");
  }
}

// Login function
async function login(username: string, password: string): Promise<LoginResult> {
  try {
    console.log("=== Login Attempt ===");
    console.log("Username:", username);

    const { data: users, error: queryError } = await supabase
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

    const userData: User = users[0];
    const userEmail = userData.email;
    console.log("Found user email:", userEmail);

    if (!userEmail) {
      return { success: false, error: "User email not found" };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
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

    console.log("Setting session...");
    await supabase.auth.setSession(authData.session);

    console.log("Waiting for session to persist...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    const userCacheData: User = {
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

  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "An error occurred during login" };
  }
}

// Signup function
async function signup(email: string, password: string, username: string): Promise<LoginResult> {
  try {
    console.log("=== Signup Attempt ===");

    const { data: existingUsers, error: queryError } = await (window as any).supabase
      .from("Users")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (queryError) {
      console.error("Username check error:", queryError);
      return { success: false, error: "Database error. Please try again." };
    }

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Username already exists" };
    }

    console.log("Creating auth user...");
    const { data: authData, error: authError } = await (window as any).supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return { success: false, error: authError.message };
    }

    if (!authData?.user) {
      console.error("No user returned from signUp");
      return { success: false, error: "Account creation failed" };
    }

    const userId = authData.user.id;
    console.log("Auth user created:", userId);

    console.log("Creating user profile...");
    const { error: insertError } = await (window as any).supabase
      .from("Users")
      .insert({
        uuid: userId,
        email: email,
        username: username,
        verified: false,
      });

    if (insertError) {
      console.error("User profile creation error:", insertError);
      return {
        success: false,
        error: "Account creation failed. Please try again.",
      };
    }

    console.log("Signup completed successfully");
    return {
      success: true,
      user: authData.user,
      message: "Account created successfully! Please check your email to verify.",
    };

  } catch (error: any) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

// Handle signup
async function handleSignup(e: Event): Promise<void> {
  e.preventDefault();
  clearError();

  const username = getInputValue("newUsername");
  const email = getInputValue("email");
  const password = getInputValue("newPassword");
  const confirmPassword = getInputValue("confirmPassword");

  if (!username || !email || !password || !confirmPassword) {
    showError("Please fill all fields");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters long");
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    return;
  }

  setButtonState("signupBtn", true, "Creating account...");

  const result = await signup(email, password, username);

  if (result.success) {
    console.log("Signup successful");
    showError("✓ Account created! Redirecting to signup process...");
    
    setTimeout(() => {
      window.location.href = "signupprocess.html";
    }, 2000);
  } else {
    console.error("Signup failed:", result.error);
    showError("Signup failed: " + result.error);
    setButtonState("signupBtn", false, "Sign Up");
  }
}

// UI management functions
function setButtonState(buttonId: string, loading: boolean = false, text: string | null = null): void {
  const btn = getElementById<HTMLButtonElement>(buttonId);
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

function showError(message: string): void {
  const errorLabel = getElementById<HTMLElement>("errorLabel");
  errorLabel.textContent = message;
  errorLabel.style.display = "block";
}

function clearError(): void {
  const errorLabel = getElementById<HTMLElement>("errorLabel");
  errorLabel.textContent = "";
  errorLabel.style.display = "none";
}

function showSignup(): void {
  getElementById<HTMLElement>("loginForm").style.display = "none";
  getElementById<HTMLElement>("signupForm").style.display = "block";
  getElementById<HTMLElement>("headerTitle").textContent = "Sign Up";
}

function showLogin(): void {
  getElementById<HTMLElement>("signupForm").style.display = "none";
  getElementById<HTMLElement>("loginForm").style.display = "block";
  getElementById<HTMLElement>("headerTitle").textContent = "Login";
}

function showTempleGateAnimation(): void {
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

function setupStyleToggle(): void {
  const styleToggle = getElementById<HTMLElement>('styleToggle');
  const currentStyle = localStorage.getItem('style') || 'style1';
  
  setStyle(currentStyle);
  
  styleToggle.addEventListener('click', () => {
    const themeStyle = getElementById<HTMLLinkElement>('theme-style');
    const newStyle = themeStyle.getAttribute('href')?.includes('style2') ? 'style1' : 'style2';
    setStyle(newStyle);
  });
}

function setStyle(style: string): void {
  const link = getElementById<HTMLLinkElement>('theme-style');
  
  if (style === 'style2') {
    link.setAttribute('href', 'style/login-style2.css');
    localStorage.setItem('style', 'style2');
  } else {
    link.setAttribute('href', 'style/login-style.css');
    localStorage.setItem('style', 'style1');
  }
}

// Check current user and redirect if needed
function checkCurrentUser(): void {
  const currentUserStr = localStorage.getItem("currentUser");
  
  if (!currentUserStr) {
    showLogin();
    return;
  }

  try {
    const currentUser: User = JSON.parse(currentUserStr);
    const username = currentUser.username;
    const hasCompletedSecondStep = currentUser.completedSecondStep;
    const isadmin = currentUser.isAdmin;

    if (isadmin) {
      window.location.href = "dashboard.html";
    } else {
      if (hasCompletedSecondStep) {
        window.location.href = "signupprocess.html";
      } else {
        window.location.href = "index.html";
      }
    }
  } catch (error) {
    console.error("Error parsing current user:", error);
    showLogin();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function() {
  setupStyleToggle();
  checkCurrentUser();
  
  // Add event listeners
  getElementById<HTMLButtonElement>("loginBtn").addEventListener("click", handleLogin);
  getElementById<HTMLButtonElement>("signupBtn").addEventListener("click", handleSignup);
  getElementById<HTMLElement>("showSignupLink").addEventListener("click", showSignup);
  getElementById<HTMLElement>("showLoginLink").addEventListener("click", showLogin);
});