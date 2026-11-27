export type Clarification = {
  intent: string;
  prompt: string;
  options: string[];
};
export function clarificationFor(question: string): Clarification | null {
  const q = question.trim();
  if (
    /\bnext\s+(?:major\s+)?swing\s*high\b/i.test(q) &&
    !/nearest|overhead|previous|historical|major daily|major weekly/i.test(q)
  )
    return {
      intent: "levels",
      prompt: "Which level do you want me to assess on the selected timeframe?",
      options: ["Nearest overhead resistance", "Previous major swing high"],
    };
  if (
    /\b(?:analyse|analyze|assess|review)\s+my\s+trade\b/i.test(q) &&
    !/\b(entry|bought|sold|long|short)\b/i.test(q)
  )
    return {
      intent: "trade",
      prompt:
        "Would you like chart research, or to provide details of an existing trade?",
      options: [
        "Assess the selected chart",
        "I will provide direction and entry details",
      ],
    };
  return null;
}
export function learningScope(question: string): string {
  if (/swing|support|resistance|breakout|\blevel\b/i.test(question))
    return "levels";
  if (/volume|participation/i.test(question)) return "volume";
  if (/trend|timeframe|momentum|rsi|macd|average/i.test(question))
    return "trend";
  return "general";
}
