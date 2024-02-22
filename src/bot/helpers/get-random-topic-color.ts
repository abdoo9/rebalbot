type Color =
  | 7_322_096
  | 16_766_590
  | 13_338_331
  | 9_367_192
  | 16_749_490
  | 16_478_047;

export function getRandomTopicColor(): Color {
  const colors: Color[] = [
    7_322_096, 16_766_590, 13_338_331, 9_367_192, 16_749_490, 16_478_047,
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}
