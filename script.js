// Tic Tac Toe — Unbeatable (Minimax + Alpha-Beta), Tailwind UI, responsive, touch-friendly, LocalStorage scores.
document.addEventListener("DOMContentLoaded", () => {
  let board = Array(9).fill("");
  let currentPlayer = "X";
  let gameActive = true;

  const cells = Array.from(document.querySelectorAll(".cell"));
  const statusEl = document.getElementById("status");
  const restartBtn = document.getElementById("restart-btn");
  const resetScoresBtn = document.getElementById("resetScores");
  const themeToggle = document.getElementById("themeToggle");

  const playerScoreEl = document.getElementById("player-score");
  const computerScoreEl = document.getElementById("computer-score");
  const tiesEl = document.getElementById("ties");

  // Persistent scores
  const SCORE_KEY = "ttt:scores:v1";
  const THEME_KEY = "ttt:theme";
  let scores = loadScores();

  updateScoresUI();
  applySavedTheme();

  const winningCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];

  // Bind events (click + touch are both handled by click on <button>)
  cells.forEach((cell, index) => {
    cell.addEventListener("click", () => onPlayerMove(index));
    cell.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !cell.disabled) {
        onPlayerMove(index);
      }
    });
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", "0");
  });

  restartBtn.addEventListener("click", restartGame);
  resetScoresBtn.addEventListener("click", () => {
    scores = { player: 0, computer: 0, ties: 0 };
    saveScores();
    updateScoresUI();
  });

  themeToggle.addEventListener("click", toggleTheme);

  function onPlayerMove(index) {
    if (!gameActive || board[index] !== "" || currentPlayer !== "X") return;
    placeMark(index, "X");
    if (checkEndState()) return;

    currentPlayer = "O";
    statusEl.textContent = "Computer's turn (O)";
    
    setTimeout(computerMove, 250);
  }

  function computerMove() {
    if (!gameActive) return;
    const best = findBestMove(board);
    placeMark(best, "O");
    checkEndState();
    if (gameActive) {
      currentPlayer = "X";
      statusEl.textContent = "Your turn (X)";
    }
  }

  function placeMark(index, mark) {
    board[index] = mark;
    const cell = cells[index];
    cell.textContent = mark;
    cell.classList.add(mark === "X" ? "text-emerald-400" : "text-rose-400");
    cell.disabled = true;

    if (navigator.vibrate) navigator.vibrate(10);
  }

  function checkWinFor(player, state = board) {
    return winningCombos.some(combo => combo.every(i => state[i] === player));
  }

  function isDraw(state = board) {
    return state.every(c => c !== "");
  }

  function checkEndState() {
    if (checkWinFor(currentPlayer)) {
      gameActive = false;
      if (currentPlayer === "X") {
        statusEl.textContent = "You win! 🎉";
        scores.player++;
      } else {
        statusEl.textContent = "Computer wins! 🤖";
        scores.computer++;
      }
      updateScoresUI();
      saveScores();
      showRestart();
      disableRemainingCells();
      return true;
    }

    if (isDraw()) {
      gameActive = false;
      statusEl.textContent = "It's a draw!";
      scores.ties++;
      updateScoresUI();
      saveScores();
      showRestart();
      disableRemainingCells();
      return true;
    }
    return false;
  }

  function disableRemainingCells() {
    cells.forEach((c, i) => { if (board[i] !== "") c.disabled = true; });
  }

  function showRestart() {
    restartBtn.classList.remove("hidden");
  }

  function restartGame() {
    board = Array(9).fill("");
    currentPlayer = "X";
    gameActive = true;
    statusEl.textContent = "Your turn (X)";
    cells.forEach(c => {
      c.textContent = "";
      c.classList.remove("text-emerald-400", "text-rose-400");
      c.disabled = false;
    });
    restartBtn.classList.add("hidden");
  }

  function findBestMove(state) {
    if (state.filter(x => x !== "").length === 0) return 4;
    if (state[4] === "") return 4;

    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
      if (state[i] === "") {
        state[i] = "O";
        const score = minimax(state, 0, false, -Infinity, Infinity);
        state[i] = "";
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  function minimax(state, depth, isMaximizing, alpha, beta) {
    if (checkWinFor("O", state)) return 10 - depth;
    if (checkWinFor("X", state)) return depth - 10;
    if (state.every(c => c !== "")) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (state[i] === "") {
          state[i] = "O";
          const evalScore = minimax(state, depth + 1, false, alpha, beta);
          state[i] = "";
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break; 
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (state[i] === "") {
          state[i] = "X";
          const evalScore = minimax(state, depth + 1, true, alpha, beta);
          state[i] = "";
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break; 
        }
      }
      return minEval;
    }
  }

  function loadScores() {
    try {
      const raw = localStorage.getItem(SCORE_KEY);
      if (!raw) return { player: 0, computer: 0, ties: 0 };
      const parsed = JSON.parse(raw);
      return { player: parsed.player||0, computer: parsed.computer||0, ties: parsed.ties||0 };
    } catch {
      return { player: 0, computer: 0, ties: 0 };
    }
  }

  function saveScores() {
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  }

  function updateScoresUI() {
    playerScoreEl.textContent = String(scores.player);
    computerScoreEl.textContent = String(scores.computer);
    tiesEl.textContent = String(scores.ties);
  }
  
  function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light") {
      document.documentElement.classList.add("light");
      document.body.classList.remove("bg-gradient-to-b","from-slate-900","via-slate-900","to-slate-800","text-slate-100");
      document.body.classList.add("bg-gradient-to-b","from-white","via-white","to-slate-50","text-slate-900");
    }
  }
  function toggleTheme() {
    const isLight = document.documentElement.classList.toggle("light");
    if (isLight) {
      localStorage.setItem(THEME_KEY, "light");
      document.body.classList.remove("bg-gradient-to-b","from-slate-900","via-slate-900","to-slate-800","text-slate-100");
      document.body.classList.add("bg-gradient-to-b","from-white","via-white","to-slate-50","text-slate-900");
    } else {
      localStorage.setItem(THEME_KEY, "dark");
      document.body.classList.remove("bg-gradient-to-b","from-white","via-white","to-slate-50","text-slate-900");
      document.body.classList.add("bg-gradient-to-b","from-slate-900","via-slate-900","to-slate-800","text-slate-100");
    }
  }
});
