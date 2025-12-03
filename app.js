// ========================================================================
// 1. IMPORT BIBLIOTEK Z PEŁNYCH ADRESÓW URL (CDN)
// ========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// ========================================================================
// 2. TWOJA KONFIGURACJA FIREBASE
// ========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAporL0p4oYVIoZ0Ue0DsxCYWemgH8FphE",
    authDomain: "projekt-alfa-d489c.firebaseapp.com",
    databaseURL: "https://projekt-alfa-d489c-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "projekt-alfa-d489c",
    storageBucket: "projekt-alfa-d489c.firebasestorage.app",
    messagingSenderId: "15975987927",
    appId: "1:15975987927:web:72988af6678764b0d9ce92",
    measurementId: "G-2ZK9ZV8FG3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ========================================================================
// 3. ELEMENTY DOM I ZMIENNE
// ========================================================================
const screens = {
    home: document.getElementById('home-screen'),
    host: document.getElementById('host-screen'),
    player: document.getElementById('player-screen')
};
const createGameBtn = document.getElementById('create-game-btn');
const joinCodeInput = document.getElementById('join-code-input');
const joinGameBtn = document.getElementById('join-game-btn');
const playerNameSection = document.getElementById('player-name-section');
const playerNameInput = document.getElementById('player-name-input');
const confirmJoinBtn = document.getElementById('confirm-join-btn');
const gameCodeDisplay = document.getElementById('game-code-display');
const qrCodeContainer = document.getElementById('qrcode');
const playerList = document.getElementById('player-list');
const resetGameBtn = document.getElementById('reset-game-btn');
const endGameBtn = document.getElementById('end-game-btn');
const readyBtn = document.getElementById('ready-btn');
const playerStatus = document.getElementById('player-status');
const playerIdDisplay = document.getElementById('player-id-display');

// ========================================================================
// 4. LOGIKA APLIKACJI
// ========================================================================
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    const role = params.get('role');
    const playerId = params.get('player');

    if (gameId) {
        if (role === 'host') {
            initHostView(gameId);
        } else if (playerId) {
            initPlayerView(gameId, playerId);
        } else {
            showScreen('home');
            joinCodeInput.value = gameId;
            playerNameSection.classList.remove('hidden');
        }
    } else {
        showScreen('home');
    }
});

createGameBtn.addEventListener('click', () => {
    const gameId = generateCode();
    set(ref(database, `games/${gameId}`), { createdAt: Date.now() });
    window.location.search = `?game=${gameId}&role=host`;
});

joinGameBtn.addEventListener('click', () => {
    const gameId = joinCodeInput.value.trim().toUpperCase();
    if (gameId) {
        get(ref(database, 'games/' + gameId)).then(snapshot => {
            if (snapshot.exists()) {
                playerNameSection.classList.remove('hidden');
            } else {
                alert('Gra o takim kodzie nie istnieje!');
            }
        });
    }
});

confirmJoinBtn.addEventListener('click', () => {
    const gameId = joinCodeInput.value.trim().toUpperCase();
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        get(ref(database, `games/${gameId}/players/${playerName}`)).then(snapshot => {
            if (snapshot.exists()) {
                alert('Gracz o takiej nazwie już istnieje w tej grze. Wybierz inną nazwę.');
            } else {
                set(ref(database, `games/${gameId}/players/${playerName}`), { ready: false });
                window.location.search = `?game=${gameId}&player=${encodeURIComponent(playerName)}`;
            }
        });
    } else {
        alert('Proszę wpisać nazwę!');
    }
});

function initHostView(gameId) {
    showScreen('host');
    gameCodeDisplay.textContent = gameId;
    
    const qr = qrcode(0, 'L');
    qr.addData(`${window.location.origin}${window.location.pathname}?game=${gameId}`);
    qr.make();
    qrCodeContainer.innerHTML = qr.createImgTag(4);
    
    const playersRef = ref(database, `games/${gameId}/players`);
    onValue(playersRef, (snapshot) => {
        const players = snapshot.val();
        playerList.innerHTML = '';
        if (players) {
            Object.keys(players).forEach(playerId => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-status-card';
                // ✅ POPRAWIONE - tylko nazwa i kółko, bez przycisku X
                playerCard.innerHTML = `
                    <span>${playerId}</span>
                    <div class="status-dot ${players[playerId].ready ? 'ready' : ''}"></div>
                `;
                playerList.appendChild(playerCard);
            });
        } else {
            playerList.innerHTML = '<p>Czekam na graczy...</p>';
        }
    });

    // Reset gotowości wszystkich graczy
    resetGameBtn.addEventListener('click', () => {
        const playersRef = ref(database, `games/${gameId}/players`);
        get(playersRef).then((snapshot) => {
            if (snapshot.exists()) {
                const updates = {};
                Object.keys(snapshot.val()).forEach(playerId => {
                    updates[`${playerId}/ready`] = false;
                });
                update(playersRef, updates);
            }
        });
    });

    // Przycisk zakończenia gry
    endGameBtn.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz zakończyć grę? Wszyscy gracze zostaną rozłączeni.')) {
            remove(ref(database, `games/${gameId}`)).then(() => {
                window.location.href = window.location.pathname;
            });
        }
    });
}

function initPlayerView(gameId, playerId) {
    showScreen('player');
    playerIdDisplay.textContent = decodeURIComponent(playerId);
    
    const gameRef = ref(database, `games/${gameId}`);
    
    onValue(gameRef, (snapshot) => {
        if (!snapshot.exists()) {
            alert("Host zakończył grę.");
            window.location.href = window.location.pathname;
        } else {
            const decodedPlayerId = decodeURIComponent(playerId);
            const player = snapshot.val().players?.[decodedPlayerId];
            
            if (player && player.ready) {
                readyBtn.classList.add('is-ready');
                readyBtn.textContent = 'GOTÓW!';
                playerStatus.textContent = 'Status: Gotowy';
            } else {
                readyBtn.classList.remove('is-ready');
                readyBtn.textContent = 'GOTOWI';
                playerStatus.textContent = 'Status: Niegotowy';
            }
        }
    });

    readyBtn.addEventListener('click', () => {
        const decodedPlayerId = decodeURIComponent(playerId);
        const readyStatusRef = ref(database, `games/${gameId}/players/${decodedPlayerId}/ready`);
        get(readyStatusRef).then(snapshot => {
            set(readyStatusRef, !snapshot.val());
        });
    });
}
