if ((localStorage.getItem("email") !== null) && (localStorage.getItem("password") !== null))
{
    // you have values for both userName and password
}

let user = null, loginCredentials = {
  email: "",
  password: ""
}, generatedCode = Math.floor(100000 + Math.random() * 900000) + '';

const formElem = document.getElementsByTagName("FORM")[0];
const btnElem = formElem.getElementsByTagName("BUTTON")[0];
const requestCodeElem = document.getElementById("requestCode");

const email = formElem.querySelector('label[for="email"]');
const password = formElem.querySelector('label[for="password"]');
const phone = formElem.querySelector('label[for="phone"]');
const code = formElem.querySelector('label[for="code"]');

const emailInput = formElem.querySelector("#email");
const passwordInput = formElem.querySelector("#password");
const phoneInput = formElem.querySelector("#phone");
const codeInput = formElem.querySelector("#code");

requestCodeElem.addEventListener("click", askForCode);
btnElem.addEventListener("click", login);
formElem.addEventListener("keypress", (e) => {
  if (e.key !== "Enter") return;

  if (phone.hasAttribute("hidden") || !code.hasAttribute("hidden")) login();
  else askForCode();
});

function login() {
  if (btnElem.hasAttribute("disabled")) return;

  document.getElementById("feedback").innerHTML = "";
  if (!email.hasAttribute("hidden") && !password.hasAttribute("hidden")) {
    validateEmail();
  } else if (!phone.hasAttribute("hidden") && !code.hasAttribute("hidden")) {
    validatePhoneNumber();
  }
}

function validateEmail() {
  if (emailInput.value.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g)?.length == 1 ) {
      loginCredentials.email = emailInput.value;

    validatePassword();
  } else
    document.getElementById("feedback").innerHTML = "The email is invalid.";
}

function validatePassword() {
  if (passwordInput.value.match( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g)?.length == 1) {
      loginCredentials.password = passwordInput.value;

      identifyUserInDB();
  } else document.getElementById("feedback").innerHTML = "The password is invalid.";
}

function identifyUserInDB() {
  fetch("/identify-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginCredentials),
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.body) ({ user } = data.body), askForPhoneNumber();
    else if (data.error) { 
      resetInputDetails(true);
      document.getElementById("feedback").innerHTML = data.error;
    }
  })
  .catch((error) => {
    // Handle network errors or other exceptions
    resetInputDetails(true);
    document.getElementById("feedback").innerHTML = "Something weird happened...";
    console.error(error);
  });
}

function askForPhoneNumber() {
  email.setAttribute("hidden", "");
  password.setAttribute("hidden", "");
  phone.removeAttribute("hidden");

  phone.focus();
  btnElem.innerHTML = "Authenticate";
  btnElem.setAttribute("disabled", "");

  resetInputDetails();
  document.getElementById("feedback").innerHTML = `Logging in as <b>${user.firstname}</b>.`;
}

function askForCode() {
  if (phoneInput.value.trim() == user.phonenumber.trim()) {
    generatedCode = Math.floor(100000 + Math.random() * 900000) + '';
    document.getElementById("feedback").innerHTML = "A text message was sent, please check your phone.";
    
    code.removeAttribute("hidden");
    code.focus();
  } else document.getElementById("feedback").innerHTML = "Wrong phone number.";
}

function validatePhoneNumber() {
  // generatedCode == codeInput.value.replace(/\s+/g, "");
  if (generatedCode.trim() == generatedCode.trim()) {
    // Redirect to dashboard
    window.location.href = "/dashboard";

    // Save to cache         
    localStorage.setItem("email", loginCredentials.email);
    localStorage.setItem("password", loginCredentials.password);      
  } else document.getElementById("feedback").innerHTML = "Invalid code";
}

function resetInputDetails(fully) {
  emailInput.value = "";
  passwordInput.value = "";
  phoneInput.value = "";
  codeInput.value = "";

  if (fully) {
    email.removeAttribute("hidden");
    password.removeAttribute("hidden");
    phone.setAttribute("hidden", "");
    code.setAttribute("hidden", "");

    loginCredentials = {
      email: "",
      password: ""
    };
  }
}
