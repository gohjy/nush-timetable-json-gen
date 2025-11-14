let thisLoc = new URL(location.href).searchParams;
const year = +thisLoc.get("year");
const sem = +thisLoc.get("sem");
const classId = thisLoc.get("class");

(() => {
    if (
        !year
        || (sem !== 1 && sem !== 2)
        || ![
            "101", "102", "103", "104", "105", "106", 
            "201", "202", "203", "204", "205", "206", 
            "301", "302", "303", "304", "305", "306", "307",
            "401", "402", "403", "404", "405", "406", "407",
            "501", "502", "503", "504", "505", "506", "507",
            "601", "602", "603", "604", "605", "606", "607"
        ].includes(classId)
    ) {
        alert("Invalid parameters!");
        location.replace("../meta/");
        throw new Error("Invalid params");
    }

    document.querySelector("#meta-container").textContent = `${classId} ${year} Sem ${sem} `;
    const backBtn = document.createElement("button");
    backBtn.textContent = "Edit (will clear your progress)";
    const backLink = document.createElement("a");
    backLink.href = "../meta/";
    backLink.append(backBtn);
    document.querySelector("#meta-container").append(backLink);
})();

const getPosData = async (posYear) => {
    const resp = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-pos-data@master/data/${posYear}/pos.json`);
    const jsonData = await resp.json();
    return jsonData;
}
/*
const getTimetableData = async ({year, sem, classId}) => {
    const resp = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-timetable-data@master/${year}s${sem}/class/${classId}`);
    const jsonData = await resp.json();
    return jsonData;
}

