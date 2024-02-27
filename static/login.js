let user = {
    email: '',
    password: '',
    phone: '',
    code: ''
}

const formElem = document.getElementsByTagName('FORM')[0];
const btnElem = formElem.getElementsByTagName('BUTTON')[0];
const requestCodeElem = document.getElementById('requestCode');

const email = formElem.querySelector('label[for="email"]');
const password = formElem.querySelector('label[for="password"]');
const phone = formElem.querySelector('label[for="phone"]');
const code = formElem.querySelector('label[for="code"]');

const emailInput = formElem.querySelector('#email');
const passwordInput = formElem.querySelector('#password');
const phoneInput = formElem.querySelector('#phone');
const codeInput = formElem.querySelector('#code');

requestCodeElem.addEventListener('click', requestCode);
btnElem.addEventListener('click', login);
formElem.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (!phone.hasAttribute("hidden") && code.hasAttribute("hidden")) requestCode();
        else login();
    }
});

function requestCode() {
    user.phone = phoneInput.value;

    code.removeAttribute("hidden");
    code.focus();
    document.getElementById('feedback').innerHTML = "A text message was sent, please check your phone.";
}

function login() {
    if (btnElem.hasAttribute("disabled")) return;

    document.getElementById('feedback').innerHTML = '';
    if (!email.hasAttribute("hidden") && !password.hasAttribute("hidden")) {
        if (emailInput.value.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g)?.length == 1) {
            user.email = emailInput.value;

            if (passwordInput.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g)?.length == 1) {
                user.password = passwordInput.value;
    
                email.setAttribute("hidden", "");
                password.setAttribute("hidden", "");
                phone.removeAttribute("hidden");

                phone.focus();
                btnElem.innerHTML = "Authenticate";
                btnElem.setAttribute("disabled", "");
                
                resetInputDetails();
            } else document.getElementById('feedback').innerHTML = "The password is invalid.";
        } else document.getElementById('feedback').innerHTML = "The email is invalid.";
    } else if (!phone.hasAttribute("hidden") && !code.hasAttribute("hidden")) {
        user.code = codeInput.value.replace(/\s+/g, '');

        fetch('/submit-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response data:', data);
    
            if (data.body) {
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else if (data.error) {
                resetInputDetails(true);
            }
        })
        .catch(error => {
            // Handle network errors or other exceptions
            console.error('Error:', error);
            resetInputDetails(true);
        });
    }; 
};

function resetInputDetails(fully) {
    emailInput.value = '';
    passwordInput.value = '';
    phoneInput.value = '';
    codeInput.value = '';

    if (fully) {
        email.removeAttribute("hidden");
        password.removeAttribute("hidden");
        phone.setAttribute("hidden", "");
        code.setAttribute("hidden", "");

        user = {
            email: '',
            password: '',
            phone: '',
            code: ''
        };
    }
}