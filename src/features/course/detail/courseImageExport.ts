export function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
) {
  context.save();
  context.fillStyle = fillStyle;
  clipRoundRect(context, x, y, width, height, radius);
  context.fill();
  context.restore();
}

export function clipRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const nextRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + nextRadius, y);
  context.lineTo(x + width - nextRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  context.lineTo(x + width, y + height - nextRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - nextRadius,
    y + height,
  );
  context.lineTo(x + nextRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  context.lineTo(x, y + nextRadius);
  context.quadraticCurveTo(x, y, x + nextRadius, y);
  context.closePath();
}

export function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

export function drawSingleLineText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let nextText = text;
  while (nextText.length > 0 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }
  context.fillText(`${nextText}...`, x, y);
}

export function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }

    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((nextLine, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines;
    drawSingleLineText(
      context,
      isLastVisibleLine ? `${nextLine}...` : nextLine,
      x,
      y + index * lineHeight,
      maxWidth,
    );
  });
}

export function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function downloadCanvas(canvas: HTMLCanvasElement, title: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${title}.png`;
  link.click();
}
