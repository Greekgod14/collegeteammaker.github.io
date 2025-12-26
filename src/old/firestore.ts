
export {};

const supabaseUrl: string = "https://fbaquxyjyaofihsewgye.supabase.co";
const supabaseAnonKey: string = "sb_publishable_QWJxYgcHFyBLgldVSe9Xqw_Qsfs2Vwp";

interface SupabaseUserData {
  id?: string;
  uuid?: string;
  email?: string;
  username?: string;
  admissionNumber?: number | string | null;
  verified?: boolean;
  isAdmin?: boolean;
  [key: string]: any;
}

interface AllowedPages {
  admin: string[];
  student: string[];
  unverified: string[];
  public: string[];
}

let isFetchingUserData: boolean = false;
let pendingUserFetch: Promise<any> | null = null;

const supabaseClient = (window as any).supabase.createClient(
  supabaseUrl,
  supabaseAnonKey
);

function getSupabaseClient() {
  return supabaseClient;
}

let currentUserData: SupabaseUserData | null = null;

const ALLOWED_PAGES: AllowedPages = {
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

function getCurrentPage(): string {
  return window.location.pathname.split("/").pop() || "index.html";
}

function isPageAllowed(userType: string, page: string): boolean {
  return ALLOWED_PAGES[userType as keyof AllowedPages]?.includes(page) || false;
}

function getUserType(): string {
  if (!currentUserData) return "public";

  if (currentUserData.isAdmin) return "admin";

  const needsSecondStep =
    !currentUserData.admissionNumber ||
    currentUserData.admissionNumber === "";

  if (needsSecondStep || !currentUserData.verified) return "unverified";

  return "student";
}

function shouldRedirect(): string | false {
  const currentPage = getCurrentPage();
  const userType = getUserType();

  if (currentPage === "login.html") {
    if (userType !== "public") {
      if (userType === "unverified") return "signupprocess.html";
      else return "dashboard.html";
    }
    return false;
  }

  if (currentPage === "signupprocess.html") {
    if (userType === "public") return "login.html";
    if (userType !== "unverified") return getDefaultPageForUserType();
    return false;
  }

  if (isPageAllowed("public", currentPage)) return false;

  return !isPageAllowed(userType, currentPage)
    ? getDefaultPageForUserType()
    : false;
}

function redirectToAllowedPage(): void {
  const redirectTo = shouldRedirect();
  const currentPage = getCurrentPage();

  if (redirectTo && currentPage !== redirectTo) {
    console.log(`Redirecting from ${currentPage} to ${redirectTo}`);
    window.location.href = redirectTo;
  }
}

function getDefaultPageForUserType(): string {
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

async function initializeAuth(): Promise<void> {
  try {
    console.log("=== Initializing Auth ===");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

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

      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!currentUserData) {
        await fetchAndStoreUserData(session.user.id);
      }
    } else {
      console.log("No active session found");
      clearAuthData();

      if (shouldRedirect()) {
        setTimeout(() => redirectToAllowedPage(), 500);
      }
    }
  } catch (error) {
    console.error("Error initializing auth:", error);
    clearAuthData();
  }
}

function handlePostLoginRedirect(): void {
  const userType = getUserType();
  const currentPage = getCurrentPage();

  if (currentPage === "login.html" && userType !== "public") {
    setTimeout(() => {
      redirectToAllowedPage();
    }, 1000);
  }
}

async function fetchAndStoreUserData(userId: string): Promise<any> {
  if (isFetchingUserData) {
    console.log("User data fetch already in progress, waiting...");
    return pendingUserFetch!;
  }

  isFetchingUserData = true;

  try {
    pendingUserFetch = (async () => {
      console.log("Fetching user data for:", userId);

      const { data, error } = await (window as any).supabase
        .from("Users")
        .select("*")
        .eq("uuid", userId)
        .single();

      console.log("Query completed, data:", data);

      if (error) throw error;
      if (!data) throw new Error("User not found in database");

      currentUserData = data;

      const needsSecondStep =
        currentUserData &&
        !currentUserData.isAdmin &&
        (!currentUserData.admissionNumber ||
          currentUserData.admissionNumber === "");

      if (currentUserData) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: userId,
            ...currentUserData,
            isAdmin: currentUserData.isAdmin || false,
            completedSecondStep: needsSecondStep,
          })
        );
      }

      console.log("User data fetched and stored in localStorage");
      handlePostLoginRedirect();

      if (shouldRedirect()) {
        redirectToAllowedPage();
      }

      return data;
    })();

    return await pendingUserFetch;
  } finally {
    isFetchingUserData = false;
    pendingUserFetch = null;
  }
}

function clearAuthData(): void {
  localStorage.removeItem("currentUser");
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("user_")) {
      localStorage.removeItem(key);
    }
  });
  currentUserData = null;
}

async function logoutUser(): Promise<void> {
  try {
    localStorage.removeItem("currentUser");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("user_")) {
        localStorage.removeItem(key);
      }
    });

    currentUserData = null;

    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

function redirectToAllowedPage2(): void {
  const defaultPage = getDefaultPageForUserType();
  const currentPage = getCurrentPage();

  if (currentPage !== defaultPage) {
    window.location.href = defaultPage;
  }
}

supabaseClient.auth.onAuthStateChange(async (event: string, session: { user: { id: string; }; }) => {
  console.log("Auth state changed:", event, "Session:", !!session);

  if (event === "INITIAL_SESSION" && session) {
    console.log("Handling INITIAL_SESSION");
    await fetchAndStoreUserData(session.user.id);
  } else if (event === "SIGNED_OUT") {
    console.log("User signed out");
    clearAuthData();
    redirectToAllowedPage2();
  } else if (event === "TOKEN_REFRESHED" && session) {
    console.log("Token refreshed");
    await fetchAndStoreUserData(session.user.id);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  initializeAuth();
});

declare global {
  interface Window {
    supabase: any;
    getSupabaseClient: () => any;
    clearAuthData: () => void;
    initializeAuth: () => void;
    getUserType: () => string;
    isPageAllowed: (userType: string, page: string) => boolean;
    logoutUser: () => Promise<void>;
  }
}

window.supabase = supabaseClient;
window.getSupabaseClient = getSupabaseClient;
window.clearAuthData = clearAuthData;
window.initializeAuth = initializeAuth;
window.getUserType = getUserType;
window.isPageAllowed = isPageAllowed;
window.logoutUser = logoutUser;
