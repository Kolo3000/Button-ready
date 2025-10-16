// ========================================================================
// 1. IMPORT BIBLIOTEK Z PEŁNYCH ADRESÓW URL (CDN)
// ========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ========================================================================
// 3. ELEMENTY DOM I ZMIENNE
// ========================================================================
const homeScreen = document.getElementById('home-screen');
const hostScreen = document.getElementById('host-screen');
const playerScreen = document.getElementById('player-screen');
const screens = [homeScreen, hostScreen, playerScreen];

const createGameBtn = document.getElementById('create-game-btn');
const joinCodeInput = document.getElementById('join-code-input');
const joinGameBtn = document.getElementById('join-game-btn');
const gameCodeDisplay = document.getElementById('game-code-display');
const qrCodeContainer = document.getElementById('qrcode');
const playerList = document.getElementById('player-list');
const resetGameBtn = document.getElementById('reset-game-btn');
const readyBtn = document.getElementById('ready-btn');
const playerStatus = document.getElementById('player-status');
const playerIdDisplay = document.getElementById('player-id-display');

// ========================================================================
// 4. LOGIKA APLIKACJI
// ========================================================================
function showScreen(screenToShow) {
    screens.forEach(screen => screen.classList.remove('active'));
    screenToShow.classList.add('active');
}

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    const role = params.get('role');
    
    if (gameId) {
        const playerId = localStorage.getItem('playerId-' + gameId);
        if (role === 'host') {
            initHostView(gameId);
        } else if (playerId) {
            initPlayerView(gameId, playerId);
        } else {
            const newPlayerId = 'Player-' + Math.floor(100 + Math.random() * 900);
            localStorage.setItem('playerId-' + gameId, newPlayerId);
            set(ref(database, 'games/' + gameId + '/players/' + newPlayerId), { ready: false });
            initPlayerView(gameId, newPlayerId);
        }
    } else {
        showScreen(homeScreen);
    }
});

createGameBtn.addEventListener('click', () => {
    const gameId = generateCode();
    window.location.search = `?game=${gameId}&role=host`;
});

joinGameBtn.addEventListener('click', () => {
    const gameId = joinCodeInput.value.trim().toUpperCase();
    if (gameId) {
        get(ref(database, 'games/' + gameId)).then(snapshot => {
            if (snapshot.exists()) {
                window.location.search = `?game=${gameId}`;
            } else {
                alert('Gra o takim kodzie nie istnieje!');
            }
        });
    }
});

function initHostView(gameId) {
    showScreen(hostScreen);
    gameCodeDisplay.textContent = gameId;

    const qr = qrcode(0, 'L');
    qr.addData(window.location.origin + window.location.pathname + `?game=${gameId}`);
    qr.make();
    qrCodeContainer.innerHTML = qr.createImgTag(4);
    
    const playersRef = ref(database, 'games/' + gameId + '/players');
    onValue(playersRef, (snapshot) => {
        const players = snapshot.val();
        playerList.innerHTML = '';
        if (players) {
            Object.keys(players).forEach(playerId => {
                const player = players[playerId];
                const playerCard = document.createElement('div');
                playerCard.className = 'player-status-card';
                playerCard.innerHTML = `
                    <span>${playerId}</span>
                    <div class="status-dot ${player.ready ? 'ready' : ''}"></div>
                `;
                playerList.appendChild(playerCard);
            });
        } else {
            playerList.innerHTML = '<p>Czekam na graczy...</p>';
        }
    });

    resetGameBtn.addEventListener('click', () => {
        const playersRef = ref(database, 'games/' + gameId + '/players');
        get(playersRef).then((snapshot) => {
            const players = snapshot.val();
            if (players) {
                const updates = {};
                Object.keys(players).forEach(playerId => {
                    updates[playerId + '/ready'] = false;
                });
                update(playersRef, updates);
            }
        });
    });
}

function initPlayerView(gameId, playerId) {
    showScreen(playerScreen);
    playerIdDisplay.textContent = playerId;
    const playerRef = ref(database, 'games/' + gameId + '/players/' + playerId);
    
    // === POPRAWIONY FRAGMENT KODU ===
    readyBtn.addEventListener('click', () => {
        // Tworzymy nową, dokładną ścieżkę do pola 'ready'
        const readyStatusRef = ref(database, `games/${gameId}/players/${playerId}/ready`);
        get(readyStatusRef).then(snapshot => {
            // Używamy nowej referencji do ustawienia wartości
            set(readyStatusRef, !snapshot.val());
        });
    });
    // ================================

    onValue(playerRef, (snapshot) => {
        const player = snapshot.val();
        if (player && player.ready) {
            readyBtn.classList.add('is-ready');
            readyBtn.textContent = 'GOTÓW!';
            playerStatus.textContent = 'Status: Gotowy';
        } else {
            readyBtn.classList.remove('is-ready');
            readyBtn.textContent = 'GOTOWI';
            playerStatus.textContent = 'Status: Niegotowy';
        }
    });
}
