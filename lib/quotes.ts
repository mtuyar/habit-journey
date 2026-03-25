export const ISLAMIC_QUOTES = [
  "Her zorlukla beraber bir kolaylık vardır. (İnşirah Suresi)",
  "İnsan için ancak çalıştığının karşılığı vardır. (Necm Suresi)",
  "İki nimet vardır ki insanların çoğu o konuda aldanmıştır: Sağlık ve boş vakit. (Hadis-i Şerif)",
  "Allah sabredenlerle beraberdir. (Bakara Suresi)",
  "Kalpler ancak Allah'ı anmakla huzur bulur. (Rad Suresi)",
  "Geçmişin keşkeleri ve geleceğin endişeleri şu anınızı çalmasın. (İmam Gazali)",
  "Vaktin kadrini bilen, ömrün bereketini görür.",
  "Zorluklar, Allah'ın seni daha güçlü bir sen yapma şeklidir.",
  "Ertelemek, zamanın hırsızıdır.",
  "Büyük hedeflere küçük ama sürekli adımlarla ulaşılır.",
  "Günlerini değerlendiren, yıllarını inşa eder."
];

export function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * ISLAMIC_QUOTES.length);
  return ISLAMIC_QUOTES[randomIndex];
}
