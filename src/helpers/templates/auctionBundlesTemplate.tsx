export const auctionBundlesTemplate = (bundleData: any[], auctionName: string) => {
  return `
         <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte ${auctionName}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 40px; }
        h3 { text-transform: uppercase; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #1a1a1a; padding: 8px; text-align: left; }
        th { color: black; }
      </style>
    </head>
    <body>
      <h3>Reporte de Lotes - ${auctionName}</h3>
      <table>
        <thead>
          <tr>
            <th>Lote</th>
            <th>Producto</th>
            <th>Vendedor</th>
            <th>Comprador</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${bundleData
            .map(
              (bundle) => `
            <tr>
              <td>${bundle.Lote}</td>
              <td>${bundle.Producto}</td>
              <td>${bundle.Vendedor}</td>
              <td></td> <!-- Comprador vacío -->
              <td></td> <!-- Precio vacío -->
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
    `;
};