const timetableDataExists = async ({year, sem, classId}) => {
    const resp = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-timetable-data@master/${year}s${sem}/class/${classId}`);
    return resp.ok;
}
    */

const plusButtonHandler = ev => {
    const input = document.createElement("input");
    input.type = "text";
    input.size = input.maxLength = 7;
    input.classList.add("courseCodeInput");
    const button = document.createElement("button");
    button.textContent = "X";
    button.addEventListener("click", (ev) => ev.currentTarget.parentElement.remove());
    const holder = document.createElement("div");
    holder.classList.add("input-holder");
    holder.append(input, button);
    ev.currentTarget.before(holder, " ");
}

const mainTables = document.querySelectorAll(".main-table");

const calcPeriodStart = periodNum => (800 + (100 * Math.floor((periodNum - 1)/2)) + (30 * ((periodNum - 1) % 2))).toString().padStart(4, "0");

for (let mainTable of mainTables) {
    const tbody = mainTable.querySelector("tbody");

    for (let periodNum=1; periodNum<=20; periodNum++) {
        const tr = document.createElement("tr");
        const periodStart = calcPeriodStart(periodNum);
        const periodEnd = calcPeriodStart(periodNum + 1);

        const td1 = document.createElement("td");
        td1.textContent = `${periodStart}-${periodEnd}`;
        tr.append(td1);

        const td2 = document.createElement("td");
        const plusButton = document.createElement("button");
        plusButton.textContent = "+";
        plusButton.addEventListener("click", plusButtonHandler);
        td2.append(plusButton);
        tr.append(td2);
        plusButton.click();

        tbody.append(tr);
    }
}

const prevBtn = document.querySelector("#prevDayBtn");
const nextBtn = document.querySelector("#nextDayBtn");
const daySpan = document.querySelector("#dayName");

const dayNames = [null, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const btnClickHandler = (next=true) => {
    const currentActive = document.querySelector("table.active");
    currentActive.classList.remove("active");
    const nextActive = (next ? currentActive.nextElementSibling : currentActive.previousElementSibling) ?? (Array.from(currentActive.parentElement.children)[next ? "find" : "findLast"](()=>true));
    nextActive.classList.add("active");
    daySpan.textContent = dayNames[+nextActive.dataset.day];
}

prevBtn.addEventListener("click", () => btnClickHandler(false));
nextBtn.addEventListener("click", () => btnClickHandler(true));

async function submitHandler() {
    let posData;
    let acadYear = year + (6 - (+classId.slice(0, 1)));
    try {
        posData = await getPosData(acadYear);
    } catch(e) {
        console.error(e);
        posData = null;
    }
    let mustHydrate = true;
    if (!posData) {
        alert("POS could not be fetched, continuing without autofill");
        mustHydrate = false;
    }

    const data = {
        version: "3-class-raw",
        meta: {
            year,
            sem,
            "class": +classId
        },
        data: []
    };

    for (let day=1; day<=5; day++) {
        let table = document.querySelector(`table.main-table[data-day="${day}"]`);
        if (!table) {
            alert("Something went wrong!!");
            throw new Error("couldn't find table for day" + day);
        }

        let thisData = { day };
        let rows = Array.from(table.querySelectorAll("tbody tr"));

        for (let period=1; period<=20; period++) {
            let thatData = [];
            let thatRow = rows[period - 1];
            for (let course of thatRow.querySelectorAll(".courseCodeInput")) {
                let courseVal = course.value.trim();
                let courseInputData = {};
                if (["cce", "pe", "lun", "rc", "men", "free", ""].includes(courseVal.toLowerCase())) {
                    courseInputData.subject = courseVal;
                    courseInputData.courseCode = "";
                    thatData.push(courseInputData);
                    continue;
                } else {
                    courseInputData.courseCode = courseVal;
                };

                if (mustHydrate) {
                    let options = posData.filter(x => x.code.trim() === courseInputData.courseCode);
                    if (!options.length) {
                        courseInputData._subject = "WARNING: This course code could not be found in the POS.";
                    } else {
                        if (options.length > 1) {
                            courseInputData._subject = "WARNING: More than one course was found for this course code in the POS.";
                        }
                        
                        const subjectInfo = options[0];
                        if (["Elective", "Enrichment"].includes(subjectInfo.type)) {
                            courseInputData.subject = "ELEC";
                        } else if (subjectInfo.type.includes("Honours")) {
                            courseInputData.subject = "HON";
                        } else if (
                            [2, 3].includes(acadYear)
                            && (
                                // C2026: AR, MU no longer valid for HAMS
                                ((year + acadYear - 1) <= 2030)
                                ? ["AR", "MU", "EN", "HY", "GE"]
                                : ["EN", "HY", "GE"]
                            ).includes(subjectInfo.department)
                        ) { 
                            courseInputData.subject = "CHAMS";
                        } else {
                            const deptMap = {
                                "MA": "MA",
                                "BL": "BIO",
                                "PC": "PHYS",
                                "CS": "CS",
                                "DV": "DV",
                                "EL": "EL",

                                "AR": "ART",
                                "MU": "MU",

                                // MTL
                                "CH": "MT", // Chinese
                                "CL": "MT",
                                "TH": "MT", // Tamil
                                "TL": "MT",
                                "MH": "MT", // Malay
                                "ML": "MT",
                                "BG": "MT", // Bengali
                                "GJ": "MT", // Gujarati
                                "GM": "MT", // German
                                "HD": "MT", // Hindi
                                "JP": "MT", // Japanese
                                "PJ": "MT", // Punjabi
                                "UD": "MT", // Urdu
                            };
                            if (subjectInfo.department in deptMap) {
                                courseInputData.subject = deptMap[subjectInfo.department];
                            } else {
                                courseInputData.subject = "";
                                courseInputData._subject = "WARNING: This course code could not be shortened to a subject.";
                            }
                        }
                    }
                }

                thatData.push(courseInputData);
            }
            thisData[`p${period}`] = thatData;
        }

        data.data.push(thisData);
    }

    const stringified = JSON.stringify(data, null, 2);

    const outputArea = document.createElement("div");
    outputArea.classList.add("output-area");
    outputArea.textContent = stringified;

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy JSON";
    copyBtn.addEventListener("click", async () => {
        copyBtn.disabled = true;
        try {
            await navigator.clipboard.writeText(stringified);
            copyBtn.textContent = "Copied!";
        } catch(e) {
            console.error(e);
            copyBtn.textContent = "Failed to copy!";
        } finally {
            setTimeout(() => {
                copyBtn.textContent = "Copy JSON";
                copyBtn.disabled = false;
            }, 2000);
        }
    });

    document.querySelector("#output-container").innerHTML = "";
    document.querySelector("#output-container").append(copyBtn, outputArea);
}

document.querySelector("#done").addEventListener("click", submitHandler);
