// ===== FlashLearn - Main Application =====


// ===== State Management =====
const App = {
    currentView: 'landing',
    currentDeck: null,
    currentDeckId: null,
    currentCardIndex: 0,
    studyCards: [],
    tempCards: [],
    isFlipped: false,


    init() {
        this.checkFirstTime();
        this.bindEvents();
        this.updateLandingButtons();
    },


    checkFirstTime() {
        const hasUsed = localStorage.getItem('flashlearn_hasUsed');
        if (!hasUsed) {
            localStorage.setItem('flashlearn_hasUsed', 'false');
        }
    },


    updateLandingButtons() {
        const hasUsed = localStorage.getItem('flashlearn_hasUsed') === 'true';
        const createBtn = document.getElementById('btn-create-landing');
        const learnBtn = document.getElementById('btn-learn-landing');


        if (hasUsed) {
            createBtn.querySelector('.btn-text').textContent = 'Create';
            learnBtn.classList.remove('hidden');
        } else {
            createBtn.querySelector('.btn-text').textContent = 'Create Flash Cards';
            learnBtn.classList.add('hidden');
        }
    },


    // ===== Navigation =====
    switchView(viewId) {
        const currentEl = document.querySelector('.view.active');
        const nextEl = document.getElementById(viewId);


        if (currentEl) {
            currentEl.classList.add('exiting');
            currentEl.classList.remove('active');
            setTimeout(() => {
                currentEl.classList.remove('exiting');
                currentEl.style.display = 'none';
            }, 400);
        }


        nextEl.style.display = 'flex';
        // Force reflow
        void nextEl.offsetHeight;
        nextEl.classList.add('entering');
        nextEl.classList.add('active');


        setTimeout(() => {
            nextEl.classList.remove('entering');
        }, 500);


        this.currentView = viewId.replace('-view', '');
    },


    // ===== Landing Events =====
    bindEvents() {
        document.getElementById('btn-create-landing').addEventListener('click', (e) => {
            this.animateButtonTransition(e.currentTarget, () => {
                this.startCreateFlow();
            });
        });


        document.getElementById('btn-learn-landing').addEventListener('click', (e) => {
            this.animateButtonTransition(e.currentTarget, () => {
                this.showDecksList();
            });
        });


        document.getElementById('btn-exit-create').addEventListener('click', () => {
            this.saveAndExitCreate();
        });


        document.getElementById('btn-add-card').addEventListener('click', () => {
            this.addCard();
        });


        document.getElementById('btn-back-decks').addEventListener('click', () => {
            this.switchView('landing-view');
        });


        document.getElementById('btn-exit-study').addEventListener('click', () => {
            this.switchView('decks-view');
            this.showDecksList();
        });


        document.getElementById('flashcard').addEventListener('click', () => {
            this.flipCard();
        });


        document.getElementById('btn-prev').addEventListener('click', () => {
            this.prevCard();
        });


        document.getElementById('btn-repeat').addEventListener('click', () => {
            this.reviewCard('repeat');
        });


        document.getElementById('btn-hard').addEventListener('click', () => {
            this.reviewCard('hard');
        });


        document.getElementById('btn-good').addEventListener('click', () => {
            this.reviewCard('good');
        });


        // Tab switching
        document.querySelectorAll('.content-tabs').forEach(tabs => {
            tabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-btn')) {
                    this.switchTab(e.target);
                }
            });
        });


        // Deck name input
        document.getElementById('deck-name').addEventListener('input', (e) => {
            document.getElementById('preview-deck-name').textContent = e.target.value || 'Untitled Deck';
        });
    },


    animateButtonTransition(button, callback) {
        const rect = button.getBoundingClientRect();
        const clone = button.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.zIndex = '1000';
        clone.style.margin = '0';
        clone.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        document.body.appendChild(clone);


        button.style.opacity = '0';


        requestAnimationFrame(() => {
            clone.style.left = '50%';
            clone.style.top = '50%';
            clone.style.transform = 'translate(-50%, -50%) scale(20)';
            clone.style.opacity = '0';
        });


        setTimeout(() => {
            clone.remove();
            button.style.opacity = '1';
            callback();
        }, 450);
    },


    // ===== Create Flow =====
    startCreateFlow() {
        this.tempCards = [];
        this.currentDeckId = null;
        document.getElementById('deck-name').value = '';
        document.getElementById('preview-deck-name').textContent = 'Untitled Deck';
        document.getElementById('preview-card-count').textContent = '0 cards';
        document.getElementById('deck-preview-cards').innerHTML = '';
        this.resetCardBuilders();
        this.switchView('create-view');
    },


    resetCardBuilders() {
        document.querySelectorAll('.content-textarea').forEach(ta => {
            ta.value = '';
        });


        // Reset tabs to text
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'text');
        });


        // Reset content areas to text
        document.querySelectorAll('.content-area').forEach(area => {
            area.innerHTML = '<textarea class="content-textarea" placeholder="Enter content..."></textarea>';
        });


        // Update placeholders
        const frontArea = document.getElementById('front-content-area');
        const backArea = document.getElementById('back-content-area');
        frontArea.querySelector('textarea').placeholder = 'Enter front content...';
        backArea.querySelector('textarea').placeholder = 'Enter back content...';
    },


    switchTab(tabBtn) {
        const tabsContainer = tabBtn.closest('.content-tabs');
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');


        const type = tabBtn.dataset.type;
        const contentArea = tabsContainer.closest('.card-builder').querySelector('.content-area');
        const isFront = tabsContainer.closest('.card-builder').id === 'front-builder';
        const placeholder = isFront ? 'Enter front content...' : 'Enter back content...';


        contentArea.innerHTML = this.getContentInputHTML(type, placeholder);


        if (type === 'drawing') {
            this.initCanvas(contentArea.querySelector('canvas'));
        }
    },


    getContentInputHTML(type, placeholder) {
        switch(type) {
            case 'text':
                return `<textarea class="content-textarea" placeholder="${placeholder}"></textarea>`;
            case 'image':
                return `
                    <div class="content-upload" onclick="this.querySelector('input').click()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <span>Click to upload image</span>
                        <input type="file" accept="image/*" onchange="App.handleFileUpload(this, 'image')">
                    </div>`;
            case 'audio':
                return `
                    <div class="content-upload" onclick="this.querySelector('input').click()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                        </svg>
                        <span>Click to upload audio</span>
                        <input type="file" accept="audio/*" onchange="App.handleFileUpload(this, 'audio')">
                    </div>`;
            case 'video':
                return `
                    <div class="content-upload" onclick="this.querySelector('input').click()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="2"/>
                            <polygon points="10,8 16,12 10,16"/>
                        </svg>
                        <span>Click to upload video</span>
                        <input type="file" accept="video/*" onchange="App.handleFileUpload(this, 'video')">
                    </div>`;
            case 'drawing':
                return `
                    <div class="canvas-container">
                        <canvas width="300" height="140"></canvas>
                        <div class="canvas-tools">
                            <button onclick="App.clearCanvas(this.closest('.canvas-container').querySelector('canvas'))" title="Clear">✕</button>
                        </div>
                    </div>`;
            default:
                return `<textarea class="content-textarea" placeholder="${placeholder}"></textarea>`;
        }
    },


    handleFileUpload(input, type) {
        const file = input.files[0];
        if (!file) return;


        const reader = new FileReader();
        reader.onload = (e) => {
            const uploadDiv = input.closest('.content-upload');
            const dataUrl = e.target.result;


            if (type === 'image') {
                uploadDiv.innerHTML = `<img src="${dataUrl}" style="max-width:100%;max-height:120px;border-radius:8px;object-fit:contain;">`;
                uploadDiv.dataset.value = dataUrl;
                uploadDiv.dataset.contentType = 'image';
            } else if (type === 'audio') {
                uploadDiv.innerHTML = `<audio controls src="${dataUrl}" style="max-width:100%;"></audio>`;
                uploadDiv.dataset.value = dataUrl;
                uploadDiv.dataset.contentType = 'audio';
            } else if (type === 'video') {
                uploadDiv.innerHTML = `<video controls src="${dataUrl}" style="max-width:100%;max-height:120px;border-radius:8px;"></video>`;
                uploadDiv.dataset.value = dataUrl;
                uploadDiv.dataset.contentType = 'video';
            }
        };
        reader.readAsDataURL(file);
    },


    initCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';


        let drawing = false;
        let lastX = 0;
        let lastY = 0;


        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        };


        const startDraw = (e) => {
            drawing = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;
            e.preventDefault();
        };


        const draw = (e) => {
            if (!drawing) return;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x;
            lastY = pos.y;
            e.preventDefault();
        };


        const endDraw = () => {
            drawing = false;
        };


        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);
    },


    clearCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },


    getCardContent(builderId) {
        const builder = document.getElementById(builderId);
        const activeTab = builder.querySelector('.tab-btn.active');
        const type = activeTab.dataset.type;
        const contentArea = builder.querySelector('.content-area');


        let value = '';


        switch(type) {
            case 'text':
                value = contentArea.querySelector('textarea')?.value || '';
                break;
            case 'image':
            case 'audio':
            case 'video':
                const uploadDiv = contentArea.querySelector('.content-upload');
                value = uploadDiv?.dataset.value || '';
                break;
            case 'drawing':
                const canvas = contentArea.querySelector('canvas');
                if (canvas) {
                    value = canvas.toDataURL();
                }
                break;
        }


        return { type, value };
    },


    addCard() {
        const deckName = document.getElementById('deck-name').value.trim();
        if (!deckName) {
            this.showToast('Please name your deck first');
            document.getElementById('deck-name').focus();
            return;
        }


        const front = this.getCardContent('front-builder');
        const back = this.getCardContent('back-builder');


        if (!front.value && !back.value) {
            this.showToast('Please add content to at least one side');
            return;
        }


        const card = {
            id: Date.now() + Math.random(),
            front,
            back,
            createdAt: Date.now(),
            nextReview: Date.now(),
            interval: 0,
            ease: 2.5
        };


        this.tempCards.push(card);


        // Animate the add button
        const addBtn = document.getElementById('btn-add-card');
        addBtn.classList.add('adding');
        setTimeout(() => addBtn.classList.remove('adding'), 600);


        // Fly animation
        this.animateCardFly();


        // Update preview
        this.updateDeckPreview();


        // Reset builders
        setTimeout(() => {
            this.resetCardBuilders();
        }, 300);


        this.showToast('Card added!');
    },


    animateCardFly() {
        const frontBuilder = document.getElementById('front-builder');
        const backBuilder = document.getElementById('back-builder');
        const previewArea = document.getElementById('deck-preview-cards');
        const previewRect = previewArea.getBoundingClientRect();


        [frontBuilder, backBuilder].forEach((builder, i) => {
            const rect = builder.getBoundingClientRect();
            const clone = builder.cloneNode(true);
            clone.classList.add('card-fly');
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            clone.style.width = rect.width + 'px';
            clone.style.height = rect.height + 'px';
            document.body.appendChild(clone);


            requestAnimationFrame(() => {
                clone.style.left = previewRect.left + 20 + 'px';
                clone.style.top = previewRect.top + 'px';
                clone.style.width = '60px';
                clone.style.height = '40px';
                clone.style.opacity = '0';
                clone.style.transform = 'scale(0.3)';
            });


            setTimeout(() => clone.remove(), 600);
        });
    },


    updateDeckPreview() {
        document.getElementById('preview-card-count').textContent = 
            `${this.tempCards.length} card${this.tempCards.length !== 1 ? 's' : ''}`;


        const container = document.getElementById('deck-preview-cards');
        container.innerHTML = this.tempCards.map((card, i) => {
            const preview = card.front.type === 'text' 
                ? card.front.value.substring(0, 20) + (card.front.value.length > 20 ? '...' : '')
                : `[${card.front.type}]`;
            return `<div class="preview-card-chip">#${i + 1} ${preview}</div>`;
        }).join('');
    },


    saveAndExitCreate() {
        const deckName = document.getElementById('deck-name').value.trim();


        if (this.tempCards.length === 0 && !deckName) {
            this.switchView('landing-view');
            return;
        }


        if (this.tempCards.length === 0) {
            this.showToast('Add at least one card to save the deck');
            return;
        }


        const deck = {
            id: Date.now().toString(),
            name: deckName || 'Untitled Deck',
            cards: this.tempCards,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };


        const decks = this.getDecks();
        decks.push(deck);
        localStorage.setItem('flashlearn_decks', JSON.stringify(decks));
        localStorage.setItem('flashlearn_hasUsed', 'true');


        this.tempCards = [];
        this.showToast('Deck saved!');
        this.updateLandingButtons();
        this.switchView('landing-view');
    },


    // ===== Decks List =====
    getDecks() {
        try {
            return JSON.parse(localStorage.getItem('flashlearn_decks')) || [];
        } catch {
            return [];
        }
    },


    showDecksList() {
        const decks = this.getDecks();
        const grid = document.getElementById('decks-grid');
        const emptyState = document.getElementById('decks-empty');


        if (decks.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            const today = new Date().toDateString();


            grid.innerHTML = decks.map(deck => {
                const dueCount = deck.cards.filter(c => {
                    const reviewDate = new Date(c.nextReview).toDateString();
                    return reviewDate <= today;
                }).length;
                const totalCards = deck.cards.length;
                const progress = totalCards > 0 ? ((totalCards - dueCount) / totalCards * 100) : 0;


                return `
                    <div class="deck-card" data-deck-id="${deck.id}">
                        <div class="deck-card-name">${this.escapeHtml(deck.name)}</div>
                        <div class="deck-card-meta">
                            <span class="deck-card-count">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <path d="M3 9h18M9 21V9"/>
                                </svg>
                                ${totalCards} cards
                            </span>
                            <span class="deck-card-due">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                                ${dueCount} due
                            </span>
                        </div>
                        <div class="deck-card-progress">
                            <div class="deck-card-progress-bar" style="width: ${progress}%"></div>
                        </div>
                    </div>
                `;
            }).join('');


            grid.querySelectorAll('.deck-card').forEach(card => {
                card.addEventListener('click', () => {
                    const deckId = card.dataset.deckId;
                    this.startStudySession(deckId);
                });
            });
        }


        this.switchView('decks-view');
    },


    // ===== Study Session =====
    startStudySession(deckId) {
        const decks = this.getDecks();
        const deck = decks.find(d => d.id === deckId);
        if (!deck || deck.cards.length === 0) {
            this.showToast('No cards in this deck');
            return;
        }


        this.currentDeck = deck;
        this.currentDeckId = deckId;
        this.currentCardIndex = 0;
        this.isFlipped = false;


        // Get due cards or all cards for demo
        const today = new Date().toDateString();
        let dueCards = deck.cards.filter(c => {
            const reviewDate = new Date(c.nextReview).toDateString();
            return reviewDate <= today;
        });


        // If no cards are due (for demo purposes), show all
        if (dueCards.length === 0) {
            dueCards = [...deck.cards];
        }


        this.studyCards = this.shuffleArray(dueCards);


        if (this.studyCards.length === 0) {
            this.showToast('No cards to study');
            return;
        }


        this.renderCurrentCard();
        this.switchView('study-view');
    },


    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },


    renderCurrentCard() {
        const card = this.studyCards[this.currentCardIndex];
        if (!card) {
            this.showStudyComplete();
            return;
        }


        const flashcard = document.getElementById('flashcard');
        flashcard.classList.remove('flipped');
        this.isFlipped = false;


        // Add entrance animation
        flashcard.classList.remove('flashcard-enter');
        void flashcard.offsetHeight;
        flashcard.classList.add('flashcard-enter');
        flashcard.addEventListener('animationend', () => {
            flashcard.classList.remove('flashcard-enter');
        }, { once: true });


        document.getElementById('card-front-content').innerHTML = this.renderContent(card.front);
        document.getElementById('card-back-content').innerHTML = this.renderContent(card.back);


        // Update progress
        const progress = ((this.currentCardIndex + 1) / this.studyCards.length) * 100;
        document.getElementById('study-progress-fill').style.width = progress + '%';
        document.getElementById('study-progress-text').textContent = 
            `${this.currentCardIndex + 1} / ${this.studyCards.length}`;


        // Update prev button
        document.getElementById('btn-prev').disabled = this.currentCardIndex === 0;
    },


    renderContent(content) {
        if (!content.value) return '<em style="color:var(--gray)">No content</em>';


        switch(content.type) {
            case 'text':
                return this.escapeHtml(content.value).replace(/\n/g, '<br>');
            case 'image':
                return `<img src="${content.value}" alt="Card image">`;
            case 'audio':
                return `<audio controls src="${content.value}"></audio>`;
            case 'video':
                return `<video controls src="${content.value}"></video>`;
            case 'drawing':
                return `<img src="${content.value}" alt="Drawing">`;
            default:
                return this.escapeHtml(content.value);
        }
    },


    flipCard() {
        const flashcard = document.getElementById('flashcard');
        this.isFlipped = !this.isFlipped;
        flashcard.classList.toggle('flipped', this.isFlipped);
    },


    prevCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.renderCurrentCard();
        }
    },


    reviewCard(rating) {
        const card = this.studyCards[this.currentCardIndex];
        if (!card) return;


        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;


        switch(rating) {
            case 'repeat':
                // Card comes again in current session
                card.nextReview = now;
                card.interval = 0;
                // Move to end of queue
                this.studyCards.splice(this.currentCardIndex, 1);
                this.studyCards.push(card);
                // Don't advance index since we removed current
                break;


            case 'hard':
                // Daily review
                card.interval = 1;
                card.nextReview = now + dayMs;
                this.currentCardIndex++;
                break;


            case 'good':
                // Next week review
                card.interval = 7;
                card.nextReview = now + (7 * dayMs);
                this.currentCardIndex++;
                break;
        }


        // Save updated deck
        this.saveDeckChanges();


        // Show next card or complete
        if (this.currentCardIndex >= this.studyCards.length) {
            this.showStudyComplete();
        } else {
            this.renderCurrentCard();
        }
    },


    saveDeckChanges() {
        const decks = this.getDecks();
        const deckIndex = decks.findIndex(d => d.id === this.currentDeckId);
        if (deckIndex === -1) return;


        // Update cards in the deck with study changes
        const deck = decks[deckIndex];
        this.studyCards.forEach(studyCard => {
            const cardIndex = deck.cards.findIndex(c => c.id === studyCard.id);
            if (cardIndex !== -1) {
                deck.cards[cardIndex] = { ...studyCard };
            }
        });


        deck.updatedAt = Date.now();
        localStorage.setItem('flashlearn_decks', JSON.stringify(decks));
    },


    showStudyComplete() {
        const studyBody = document.querySelector('.study-body');
        studyBody.innerHTML = `
            <div class="study-complete">
                <div style="font-size:4rem;margin-bottom:1rem;">🎉</div>
                <h2>Session Complete!</h2>
                <p>You've reviewed all cards in this deck.</p>
                <button class="btn-primary btn-landing" style="max-width:200px;margin:0 auto;" onclick="App.finishStudy()">
                    Back to Decks
                </button>
            </div>
        `;
    },


    finishStudy() {
        // Reset study body
        const studyBody = document.querySelector('.study-body');
        studyBody.innerHTML = `
            <div class="flashcard-container" id="flashcard-container">
                <div class="flashcard" id="flashcard">
                    <div class="flashcard-face flashcard-front" id="card-front">
                        <div class="card-content" id="card-front-content"></div>
                        <div class="card-hint">Tap to flip</div>
                    </div>
                    <div class="flashcard-face flashcard-back" id="card-back">
                        <div class="card-content" id="card-back-content"></div>
                        <div class="card-hint">Tap to flip back</div>
                    </div>
                </div>
            </div>
            <div class="study-actions">
                <button id="btn-prev" class="btn-study-nav">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 15l-5-5 5-5"/>
                    </svg>
                    Previous
                </button>
                <div class="review-buttons">
                    <button id="btn-repeat" class="btn-review btn-repeat">
                        <span class="review-label">Repeat</span>
                        <span class="review-sub">Again today</span>
                    </button>
                    <button id="btn-hard" class="btn-review btn-hard">
                        <span class="review-label">Hard</span>
                        <span class="review-sub">Daily</span>
                    </button>
                    <button id="btn-good" class="btn-review btn-good">
                        <span class="review-label">Good</span>
                        <span class="review-sub">Next week</span>
                    </button>
                </div>
            </div>
        `;


        // Re-bind study events
        document.getElementById('flashcard').addEventListener('click', () => this.flipCard());
        document.getElementById('btn-prev').addEventListener('click', () => this.prevCard());
        document.getElementById('btn-repeat').addEventListener('click', () => this.reviewCard('repeat'));
        document.getElementById('btn-hard').addEventListener('click', () => this.reviewCard('hard'));
        document.getElementById('btn-good').addEventListener('click', () => this.reviewCard('good'));


        this.showDecksList();
    },


    // ===== Utilities =====
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        toastMsg.textContent = message;
        toast.classList.add('show');


        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    },


    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};


// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});