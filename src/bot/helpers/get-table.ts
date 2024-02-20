/* eslint-disable no-restricted-syntax */
import { createCanvas } from "canvas";
import { Readable } from "node:stream";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTable(data: any[]): Readable {
  const scaleFactor = 2; // Increase this to increase resolution
  const padding = 10 * scaleFactor;
  const rowHeight = 20 * scaleFactor;
  const canvas = createCanvas(2000 * scaleFactor, 2000 * scaleFactor); // Temporarily create a large canvas
  const context = canvas.getContext("2d");

  context.font = `${14 * scaleFactor}px Arial`;
  context.textBaseline = "middle";

  // Calculate the maximum width of each column
  const columnWidths = Object.keys(data[0]).map((key, _index) => {
    const headerWidth = context.measureText(key).width;
    const cellWidths = data.map(
      (row) => context.measureText(String(row[key])).width,
    );
    return Math.max(headerWidth, ...cellWidths) + 2 * padding;
  });

  // Calculate the total width and height of the table
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const tableHeight = (data.length + 1) * rowHeight + 2 * padding;

  // Create a new canvas with the correct size
  const finalCanvas = createCanvas(tableWidth, tableHeight);
  const finalContext = finalCanvas.getContext("2d");

  finalContext.font = `${14 * scaleFactor}px Arial`;
  finalContext.textBaseline = "middle";

  // Draw the table
  let x = 0;
  for (const [index, key] of Object.keys(data[0]).entries()) {
    // eslint-disable-next-line no-plusplus
    for (let rowIndex = -1; rowIndex < data.length; rowIndex++) {
      const cell = rowIndex === -1 ? key : String(data[rowIndex][key]);
      const y = padding + (rowIndex + 1) * rowHeight;

      // Set the fill color for the cell
      finalContext.fillStyle =
        rowIndex === -1
          ? "#ADD8E6"
          : rowIndex % 2 === 0
            ? "#FFFFFF"
            : "#F0F0F0";
      finalContext.fillRect(x, y, columnWidths[index], rowHeight);

      // Set the stroke color for the cell border
      finalContext.strokeStyle = "#000000";
      finalContext.strokeRect(x, y, columnWidths[index], rowHeight);

      // Set the fill color for the text and draw the text
      finalContext.fillStyle = "#000000";
      finalContext.fillText(cell, x + padding, y + rowHeight / 2);
    }
    x += columnWidths[index];
  }

  const stream = finalCanvas.createPNGStream();
  return Readable.from(stream);
}
