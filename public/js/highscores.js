// Check if there is a logged user. If none, sign in.
if (!sessionStorage.userEmail) window.location.replace("../html/signIn.html");

// Set the references for the elements.
const buttomMenu = document.getElementById('buttonMenu');
const highScoreContainer = document.getElementById('highScoreContainer');

/**
 * @description Firebase config file.
 */
const firebaseConfig = {
    // Prod.
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

// Initialize Firebase Firestore.
const firestoreDB = firebase.firestore();

/**
 * @description Redirects user to the menu page.
 */
const openMenu = () => {
    window.location.replace("../html/menu.html");
};

/**
 * @description Gets the highscores from Firestore then renders them on the page.
 */
const getHighScores = async() => {
    // Log view highscore event.
    firebaseAnalytics.logEvent(`view_high_score`);
    const getHighScoreTrace = firebasePerf.trace("get_high_score");
    getHighScoreTrace.start();

    // Get the score from Firestore.
    const highscoresRef = firestoreDB.collection('highscores').doc('highscores');
    const firestoreDoc = await highscoresRef.get();
    const docData = firestoreDoc.data();

    // Sort the scores.
    const _highscoreMap = new Map();
    Object.keys(docData).forEach((identifier) => {
        _highscoreMap.set(identifier, {
            username: docData[identifier]['username'],
            score: docData[identifier]['score'],
        });
    });
    const sortedScore = new Map([..._highscoreMap.entries()].sort((a, b) => b[1]['score'] - a[1]['score']));

    // Render the HTML.
    let place = 0;
    highScoreContainer.innerHTML = '';
    sortedScore.forEach((value, key) => {
        place += 1;
        const scoreContainerTemplate = `
            <div class="blue-grey darken-4" style="padding: 1em; margin-top: 0.5em; margin-bottom: 0.5em; border-radius: 3em;">
                <div style="display: flex; position: relative;">
                    <div style="position: absolute; height: 100%; align-items: center; padding-left: 0.5em">
                        <div class="valign-wrapper" style="height: 100%;">
                            <b>${place}</b>
                        </div>
                    </div>
                    <div style="width: 100%;">
                        <div style="width: 100%;">
                            ${value['username']}
                        </div>
                        <div class="yellow-text text-accent-3">
                            ${value['score']}
                        </div>
                    </div>
                </div>
            </div>`;
        highScoreContainer.innerHTML += scoreContainerTemplate;
    });
    getHighScoreTrace.stop(); // Stop the trace.
};

// Opens the menu page when the menu button is clicked.
buttonMenu.onclick = () => openMenu();

// Get the highscores and render the HTML.
getHighScores();