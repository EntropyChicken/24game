class HistoryScreen {
	constructor(w = width, h = height) {
		this.container = createDiv('');
		this.container.style('position', 'absolute');
		this.container.style('overflow-y', 'auto');
		this.container.style('display', 'flex');
		this.container.style('flex-direction', 'column');
		this.container.style('gap', '14px');
		this.container.style('font-family', 'Arial, sans-serif');
		this.container.hide();

		this.pageSize = 6;      // wins per page
		this.currentPage = 0;    // 0-indexed
		this.totalPages = 1;

		this.reSetupLayout(w, h);
	}

	reSetupLayout(w = width, h = height) {
		this.width = w;
		this.height = h;

		// same size/position formula as Level's homeButton
		this.homeButton = new Button({
			x: this.width * 0.05, y: this.height * 0.05, w: max(60, this.width * 0.1), h: this.height * 0.1,
			label: "Home",
			style: {
				r: 10,
				onHoverMovement: 0.004
			},
			getText: () => TRANSLATIONS[currentLang].level.homeButton,
			onClick: () => { setScreen("title"); }
		});

		// pagination controls, top right
		const navBtnW = max(50, this.width * 0.07);
		const navBtnH = this.height * 0.1;
		const margin = this.width * 0.05;
		const pageLabelW = 70; // reserved space for the "x / y" text between the buttons
		const navGap = 10;

		this.nextButton = new Button({
			x: this.width - margin - navBtnW, y: this.height * 0.05, w: navBtnW, h: navBtnH,
			label: "Next",
			style: {
				r: 10,
				onHoverMovement: -0.004
			},
			getText: () => TRANSLATIONS[currentLang]?.history?.nextButton ?? "Next",
			onClick: () => this.goToNextPage()
		});

		this.prevButton = new Button({
			x: this.nextButton.x - navGap - pageLabelW - navGap - navBtnW, y: this.height * 0.05, w: navBtnW, h: navBtnH,
			label: "Prev",
			style: {
				r: 10,
				onHoverMovement: -0.004
			},
			getText: () => TRANSLATIONS[currentLang]?.history?.prevButton ?? "Prev",
			onClick: () => this.goToPrevPage()
		});

		this.positionContainer();
	}

	positionContainer() {
		this.container.position(this.homeButton.x, this.homeButton.y+this.homeButton.h+20);
		this.container.style('width', (this.width - 110) + 'px');
		this.container.style('height', (this.height - 110) + 'px');
	}

	show() {
		this.currentPage = 0; // always open on the most recent wins
		this.refresh();
		this.container.show();
	}

	hide() {
		this.container.hide();
	}

	goToNextPage() {
		if (this.currentPage < this.totalPages - 1) {
			this.currentPage++;
			this.refresh();
		}
	}

	goToPrevPage() {
		if (this.currentPage > 0) {
			this.currentPage--;
			this.refresh();
		}
	}

	// rebuilds the win-history HTML from localStorage, for the current page only
	refresh() {
		let victories = JSON.parse(localStorage.getItem('winHistory')) || [];
		let allRecent = victories.slice().reverse(); // most recent first, full list

		this.totalPages = Math.max(1, Math.ceil(allRecent.length / this.pageSize));
		// clamp in case wins changed (or shrank) while the screen was open
		this.currentPage = constrain(this.currentPage,0,this.totalPages-1);
        this.nextButton.style.transparent = (this.currentPage === this.totalPages-1);
        this.nextButton.style.onHoverMovement = (this.currentPage === this.totalPages-1) ? 0 : 0.0045;
        this.prevButton.style.transparent = (this.currentPage === 0);
        this.prevButton.style.onHoverMovement = (this.currentPage === 0) ? 0 : 0.0045;

		const start = this.currentPage * this.pageSize;
		const pageItems = allRecent.slice(start, start + this.pageSize);

		const rowStyle = `display: flex; align-items: stretch; gap: 8px;`;
		const boxStyle = `
			font-family: Arial, sans-serif;
			white-space: normal; word-wrap: break-word; overflow-wrap: break-word;
			user-select: text; -webkit-user-select: text;
			background: rgba(255,255,255,1); border-radius: 8px;
			padding: 8px 12px; font-size: 16px; max-height: 100px; overflow-y: auto;
			flex: 1 1 auto;
		`;
		const copyBtnStyle = `
			font-family: Arial, sans-serif;
			flex: 0 0 auto; align-self: center;
			padding: 6px 10px; border-radius: 6px; border: none;
			background: rgba(255,255,255,1); cursor: pointer; font-size: 14px;
		`;

		let html = pageItems.map((win, i) => {
        let dateStr = new Date(win.timestamp).toLocaleString();
        let modeLabel = TRANSLATIONS[currentLang].history.screenToMode[win.screen] ?? win.screen;
        
        // 1. Escape each piece of text individually
        let p1 = escapeHtml(`${dateStr} (${modeLabel}${win.hintUsed ? ' (hint used)' : ''})`);
        let p2 = escapeHtml(`[${win.originalValues.join(', ')}] ${win.opSymbols.join('')} `);

        // 2. Join them with HTML line break tags
        let metaHtml = `${p1}<br>${p2}`;

        return `
            <div>
                <div style="${rowStyle}">
                    <div class="win-box" data-copy-idx="${i}-meta" style="${boxStyle}">${metaHtml}</div>
                    <button class="win-copy-btn" data-copy-target="${i}-meta" style="${copyBtnStyle}">Copy</button>
                </div>
                <div style="${rowStyle} margin-left: 40px; width: calc(100% - 40px);">
                    <div class="win-box" data-copy-idx="${i}-sol" style="${boxStyle}">${escapeHtml(win.solution)}</div>
                    <button class="win-copy-btn" data-copy-target="${i}-sol" style="${copyBtnStyle}">Copy</button>
                </div>
            </div>
        `;
    }).join('');

		this.container.html(html || '<div style="color:white;">No wins yet... Go make some 24s!</div>');
		this.wireCopyButtons();
	}

	// attach click handlers after injecting HTML, so we don't have to escape text into inline onclick attrs
	wireCopyButtons() {
		const boxes = this.container.elt.querySelectorAll('.win-box');
		const textByIdx = {};
		boxes.forEach(box => { textByIdx[box.dataset.copyIdx] = box.textContent; });

		const buttons = this.container.elt.querySelectorAll('.win-copy-btn');
		buttons.forEach(btn => {
			btn.addEventListener('click', () => {
				const text = textByIdx[btn.dataset.copyTarget] || '';
				navigator.clipboard.writeText(text).then(() => {
					const original = btn.textContent;
					btn.textContent = 'Copied!';
					setTimeout(() => { btn.textContent = original; }, 1200);
				}).catch(() => {
					btn.textContent = 'Failed';
					setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
				});
			});
		});
	}

	draw() {
		background(lerpColor(color(0), theme.backgroundColorCorrect, 1));
		textAlign(LEFT, TOP);
		textSize(50);
		textAlign(LEFT, TOP);

		this.homeButton.draw();
		this.prevButton.draw();
		this.nextButton.draw();

		// page indicator, centered between prev/next buttons
		push();
		textAlign(CENTER, CENTER);
		textSize(25);
		fill(0);
		noStroke();
		let midX = (this.prevButton.x + this.prevButton.w + this.nextButton.x) / 2;
		let midY = this.prevButton.y + this.prevButton.h / 2;
		text(`${this.currentPage + 1} / ${this.totalPages}`, midX, midY);
		pop();
	}

	handleClick(mx, my) {
		if (this.homeButton.contains(mx, my)) {
			this.homeButton.drawScale -= 0.08;
			this.homeButton.onClick();
		}
		if (this.prevButton.contains(mx, my)) {
			this.prevButton.drawScale -= 0.08;
			this.prevButton.onClick();
		}
		if (this.nextButton.contains(mx, my)) {
			this.nextButton.drawScale -= 0.08;
			this.nextButton.onClick();
		}
	}
}

function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}