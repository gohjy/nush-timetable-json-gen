let data;
try {
    data = JSON.parse(new URL(location.href).searchParams.get("data"));
} catch(e) {
    alert("invalid data");
    location.replace("../fill/");
    throw e;
}
document.querySelector("#output-container").textContent = JSON.stringify(data,null,2);