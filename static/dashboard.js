document.addEventListener("DOMContentLoaded", function () {

    const profileBtn = document.getElementById("profileBtn");
    const profilePanel = document.getElementById("profilePanel");
    const logoutBtn = document.getElementById("logoutBtn");


    /* =========================================
       PROFILE ICON
    ========================================= */

    if (profileBtn && profilePanel) {

        profileBtn.addEventListener("click", function (event) {

            event.stopPropagation();

            profilePanel.classList.toggle("show");

        });

    }


    /* =========================================
       CLOSE PROFILE PANEL
       WHEN CLICKING OUTSIDE
    ========================================= */

    document.addEventListener("click", function (event) {

        if (
            profilePanel &&
            profileBtn &&
            !profilePanel.contains(event.target) &&
            !profileBtn.contains(event.target)
        ) {

            profilePanel.classList.remove("show");

        }

    });


    /* =========================================
       LOGOUT
    ========================================= */

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            const confirmLogout = confirm(
                "Are you sure you want to logout?"
            );

            if (confirmLogout) {

                window.location.href = "/";

            }

        });

    }


    /* =========================================
       FEATURE BUTTONS
    ========================================= */

    const featureButtons =
        document.querySelectorAll(".feature-card button");


    featureButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            alert(
                "This feature will be available soon."
            );

        });

    });

});

