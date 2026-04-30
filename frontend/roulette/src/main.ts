import { alert } from "./alert.js";

let ws: WebSocket;

function connectWebSocket(): void {
  ws = new WebSocket("ws://localhost:8080/ws/roulette");

  ws.addEventListener("message", (event: MessageEvent<string>) => {
    const result = parseInt(event.data, 10);
    console.log("Spin result received:", result);

    if (Number.isNaN(result)) {
      console.error("Invalid spin result:", event.data);
      gameState.isSpinning = false;
      stopRolling();
      return;
    }

    animateWheel(result);

    setTimeout(() => {
      handleSpinResult(result);
      gameState.isSpinning = false;
      displayResult(result);
    }, SPIN_DURATION_MS);
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    gameState.isSpinning = false;
    stopRolling();
  });

  ws.addEventListener("close", () => {
    console.warn("WebSocket closed. Reconnecting in 3s...");
    gameState.isSpinning = false;
    stopRolling();
    setTimeout(connectWebSocket, 3000);
  });
}

connectWebSocket();

type BetType =
  | "odd" | "even"
  | "red" | "black"
  | "1-18" | "19-36"
  | "1-12" | "13-24" | "25-36"
  | "column-1" | "column-2" | "column-3"
  | `${number}`;

interface GameState {
  activeBets: Map<BetType, number>;
  balance: number;
  currentBet: number;
  lastRoundWinnings: number;
  isSpinning: boolean;
}

const oddNumbers   = new Set([1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]);
const evenNumbers  = new Set([2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]);
const redNumbers   = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const blackNumbers = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);
const column1      = new Set([1,4,7,10,13,16,19,22,25,28,31,34]);
const column2      = new Set([2,5,8,11,14,17,20,23,26,29,32,35]);
const column3      = new Set([3,6,9,12,15,18,21,24,27,30,33,36]);

const INITIAL_BALANCE = 100000;
const SPIN_DURATION_MS = 4500;
const ZERO_OFFSET_DEG = 0;

const gameState: GameState = {
  activeBets: new Map(),
  balance: INITIAL_BALANCE,
  currentBet: 0,
  lastRoundWinnings: 0,
  isSpinning: false,
};

const betSelect   = getElement<HTMLSelectElement>("bet-select");
const spinButton  = getElement<HTMLButtonElement>("spin-btn");
const balanceEl   = getElement<HTMLSpanElement>("balance");
const betAmountEl = getElement<HTMLSpanElement>("bet-amount");
const winAmountEl = getElement<HTMLSpanElement>("win-amount");
const resultEl    = getElement<HTMLDivElement>("won-number");
const tableEL     = getElement<HTMLDivElement>("roulette");
const wheelImage  = document.querySelector<HTMLImageElement>(".wheel img")!;

const backgroundMusic = new Audio("./assets/sounds/background-music.mp3");
const winSound        = new Audio("./assets/sounds/coin-sound.mp3");
const rollingSound    = new Audio("./assets/sounds/roulette-sound.mp3");
const errorSound      = new Audio("./assets/sounds/error-sound.mp3");

backgroundMusic.volume = 0.5;
backgroundMusic.loop   = true;
winSound.volume        = 0.7;
rollingSound.volume    = 0.8;
backgroundMusic.play().catch((error) => {
  console.error("Failed to play background music:", error);
});

let rollInterval: number | null = null;
let currentRotation = 0;

betSelect.addEventListener("change", () => {
  if (betSelect.value === "all-in") {
    alert.info(`Selected bet amount: $${gameState.balance} (All In)`, 2000);
    gameState.currentBet = gameState.balance;
    updateUI();
    return;
  }
  calculateBetAmount();
});

spinButton.addEventListener("click", () => {
  if (gameState.activeBets.size === 0 || gameState.isSpinning) {
    alert.error("Please place a bet before spinning!", 3000);
    return;
  }
  if (ws.readyState !== WebSocket.OPEN) {
    console.error("WebSocket not connected.");
    return;
  }
  gameState.isSpinning = true;
  ws.send("spin");
});

tableEL.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.hasAttribute("data-bet")) {
    const betType = target.getAttribute("data-bet") as BetType | null;
    if (!betType) return;
    if (gameState.currentBet <= 0) {
      alert.error("Please enter a bet amount greater than 0!", 3000);
      return;
    }
    if (gameState.balance < gameState.currentBet) {
      alert.error("You are broke!", 3000);
      return;
    }
    placeBet(betType);
  }
});

function initGame(): void {
  gameState.activeBets.clear();
  gameState.balance = INITIAL_BALANCE;
  gameState.currentBet = 0;
  gameState.lastRoundWinnings = 0;
  gameState.isSpinning = false;
  betSelect.value = "";
  resultEl.textContent = "-";
  resultEl.style.background = "transparent";
  stopRolling();
  updateUI();
}

function resetGame(): void {
  setResetButtonMode(false);
  initGame();
  alert.info("Welcome to the Roulette Game! Place your bets and spin the wheel!", 5000);
}

function calculateBetAmount(): void {
  if (betSelect.value === "all-in") {
    gameState.currentBet = gameState.balance;
  } else {
    const value = parseInt(betSelect.value, 10);
    if (!Number.isNaN(value)) {
      gameState.currentBet = value;
    }
  }
  updateUI();
}

