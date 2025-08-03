let thisLoc = new URL(location.href).searchParams;
const year = +thisLoc.get("year");
const sem = +thisLoc.get("sem");
const classId = thisLoc.get("class");

(() => {
    if (
        !year
        || (sem !== 1 && sem !== 2)
        || !"101 102 103 104 105 106 201 202 203 204 205 206 \
            301 302 303 304 305 306 401 402 403 404 405 406 \
            501 502 503 504 505 506 601 602 603 604 605 606 \
            307 407 507 607".split(" ").filter(x => !!x).includes(classId)
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
    const posData = await getPosData(year + (6 - (+classId.slice(0, 1))));
    let mustHydrate = true;
    if (!posData) {
        alert("POS could not be fetched, continuing without autofill");
        mustHydrate = false;
    }

    const data = {
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
                let courseInputData = {
                    courseCode: course.value.trim()
                };
                if (mustHydrate) {
                    let options = posData.filter(x => x.code.trim() === courseInputData.courseCode);
                    if (!options.length) {
                        courseInputData._subject = "WARNING: This course code could not be found in the POS.";
                    } else {
                        if (options.length > 1) {
                            courseInputData._subject = "WARNING: More than one course was found for this course code in the POS.";
                        }
                        let longName;
                        longName = courseInputData.shortName = courseInputData.longName = options[0].title.trim();

                        if (courseInputData.courseCode.match(/^DV(?=\d)/i)) {
                            courseInputData.shortName = "DV " + courseInputData.shortName;
                            courseInputData.shortName.replace(/\b(D)esign (and|\&) (E)ngineering\b/i, "$1&$3");
                            courseInputData.shortName.replace(/\b(S)cien(ce|tific) (P)resentations?\b/i, "$1$3");
                        }

                        if (longName.match(/^Advanced\b/)) {
                            courseInputData.shortName = courseInputData.shortName.replace("Advanced", "Adv");
                        }

                        if (longName.match(/^Foundations in \b/i)) {
                            courseInputData.shortName = courseInputData.shortName.replace(/^Foundations in \b/i, "");
                        }

                        if (longName.match(/\brobotics\b/i)) {
                            courseInputData.shortName = courseInputData.shortName.replace(/\b(robot)ics\b/i, "$1");
                        }

                        if (longName.match(/\bbiology\b/i)) {
                            courseInputData.shortName = courseInputData.shortName.replace(/\b(bio)logy\b/i, "$1");
                        }

                        if (longName.match(/\bchemistry\b/i)) {
                            courseInputData.shortName = courseInputData.shortName.replace(/\b(chem)istry\b/i, "$1");
                        }

                        // roman numeral regex from StackOverflow:
                        // https://stackoverflow.com/a/267405
                        // CC BY-SA 4.0 (https://stackoverflow.com/help/licensing)
                        
                        // /^(?=.)M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/
                        
                        if (longName.match(/\bOlympiad\b/i)) {
                            let match = longName.match(/^(Math|Phys|Bio|Chem)[^\s]* Oly.* Training ((?=.)M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))$/i);
                            if (match) {
                                courseInputData.shortName = match[1] + " Oly " + match[2];
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

    const stringified = JSON.stringify(data);

    const urlObj = new URL("../out/", location.href);
    urlObj.searchParams.set("data", stringified);
    location.assign(urlObj.href);
}

document.querySelector("#done").addEventListener("click", submitHandler);