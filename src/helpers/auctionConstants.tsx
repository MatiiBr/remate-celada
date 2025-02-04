export const AUCTION_STATUSES = {
  EN_CURSO: "EN CURSO",
  PAUSADO: "PAUSADO",
  CANCELADO: "CANCELADO",
  FINALIZADO: "FINALIZADO",
  PENDIENTE: "PENDIENTE",
} as const;

export type AuctionStatus =
  (typeof AUCTION_STATUSES)[keyof typeof AUCTION_STATUSES];

export const auctionStatusBadgeClasses: Record<AuctionStatus, string> = {
  "EN CURSO": "bg-green-50 text-green-600 ring-green-500/10",
  PAUSADO: "bg-yellow-50  text-yellow-800  ring-yellow-600/20 ",
  CANCELADO: "bg-red-50 text-red-700 ring-red-600/10 ",
  FINALIZADO: "bg-purple-50 text-purple-700 ring-purple-600/10",
  PENDIENTE: "bg-gray-50 text-gray-600 ring-gray-500/10",
};
