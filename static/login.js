const user = {
    email: '',
    password: '',
    phone: '',
    code: ''
}


const form = document.getElementsByTagName('FORM')[0];
const btn = form.getElementsByTagName('BUTTON')[0];
btn.addEventListener('click', login);
form.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

function login() {
    const email = form.querySelector('label[for="email"]');
    const password = form.querySelector('label[for="password"]');
    const phone = form.querySelector('label[for="phone"]');
    const code = form.querySelector('label[for="code"]');

    if (!email.hasAttribute("hidden") && !password.hasAttribute("hidden")) {
        const emailInput = form.querySelector('#email').value;
        const passwordInput = form.querySelector('#password').value;

        if (emailInput.match(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g)?.length == 1) {
            user.email = emailInput;
    
            if (passwordInput.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g)?.length == 1) {
                user.password = passwordInput;
    
                email.setAttribute("hidden", "");
                password.setAttribute("hidden", "");
                phone.removeAttribute("hidden");
                requestCode.removeAttribute("hidden");
                // code.removeAttribute("hidden");
            } else form.getElementsByTagName('SPAN')[0].innerHTML = "The password is invalid.";
        } else {
            form.getElementsByTagName('SPAN')[0].innerHTML = "The email is invalid.";
        }
    } else if (!phone.hasAttribute("hidden") && !code.hasAttribute("hidden")) {
        const phoneInput = form.querySelector('#phone').value;
        const codeInput = form.querySelector('#code').value;

        user.phone = phoneInput;
        user.code = codeInput;

        form.getElementsByTagName('SPAN')[0].innerHTML = "Check:";
    }
};