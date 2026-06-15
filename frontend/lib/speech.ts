let currentAudio: HTMLAudioElement | null = null
let isMuted = false
let lastRequestId = 0

export const setMuted = (val: boolean) => { isMuted = val }

const TRANSLATIONS: Record<string, Record<string, string>> = {
  english: {
    same_code: "Did you... submit the same code again? Hoping it would fix itself? It did not.",
    empty_code: "There is nothing here bhai. You submitted air. Actual air.",
    click_logo: "Stop clicking me, I am not a toy, fr fr 💀",
    konami: "You really just tried the Konami code on a code editor bro. Seek help immediately.",
    score_zero: "Zero out of hundred. ZERO. I have never seen this in my life.",
    score_100: "Actual W code. Screenshot this. Frame it. Hang it on your wall.",
    copy_code: "Copied. Now go paste it and pretend you wrote it.",
    gender_egg: "Bhai, choose one. Do you listen to both?",
  },
  hinglish: {
    same_code: "Bhai... firse wahi code submit kar diya? Kya laga, khud theek ho jayega? Bilkul nahi.",
    empty_code: "Kuch bhi nahi hai yahan bhai. Khali hawa submit kar di tune.",
    click_logo: "Bhai baar baar click mat kar, khilona nahi hu main fr fr 💀",
    konami: "Bhai sach me tune code editor pe Konami code try kiya? Dimag ka ilaaj karwa jaldi.",
    score_zero: "Zero out of hundred. ZERO. Bhai aisa ganda code maine aaj tak nahi dekha.",
    score_100: "Ekdum W code bhai! Screenshot le, print nikal, aur ghar ke deewar pe taang de.",
    copy_code: "Copy kar liya. Ab paste karke aise pretend kar jaise tune hi likha ho.",
    gender_egg: "Bhai choose kar ek. Dono sunta hai kya tu?",
  },
  banglish: {
    same_code: "Bhai... abar same code submit korli? Bhabli nijebete thik hoye jabe? Hobe na.",
    empty_code: "Ekhane toh kichui nei bhai. Tui toh shudhu hawa submit korechis.",
    click_logo: "Bhai bar bar click koris na, ami khelna noi fr fr 💀",
    konami: "Tui shotti code editor-e Konami code try korli? Taratari doctor dekhabi bhai.",
    score_zero: "Zero out of hundred. SHUNNO. Bhai erom baje code ami jiboneo dekhi ni.",
    score_100: "Sotti W code bhai! Ekta screenshot ne, frame kor, aar dewal-e tangiye de.",
    copy_code: "Copy kora hoyeche. Ebar paste kore emon bhab ne jeno tui-i likhechis.",
    gender_egg: "Bhai ekta choose kor. Dutoই shonish naki tui?",
  },
  bhojpuri: {
    same_code: "Arey babua... fir se ohi code bhej delu? Sochlu ki apne se thik ho jayi? E na hoi.",
    empty_code: "Ehaan kucho naikhe bhaiya. Pura khali hawa bhej delu tu.",
    click_logo: "Babua baar baar click mat kara, hum khilona naikhi fr fr 💀",
    konami: "Arey baap re baap, code editor pa Konami code daal delu? Dimaag theek kara apna jaldi.",
    score_zero: "Sau me se zero. ANDA. Aisan raddi code hum kabo naikhi dekhle.",
    score_100: "Pura ek number code ba babua! Screenshot le la, frame kara ke deewar pa taang da.",
    copy_code: "Copy ho gail. Ab jaa ke paste kara aur aisan dikhava ki tuhi likhle raha.",
    gender_egg: "Bhaiya ekgo choose kara. Dono sunela ka tu?",
  },
  marathi: {
    same_code: "मित्रा... पुन्हा तोच कोड सबमिट केलास? वाटलं स्वतःहून ठीक होईल? अजिबात नाही.",
    empty_code: "इथे काहीच नाहीये भाऊ. तू नुसती हवा सबमिट केली आहेस.",
    click_logo: "भाऊ मला वारंवार क्लिक करू नकोस, मी खेळणं नाहीये fr fr 💀",
    konami: "भाऊ, तू खरंच कोड एडिटरवर कोनामी कोड ट्राय केलास? लवकर इलाज करून घे स्वतःवर.",
    score_zero: "शंभर पैकी शून्य. ZERO. असा घाणेरडा कोड मी माझ्या आयुष्यात कधीच नाही पाहिला.",
    score_100: "एकदम W कोड मित्रा! स्क्रीनशॉट घे, फ्रेम कर, आणि भिंतीवर टांगून ठेव.",
    copy_code: "कॉपी केलाय. आता पेस्ट कर आणि असं दाखव की तूच लिहिलायस.",
    gender_egg: "भाऊ एक निवड. दोन्ही ऐकतोस का तू?",
  },
  tamil: {
    same_code: "தம்பி... மறுபடியும் அதே கோட சப்மிட் பண்றியா? அதுவே சரியாயிடும்னு நெனச்சியா? வாய்ப்பே இல்ல.",
    empty_code: "இங்க ஒண்ணume இல்ல தம்பி. வெறும் காத்தை சப்மிட் பண்ணிருக்க.",
    click_logo: "என்னை சும்மா சும்மா கிளிக் பண்ணாத, நான் ஒன்னும் பொம்மை இல்ல fr fr 💀",
    konami: "தம்பி, நீ நிஜமாவே கோடு எடிட்டர்ல கொனாமி கோட ட்ரை பண்ணியா? போய் உடனே ட்ரீட்மென்ட் எடு.",
    score_zero: "நூத்துக்கு ஜீரோ. ZERO. இப்படி ஒரு கேவலமான கோட என் வாழ்க்கையில பார்த்ததே இல்ல.",
    score_100: "செம்ம W கோடு தம்பி! ஸ்கிரீன்ஷாட் எடுத்து, பிரேம் பண்ணி, செவத்துல மாட்டி வை.",
    copy_code: "காப்பி பண்ணியாச்சு. இப்போ போய் பேஸ்ட் பண்ணிட்டு நீ தான் எழுதின மாதிரி சீன் போடு.",
    gender_egg: "தம்பி ஏதாவது ஒன்னு சூஸ் பண்ணு. ரெண்டையுமே கேப்பியா நீ?",
  },
  british: {
    same_code: "Did you... submit the same code again? Hoping it would mend itself? It did not.",
    empty_code: "There is absolutely nothing here, mate. You've submitted thin air. Literal air.",
    click_logo: "Stop clicking me, I am not a toy, bloody hell 💀",
    konami: "You actually just tried the Konami code on a code editor, mate? Blimey, seek help immediately.",
    score_zero: "Zero out of a hundred. Absolute rubbish. I have never seen such a shambles in my life.",
    score_100: "Bloody brilliant code! Take a screenshot, frame it, and hang it on your mantlepiece.",
    copy_code: "Copied. Now go paste it and pretend you wrote it yourself, cheers.",
    gender_egg: "Mate, choose one. Do you listen to both?",
  }
}

