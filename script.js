const getPosData = async (posYear) => {
    const resp = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-pos-data@master/data/${posYear}/pos.json`);
    const jsonData = await resp.json();
    return jsonData;
}

const getTimetableData = async ({year, sem, classId}) => {
    const resp = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-timetable-data@master/${year}s${sem}/class/${classId}`);
    const jsonData = await resp.json();
    return jsonData;
}

const timetableDataExists = async ({year, sem, classId}) => {
    const resp = await fetch(`https://cdn.jsdelivr.net/gh/gohjy/nush-timetable-data@master/${year}s${sem}/class/${classId}`);
    return resp.ok;
}

/*********************** /
/  Setup event listeners /
/ ***********************/

/* const yearSelect = document.querySelector("#yearSelect");
const yearSelectCont = document.querySelector("#yearSelect-container");
const classIdSelect = document.querySelector("#classIdSelect");
const classIdSelectCont = document.querySelector("#classIdSelect-container");
const mainSect = document.querySelector("#main-container");

const yChangeHandler = () => {
    if (yearSelect.hasAttribute("data-valid")) {
        classIdSelectCont.classList.remove("invisible");
    } else {
        classIdSelectCont.classList.add("invisible");
        mainSect.classList.add("invisible")
    }
}

yearSelect.addEventListener("input", () => {
    const value = +yearSelect.value;
    if (!value || value < 2005 || value > (new Date().getFullYear() + 1)) {
        yearSelect.removeAttribute("data-valid");
    } else {
        yearSelect.setAttribute("data-valid", "");
    }
    yChangeHandler();
});
yearSelect.addEventListener("change", yChangeHandler);
yearSelect.addEventListener("blur", yChangeHandler); */

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

const calcPeriodStart = periodNum => (800 + (100 * Math.floor(periodNum/2)) + (30 * (periodNum % 2))).toString().padStart(4, "0");

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