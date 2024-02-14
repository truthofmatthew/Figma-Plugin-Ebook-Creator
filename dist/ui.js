/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
// uiHandlers.js

console.log("uiHandlers.js loaded");


document.addEventListener('DOMContentLoaded', function () {
    const bulletPointStyleBtn = document.getElementById('bulletPointStyle');
    const helpButton = document.getElementById('helpButton');
    const closeModal = document.getElementById('closeModal');
    const copyTextBtn = document.getElementById('copyTextBtn');
    const textBlock = document.getElementById('textBlock');

    // Initially disable the bulletPointStyle button if the textarea is empty
    bulletPointStyleBtn.disabled = !textBlock.value.trim();

    // Input event for textarea
    textBlock.addEventListener('input', () => {
        // Disable the bulletPointStyle button if textarea is empty
        bulletPointStyleBtn.disabled = !textBlock.value.trim();
    });

    bulletPointStyleBtn.addEventListener('click', () => {
        const text = textBlock.value;
        parent.postMessage({ pluginMessage: { type: 'create-text-layers', text } }, '*');
    });

    helpButton.addEventListener('click', function () {
        const helpModal = document.getElementById('helpModal');
        helpModal.style.display = "block";
    });

    closeModal.addEventListener('click', function () {
        const helpModal = document.getElementById('helpModal');
        helpModal.style.display = "none";
    });

    window.onclick = function (event) {
        const helpModal = document.getElementById('helpModal');
        if (event.target == helpModal) {
            helpModal.style.display = "none";
        }
    };

    copyTextBtn.addEventListener('click', function () {
        const guideText = document.getElementById('guideText');
        if (navigator.clipboard && window.isSecureContext) {
            // Use the Clipboard API when available
            navigator.clipboard.writeText(guideText.innerText).then(() => {
                alert('Text copied to clipboard');
            }).catch(err => {
                console.error('Error copying text: ', err);
            });
        } else {
            // Fallback method for copying text
            let textArea = document.createElement("textarea");
            textArea.value = guideText.innerText;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                let successful = document.execCommand('copy');
                alert('Text copied to clipboard');
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    });





    
});

/******/ })()
;