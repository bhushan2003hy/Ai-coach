
document.addEventListener("DOMContentLoaded", function () {
    const profileBtn = document.getElementById("profileBtn");
    const profilePanel = document.getElementById("profilePanel");
    const profileView = document.getElementById("profileView");
    const profileEdit = document.getElementById("profileEdit");
    const editProfileBtn = document.getElementById("editProfileBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    function showProfileDetails() {
        profileView.hidden = false;
        profileEdit.hidden = true;
    }

    function showProfileForm() {
        profileView.hidden = true;
        profileEdit.hidden = false;
    }

    // Profile icon: open / close panel
    if (profileBtn && profilePanel) {
        profileBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            profilePanel.classList.toggle("show");
        });
    }

    // Open edit form
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", function () {
            showProfileForm();
        });
    }

    // Cancel editing
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", function () {
            showProfileDetails();
        });
    }

    // Keep edit form open if server returns a validation error
    if (document.querySelector(".profile-error")) {
        showProfileForm();
        profilePanel.classList.add("show");
    }

    // Close panel when clicking outside it
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

    // Logout (existing behavior)
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (confirm("Are you sure you want to logout?")) {
                window.location.href = "/";
            }
        });
    }

    // Feature buttons
    document.querySelectorAll(".feature-card button").forEach(function (button) {
        button.addEventListener("click", function () {
            alert("This feature will be available soon.");
        });
    });
});
