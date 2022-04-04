// Check if there is a logged user. If none, sign in.
if (!sessionStorage.userEmail) window.location.replace("../html/signIn.html");

// Create references for elements.
const buttonPlay = document.getElementById('buttonPlay');
const buttonHighScores = document.getElementById('buttonHighScores');
const buttonSettings = document.getElementById('buttonSettings');

/**
 * @description Firebase config file.
 */
const firebaseConfig = {
    // Prod
    apiKey: "AIzaSyCuTFZvbUxoR20j1x3NGBD43Ugk27khy-o",
    authDomain: "pewpewshooters.firebaseapp.com",
    projectId: "pewpewshooters",
    storageBucket: "pewpewshooters.appspot.com",
    messagingSenderId: "27720464394",
    appId: "1:27720464394:web:9033605db4ab32e68947f3",
    measurementId: "G-0DNXMX49DJ"
};

// Initialize Firebase.
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Analytics.
const firebaseAnalytics = firebase.analytics();

// Initialize Firebase Performance Monitoring.
const firebasePerf = firebase.performance();

// Initialize Firebase Performance Authentication.
const firebaseAuth = firebase.auth();

/**
 * @description Redirects user to the game page.
 */
const openGame = () => {
    window.location.replace("../html/game.html");
};

/**
 * @description Redirects user to the highscores page.
 */
const openHighScores = () => {
    window.location.replace("../html/highscores.html");
};

/**
 * @description Redirects user to the settings page.
 */
const openSettings = () => {
    window.location.replace("../html/settings.html");

};

// Opens the game page when the play button is clicked.
buttonPlay.onclick = () => openGame();

// Open the highscores page when the highscores button is clicked.
buttonHighScores.onclick = () => openHighScores();

// Opens the settings page when the settings button is clicked.
buttonSettings.onclick = () => openSettings();