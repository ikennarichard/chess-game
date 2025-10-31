import type { Piece } from "../lib/contants/types";

interface SquareProps {
  cell: Piece | null;
  onClick: () => void;
  selected: boolean;
  isLight: boolean;
  isValidMove: boolean;
  isKingInCheck: boolean;
  isLastMoveSquare: boolean;
}

export default function Square({
  cell,
  onClick,
  selected,
  isLight,
  isValidMove,
  isKingInCheck,
  isLastMoveSquare,
}: SquareProps) {
  return (
    <button
      onClick={onClick}
      role="button"
      className={`w-full aspect-square flex items-center justify-center relative transition-all duration-200 focus:outline-none
        ${
          isLight
            ? "bg-[linear-gradient(180deg,#f9edd6,#f3dbc1)]"
            : "bg-[linear-gradient(180deg,#816046,#6f553f)]"
        }
        ${selected ? "ring-4 ring-blue-400 ring-inset z-10" : ""}
        ${
          isLastMoveSquare
            ? "shadow-[inset_0_0_0_6px_rgba(253,230,138,0.08)]"
            : ""
        }
      `}
      aria-pressed={selected}
      aria-label={cell ? `${cell.color} ${cell.type}` : "empty square"}
    >
      {/* valid move dot/capture highlight */}
      {!cell && isValidMove && (
        <span className="w-3 h-3 md:w-4 md:h-4 bg-green-400 rounded-full opacity-90 transform transition-all animate-pulse"></span>
      )}

      {cell && isValidMove && (
        <div className="absolute inset-0 border-2 border-red-400 rounded transition-transform animate-pulse pointer-events-none"></div>
      )}

      {cell && (
        <span
          className={`select-none text-[clamp(1.4rem,4.2vw,2.6rem)] transition-transform duration-150 will-change-transform transform ${
            cell.color === "white"
              ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"
              : "text-black"
          } hover:scale-105`}
          style={{
            textShadow:
              cell.color === "white" ? "0 0 3px rgba(0,0,0,0.6)" : undefined,
          }}
        >
          {cell.piece}
        </span>
      )}

      {isKingInCheck && (
        <div className="absolute inset-0 bg-red-500/30 rounded animate-pulse pointer-events-none" />
      )}
    </button>
  );
}