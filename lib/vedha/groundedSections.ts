import type { Evidence, Narrative } from "./contracts";

type Layer = Narrative["layers"][number];

/** Critical claims are assembled from evidence, never inferred from model prose. */
export function groundCriticalSections(raw: unknown, evidence: Evidence): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const report = raw as Record<string, unknown>;
  if (!Array.isArray(report.layers)) return raw;
  const facts = new Map(evidence.facts.map(fact => [fact.id, fact]));
  const has = (id: string) => facts.has(id);
  const ref = (id: string) => `[F:${id}]`;
  const price = (id: string): number | null => {
    const value = facts.get(id)?.value;
    if (!value || !/^₹[\d,]+(?:\.\d+)?$/.test(value)) return null;
    const number = Number(value.slice(1).replace(/,/g, ""));
    return Number.isFinite(number) && number > 0 ? number : null;
  };
  function section(id: string, sentences: string[]): Layer {
    const explanation = sentences.join(" ");
    const evidenceIds = [...new Set([...explanation.matchAll(/\[F:([a-zA-Z0-9_]+)\]/g)].map(match => match[1]))];
    return { id, explanation, evidenceIds };
  }
  const close = price("close");
  const support = price("support1");
  const resistance = price("resistance1");
  // Do not describe a supplied price as support/resistance on the wrong side.
  const supportValid = close !== null && support !== null && support < close;
  const resistanceValid = close !== null && resistance !== null && resistance > close;

  const patterns = section("patterns", [
    has("patterns")
      ? `The detector records the following within its recent completed-candle window: ${ref("patterns")}.`
      : `At the completed reference close ${ref("close")}, no candlestick-detector output was supplied.`,
    "Each listed time identifies a detection candle, rather than a price attributed to the formation. Detector matches describe candle shapes; they do not establish a reversal or identify who traded. Interpret them alongside subsequent completed closes and confirmed swings.",
  ]);

  const riskSentences: string[] = [];
  if (has("volume") && has("volume_mean")) riskSentences.push(
    `The last completed candle volume is ${ref("volume")}, compared with a mean of ${ref("volume_mean")} across the preceding twenty completed candles.`,
  );
  if (has("relative_volume")) {
    riskSentences.push(`Relative volume is ${ref("relative_volume")}.`);
    // Use the engine's unrounded classification, not rounded display values.
    if (evidence.observations.includes("Volume is elevated relative to the preceding average."))
      riskSentences.push("Participation is elevated against that recent average, but volume alone does not determine direction or confirm a breakout.");
    else if (evidence.observations.includes("Volume is subdued relative to the preceding average."))
      riskSentences.push("Participation is subdued against that recent average, providing limited volume confirmation for a move through a structural level.");
    else if (evidence.observations.includes("Volume is broadly near its preceding average; small differences are not strong confirmation."))
      riskSentences.push("Participation is broadly near its recent average and does not provide strong volume confirmation.");
  }
  if (has("atr")) riskSentences.push(`The fourteen-period ATR is ${ref("atr")}${has("atr_percent") ? `, equivalent to ${ref("atr_percent")} of the completed close` : ""}. This describes the current average true range; no historical volatility ranking is supplied.`);
  riskSentences.push(`The completed reference close is ${ref("close")}. Candle volume cannot identify institutional buying or selling. Evaluate any move through nearby levels using completed closes and follow-through.`);
  const risk = section("risk", riskSentences);

  const outlookSentences = [
    `The completed reference close is ${ref("close")}.`,
    resistanceValid
      ? `A completed close above the local swing resistance at ${ref("resistance1")}, followed by sustained trading above it, would strengthen the recovery or continuation case. A brief price breach alone would not establish a confirmed breakout.`
      : "No valid local swing resistance above the reference close is available for an upside confirmation condition.",
    supportValid
      ? `A completed close below the local swing support at ${ref("support1")} would weaken that immediate reference and call for reassessment. This alone would not establish a broader trend reversal; a change in swing sequence and subsequent follow-through would be needed.`
      : "No valid local swing support below the reference close is available for a downside confirmation condition.",
  ];
  if (has("supertrend")) {
    const st = price("supertrend");
    outlookSentences.push(`The current Supertrend reference is separately located at ${ref("supertrend")}.`);
    if (st !== null && supportValid && st < support!) outlookSentences.push(
      `A close just below ${ref("support1")} can still remain above ${ref("supertrend")}; loss of that local support does not by itself mean Supertrend has been crossed.`,
    );
    else if (st !== null && resistanceValid && st > resistance!) outlookSentences.push(
      `A close just above ${ref("resistance1")} can still remain below ${ref("supertrend")}; clearing that local resistance does not by itself mean Supertrend has been crossed.`,
    );
    outlookSentences.push("The displayed Supertrend value can change with subsequent candles.");
  }
  outlookSentences.push("A pullback interpretation depends on the wider swing structure remaining intact. These are conditional observations, not entries, price objectives or forecasts.");
  for(const key of ["hourly","daily","weekly","monthly"]){
    if(has(`mtf_${key}_status`))outlookSentences.push(`The independently assessed ${key} classification is ${ref(`mtf_${key}_status`)}.`);
  }
  const outlook = section("outlook", outlookSentences);

  const conclusion = [
    `Use the completed close ${ref("close")} as the historical reference.`,
    supportValid
      ? `Local support is ${ref("support1")}; a completed close below it calls for reassessment, rather than automatically establishing a reversal.`
      : has("support1")
        ? `The supplied support reference ${ref("support1")} is not below that close, so it cannot serve as a downside support condition.`
        : "No local swing support was supplied.",
    resistanceValid
      ? `Local resistance is ${ref("resistance1")}; a completed close above it with follow-through would strengthen the recovery or continuation case.`
      : has("resistance1")
        ? `The supplied resistance reference ${ref("resistance1")} is not above that close, so it cannot serve as an upside resistance condition.`
        : "No local swing resistance was supplied.",
    "A momentary breach is insufficient confirmation.",
  ].join(" ");
  const zoneSentences:string[]=[`The completed reference close is ${ref("close")}.`];
  if(supportValid)zoneSentences.push(`The nearest local swing support below that close is ${ref("support1")}${has("support1_distance")?`, at a distance of ${ref("support1_distance")}`:""}.`);
  else zoneSentences.push("No valid local swing support below that close is supplied.");
  if(resistanceValid)zoneSentences.push(`The nearest local swing resistance above that close is ${ref("resistance1")}${has("resistance1_distance")?`, at a distance of ${ref("resistance1_distance")}`:""}.`);
  else zoneSentences.push("No valid local swing resistance above that close is supplied.");
  if(has("fib_a")&&has("fib_b")){
   const fibLevels=[["fib_382","thirty-eight point two percent"],["fib_500","fifty percent"],["fib_618","sixty-one point eight percent"]].filter(([id])=>has(id));
   if(fibLevels.length){
    zoneSentences.push(`Separately, Fibonacci uses the confirmed start anchor ${ref("fib_a")} and end anchor ${ref("fib_b")}.${has("fib_direction")?` The supplied anchor direction is ${ref("fib_direction")}.`:""}`);
    zoneSentences.push(`The retracement references are ${fibLevels.map(([id,label])=>`${label} at ${ref(id)}`).join(", ")}. These retracement references do not establish a projected price objective or prove that price will react there.`);
   }
  }
  if(has("pivot_reference")&&has("pivot_P"))zoneSentences.push(`The traditional pivot reference period is ${ref("pivot_reference")}, with its central pivot at ${ref("pivot_P")}.`);
  zoneSentences.push("These methods describe separate historical references, not a validated confluence zone. A nearest local swing is not necessarily a major market turning point.");
  const zones=section("zones",zoneSentences);
  const opening: string[] = [
    has("symbol") && has("timeframe")
      ? `For ${ref("symbol")} on the ${ref("timeframe")} timeframe, the last completed candle closed at ${ref("close")}.`
      : `The last completed candle closed at ${ref("close")}.`,
  ];
  const emaTwenty=price("ema20");
  if(close!==null&&emaTwenty!==null)opening.push(
    `That close is ${close>emaTwenty?"above":close<emaTwenty?"below":"at"} the twenty-period EMA at ${ref("ema20")}.`,
  );
  if(evidence.observations.includes("EMA stack is bullishly aligned."))
    opening.push("The supplied EMA stack is bullishly aligned; this describes the selected timeframe rather than establishing a trend on another timeframe.");
  else if(evidence.observations.includes("EMA stack is bearishly aligned."))
    opening.push("The supplied EMA stack is bearishly aligned; this describes the selected timeframe rather than establishing a trend on another timeframe.");
  else if(evidence.observations.includes("EMA alignment is mixed."))
    opening.push("The supplied EMA alignment is mixed, so the moving averages do not provide a uniform directional picture.");
  if(has("supertrend")&&has("supertrend_direction"))opening.push(
    `Supertrend is ${ref("supertrend_direction")} with a current reference at ${ref("supertrend")}.`,
  );
  const numeric=(id:string):number|null=>{
    const value=facts.get(id)?.value;
    if(!value||!/^[-+]?\d[\d,]*(?:\.\d+)?$/.test(value))return null;
    const number=Number(value.replace(/,/g,""));return Number.isFinite(number)?number:null;
  };
  const histogram=numeric("macd_hist"),priorHistogram=numeric("macd_hist_prior");
  if(histogram!==null&&priorHistogram!==null)opening.push(
    `The MACD histogram is ${ref("macd_hist")}, ${histogram>priorHistogram?"higher than":histogram<priorHistogram?"lower than":"unchanged from"} ${ref("macd_hist_prior")} five completed bars earlier; this comparison alone does not establish a crossover.`,
  );
  if(has("relative_volume"))opening.push(
    `Relative volume is ${ref("relative_volume")} against the prior twenty completed bars.`,
  );
  if(has("mtf_daily_status"))opening.push("Separate hourly, daily, weekly and monthly assessments appear in the trend comparison below; missing coverage does not confirm alignment.");
  opening.push("These historical readings need to be weighed together; none independently confirms the next price move.");
  // Structure uses calculated facts directly. Model prose cannot change timeframe
  // classifications, introduce literal readings or omit required coverage references.
  const structureSentences:string[]=[];
  if(has("close"))structureSentences.push(`The selected chart's completed reference close is ${ref("close")}.`);
  for(const [period,name] of [["20","twenty"],["50","fifty"],["200","two hundred"]]){
    const id="ema"+period;
    if(!has(id))continue;
    const average=price(id);
    structureSentences.push(`The ${name}-period EMA is ${ref(id)}${close!==null&&average!==null?`; the completed close is ${close>average?"above":close<average?"below":"at"} it`:""}.${has(id+"_slope")?` Its change over five completed candles on the selected timeframe is ${ref(id+"_slope")}.`:""}`);
  }
  const swingObservation=evidence.observations.find(value=>/^Last two confirmed swing highs are (rising|falling or equal); last two confirmed swing lows are (rising|falling or equal)\.$/.test(value));
  if(swingObservation)structureSentences.push(swingObservation);
  else structureSentences.push("A complete rising or falling swing sequence is not established by the supplied observations.");
  const frameStates:string[]=[];
  for(const key of ["hourly","daily","weekly","monthly"]){
    const status="mtf_"+key+"_status",summary="mtf_"+key+"_summary";
    if(!has(status))continue;
    frameStates.push(facts.get(status)!.value);
    structureSentences.push(`The independently calculated ${key} assessment is ${ref(status)}.${has(summary)?` ${ref(summary)}`:""}`);
  }
  if(frameStates.length===4&&frameStates.every(value=>value==="Bullish"))
    structureSentences.push("All four available classifications agree on bullish structure under the stated rules. Agreement is not a forecast.");
  else if(frameStates.length===4&&frameStates.every(value=>value==="Bearish"))
    structureSentences.push("All four available classifications agree on bearish structure under the stated rules. Agreement is not a forecast.");
  else if(frameStates.length){
    const incomplete=frameStates.some(value=>value==="Insufficient evidence"||value==="Stale evidence");
    structureSentences.push(incomplete?"Missing or stale coverage prevents confirmation across all four timeframes. Available readings must be assessed separately.":"The classifications do not establish a uniform directional trend across all four timeframes. Mixed evidence must not be treated as confirmation.");
  }
  structureSentences.push("Average slopes describe changes on their own timeframe; they do not independently confirm another timeframe or predict the depth of a pullback.");
  const structure=section("structure",structureSentences);
  const replacements = new Map([structure, patterns, risk, zones, outlook].map(layer => [layer.id, layer]));
  return {
    ...report,
    overview: opening.join(" "),
    // Preserve malformed/duplicate/missing IDs so normal validation still rejects them.
    layers: report.layers.map(item => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const layer = item as Record<string, unknown>;
      return typeof layer.id === "string" && replacements.has(layer.id)
        ? replacements.get(layer.id)
        : item;
    }),
    conclusion,
  };
}
