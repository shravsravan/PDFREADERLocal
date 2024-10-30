document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressText = document.getElementById('progressText');
    const readButton = document.getElementById('readButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');
    const voiceSelect = document.getElementById('voiceSelect');
    const output = document.getElementById('output');

    let utterance;
    let isPaused = false;
    let startingPoint = 0; // Variable to track the starting point
    let pdfContentLines = []; // Store lines of PDF content

    // Set PDF.js worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    fileInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = function (e) {
                const typedarray = new Uint8Array(e.target.result);
                pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                    let pdfText = "";
                    const pagePromises = [];
                    for (let i = 1; i <= pdf.numPages; i++) {
                        pagePromises.push(
                            pdf.getPage(i).then(page => {
                                return page.getTextContent().then(textContent => {
                                    const pageText = textContent.items.map(item => item.str).join("\n"); // Join with newline for lines
                                    pdfText += `\nPage ${i}:\n${pageText}\n`;
                                    pdfContentLines.push(pageText.split("\n")); // Store lines for easy access
                                });
                            })
                        );
                    }
                    Promise.all(pagePromises).then(() => {
                        output.innerHTML = pdfText.replace(/\n/g, "<br>"); // Use <br> to display lines
                        window.pdfContent = pdfText;
                    });
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Please upload a valid PDF file.");
        }
    });

    // Set up voice selection
    speechSynthesis.onvoiceschanged = function () {
        const voices = speechSynthesis.getVoices();
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    };

    // Click event to set the starting point
    output.addEventListener('click', function (event) {
        const lineHeight = parseInt(getComputedStyle(output).lineHeight);
        const yPosition = event.clientY - output.getBoundingClientRect().top;
        const lineIndex = Math.floor(yPosition / lineHeight);

        if (lineIndex < pdfContentLines.length) {
            startingPoint = pdfContentLines.slice(0, lineIndex).join("\n").length; // Update the starting point
            console.log("Starting from line:", lineIndex + 1); // Log the line number for debugging
        }
    });

    readButton.addEventListener('click', function () {
        if (window.pdfContent) {
            utterance = new SpeechSynthesisUtterance(window.pdfContent.substring(startingPoint)); // Read from the starting point
            const selectedVoice = voiceSelect.value;
            const voices = speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoice);
            utterance.voice = voice;
            utterance.rate = speedRange.value; // Set speech rate from slider
            speechSynthesis.speak(utterance);

            // Update speed dynamically
            utterance.onboundary = function (event) {
                if (event.charIndex) {
                    const currentText = window.pdfContent.substring(event.charIndex);
                    output.innerHTML = currentText.replace(/(.*?)/, '<span class="highlight">$1</span>');
                }
            };

            utterance.onend = function () {
                output.innerHTML = window.pdfContent; // Reset the output when done
            };
        } else {
            alert("Please upload a PDF and wait for it to be processed.");
        }
    });

    pauseButton.addEventListener('click', function () {
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
            isPaused = true;
        }
    });

    resumeButton.addEventListener('click', function () {
        if (isPaused) {
            speechSynthesis.resume();
            isPaused = false;
        }
    });

    speedRange.addEventListener('input', function () {
        speedValue.textContent = speedRange.value; // Display current speed value
        if (utterance) {
            utterance.rate = speedRange.value; // Change speed dynamically
        }
    });
});
