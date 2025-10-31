export type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
export type PieceColor = "white" | "black";
export type SpecialMove = "enpassant" | "castle-k" | "castle-q" | undefined;

export interface Piece {
  piece: string;
  color: PieceColor;
  type: PieceType;
  hasMoved: boolean;
}

export type Board = (Piece | null)[][];
export type Position = [number, number];
export type Move = [number, number, SpecialMove?];

export interface LastMove {
  from: Position;
  to: Position;
  piece: Piece;
}

export interface SelectedSquare {
  row: number;
  col: number;
}

export interface CapturedPieces {
  white: string[];
  black: string[];
}