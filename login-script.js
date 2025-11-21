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

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  showLogin(); 
} else {
  const username = currentUser.username;
  const hasCompletedSecondStep = currentUser.completedSecondStep;
  const isadmin = currentUser.isAdmin;
  if (isadmin) {
    window.location.href = "admin.html";
  } else {
    if (hasCompletedSecondStep) {
      window.location.href = "signupprocess.html";
    } else {
      window.location.href = "index.html";}
  }
}


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



async function handleLogin() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  if (username === "" || password === "") {
    alert("Please fill all fields");
    return;
  }

  const result = await login(username, password);
  if (result.success) {
    if (result.isAdmin) {
      // TODO: Implement admin redirect if needed
      // window.location.href = "admin.html";
    }
    // Regular user redirect is handled in login function
  } else {
    showError("Login failed: " + result.error);
  }
}

async function login(username, password) {
  try {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const usernameSnapshot = await db
      .collection("Users")
      .where("username", "==", username)
      .get();

    if (usernameSnapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const userDoc = usernameSnapshot.docs[0];
    const userData = userDoc.data();
    const userEmail = userData.email;
    const userId = userDoc.id; // This is the user's UID

    const userCredential = await auth.signInWithEmailAndPassword(
      userEmail,
      password
    );
    const user = userCredential.user;
    user.username = username;

    if (userData.isAdmin) {
      // TODO: Implement admin redirect if needed
      return { success: true, user: user, isAdmin: true };
    } else {
      if (!userData.studentid || userData.studentid == "") {
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...user,
            completedSecondStep: false,
          })
        );
        showTempleGateAnimation();
        window.location.href = "signupprocess.html";
      } else {
        //TODO: Implement check for studentid
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...user,
            completedSecondStep: false,
          })
        );
        showTempleGateAnimation();

        window.location.href = "index.html";
      }
      return { success: true, user: user, isAdmin: false };
    }
  } catch (error) {
    console.error("Login error:", error.message);
    return { success: false, error: error.message };
  }
}

function showTempleGateAnimation() {
  const templeGate = document.getElementById("templeGate");
  const loadingOverlay = document.getElementById("loadingOverlay");

  // Show temple gate animation
  if (templeGate) {
    templeGate.classList.add("active");
  }

  // After gate animation, show loading
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
    const auth = firebase.auth();
    const db = firebase.firestore();

    const usernameSnapshot = await db
      .collection("members")
      .where("username", "==", username)
      .get();

    if (!usernameSnapshot.empty) {
      return { success: false, error: "Username already exists" };
    }

    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    await db.collection("Users").doc(user.uid).set({
      email: email,
      username: username,
      studentid: "",
    });

    return { success: true, user: user };
  } catch (error) {
    console.error("Signup error:", error.message);
    return { success: false, error: error.message };
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