export const getTranslatedText = (key: string, lang: string): string => {
  const langKey = TRANSLATIONS[lang] ? lang : "english"
  return TRANSLATIONS[langKey][key] || TRANSLATIONS["english"][key] || ""
}

/**
 * Fetch a fresh AI-generated idle roast from the backend.
 * Falls back to a generic message if the API call fails.
 */
export const fetchIdleRoast = async (lang: string): Promise<string> => {
  try {
    const res = await fetch(`/api/idle-roast?lang=${encodeURIComponent(lang)}`)
    if (res.ok) {
      const data = await res.json()
      return data.text || "Hello? Your code is rotting while you're gone."
    }
  } catch (err) {
    console.error("Failed to fetch idle roast:", err)
  }
  // Multiple creative fallbacks per language to prevent repetition
  const fallbacks: Record<string, string[]> = {
    english: [
      "Ayo, are you alive? Your code is still broken and waiting for you.",
      "Hello? Your code is not going to fix itself. Trust me, I tried.",
      "Still here? Or did you go fetch some talent?",
      "Your code is crying in the corner. Come back.",
    ],
    hinglish: [
      "Bhai zinda hai? Code abhi bhi toota hua hai idhar.",
      "Bhai kidhar gaya? Apne aap code theek nahi hone wala, maine try kiya tha.",
      "Kya bhai, chai peene gaya kya? Code tera ro raha hai.",
      "Bhai aaja, code dekh ke meri aankhein dukh rahi hain.",
    ],
    banglish: [
      "Ki re bhai, benche achis? Code ekhono bhanga pore ache.",
      "Ki re bhai, kothay geli? Code nijer theke thik hobe na, ami try korechi.",
      "Bhai cha khete geli naki? Erom baje code eka rekhe jas na.",
    ],
    bhojpuri: [
      "Babua kahan gailu? Code abhi bhi tootal ba idhar.",
      "Arre bhaiya, kahan gailu? Apne se code na sudhari, hum dekh chuki bani.",
      "Babua aaja ho, aisan code likh ke kahan bhag gailu?",
    ],
    marathi: [
      "भाऊ जिवंत आहेस का? कोड अजूनही तुटलेला आहे.",
      "अरे मित्रा, कुठे गेलायस? कोड स्वतःहून दुरुस्त होणार नाही, मी प्रयत्न करून पाहिलाय.",
      "भाऊ, चहा प्यायला गेला का? इकडे कोड तुटलेला पडलाय.",
    ],
    tamil: [
      "தம்பி உயிரோட இருக்கியா? கோட இன்னும் உடைஞ்சி கிடக்கு.",
      "என்ன தம்பி, எங்க போய்ட்ட? கோடு தானா சரியாகாது, நான் முயற்சி பண்ணி பாத்துட்டேன்.",
      "தம்பி, டீ குடிக்க போயிட்டியா? கோடு இங்க அழுதுகிட்டு இருக்கு.",
    ],
    british: [
      "Mate, you still about? Your code is still an absolute shambles.",
      "Hello? Are you still there, mate? Your code is not going to fix itself. Trust me, I've tried.",
      "Gone for a cuppa, have we? Leaving this absolute bin fire behind?",
    ],
  }
  const choices = fallbacks[lang] || fallbacks["english"]
  const randomIndex = Math.floor(Math.random() * choices.length)
  return choices[randomIndex]
}

