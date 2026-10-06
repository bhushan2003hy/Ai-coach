document.addEventListener("DOMContentLoaded", function () {

    const completeBtn =
        document.getElementById("completeProfileBtn");

    const resumeInput =
        document.getElementById("resume");


    /*
    ==========================================
    RESUME FILE CHECK
    ==========================================
    */

    if (resumeInput) {

        resumeInput.addEventListener(
            "change",
            function () {

                const file = this.files[0];

                if (!file) {
                    return;
                }

                const maxSize =
                    5 * 1024 * 1024;

                const fileName =
                    file.name.toLowerCase();

                const isPDF =
                    file.type === "application/pdf" ||
                    fileName.endsWith(".pdf");


                // Check PDF

                if (!isPDF) {

                    alert(
                        "Please upload a PDF resume."
                    );

                    this.value = "";

                    return;
                }


                // Check file size

                if (file.size > maxSize) {

                    alert(
                        "Resume size must be less than 5 MB."
                    );

                    this.value = "";

                    return;
                }


                // Show selected filename

                const uploadContent =
                    document.querySelector(
                        ".upload-content"
                    );

                if (uploadContent) {

                    uploadContent.innerHTML = `
                        <strong>${file.name}</strong>
                        <span>Resume selected successfully</span>
                    `;
                }

            }
        );
    }


    /*
    ==========================================
    INPUT HELPERS
    ==========================================
    */

    function getValue(id) {

        const element =
            document.getElementById(id);

        if (!element) {
            return "";
        }

        return element.value.trim();
    }


    function markError(element) {

        if (!element) {
            return;
        }

        element.classList.add("input-error");
    }


    function removeError(element) {

        if (!element) {
            return;
        }

        element.classList.remove("input-error");
    }


    /*
    ==========================================
    REMOVE ERROR WHEN USER TYPES
    ==========================================
    */

    const allInputs =
        document.querySelectorAll(
            "input, select"
        );

    allInputs.forEach(function (input) {

        input.addEventListener(
            "input",
            function () {
                removeError(this);
            }
        );

        input.addEventListener(
            "change",
            function () {
                removeError(this);
            }
        );

    });


    /*
    ==========================================
    COMPLETE PROFILE
    ==========================================
    */

    if (completeBtn) {

        completeBtn.addEventListener(
            "click",
            function () {

                let isValid = true;


                /*
                ------------------------------
                REQUIRED FIELDS
                ------------------------------
                */

                const requiredFields = [
                    "fullName",
                    "mobile",
                    "college",
                    "degree",
                    "branch",
                    "currentYear",
                    "graduationYear",
                    "cgpa",
                    "skills"
                ];


                requiredFields.forEach(
                    function (id) {

                        const element =
                            document.getElementById(id);

                        const value =
                            getValue(id);

                        if (!value) {

                            markError(element);

                            isValid = false;

                        } else {

                            removeError(element);

                        }

                    }
                );


                /*
                ------------------------------
                MOBILE VALIDATION
                ------------------------------
                */

                const mobile =
                    getValue("mobile");

                const mobileInput =
                    document.getElementById(
                        "mobile"
                    );

                if (mobile) {

                    const mobilePattern =
                        /^[6-9][0-9]{9}$/;

                    if (
                        !mobilePattern.test(
                            mobile
                        )
                    ) {

                        markError(
                            mobileInput
                        );

                        alert(
                            "Please enter a valid 10 digit Indian mobile number."
                        );

                        isValid = false;

                    }

                }


                /*
                ------------------------------
                CGPA / PERCENTAGE VALIDATION
                ------------------------------
                */

                const cgpa =
                    getValue("cgpa");

                const cgpaInput =
                    document.getElementById(
                        "cgpa"
                    );

                if (cgpa) {

                    const cleaned =
                        cgpa
                            .toLowerCase()
                            .replace("%", "")
                            .replace("cgpa", "")
                            .trim();

                    const number =
                        parseFloat(cleaned);

                    if (
                        isNaN(number) ||
                        number <= 0 ||
                        number > 100
                    ) {

                        markError(
                            cgpaInput
                        );

                        alert(
                            "Please enter a valid CGPA or percentage."
                        );

                        isValid = false;

                    }

                }


                /*
                ------------------------------
                STOP IF INVALID
                ------------------------------
                */

                if (!isValid) {

                    const firstError =
                        document.querySelector(
                            ".input-error"
                        );

                    if (firstError) {

                        firstError.focus();

                    }

                    return;
                }


                /*
                ------------------------------
                TEMPORARY SUCCESS
                ------------------------------
                */

                alert(
                    "Profile information is valid. Database connection will be added in the next step."
                );

            }
        );

    }

});

