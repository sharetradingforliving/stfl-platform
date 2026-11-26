import type { Evidence, Narrative } from "./contracts";
export const IDS = ["structure", "patterns", "risk", "indicators", "zones", "outlook"] as const;
const string = { type: "string" };
export const NARRATIVE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["headline", "overview", "layers", "conclusion"],
  properties: {
    headline: string, overview: string, conclusion: string,
    layers: {
      type: "array", minItems: 6, maxItems: 6,
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "explanation", "evidenceIds"],
        properties: {
          id: { type: "string", enum: IDS }, explanation: string,
          evidenceIds: { type: "array", minItems: 1, items: string },
        },
      },
    },
  },
};
class NarrativeValidationError extends Error {
  constructor(message: string, public section?: string, public violation?: string) { super(message); this.name = "NarrativeValidationError"; }
}
function reject(message: string, section?: string, violation?: string): never { throw new NarrativeValidationError(message,section,violation); }
/** Normalise known indicator SETTINGS only; never accept a literal price or reading. */
function normaliseLabels(input:unknown,factIds:Set<string>,timeframe:string):unknown {
 if(typeof input!=="string")return input;
 const names:Record<string,string>={"9":"nine","10":"ten","14":"fourteen","20":"twenty","50":"fifty","100":"one hundred","200":"two hundred"};
 return input.split(/(\[F:[a-zA-Z0-9_]+\])/g).map(part=>{
  if(/^\[F:[a-zA-Z0-9_]+\]$/.test(part))return part;
  let result=part;
  for(const kind of ["EMA","SMA"]){
   for(const period of [20,50,100,200]){
    if(!factIds.has(kind.toLowerCase()+period))continue;
    const phrase=names[String(period)]+"-period "+kind;
    result=result.replace(new RegExp("\\b"+kind+"\\s*[-(]?\\s*"+period+"(?![\\w.])\\)?","gi"),phrase);
    result=result.replace(new RegExp("\\b"+period+"[- ](?:period|bar|day)\\s+"+kind+"\\b","gi"),phrase);
    result=result.replace(new RegExp("\\b"+period+"\\s+"+kind+"\\b","gi"),phrase);
   }
  }
  for(const [kind,id] of [["RSI","rsi"],["ADX","adx"],["ATR","atr"]]){
   if(!factIds.has(id))continue;
   result=result.replace(new RegExp("\\b"+kind+"\\s*[-(]?\\s*14(?![\\w.])\\)?","gi"),"fourteen-period "+kind);
   result=result.replace(new RegExp("\\b14[- ](?:period|bar|day)\\s+"+kind+"\\b","gi"),"fourteen-period "+kind);
  }
  if(factIds.has("macd"))result=result.replace(/\bMACD\s*\(\s*12\s*,\s*26\s*,\s*9\s*\)/gi,"MACD with twelve, twenty-six and nine settings");
  if(factIds.has("supertrend"))result=result.replace(/\bSupertrend\s*\(?\s*10\s*,\s*3(?![\d.])\s*\)?/gi,"Supertrend with ten and three settings");
  const frames:Record<string,string>={"1m":"one-minute","5m":"five-minute","15m":"fifteen-minute","30m":"thirty-minute","1H":"one-hour","4H":"four-hour","D":"daily","W":"weekly","M":"monthly"};
  const label=timeframe==="D"?"1D":timeframe==="W"?"1W":timeframe==="M"?"1M":timeframe;
  if(frames[timeframe])result=result.replace(new RegExp("\\b"+label+"\\b","g"),frames[timeframe]);
  return result;
 }).join("");
}
/** Bind only exact, uniquely identifiable supplied readings; never infer or round values. */
function bindLiteralFacts(input: unknown, evidence: Evidence): unknown {
 if(typeof input!=="string")return input;
 const numeric=(value:string)=>{
  if(!/^-?(?:\d+|\d{1,3}(?:,\d{2,3})+)(?:\.\d+)?$/.test(value))return null;
  return Number(value.replace(/,/g,""));
 };
 const facts=evidence.facts;
 const named:Record<string,string>={rsi:"rsi",adx:"adx",atr:"atr",macd:"macd", "macd signal":"macd_signal", "macd histogram":"macd_hist", "positive directional indicator":"plus_di", "negative directional indicator":"minus_di", "relative volume":"relative_volume"};
 return input.split(/(\[F:[^\]\r\n]*\])/g).map(part=>{
  if(part.startsWith("[F:"))return part;
  return part.replace(/(?<![\w.,₹+−-])([₹]?[-−]?\d[\d,]*(?:\.\d+)?)(%|×|x\b)?(?![\w,]|\.\d)/g,(token:string,amount:string,suffix:string|undefined,offset:number)=>{
   const currency=amount.startsWith("₹");
   const number=numeric(amount.replace(/^₹/,"").replace("−","-"));
   if(number===null)return token;
   // A bare reading needs an immediately associated, recognised indicator label.
   const prefix=part.slice(0,offset);
   const label=prefix.match(/\b(MACD histogram|MACD signal|positive directional indicator|negative directional indicator|relative volume|RSI|ADX|ATR|MACD)(?:\s+(?:fourteen|fourteen-period))?(?:\s+(?:is|at|of|reads|equals))?\s*[:=]?\s*$/i)?.[1].toLowerCase();
   const namedId=label?named[label]:undefined;
   if(!currency&&!namedId)return token;
   const matches=facts.filter(fact=>{
    if(namedId&&fact.id!==namedId)return false;
    const value=fact.value;
    if(currency&&!value.startsWith("₹"))return false;
    if(!currency&&value.startsWith("₹"))return false;
    const unit=value.endsWith("%")?"%":value.endsWith("×")?"×":"";
    if((suffix==="x"?"×":suffix??"")!==unit)return false;
    return numeric(value.replace(/^₹/,"").replace(/[%×]$/, ""))===number;
   });
   return matches.length===1?`[F:${matches[0].id}]`:token;
  });
 }).join("");
}
/** Shape, fact references and numeric gates; these cannot prove semantic accuracy. */
export function validateNarrative(raw: unknown, evidence: Evidence): Narrative {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) reject("Invalid narrative structure");
  const input = raw as Record<string, unknown>;
  const factIds = new Set(evidence.facts.map(fact => fact.id));
  const aliases=new Map<string,string[]>();
  const aliasKey=(id:string)=>id.toLowerCase().replace(/[^a-z0-9]/g,"");
  for(const id of factIds){const key=aliasKey(id);aliases.set(key,[...(aliases.get(key)??[]),id]);}
  const normalise=(text:unknown)=>{
   if(typeof text!=="string")return text;
   const canonical=text.replace(/\[F:([a-zA-Z0-9_-]+)\]/g,(token,id:string)=>{
    if(factIds.has(id))return token;
    const matches=aliases.get(aliasKey(id));return matches?.length===1?`[F:${matches[0]}]`:token;
   });
   return bindLiteralFacts(normaliseLabels(canonical,factIds,evidence.context.timeframe),evidence);
  };
  const value:Record<string,unknown>={...input,
   headline:normalise(input.headline),overview:normalise(input.overview),conclusion:normalise(input.conclusion),
   layers:Array.isArray(input.layers)?input.layers.map(item=>item&&typeof item==="object"&&!Array.isArray(item)?{...item,explanation:normalise((item as Record<string,unknown>).explanation)}:item):input.layers,
  };
  const keys = ["headline", "overview", "layers", "conclusion"];
  if (Object.keys(value).some(key => !keys.includes(key)) || !Array.isArray(value.layers) || value.layers.length !== 6) reject("Invalid narrative structure");
  const seen = new Set<string>();
  let section="headline";
  function text(input: unknown, maximum: number, allowed?: string[]): string[] {
    if (typeof input !== "string" || input.trim().length < 10 || input.length > maximum || /https?:|www\.|<[^>]+>/i.test(input)) reject("Invalid narrative text");
    const tokens = [...input.matchAll(/\[F:([a-zA-Z0-9_]+)\]/g)].map(match => match[1]);
    if (tokens.some(id => !factIds.has(id))) reject("Unsupported evidence reference",section,"unknown_fact");
    const stripped = input.replace(/\[F:[a-zA-Z0-9_]+\]/g, "");
    if (/[\d\[\]]/.test(stripped)) reject("Numerical claims must use verified fact placeholders",section,/\d/.test(stripped)?"literal_number":"unrecognised_brackets");
    if (/guaranteed|sure profit|win rate|stop.hunt|insider|\b(buy|sell) now\b/i.test(stripped)) reject("Unsupported certainty or instruction");
    return tokens;
  }
  text(value.headline, 140);
  section="overview";
  const overviewRefs = text(value.overview, 2000);
  if (factIds.has("close") && !overviewRefs.includes("close")) reject("Overview must reference the completed close");
  section="conclusion";
  const conclusionRefs = text(value.conclusion, 1500);
  for (const id of ["support1", "resistance1"]) {
    if (factIds.has(id) && !conclusionRefs.includes(id)) reject("Conclusion must reference available structural boundaries");
  }
  const layers: Narrative["layers"] = value.layers.map((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) reject("Invalid layer structure");
    const layer = item as Record<string, unknown>;
    if (Object.keys(layer).some(key => !["id", "explanation", "evidenceIds"].includes(key)) ||
      typeof layer.id !== "string" || !IDS.includes(layer.id as typeof IDS[number]) || seen.has(layer.id) ||
      !Array.isArray(layer.evidenceIds) || layer.evidenceIds.some(id => typeof id !== "string")) reject("Invalid layer evidence");
    section=layer.id;
    // Derive metadata from validated inline references rather than trusting a second model-authored list.
    const ids = [...new Set(text(layer.explanation, 4000))];
    if (!ids.length) reject("Each layer must cite evidence in its explanation");
    if(layer.id==="structure")for(const key of ["hourly","daily","weekly","monthly"]){
      const id=`mtf_${key}_status`;
      if(factIds.has(id)&&!ids.includes(id))reject("Structure must reference each supplied timeframe classification",section);
    }
    if (/\btargets?\b|automatically\s+invalidat|would\s+invalidat/i.test(layer.explanation as string)) reject("Unsupported trade objective or automatic invalidation");
    const fibRefs = text(layer.explanation, 4000, ids).some(id => /^fib_\d+$/.test(id));
    if (fibRefs && factIds.has("fib_a") && factIds.has("fib_b") &&
      (!ids.includes("fib_a") || !ids.includes("fib_b") ||
       !(layer.explanation as string).includes("[F:fib_a]") || !(layer.explanation as string).includes("[F:fib_b]")))
      reject("Fibonacci claims must include both supplied anchors");
    seen.add(layer.id);
    return { id: layer.id, explanation: layer.explanation as string, evidenceIds: [...new Set(ids)] };
  });
  layers.sort((a, b) => IDS.indexOf(a.id as typeof IDS[number]) - IDS.indexOf(b.id as typeof IDS[number]));
  return { headline: value.headline as string, overview: value.overview as string, conclusion: value.conclusion as string, layers };
}
