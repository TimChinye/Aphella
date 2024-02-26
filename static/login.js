const user = {
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

requestCodeElem.addEventListener('click', requestCode);
btnElem.addEventListener('click', login);
formElem.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (!phone.hasAttribute("hidden") && code.hasAttribute("hidden")) requestCode();
        else login();
    }
});

function login() {
    if (btnElem.hasAttribute("disabled")) return;

    document.getElementById('feedback').innerHTML = '';
    if (!email.hasAttribute("hidden") && !password.hasAttribute("hidden")) {
        const emailInput = formElem.querySelector('#email').value;
        if (emailInput.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g)?.length == 1) {
            user.email = emailInput;

            const passwordInput = formElem.querySelector('#password').value;
            if (passwordInput.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g)?.length == 1) {
                user.password = passwordInput;
    
                email.setAttribute("hidden", "");
                password.setAttribute("hidden", "");
                phone.removeAttribute("hidden");

                phone.focus();
                btnElem.innerHTML = "Authenticate";
                btnElem.setAttribute("disabled", "");
            } else document.getElementById('feedback').innerHTML = "The password is invalid.";
        } else document.getElementById('feedback').innerHTML = "The email is invalid.";
    } else if (!phone.hasAttribute("hidden") && !code.hasAttribute("hidden")) {
        user.code = formElem.querySelector('#code').value.replace(/\s+/g, '');

        fetch('/submit-login', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        })
        .then(response => response.json())
        .catch((error) => console.error('Error:', error));
    };
};

function requestCode() {
    user.phone = formElem.querySelector('#phone').value;

    code.removeAttribute("hidden");
    code.focus();
    document.getElementById('feedback').innerHTML = "A text message was sent, please check your phone.";
}