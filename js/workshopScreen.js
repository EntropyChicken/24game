class WorkshopScreen {
	constructor(w = width, h = height) {
        this.workbenchWidth = w*0.65;
    
        this.numberInput = createInput('');
        this.numberInput.attribute('placeholder', TRANSLATIONS[currentLang].workshopScreen.numberInput);
        this.numberInput.style('font-size', '20px');
        this.numberInput.style('padding', '10px');
        this.numberInput.style('border-radius', '8px');
        this.numberInput.style('border', '2px solid #323232');
        this.numberInput.style('text-align', 'center');
        this.numberInput.style('box-sizing', 'border-box');
        this.numberInput.style('font-family', 'Arial, sans-serif');

        this.numberInput.position(100, 100);
        this.numberInput.elt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                createCard();
                teamInput.elt.blur(); 
            }
        });

	}
    drawWorkbench() {

    }
    drawList() {

    }
    draw() {
        background(210,225,250); // color of designed puzzle modes
    }
}

function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}