var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const supabaseUrl = "https://fbaquxyjyaofihsewgye.supabase.co";
const supabaseAnonKey = "sb_publishable_QWJxYgcHFyBLgldVSe9Xqw_Qsfs2Vwp";
let isFetchingUserData = false;
let pendingUserFetch = null;
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
function getSupabaseClient() {
    return supabaseClient;
}
let currentUserData = null;
const ALLOWED_PAGES = {
    admin: [
        "dashboard.html",
        "team-generation.html",
        "settings.html",
        "team-manage.html",
        "student-management.html",
    ],
    student: [
        "dashboard.html",
        "my-team.html",
        "profile.html",
        "courses.html",
        "assignments.html",
    ],
    unverified: ["signupprocess.html", "profile.html"],
    public: ["login.html", "forgot-password.html"],
};
function getCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}
function isPageAllowed(userType, page) {
    var _a;
    return ((_a = ALLOWED_PAGES[userType]) === null || _a === void 0 ? void 0 : _a.includes(page)) || false;
}
function getUserType() {
    if (!currentUserData)
        return "public";
    if (currentUserData.isAdmin)
        return "admin";
    const needsSecondStep = !currentUserData.admissionNumber ||
        currentUserData.admissionNumber === "";
    if (needsSecondStep || !currentUserData.verified)
        return "unverified";
    return "student";
}
function shouldRedirect() {
    const currentPage = getCurrentPage();
    const userType = getUserType();
    if (currentPage === "login.html") {
        if (userType !== "public") {
            if (userType === "unverified")
                return "signupprocess.html";
            else
                return "dashboard.html";
        }
        return false;
    }
    if (currentPage === "signupprocess.html") {
        if (userType === "public")
            return "login.html";
        if (userType !== "unverified")
            return getDefaultPageForUserType();
        return false;
    }
    if (isPageAllowed("public", currentPage))
        return false;
    return !isPageAllowed(userType, currentPage)
        ? getDefaultPageForUserType()
        : false;
}
function redirectToAllowedPage() {
    const redirectTo = shouldRedirect();
    const currentPage = getCurrentPage();
    if (redirectTo && currentPage !== redirectTo) {
        console.log(`Redirecting from ${currentPage} to ${redirectTo}`);
        window.location.href = redirectTo;
    }
}
function getDefaultPageForUserType() {
    const userType = getUserType();
    switch (userType) {
        case "admin":
            return "dashboard.html";
        case "student":
            return "dashboard.html";
        case "unverified":
            return "signupprocess.html";
        default:
            return "login.html";
    }
}
function initializeAuth() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== Initializing Auth ===");
            yield new Promise((resolve) => setTimeout(resolve, 1000));
            const { data: { session }, error: sessionError, } = yield supabaseClient.auth.getSession();
            if (sessionError) {
                console.error("Session error:", sessionError);
                clearAuthData();
                return;
            }
            console.log("Session found:", !!session);
            if (session && session.user) {
                console.log("User ID from session:", session.user.id);
                const storedUser = localStorage.getItem("currentUser");
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    if (userData.id === session.user.id) {
                        currentUserData = userData;
                        console.log("Using cached user data");
                        if (shouldRedirect()) {
                            setTimeout(() => redirectToAllowedPage(), 500);
                        }
                        return;
                    }
                }
                yield new Promise((resolve) => setTimeout(resolve, 500));
                if (!currentUserData) {
                    yield fetchAndStoreUserData(session.user.id);
                }
            }
            else {
                console.log("No active session found");
                clearAuthData();
                if (shouldRedirect()) {
                    setTimeout(() => redirectToAllowedPage(), 500);
                }
            }
        }
        catch (error) {
            console.error("Error initializing auth:", error);
            clearAuthData();
        }
    });
}
function handlePostLoginRedirect() {
    const userType = getUserType();
    const currentPage = getCurrentPage();
    if (currentPage === "login.html" && userType !== "public") {
        setTimeout(() => {
            redirectToAllowedPage();
        }, 1000);
    }
}
function fetchAndStoreUserData(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isFetchingUserData) {
            console.log("User data fetch already in progress, waiting...");
            return pendingUserFetch;
        }
        isFetchingUserData = true;
        try {
            pendingUserFetch = (() => __awaiter(this, void 0, void 0, function* () {
                console.log("Fetching user data for:", userId);
                const { data, error } = yield window.supabase
                    .from("Users")
                    .select("*")
                    .eq("uuid", userId)
                    .single();
                console.log("Query completed, data:", data);
                if (error)
                    throw error;
                if (!data)
                    throw new Error("User not found in database");
                currentUserData = data;
                const needsSecondStep = currentUserData &&
                    !currentUserData.isAdmin &&
                    (!currentUserData.admissionNumber ||
                        currentUserData.admissionNumber === "");
                if (currentUserData) {
                    localStorage.setItem("currentUser", JSON.stringify(Object.assign(Object.assign({ id: userId }, currentUserData), { isAdmin: currentUserData.isAdmin || false, completedSecondStep: needsSecondStep })));
                }
                console.log("User data fetched and stored in localStorage");
                handlePostLoginRedirect();
                if (shouldRedirect()) {
                    redirectToAllowedPage();
                }
                return data;
            }))();
            return yield pendingUserFetch;
        }
        finally {
            isFetchingUserData = false;
            pendingUserFetch = null;
        }
    });
}
function clearAuthData() {
    localStorage.removeItem("currentUser");
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("user_")) {
            localStorage.removeItem(key);
        }
    });
    currentUserData = null;
}
function logoutUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            localStorage.removeItem("currentUser");
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith("user_")) {
                    localStorage.removeItem(key);
                }
            });
            currentUserData = null;
            yield supabaseClient.auth.signOut();
            window.location.href = "login.html";
        }
        catch (error) {
            console.error("Error logging out:", error);
        }
    });
}
function redirectToAllowedPage2() {
    const defaultPage = getDefaultPageForUserType();
    const currentPage = getCurrentPage();
    if (currentPage !== defaultPage) {
        window.location.href = defaultPage;
    }
}
supabaseClient.auth.onAuthStateChange((event, session) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Auth state changed:", event, "Session:", !!session);
    if (event === "INITIAL_SESSION" && session) {
        console.log("Handling INITIAL_SESSION");
        yield fetchAndStoreUserData(session.user.id);
    }
    else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        clearAuthData();
        redirectToAllowedPage2();
    }
    else if (event === "TOKEN_REFRESHED" && session) {
        console.log("Token refreshed");
        yield fetchAndStoreUserData(session.user.id);
    }
}));
document.addEventListener("DOMContentLoaded", function () {
    initializeAuth();
});
window.supabase = supabaseClient;
window.getSupabaseClient = getSupabaseClient;
window.clearAuthData = clearAuthData;
window.initializeAuth = initializeAuth;
window.getUserType = getUserType;
window.isPageAllowed = isPageAllowed;
window.logoutUser = logoutUser;

//TRYNA GET THE WORKFLOW BACK TO NORMAL