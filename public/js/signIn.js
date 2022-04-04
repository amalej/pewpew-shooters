// Create references for elements.
const buttonSignIn = document.getElementById('buttonSignIn');

/**
 * @description Firebase config file.
 */
const firebaseConfig = {
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

// Initialize Firebase Authentication.
const firebaseAuth = firebase.auth();

// Initialize Firebase Firestore.
const firestoreDB = firebase.firestore();

/**
 * @description Sign in the user.
 */
const signIn = async() => {
    // Log Sign in event.
    firebaseAnalytics.logEvent(`log_in`);

    // Create trace to measure duration of log in.
    const logInTrace = firebasePerf.trace("log_in");
    logInTrace.start(); // Start trace.

    const provider = new firebase.auth.GoogleAuthProvider();
    firebaseAuth.signInWithPopup(provider)
        .then(async(result) => {
            const user = result.user;
            sessionStorage.userDisplayName = user.displayName;
            sessionStorage.userEmail = user.email;

            // Open the loading modal.
            const modal = document.getElementById('modalLoad');
            const modalInstance = M.Modal.init(modal, {
                dismissible: false
            });
            modalInstance.open();

            // Check if the device is a mobile device.
            const isMobile = navigator.userAgentData.mobile;

            // Create Firestore reference.
            const firestoreInstanceTrace = firebasePerf.trace("firestore_instance");
            firestoreInstanceTrace.start();
            try {
                await createFirestoreInstance(user.email, user.displayName);
                firestoreInstanceTrace.putAttribute("Result", "success");
                firestoreInstanceTrace.stop(); // Stop Firestore instance trace if successful.
                M.toast({ html: 'Logging in', displayLength: 1500, classes: isMobile ? '' : 'rounded' });
            } catch (e) {
                console.log(e);
                firestoreInstanceTrace.putAttribute("Result", "failed");
                firestoreInstanceTrace.stop(); // Stop Firestore instance trace if failed.
                M.toast({ html: 'Error logging in', displayLength: 1500, classes: isMobile ? '' : 'rounded' });
            } finally {
                logInTrace.putAttribute("Result", "success");
                logInTrace.stop(); // Stop sign in trace if successful.

                // Delay log in for a couple of seconds to log the trace.
                setTimeout(() => {
                    modalInstance.close();
                    if (user) window.location.replace("../html/menu.html");
                }, 5000);
            }
        }).catch((e) => {
            console.log(e);
            logInTrace.putAttribute("Result", "failed");
            logInTrace.stop(); // Stop sign in trace if failed.
        });
};

/**
 * @description Create a document which holds data about the user.
 * @param {string} email Email of the user will be used as reference.
 */
const createFirestoreInstance = async(email, displayName) => {
    const userRef = firestoreDB.collection('users').doc(email);
    const firestoreDoc = await userRef.get();
    const docData = firestoreDoc.data();

    // If user has no data in Firestore, create one.
    if (!docData) {
        await userRef.set({
            email: email,
            displayName: displayName,
            username: displayName,
            highscores: [],
        });
    }
}

// Signs in the user when the sign in button is clicked.
buttonSignIn.onclick = () => signIn();