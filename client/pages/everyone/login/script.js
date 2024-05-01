if (new URLSearchParams(window.location.search).has('dev')) {
  let dummyAccounts = {
    "admin": "stephan.latliff@aphella.com",
    "staff": "lurleen.yearne@aphella.com",
    "patient": "ulitzmann0@unc.edu"
  }

  forceLogin(dummyAccounts[new URLSearchParams(window.location.search).get('dev') || 'admin']), localStorage.clear();
}
else window.location.href = window.location.href + "?dev";

let firstname = null, generatedCode = null;

const blankLoginCredentials = {
  email: "",
  password: "",
  phone: null,
  code: null
};

let loginCredentials = blankLoginCredentials;

const formElem = document.getElementsByTagName("form")[0];
const btnElem = formElem.getElementsByTagName("button")[0];
const requestCodeElem = document.getElementById("requestCode");

const email = formElem.querySelector('label[for="email"]');
const password = formElem.querySelector('label[for="password"]');
const phone = formElem.querySelector('label[for="phone"]');
const code = formElem.querySelector('label[for="code"]');

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const phoneInput = document.getElementById("phone");
const codeInput = document.getElementById("code");

formElem.addEventListener("keypress", (e) => {
  if (e.key !== "Enter") return;

  if (phone.hasAttribute("hidden") || !code.hasAttribute("hidden")) login();
  else askForCode();
});

requestCodeElem.addEventListener("click", () => askForCode());
btnElem.addEventListener("click", () => login());

var login = function() {
  if (btnElem.hasAttribute("disabled")) return;
  document.getElementById("feedback").innerHTML = "&nbsp;";

  if (!email.hasAttribute("hidden") && !password.hasAttribute("hidden")) {
    validateEmail();
  }
}, askForCode;

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

    verifyUserInDB();
  } else document.getElementById("feedback").innerHTML = "The password is invalid.";
}

function askForPhoneNumber(firstname) {
  email.setAttribute("hidden", "");
  password.setAttribute("hidden", "");
  phone.removeAttribute("hidden");

  phone.focus();
  btnElem.innerHTML = "Authenticate";
  btnElem.setAttribute("disabled", "");

  resetInputDetails();
  document.getElementById("feedback").innerHTML = `Logging in as <b>${firstname}</b>.`;
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

    loginCredentials = blankLoginCredentials;
  }
}

async function verifyUserInDB() {
  await fetch("/verify-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: loginCredentials.email, password: loginCredentials.password })
  })
  .then((response) => response.json())
  .then((data) => {
    if (!data.message) {
      let { firstname } = data;
      askForPhoneNumber(firstname);

      login = async function() { // authenticate
        if (btnElem.hasAttribute("disabled")) return;
        document.getElementById("feedback").innerHTML = "&nbsp;";
      
        if (!phone.hasAttribute("hidden") && !code.hasAttribute("hidden")) {
          loginCredentials.code = codeInput.value.replace(/\s+/g, "").trim();
          await verifyCode();
        }
      };

      askForCode = async function() {
        document.getElementById("feedback").innerHTML = "&nbsp;";
      
        loginCredentials.phone = phoneInput.value.trim();

        await verifyPhoneNumber().then((isVerified) => {
          if (typeof isVerified == "undefined");
          else if (isVerified) {
            code.removeAttribute("hidden");
            code.focus();
            
            document.getElementById("feedback").innerHTML = "A text message was sent, please check your phone.";
          } else document.getElementById("feedback").innerHTML = "Wrong phone number.";
        });
      };
    }
    else { 
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

async function verifyPhoneNumber() {
  try {
    let data = await fetch("/verify-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: loginCredentials.phone}),
    })
    .then((response) => response.json());

    console.log(data.code);
    return data.isVerified;
  } catch (error) {
    resetInputDetails(true);
    
    document.getElementById("feedback").innerHTML = "Something weird happened...";
    console.error(error);
  }
}

function verifyCode() {
  fetch("/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: loginCredentials.code}),
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.isVerified) {
      window.location.href = "/dashboard";
      localStorage.clear();
    }
    else document.getElementById("feedback").innerHTML = "Invalid code";
  })
  .catch((error) => {
    resetInputDetails(true);
    
    document.getElementById("feedback").innerHTML = "Something weird happened...";
    console.error(error);
  });
}

function forceLogin(email) {
  fetch("/force-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email
    })
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.error) document.getElementById("feedback").innerHTML = data.error;
    else window.location.href = "/dashboard";
  })
  .catch((error) => {
    resetInputDetails(true);
    
    document.getElementById("feedback").innerHTML = "Something weird happened...";
    console.error(error);
  });
}