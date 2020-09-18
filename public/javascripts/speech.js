window.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("button");
    const result = document.getElementById("result");
    const reply = document.getElementById("reply");
    const main = document.getElementsByTagName("main")[0];

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (typeof SpeechRecognition === "undefined") {
        button.remove();
        const message = document.getElementById("message");
        message.removeAttribute("hidden");
        message.setAttribute("aria-hidden", "false");
    } else {
        let listening = false;
        const recognition = new SpeechRecognition();
        const start = () => {
            recognition.start();
            button.textContent = "Stop listening";
            main.classList.add("speaking");
        };
        const stop = () => {
            recognition.stop();
            button.textContent = "Start listening";
            main.classList.remove("speaking");
            sendInput();
        };
        const onResult = event => {
            result.innerHTML = "";
            for (const res of event.results) {
                const text = document.createTextNode(res[0].transcript);
                console.log('Transcript:', text);
                const p = document.createElement("p");
                if (res.isFinal) {
                    p.classList.add("final");
                }
                p.appendChild(text);
                result.appendChild(p);
            }
        };
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.addEventListener("result", onResult);

        button.addEventListener("click", () => {
            listening ? stop() : start();
            listening = !listening;
        });
    }
});

function sendInput() {
    var text = document.getElementsByClassName("final")[0].innerText;
    var http = new XMLHttpRequest();
    var url = "http://localhost:3000/input?text=" + text;

    window.location.href = url;
    // http.open("GET", url);
    // http.send();

    // http.onreadystatechange = (e) => {
    //     var response = http.responseText;
    //     console.log("Response:", response);
    // }
}