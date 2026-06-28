const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

function handleCredentialResponse(response) {
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const email = payload.email || "";
        const name = payload.name || payload.given_name || "Google User";

        if (email) {
            localStorage.setItem('loggedInUser', email);
            localStorage.setItem('loggedInUserName', name);
            window.location.href = 'index.html';
            return;
        }
    } catch (error) {
        console.error('Google credential parsing failed', error);
    }
    alert('Google sign-in failed. Please try again.');
}

function initGoogleSignIn() {
    const googleSignin = document.getElementById('google-signin');
    if (!googleSignin) return;

    if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID") {
        googleSignin.innerHTML = '<p class="google-hint">Add a Google client ID in login.js to enable Google sign-in.</p>';
        return;
    }

    if (window.google?.accounts?.id) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            ux_mode: 'popup',
        });
        google.accounts.id.renderButton(googleSignin, {
            theme: 'outline',
            size: 'large',
            width: '320',
            text: 'signin_with',
        });
        google.accounts.id.prompt();
    } else {
        setTimeout(initGoogleSignIn, 150);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('loggedInUser')) {
        window.location.href = 'index.html';
        return;
    }

    initGoogleSignIn();
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Please fill all fields.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('loggedInUser', email);
            localStorage.setItem('loggedInUserName', user.name || '');
            window.location.href = 'index.html';
        } else {
            alert('Invalid email or password.');
        }
    });
});