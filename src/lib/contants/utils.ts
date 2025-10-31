import type {
  Board,
  CapturedPieces,
  LastMove,
  Move,
  Piece,
  PieceColor,
  PieceType,
  Position,
  SpecialMove,
} from "./types";

const backPieces = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
const whitePawn = "♙";
const blackPawn = "♙";
export const letterMap = ["a", "b", "c", "d", "e", "f", "g", "h"];

const pieceValues: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export const getInitialBoard = (): Board => {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  const types: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  for (let i = 0; i < 8; i++) {
    board[0][i] = {
      piece: backPieces[i],
      color: "black",
      type: types[i],
      hasMoved: false,
    };
    board[1][i] = {
      piece: blackPawn,
      color: "black",
      type: "pawn",
      hasMoved: false,
    };
    board[6][i] = {
      piece: whitePawn,
      color: "white",
      type: "pawn",
      hasMoved: false,
    };
    board[7][i] = {
      piece: backPieces[i],
      color: "white",
      type: types[i],
      hasMoved: false,
    };
  }
  return board;
};

export const findKing = (board: Board, color: PieceColor): Position | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c]?.type === "king" && board[r][c]?.color === color) {
        return [r, c];
      }
    }
  }
  return null;
};

export const isSquareAttacked = (
  board: Board,
  row: number,
  col: number,
  byColor: PieceColor
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        const moves = getRawMoves(board, r, c, null);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) {
          return true;
        }
      }
    }
  }
  return false;
};

const getRawMoves = (
  board: Board,
  fromRow: number,
  fromCol: number,
  lastMove: LastMove | null
): Move[] => {
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const moves: Move[] = [];
  const { type, color } = piece;

  const isValidSquare = (r: number, c: number) =>
    r >= 0 && r < 8 && c >= 0 && c < 8;
  const isEmptyOrEnemy = (r: number, c: number) =>
    !board[r][c] || board[r][c]!.color !== color;

  if (type === "pawn") {
    const direction = color === "white" ? -1 : 1;
    const startRow = color === "white" ? 6 : 1;

    if (
      isValidSquare(fromRow + direction, fromCol) &&
      !board[fromRow + direction][fromCol]
    ) {
      moves.push([fromRow + direction, fromCol]);

      if (fromRow === startRow && !board[fromRow + 2 * direction][fromCol]) {
        moves.push([fromRow + 2 * direction, fromCol]);
      }
    }

    [-1, 1].forEach((offset) => {
      const newRow = fromRow + direction;
      const newCol = fromCol + offset;
      if (
        isValidSquare(newRow, newCol) &&
        board[newRow][newCol] &&
        board[newRow][newCol]!.color !== color
      ) {
        moves.push([newRow, newCol]);
      }
    });

    if (lastMove) {
      const enPassantRow = color === "white" ? 3 : 4;
      if (
        fromRow === enPassantRow &&
        lastMove.piece.type === "pawn" &&
        Math.abs(lastMove.from[0] - lastMove.to[0]) === 2 &&
        Math.abs(lastMove.to[1] - fromCol) === 1 &&
        lastMove.to[0] === fromRow
      ) {
        moves.push([fromRow + direction, lastMove.to[1], "enpassant"]);
      }
    }
  }

  if (type === "rook") {
    [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ].forEach(([dr, dc]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = fromRow + dr * i;
        const newCol = fromCol + dc * i;
        if (!isValidSquare(newRow, newCol)) break;
        if (board[newRow][newCol]) {
          if (board[newRow][newCol]!.color !== color)
            moves.push([newRow, newCol]);
          break;
        }
        moves.push([newRow, newCol]);
      }
    });
  }

  if (type === "knight") {
    [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ].forEach(([dr, dc]) => {
      const newRow = fromRow + dr;
      const newCol = fromCol + dc;
      if (isValidSquare(newRow, newCol) && isEmptyOrEnemy(newRow, newCol)) {
        moves.push([newRow, newCol]);
      }
    });
  }

  if (type === "bishop") {
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dr, dc]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = fromRow + dr * i;
        const newCol = fromCol + dc * i;
        if (!isValidSquare(newRow, newCol)) break;
        if (board[newRow][newCol]) {
          if (board[newRow][newCol]!.color !== color)
            moves.push([newRow, newCol]);
          break;
        }
        moves.push([newRow, newCol]);
      }
    });
  }

  if (type === "queen") {
    [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dr, dc]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = fromRow + dr * i;
        const newCol = fromCol + dc * i;
        if (!isValidSquare(newRow, newCol)) break;
        if (board[newRow][newCol]) {
          if (board[newRow][newCol]!.color !== color)
            moves.push([newRow, newCol]);
          break;
        }
        moves.push([newRow, newCol]);
      }
    });
  }

  if (type === "king") {
    [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach(([dr, dc]) => {
      const newRow = fromRow + dr;
      const newCol = fromCol + dc;
      if (isValidSquare(newRow, newCol) && isEmptyOrEnemy(newRow, newCol)) {
        moves.push([newRow, newCol]);
      }
    });

    if (!piece.hasMoved) {
      const enemyColor = color === "white" ? "black" : "white";

      if (
        !board[fromRow][5] &&
        !board[fromRow][6] &&
        board[fromRow][7]?.type === "rook" &&
        !board[fromRow][7]?.hasMoved &&
        !isSquareAttacked(board, fromRow, fromCol, enemyColor) &&
        !isSquareAttacked(board, fromRow, 5, enemyColor) &&
        !isSquareAttacked(board, fromRow, 6, enemyColor)
      ) {
        moves.push([fromRow, 6, "castle-k"]);
      }

      if (
        !board[fromRow][3] &&
        !board[fromRow][2] &&
        !board[fromRow][1] &&
        board[fromRow][0]?.type === "rook" &&
        !board[fromRow][0]?.hasMoved &&
        !isSquareAttacked(board, fromRow, fromCol, enemyColor) &&
        !isSquareAttacked(board, fromRow, 3, enemyColor) &&
        !isSquareAttacked(board, fromRow, 2, enemyColor)
      ) {
        moves.push([fromRow, 2, "castle-q"]);
      }
    }
  }

  return moves;
};

