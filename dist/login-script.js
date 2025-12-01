

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// DOM element getters with type safety
function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id '${id}' not found`);
    }
    return element;
}
function getInputValue(id) {
    const element = getElementById(id);
    return element.value.trim();
}
// Function to handle login
function handleLogin(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        clearError();
        const username = getInputValue("username");
        const password = getInputValue("password");
        if (!username || !password) {
            showError("Please fill all fields");
            return;
        }
        setButtonState("loginBtn", true, "Logging in...");
        const result = yield login(username, password);
        if (result.success) {
            console.log("Login successful, showing animation...");
            showTempleGateAnimation();
            setTimeout(() => {
                console.log("Animation complete, initializing auth...");
                if (typeof window.initializeAuth === 'function') {
                    window.initializeAuth();
                }
            }, 3000);
        }
        else {
            console.error("Login failed:", result.error);
            showError("Login failed: " + result.error);
            setButtonState("loginBtn", false, "Login");
        }
    });
}
// Login function
function login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== Login Attempt ===");
            console.log("Username:", username);
            const { data: users, error: queryError } = yield supabase
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
            if (!userEmail) {
                return { success: false, error: "User email not found" };
            }
            const { data: authData, error: authError } = yield supabase.auth.signInWithPassword({
                email: userEmail,
                password: password,
            });
            if (authError) {
                console.error("Auth error:", authError.message);
                return { success: false, error: "Invalid password" };
            }
            if (!(authData === null || authData === void 0 ? void 0 : authData.user) || !(authData === null || authData === void 0 ? void 0 : authData.session)) {
                console.error("No auth data returned");
                return { success: false, error: "Authentication failed" };
            }
            console.log("Auth successful, user ID:", authData.user.id);
            console.log("Setting session...");
            yield supabase.auth.setSession(authData.session);
            console.log("Waiting for session to persist...");
            yield new Promise(resolve => setTimeout(resolve, 1500));
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
        }
        catch (error) {
            console.error("Login error:", error);
            return { success: false, error: error.message || "An error occurred during login" };
        }
    });
}
// Signup function
function signup(email, password, username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== Signup Attempt ===");
            const { data: existingUsers, error: queryError } = yield window.supabase
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
            const { data: authData, error: authError } = yield window.supabase.auth.signUp({
                email: email,
                password: password,
            });
            if (authError) {
                console.error("Auth error:", authError);
                return { success: false, error: authError.message };
            }
            if (!(authData === null || authData === void 0 ? void 0 : authData.user)) {
                console.error("No user returned from signUp");
                return { success: false, error: "Account creation failed" };
            }
            const userId = authData.user.id;
            console.log("Auth user created:", userId);
            console.log("Creating user profile...");
            const { error: insertError } = yield window.supabase
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
        }
        catch (error) {
            console.error("Signup error:", error);
            return {
                success: false,
                error: error.message || "An unexpected error occurred",
            };
        }
    });
}
// Handle signup
function handleSignup(e) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const result = yield signup(email, password, username);
        if (result.success) {
            console.log("Signup successful");
            showError("✓ Account created! Redirecting to signup process...");
            setTimeout(() => {
                window.location.href = "signupprocess.html";
            }, 2000);
        }
        else {
            console.error("Signup failed:", result.error);
            showError("Signup failed: " + result.error);
            setButtonState("signupBtn", false, "Sign Up");
        }
    });
}
// UI management functions
function setButtonState(buttonId, loading = false, text = null) {
    const btn = getElementById(buttonId);
    if (loading) {
        btn.disabled = true;
        btn.textContent = text || "Loading...";
        btn.style.opacity = "0.6";
    }
    else {
        btn.disabled = false;
        btn.textContent = text || (buttonId === "loginBtn" ? "Login" : "Sign Up");
        btn.style.opacity = "1";
    }
}
function showError(message) {
    const errorLabel = getElementById("errorLabel");
    errorLabel.textContent = message;
    errorLabel.style.display = "block";
}
function clearError() {
    const errorLabel = getElementById("errorLabel");
    errorLabel.textContent = "";
    errorLabel.style.display = "none";
}
function showSignup() {
    getElementById("loginForm").style.display = "none";
    getElementById("signupForm").style.display = "block";
    getElementById("headerTitle").textContent = "Sign Up";
}
function showLogin() {
    getElementById("signupForm").style.display = "none";
    getElementById("loginForm").style.display = "block";
    getElementById("headerTitle").textContent = "Login";
}
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
function setupStyleToggle() {
    const styleToggle = getElementById('styleToggle');
    const currentStyle = localStorage.getItem('style') || 'style1';
    setStyle(currentStyle);
    styleToggle.addEventListener('click', () => {
        var _a;
        const themeStyle = getElementById('theme-style');
        const newStyle = ((_a = themeStyle.getAttribute('href')) === null || _a === void 0 ? void 0 : _a.includes('style2')) ? 'style1' : 'style2';
        setStyle(newStyle);
    });
}
function setStyle(style) {
    const link = getElementById('theme-style');
    if (style === 'style2') {
        link.setAttribute('href', 'style/login-style2.css');
        localStorage.setItem('style', 'style2');
    }
    else {
        link.setAttribute('href', 'style/login-style.css');
        localStorage.setItem('style', 'style1');
    }
}
// Check current user and redirect if needed
function checkCurrentUser() {
    const currentUserStr = localStorage.getItem("currentUser");
    if (!currentUserStr) {
        showLogin();
        return;
    }
    try {
        const currentUser = JSON.parse(currentUserStr);
        const username = currentUser.username;
        const hasCompletedSecondStep = currentUser.completedSecondStep;
        const isadmin = currentUser.isAdmin;
        if (isadmin) {
            window.location.href = "dashboard.html";
        }
        else {
            if (hasCompletedSecondStep) {
                window.location.href = "signupprocess.html";
            }
            else {
                window.location.href = "index.html";
            }
        }
    }
    catch (error) {
        console.error("Error parsing current user:", error);
        showLogin();
    }
}
// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
    setupStyleToggle();
    checkCurrentUser();
    // Add event listeners
    getElementById("loginBtn").addEventListener("click", handleLogin);
    getElementById("signupBtn").addEventListener("click", handleSignup);
    getElementById("showSignupLink").addEventListener("click", showSignup);
    getElementById("showLoginLink").addEventListener("click", showLogin);
});
export {};
