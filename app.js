// ========================================================================
// 1. KONFIGURACJA FIREBASE - Wklej tutaj swoją konfigurację
// ========================================================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// ========================================================================
// 2. ELEMENTY DOM I ZMIENNE
// ========================================================================
const homeScreen = document.getElementById('home-screen');
const hostScreen = document.getElementById('host-screen');
const playerScreen = document.getElementById('player-screen');
const screens = [homeScreen, hostScreen, playerScreen];

// Przyciski i pola
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
// 3. LOGIKA APLIKACJI
// ========================================================================
function showScreen(screenToShow) {
    screens.forEach(screen => screen.classList.remove('active'));
    screenToShow.classList.add('active');
}

function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Inicjalizacja strony
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    const role = params.get('role');
    const playerId = localStorage.getItem('playerId-' + gameId);

    if (gameId) {
        if (role === 'host') {
            initHostView(gameId);
        } else if (playerId) {
            initPlayerView(gameId, playerId);
        } else {
            // Nowy gracz w istniejącej grze
            const newPlayerId = 'Player-' + Math.floor(100 + Math.random() * 900);
            localStorage.setItem('playerId-' + gameId, newPlayerId);
            database.ref('games/' + gameId + '/players/' + newPlayerId).set({ ready: false });
            initPlayerView(gameId, newPlayerId);
        }
    } else {
        showScreen(homeScreen);
    }
});

// Logika przycisków na ekranie startowym
createGameBtn.addEventListener('click', () => {
    const gameId = generateCode();
    window.location.search = `?game=${gameId}&role=host`;
});

joinGameBtn.addEventListener('click', () => {
    const gameId = joinCodeInput.value.trim().toUpperCase();
    if (gameId) {
        database.ref('games/' + gameId).once('value', snapshot => {
            if (snapshot.exists()) {
                window.location.search = `?game=${gameId}`;
            } else {
                alert('Gra o takim kodzie nie istnieje!');
            }
        });
    }
});

// Logika dla Hosta
function initHostView(gameId) {
    showScreen(hostScreen);
    gameCodeDisplay.textContent = gameId;

    // Generowanie kodu QR
    const qr = qrcode(0, 'L');
    qr.addData(window.location.href.replace('&role=host', ''));
    qr.make();
    qrCodeContainer.innerHTML = qr.createImgTag(4);
    
    // Nasłuchiwanie zmian w statusach graczy
    const playersRef = database.ref('games/' + gameId + '/players');
    playersRef.on('value', (snapshot) => {
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
        const playersRef = database.ref('games/' + gameId + '/players');
        playersRef.once('value', (snapshot) => {
            const players = snapshot.val();
            if (players) {
                const updates = {};
                Object.keys(players).forEach(playerId => {
                    updates[playerId + '/ready'] = false;
                });
                playersRef.update(updates);
            }
        });
    });
}

// Logika dla Gracza
function initPlayerView(gameId, playerId) {
    showScreen(playerScreen);
    playerIdDisplay.textContent = playerId;
    const playerRef = database.ref('games/' + gameId + '/players/' + playerId);

    readyBtn.addEventListener('click', () => {
        playerRef.child('ready').once('value', snapshot => {
            playerRef.child('ready').set(!snapshot.val());
        });
    });

    playerRef.on('value', (snapshot) => {
        const player = snapshot.val();
        if (player.ready) {
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

