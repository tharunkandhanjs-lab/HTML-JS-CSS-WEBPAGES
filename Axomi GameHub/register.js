const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

function handleRegisterCredential(response) {
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const email = payload.email || "";
        const name = payload.name || payload.given_name || "Google User";

        if (!email) {
            alert('Google sign-in failed. No email returned.');
            return;
        }

        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (!users.find(u => u.email === email)) {
            users.push({ name, email, password: '' });
            localStorage.setItem('users', JSON.stringify(users));
        }

        localStorage.setItem('loggedInUser', email);
        localStorage.setItem('loggedInUserName', name);
        window.location.href = 'index.html';
    } catch (err) {
        console.error('Google register error', err);
        alert('Google registration failed. Please try again.');
    }
}

function initRegisterGoogleSignIn() {
    const googleSignin = document.getElementById('google-signin');
    if (!googleSignin) return;

    if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
        googleSignin.innerHTML = '<p class="google-hint">Add your Google client ID in register.js to enable Google sign-in.</p>';
        return;
    }

    if (window.google?.accounts?.id) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleRegisterCredential,
            ux_mode: 'popup',
        });
        google.accounts.id.renderButton(googleSignin, {
            theme: 'outline',
            size: 'large',
            width: '320',
            text: 'signup_with',
        });
        google.accounts.id.prompt();
    } else {
        setTimeout(initRegisterGoogleSignIn, 150);
    }
}

function registerUser(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', email);
    localStorage.setItem('loggedInUserName', name);
    alert('Signup successful! You are now logged in.');
    window.location.href = 'index.html';
}


document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('loggedInUser')) {
        window.location.href = 'index.html';
        return;
    }

    initRegisterGoogleSignIn();

    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill all fields.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        let users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            alert('Email already registered.');
            return;
        }

        registerUser(name, email, password);
    });
});