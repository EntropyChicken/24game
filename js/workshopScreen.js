class WorkshopScreen {
	constructor(w = width, h = height) {
        
	}
    draw() {
        background(210,225,250); // color of designed puzzle modes
    }
}

function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}