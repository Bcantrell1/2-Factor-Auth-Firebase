import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import dotenv from 'dotenv'

dotenv.config()

firebase.initializeApp({
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID
});

const auth = firebase.auth();

/* Wait for auth state change */
auth.onAuthStateChanged((user) => {
    const userElement = document.querySelector("#user");

    if (user) {
        userElement.innerHTML = `${user.email} logged in. ${JSON.stringify(user.multiFactor.enrolledFactors)}`
    } else {
        userElement.innerHTML = "No user signed in";
    }
})

/* Prevent spam using captcha */ 
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('captcha', {
    size: 'invisible',
    callback: (response) => console.log("captcha solved!", response)
});

/* New user setup without provider */
const signupBtn = document.querySelector('#signup-button');

signupBtn.onclick = async () => {
    const email = document.querySelector('#signup-email').value;
    const password = document.querySelector('#signup-password').value;

    const userCredentials = await auth.createUserWithEmailAndPassword(email, password);
    await userCredentials.user.sendEmailVerification();

    alert('check your email!');
};

/* Setup Two Factor */
const setupButton = document.querySelector("#setup-button");

setupButton.onclick = async () => {
    const phoneNumber = document.querySelector("#phone");
    const user = auth.currentUser;
    const session = await user.multiFactor.getSession();

    const phoneOptions = {
        phoneNumber,
        session,
    };

    const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();

    window.verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneOptions,
        window.recaptchaVerifier
    );

    alert('Code sent to your phone!');
}

/* Verify Two Factor */
const verifyButton = document.querySelector("#verify");

verifyButton.onclick = async () => {
    const code = document.querySelector("#code");
    const firebaseCredentials = new firebase.auth.PhoneAuthProvider.credential(
        window.verificationId,
        code
    );

    const multiFactorAssertion = firebase.auth.PhoneMultiFactorGenerator.assertion(
        firebaseCredentials
    );

    const user = auth.currentUser;
    await user.multiFactor.enroll(multiFactorAssertion, "phone number");

    alert(`Two factor verification has been setup!`);
}

/* Sign Out */
const signOutButton = document.querySelector('#signout');
signOutButton.onclick = () => auth.signOut();

/* Login User With Multi Factor */
const loginButton = document.querySelector("#login-button");

loginButton.onclick = async () => {
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        if (error.code === "auth/multi-factor-auth-required") {
            window.resolver = error.resolver;
        }
    }

    const phoneOptions = {
        multiFactorHint: window.resolver.hints[0],
        session: window.resolver.session
    }

    const phoneAuthProvider = await firebase.auth.PhoneAuthProvider();

    window.verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneOptions,
        window.recaptchaVerifier
    );

    alert("Code has been sent to your phone");
}

/* Verify Two Factor */
const verificationButton = document.querySelector("#login-verify");

verificationButton.onclick = async () => {
    const code = document.querySelector("#login-code");

    const firebaseCredentials = new firebase.auth.PhoneAuthProvider.credential(
        window.verificationId,
        code
    );

    const multiFactorAssertion = firebase.auth.PhoneMultiFactorGenerator.assertion(
        firebaseCredentials
    );

    const credentials = await window.resolver.resolveSignIn(multiFactorAssertion);

    console.log(credentials);

    alert("You have been logged in!");
}