export const getValidMoves = (
  board: Board,
  fromRow: number,
  fromCol: number,
  lastMove: LastMove | null
): Move[] => {
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, fromRow, fromCol, lastMove);
  const validMoves: Move[] = [];

  for (const move of rawMoves) {
    const [toRow, toCol, special] = move;
    const testBoard: Board = board.map((row) => [...row]);
    testBoard[toRow][toCol] = testBoard[fromRow][fromCol];
    testBoard[fromRow][fromCol] = null;

    if (special === "enpassant") {
      testBoard[toRow === 2 ? 3 : 4][toCol] = null;
    }

    const kingPos =
      piece.type === "king" ? [toRow, toCol] : findKing(testBoard, piece.color);
    const enemyColor = piece.color === "white" ? "black" : "white";

    if (
      kingPos &&
      !isSquareAttacked(testBoard, kingPos[0], kingPos[1], enemyColor)
    ) {
      validMoves.push(move);
    }
  }

  return validMoves;
};

export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const enemyColor = color === "white" ? "black" : "white";
  return isSquareAttacked(board, kingPos[0], kingPos[1], enemyColor);
};

export const hasAnyLegalMoves = (
  board: Board,
  color: PieceColor,
  lastMove: LastMove | null
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, r, c, lastMove);
        if (moves.length > 0) return true;
      }
    }
  }
  return false;
};

export const moveToNotation = (
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  captured: Piece | null,
  special?: SpecialMove
): string => {
  const piece = board[fromRow][fromCol];
  if (!piece) return "";

  const pieceSymbol = piece.type === "pawn" ? "" : piece.type[0].toUpperCase();
  const fromSquare = letterMap[fromCol] + (8 - fromRow);
  const toSquare = letterMap[toCol] + (8 - toRow);
  const captureSymbol = captured ? "x" : "";

  if (special === "castle-k") return "O-O";
  if (special === "castle-q") return "O-O-O";

  return `${pieceSymbol}${fromSquare}${captureSymbol}${toSquare}`;
};

export const calculateMaterialAdvantage = (
  captured: CapturedPieces
): { white: number; black: number } => {
  const whiteMaterial = captured.black.reduce((sum, piece) => {
    const type =
      piece === blackPawn
        ? "pawn"
        : piece === "♜"
        ? "rook"
        : piece === "♞"
        ? "knight"
        : piece === "♝"
        ? "bishop"
        : piece === "♛"
        ? "queen"
        : "king";
    return sum + pieceValues[type];
  }, 0);

  const blackMaterial = captured.white.reduce((sum, piece) => {
    const type =
      piece === whitePawn
        ? "pawn"
        : piece === "♖"
        ? "rook"
        : piece === "♘"
        ? "knight"
        : piece === "♗"
        ? "bishop"
        : piece === "♕"
        ? "queen"
        : "king";
    return sum + pieceValues[type];
  }, 0);

  return { white: whiteMaterial, black: blackMaterial };
};
