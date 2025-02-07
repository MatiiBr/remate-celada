export const formatNumber = (input: number): string => {
  return input.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
