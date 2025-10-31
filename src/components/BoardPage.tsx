import { useEffect, useState } from "react";
import type {
  Board,
  CapturedPieces,
  LastMove,
  Move,
  PieceColor,
  PieceType,
  SelectedSquare,
} from "../lib/contants/types";
import {
  calculateMaterialAdvantage,
  findKing,
  getInitialBoard,
  getValidMoves,
  hasAnyLegalMoves,
  isInCheck,
  moveToNotation,
} from "../lib/contants/utils";
import { PromotionModal } from "./PromotionModal";
import Square from "./Square";

export default function BoardPage() {
  const [board, setBoard] = useState<Board>(getInitialBoard());
  const [selectedSquare, setSelectedSquare] = useState<SelectedSquare | null>(
    null
  );
  const [currentTurn, setCurrentTurn] = useState<PieceColor>("white");
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [promotionPending, setPromotionPending] = useState<any>(null);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [timerActive, setTimerActive] = useState(true);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    white: [],
    black: [],
  });
  const [showHints, setShowHints] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!timerActive || gameOver) return;

    const timer = setInterval(() => {
      if (currentTurn === "white") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setGameOver("Time's up! Black wins!");
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setGameOver("Time's up! White wins!");
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTurn, timerActive, gameOver]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const checkGameState = (newBoard: Board, nextTurn: PieceColor) => {
    const inCheck = isInCheck(newBoard, nextTurn);
    const hasLegalMoves = hasAnyLegalMoves(newBoard, nextTurn, lastMove);

    if (!hasLegalMoves) {
      if (inCheck) {
        setGameOver(
          `Checkmate! ${currentTurn === "white" ? "White" : "Black"} wins!`
        );
        setTimerActive(false);
      } else {
        setGameOver("Stalemate! It's a draw!");
        setTimerActive(false);
      }
    }
  };

  const handlePromotion = (type: PieceType, symbol: string) => {
    const { newBoard, toRow, toCol, nextTurn } = promotionPending;
    newBoard[toRow][toCol] = {
      piece: symbol,
      color: currentTurn,
      type: type,
      hasMoved: true,
    };

    setBoard(newBoard);
    setPromotionPending(null);
    setCurrentTurn(nextTurn);
    checkGameState(newBoard, nextTurn);
  };

  const handleSquareClick = (rowIdx: number, colIdx: number) => {
    if (gameOver || promotionPending) return;

    const clickedCell = board[rowIdx][colIdx];

    if (!selectedSquare) {
      if (clickedCell && clickedCell.color === currentTurn) {
        setSelectedSquare({ row: rowIdx, col: colIdx });
        setValidMoves(getValidMoves(board, rowIdx, colIdx, lastMove));
      }
      return;
    }

    if (selectedSquare.row === rowIdx && selectedSquare.col === colIdx) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (clickedCell && clickedCell.color === currentTurn) {
      setSelectedSquare({ row: rowIdx, col: colIdx });
      setValidMoves(getValidMoves(board, rowIdx, colIdx, lastMove));
      return;
    }

    const moveData = validMoves.find(([r, c]) => r === rowIdx && c === colIdx);
    if (!moveData) return;

    const [toRow, toCol, special] = moveData;
    const newBoard: Board = board.map((row) => [...row]);
    const selectedPiece = newBoard[selectedSquare.row][selectedSquare.col];
    const captured = newBoard[toRow][toCol];

    if (captured) {
      setCapturedPieces((prev) => ({
        ...prev,
        [currentTurn]: [...prev[currentTurn], captured.piece],
      }));
    }

    if (special === "enpassant") {
      const capturedPawn = newBoard[toRow === 2 ? 3 : 4][toCol];
      if (capturedPawn) {
        setCapturedPieces((prev) => ({
          ...prev,
          [currentTurn]: [...prev[currentTurn], capturedPawn.piece],
        }));
      }
      newBoard[toRow === 2 ? 3 : 4][toCol] = null;
    } else if (special === "castle-k") {
      newBoard[selectedSquare.row][5] = newBoard[selectedSquare.row][7];
      newBoard[selectedSquare.row][7] = null;
      if (newBoard[selectedSquare.row][5]) {
        newBoard[selectedSquare.row][5]!.hasMoved = true;
      }
    } else if (special === "castle-q") {
      newBoard[selectedSquare.row][3] = newBoard[selectedSquare.row][0];
      newBoard[selectedSquare.row][0] = null;
      if (newBoard[selectedSquare.row][3]) {
        newBoard[selectedSquare.row][3]!.hasMoved = true;
      }
    }

    const notation = moveToNotation(
      board,
      selectedSquare.row,
      selectedSquare.col,
      toRow,
      toCol,
      captured,
      special
    );

    if (selectedPiece) {
      newBoard[toRow][toCol] = { ...selectedPiece, hasMoved: true };
      newBoard[selectedSquare.row][selectedSquare.col] = null;
    }

    const nextTurn: PieceColor = currentTurn === "white" ? "black" : "white";
    const newLastMove: LastMove = {
      from: [selectedSquare.row, selectedSquare.col],
      to: [toRow, toCol],
      piece: selectedPiece!,
    };

    if (selectedPiece?.type === "pawn" && (toRow === 0 || toRow === 7)) {
      setPromotionPending({ newBoard, toRow, toCol, nextTurn });
      setSelectedSquare(null);
      setValidMoves([]);
      setMoveHistory((prev) => [...prev, notation]);
      setLastMove(newLastMove);
      return;
    }

    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentTurn(nextTurn);
    setMoveHistory((prev) => [...prev, notation]);
    setLastMove(newLastMove);

    checkGameState(newBoard, nextTurn);
  };

  const isValidMoveSquare = (rowIdx: number, colIdx: number): boolean => {
    return validMoves.some(([r, c]) => r === rowIdx && c === colIdx);
  };

  const isLastMoveSquare = (rowIdx: number, colIdx: number): boolean => {
    if (!lastMove) return false;
    return (
      (lastMove.from[0] === rowIdx && lastMove.from[1] === colIdx) ||
      (lastMove.to[0] === rowIdx && lastMove.to[1] === colIdx)
    );
  };

  const kingInCheckPos = isInCheck(board, currentTurn)
    ? findKing(board, currentTurn)
    : null;

  const resetGame = () => {
    setBoard(getInitialBoard());
    setSelectedSquare(null);
    setCurrentTurn("white");
    setValidMoves([]);
    setGameOver(null);
    setMoveHistory([]);
    setLastMove(null);
    setPromotionPending(null);
    setWhiteTime(600);
    setBlackTime(600);
    setTimerActive(true);
    setCapturedPieces({ white: [], black: [] });
  };

  const materialAdvantage = calculateMaterialAdvantage(capturedPieces);
  const advantage = materialAdvantage.white - materialAdvantage.black;

  // check whether a piece at (r,c) (if any) has any legal moves
  const pieceHasAnyLegalMoves = (r: number, c: number) => {
    const piece = board[r][c];
    if (!piece) return false;
    if (piece.color !== currentTurn) return false;
    const moves = getValidMoves(board, r, c, lastMove);
    return moves.length > 0;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8 flex items-start justify-center">
      {promotionPending && (
        <PromotionModal onSelect={handlePromotion} color={currentTurn} />
      )}

      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 md:gap-6">
        <aside className="order-2 md:order-1 md:w-72 lg:w-80 shrink-0">
          <div className="bg-linear-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-xl border border-gray-700 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">White</p>
                <p
                  className={`font-mono font-bold text-2xl ${
                    whiteTime <= 30
                      ? "text-red-400 animate-pulse"
                      : currentTurn === "white"
                      ? "text-green-400"
                      : "text-white"
                  }`}
                >
                  {formatTime(whiteTime)}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400">Turn</p>
                <div className="px-3 py-1 rounded bg-gray-900 text-white font-semibold">
                  {currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400">Black</p>
                <p
                  className={`font-mono font-bold text-2xl ${
                    blackTime <= 30
                      ? "text-red-400 animate-pulse"
                      : currentTurn === "black"
                      ? "text-green-400"
                      : "text-white"
                  }`}
                >
                  {formatTime(blackTime)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setTimerActive((p) => !p)}
                className="flex-1 px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition transform hover:-translate-y-0.5 active:scale-95"
              >
                {timerActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={resetGame}
                className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition transform hover:-translate-y-0.5 active:scale-95"
              >
                Reset
              </button>
            </div>

            {gameOver && (
              <div className="mt-3 text-center">
                <p className="text-sm text-white font-semibold">{gameOver}</p>
              </div>
            )}
          </div>

          <div className="bg-linear-to-br from-gray-800 to-gray-900 p-3 rounded-2xl shadow-lg border border-gray-700 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Captured</h4>
              <button
                onClick={() => setShowHints((s) => !s)}
                className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-white"
              >
                {showHints ? "Hide Hints" : "Hints"}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">White</span>
                <div className="flex gap-1 flex-wrap">
                  {capturedPieces.white.length === 0 ? (
                    <span className="text-gray-500 text-xs">—</span>
                  ) : (
                    capturedPieces.white.map((p, i) => (
                      <span
                        key={i}
                        className="text-2xl transform transition hover:scale-110"
                        aria-hidden
                      >
                        {p}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16">Black</span>
                <div className="flex gap-1 flex-wrap">
                  {capturedPieces.black.length === 0 ? (
                    <span className="text-gray-500 text-xs">—</span>
                  ) : (
                    capturedPieces.black.map((p, i) => (
                      <span
                        key={i}
                        className="text-2xl transform transition hover:scale-110"
                        aria-hidden
                      >
                        {p}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-gray-800 to-gray-900 p-3 rounded-2xl shadow-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Material</h4>
              <div
                className={`text-sm font-bold ${
                  advantage > 0
                    ? "text-green-400"
                    : advantage < 0
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {advantage > 0
                  ? `+${advantage} White`
                  : advantage < 0
                  ? `+${Math.abs(advantage)} Black`
                  : "Equal"}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm text-gray-300 font-medium">History</h5>
                <button
                  onClick={() => setHistoryOpen((h) => !h)}
                  className="text-xs text-gray-300 px-2 py-1 rounded hover:bg-gray-700"
                >
                  {historyOpen ? "Hide" : "Show"}
                </button>
              </div>

              <div
                className={`max-h-40 overflow-auto rounded-md bg-gray-950 p-2 transition-all ${
                  historyOpen ? "block" : "hidden md:block"
                }`}
              >
                {moveHistory.length === 0 ? (
                  <div className="text-gray-500 text-xs text-center py-6">
                    No moves yet
                  </div>
                ) : (
                  moveHistory.map((mv, idx) => (
                    <div
                      key={idx}
                      className={`text-xs py-1 px-2 rounded mb-1 ${
                        idx === moveHistory.length - 1
                          ? "bg-gray-800 text-yellow-400 font-semibold"
                          : "text-gray-300"
                      }`}
                    >
                      {idx % 2 === 0
                        ? `${Math.floor(idx / 2) + 1}. ${mv}`
                        : `   ${mv}`}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="order-1 md:order-2 flex-1 flex flex-col items-center gap-4">
          <div
            className="bg-linear-to-br from-gray-800 to-gray-900 p-4 rounded-2xl shadow-2xl border border-gray-700"
            aria-label="Chess board container"
          >
            <div className="flex items-start gap-3">
              <div className="w-[min(92vw,36rem)]">
                <div className="grid grid-cols-8 gap-0 rounded overflow-hidden border border-gray-700">
                  {board.map((row, r) =>
                    row.map((cell, c) => {
                      const isLight = (r + c) % 2 === 0;
                      const selected = selectedSquare
                        ? selectedSquare.row === r && selectedSquare.col === c
                        : false;
                      const isValid =
                        isValidMoveSquare(r, c) ||
                        (showHints && pieceHasAnyLegalMoves(r, c));
                      const isKingInCheck = kingInCheckPos
                        ? kingInCheckPos[0] === r && kingInCheckPos[1] === c
                        : false;
                      const lastSquare = isLastMoveSquare(r, c);
                      return (
                        <div key={`${r}-${c}`} className="w-full">
                          <Square
                            cell={cell}
                            onClick={() => handleSquareClick(r, c)}
                            selected={selected}
                            isLight={isLight}
                            isValidMove={isValid}
                            isKingInCheck={isKingInCheck}
                            isLastMoveSquare={lastSquare}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="hidden sm:block w-4" />
            </div>
          </div>

          <div className="w-full max-w-xl flex gap-3 justify-center">
            <button
              onClick={() => {
                setHistoryOpen((h) => !h);
              }}
              className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 text-sm hover:scale-105 transition transform"
            >
              {historyOpen ? "Hide History" : "Show History"}
            </button>
            <button
              onClick={() => setShowHints((s) => !s)}
              className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 text-sm hover:scale-105 transition transform"
            >
              {showHints ? "Hide Hints" : "Show Hints"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