export const speak = async (text: string, lang: string = "english", gender: string = "male") => {
  if (isMuted || !text) return

  // Stop anything currently playing
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  // Increment request ID to invalidate any pending fetch requests
  const requestId = ++lastRequestId

  try {
    const res = await fetch(
      `/api/speak?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&gender=${gender}`,
      { method: "POST" }
    )
    
    // If a newer speak request has been made, discard this one
    if (requestId !== lastRequestId) {
      return
    }

    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    
    // Double check again after blob parsing
    if (requestId !== lastRequestId) {
      URL.revokeObjectURL(url)
      return
    }

    currentAudio = new Audio(url)
    currentAudio.play()
    currentAudio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio?.src === url) {
        currentAudio = null
      }
    }
  } catch (err) {
    console.error("Speech failed:", err)
  }
}

export const speakKey = (key: string, lang: string, gender: string = "male") => {
  const text = getTranslatedText(key, lang)
  return speak(text, lang, gender)
}

/**
 * Fetch a fresh AI-generated idle message and speak it aloud.
 */
export const speakIdle = async (lang: string, gender: string = "male") => {
  const text = await fetchIdleRoast(lang)
  return speak(text, lang, gender)
}

export const speakRoast = (roast: string, lang: string, gender: string = "male") =>
  speak(roast, lang, gender)

export const speakError = (msg: string, lang: string, gender: string = "male") =>
  speak(msg, lang, gender)

export const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}
