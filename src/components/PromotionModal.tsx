import type { PieceColor, PieceType } from "../lib/contants/types";

interface PromotionModalProps {
  onSelect: (type: PieceType, symbol: string) => void;
  color: PieceColor;
}

export function PromotionModal({ onSelect, color }: PromotionModalProps) {
  const pieces =
    color === "white"
      ? [
          { type: "queen" as PieceType, symbol: "♕" },
          { type: "rook" as PieceType, symbol: "♖" },
          { type: "bishop" as PieceType, symbol: "♗" },
          { type: "knight" as PieceType, symbol: "♘" },
        ]
      : [
          { type: "queen" as PieceType, symbol: "♛" },
          { type: "rook" as PieceType, symbol: "♜" },
          { type: "bishop" as PieceType, symbol: "♝" },
          { type: "knight" as PieceType, symbol: "♞" },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-linear-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-2xl border border-yellow-500">
        <p className="text-center text-2xl font-semibold text-white mb-4">
          Choose Promotion
        </p>
        <div className="grid grid-cols-4 gap-4">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type, p.symbol)}
              className="aspect-square rounded-xl flex items-center justify-center text-5xl select-none transform transition hover:scale-105 active:scale-95 bg-amber-500/90 hover:bg-amber-500/100 shadow-md"
              aria-label={`Promote to ${p.type}`}
            >
              {p.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}