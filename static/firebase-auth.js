// =========================================================
// GOOGLE LOGIN - GOOGLE IDENTITY SERVICES + FIREBASE
// =========================================================

const googleProvider =
    new firebase.auth.GoogleAuthProvider();


// =========================================================
// GOOGLE LOGIN CALLBACK
// =========================================================

window.handleGoogleCredential = function (response) {

    console.log("GOOGLE ID TOKEN RECEIVED");

    if (!response || !response.credential) {

        console.error(
            "GOOGLE ID TOKEN NOT RECEIVED"
        );

        return;
    }

    // Google ID token ko Firebase credential mein convert karo
    const credential =
        googleProvider.credential(
            response.credential
        );

    console.log(
        "FIREBASE GOOGLE CREDENTIAL CREATED"
    );


    // Firebase mein Google user login
    firebase.auth()
        .signInWithCredential(credential)

        .then(function (result) {

            const user = result.user;

            console.log(
                "FIREBASE GOOGLE USER:",
                user
            );

            console.log(
                "GOOGLE EMAIL:",
                user.email
            );

            console.log(
                "GOOGLE NAME:",
                user.displayName
            );

            console.log(
                "GOOGLE UID:",
                user.uid
            );

            return response.credential;

        })

       .then(function (googleIdToken) {
        console.log(
        "GOOGLE ID TOKEN READY FOR DJANGO"
            );

            const formData =
                new FormData();

            formData.append(
             "id_token",
              googleIdToken
            );

            const csrfToken = document.querySelector(
                '[name=csrfmiddlewaretoken]'
            ).value;

            return fetch("/google-login/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken
                },
                body: formData
            });

        })

        .then(function (response) {

            return response.text().then(function (text) {

                console.log(
                    "DJANGO RESPONSE STATUS:",
                    response.status
                );

                console.log(
                    "DJANGO RESPONSE:",
                    text
                );

                if (!response.ok) {
                    throw new Error(
                        "Django returned " + response.status
                    );
                }

                return JSON.parse(text);
            });

        })

        .then(function (data) {

            console.log(
                "DJANGO GOOGLE LOGIN RESPONSE:",
                data
            );

            if (data.success) {

                window.location.href =
                    data.redirect_url;

            } else {

                alert(
                    data.error ||
                    "Google login failed."
                );

            }

        })

        .catch(function (error) {

            console.error(
                "GOOGLE LOGIN ERROR CODE:",
                error.code
            );

            console.error(
                "GOOGLE LOGIN ERROR MESSAGE:",
                error.message
            );

            console.error(
                "GOOGLE LOGIN FULL ERROR:",
                error
            );

        });
};


// =========================================================
// INITIALIZE GOOGLE IDENTITY SERVICES
// =========================================================

function initializeGoogleLogin() {

    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.id
    ) {

        console.error(
            "GOOGLE IDENTITY SERVICES NOT LOADED"
        );

        return;

    }


    google.accounts.id.initialize({

        client_id:
            "656716095633-djqmbkhbb7bi5ac2od6a10vhta402vf1.apps.googleusercontent.com",

        callback:
            handleGoogleCredential

    });


    console.log(
        "GOOGLE IDENTITY SERVICES INITIALIZED"
    );
}


// =========================================================
// GOOGLE BUTTON
// =========================================================

const googleButton =
    document.querySelector(
        '[data-provider="google"]'
    );


if (googleButton) {

    googleButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            console.log(
                "GOOGLE BUTTON CLICKED"
            );

            if (
                typeof google === "undefined" ||
                !google.accounts ||
                !google.accounts.id
            ) {

                console.error(
                    "GOOGLE IDENTITY SERVICES NOT READY"
                );

                return;
            }

            google.accounts.id.prompt();

        }
    );

    console.log(
        "Google button event listener attached"
    );

} else {

    console.warn(
        "Google button not found"
    );

}


// =========================================================
// WAIT FOR GOOGLE SCRIPT
// =========================================================

window.addEventListener(
    "load",
    function () {

        initializeGoogleLogin();

    }
);