function placeBet(betType: BetType): void {
  gameState.balance -= gameState.currentBet;
  gameState.activeBets.set(betType, (gameState.activeBets.get(betType) ?? 0) + gameState.currentBet);
  updateUI();
}

function handleSpinResult(result: number): void {
  let totalWinnings = 0;
  let didWin = false;
  let didLose = false;

  gameState.activeBets.forEach((amount, betType) => {
    const multiplier = getPayoutMultiplier(betType, result);
    if (multiplier > 0) {
      totalWinnings += amount * (multiplier + 1);
      alert.success(`You won $${amount * multiplier} on ${betType}!`, 3000);
      didWin = true;
    } else {
      alert.error(`You lost $${amount} on ${betType}.`, 3000);
      didLose = true;
    }
  });

  if (didWin) {
    winSound.currentTime = 0;
    winSound.play();
  } else if (didLose) {
    errorSound.currentTime = 0;
    errorSound.play();
  }

  gameState.balance += totalWinnings;
  gameState.lastRoundWinnings = totalWinnings;
  gameState.activeBets.clear();
  updateUI();
}

function getPayoutMultiplier(bet: BetType, result: number): number {
  if (result === 0) return 0;

  if (bet === "odd"      && oddNumbers.has(result))          return 1;
  if (bet === "even"     && evenNumbers.has(result))         return 1;
  if (bet === "red"      && redNumbers.has(result))          return 1;
  if (bet === "black"    && blackNumbers.has(result))        return 1;
  if (bet === "1-18"     && result >= 1  && result <= 18)    return 1;
  if (bet === "19-36"    && result >= 19 && result <= 36)    return 1;
  if (bet === "1-12"     && result >= 1  && result <= 12)    return 2;
  if (bet === "13-24"    && result >= 13 && result <= 24)    return 2;
  if (bet === "25-36"    && result >= 25 && result <= 36)    return 2;
  if (bet === "column-1" && column1.has(result))             return 2;
  if (bet === "column-2" && column2.has(result))             return 2;
  if (bet === "column-3" && column3.has(result))             return 2;
  if (parseInt(bet, 10) === result)                          return 35;

  return 0;
}

function animateWheel(result: number): void {
  startRolling();
  rollingSound.currentTime = 0;
  rollingSound.play();

  const targetNum = result;
  const angleToTarget = getAngleForNumber(targetNum);

  const normalizedCurrent = currentRotation % 360;
  let delta = (angleToTarget - normalizedCurrent + 360) % 360;
  if (delta < 0) delta += 360;

  currentRotation += delta + 360 * 5;

  wheelImage.style.transition = `transform ${SPIN_DURATION_MS}ms ease-out`;
  wheelImage.style.transform = `rotate(${currentRotation}deg)`;
}

function getAngleForNumber(num: number): number {
  const numberOrder = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30,
    8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
    7, 28, 12, 35, 3, 26
  ];

  const index = numberOrder.indexOf(num);
  if (index === -1) throw new Error(`Invalid roulette number: ${num}`);

  const slotDeg = 360 / numberOrder.length; 

  return -(index * slotDeg) + ZERO_OFFSET_DEG;
}

function getNumberColor(num: number): void {
  if (num === 0)             { resultEl.style.background = "green";       return; }
  if (redNumbers.has(num))   { resultEl.style.background = "red";         return; }
  if (blackNumbers.has(num)) { resultEl.style.background = "black";       return; }
  resultEl.style.background = "transparent";
}

function startRolling(): void {
  spinButton.disabled = true;
  spinButton.innerHTML = "Spinning...";
  rollInterval = window.setInterval(() => {
    const rolling = Math.floor(Math.random() * 37);
    resultEl.textContent = String(rolling);
    getNumberColor(rolling);
  }, 80);
}

function stopRolling(): void {
  if (rollInterval !== null) {
    clearInterval(rollInterval);
    rollInterval = null;
  }
  spinButton.innerHTML = "Spin";
  spinButton.disabled = false;
  checkBalance();
  rollingSound.pause();
}

function checkBalance(): void {
  if (gameState.balance === 0) {
    alert.error("You are broke! Waiting on reset", 5000);
    setResetButtonMode(true);
  }
  if (betSelect.value === "all-in" && gameState.balance > 0) {
    gameState.currentBet = gameState.balance;
    updateUI();
  }
}

function onResetClick(): void {
  resetGame();
}

function setResetButtonMode(enable: boolean): void {
  if (enable) {
    spinButton.innerHTML = "Reset";
    spinButton.disabled = false;
    spinButton.classList.add("reset-btn");
    spinButton.id = "reset-btn";
    spinButton.addEventListener("click", onResetClick);
  } else {
    spinButton.removeEventListener("click", onResetClick);
    spinButton.innerHTML = "Spin";
    spinButton.disabled = false;
    spinButton.classList.remove("reset-btn");
    spinButton.id = "spin-btn";
  }
}

function displayResult(result: number): void {
  resultEl.textContent = String(result);
  getNumberColor(result);
  stopRolling();
}

function updateUI(): void {
  balanceEl.textContent   = `$${gameState.balance}`;
  betAmountEl.textContent = `$${getTotalBetAmount()}`;
  winAmountEl.textContent = `$${gameState.lastRoundWinnings}`;
}

function getTotalBetAmount(): number {
  let total = 0;
  gameState.activeBets.forEach((amount) => { total += amount; });
  return total;
}

function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el as T;
}

initGame();