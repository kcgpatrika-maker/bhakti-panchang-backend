const bhaktiMaster = {

  // ====== 1–5 ======
  shiv: {
    id: "shiv",
    name: "भगवान शिव",
    category: "देव",
    mantra: ["ॐ नमः शिवाय"],
    aarti: `जय शिव ओंकारा, ॐ जय शिव ओंकारा।
ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धारा॥`,
    chalisa: `जय गिरिजा पति दीन दयाला।
सदा करत सन्तन प्रतिपाला॥`,
    stotra: `वन्दे देवमुमापतिं सुरगुरुं वन्दे जगत्कारणम्।`,
    puja_vidhi: `जल, बेलपत्र, भस्म अर्पण करें।
मंत्र जप करें।
शिव आरती करें।`
  },

  hanuman: {
    id: "hanuman",
    name: "हनुमान जी",
    category: "देव",
    mantra: ["ॐ नमो भगवते हनुमते नमः"],
    aarti: `आरती कीजै हनुमान लला की।
दुष्ट दलन रघुनाथ कला की॥`,
    chalisa: `श्रीगुरु चरण सरोज रज,
निज मनु मुकुरु सुधारि॥`,
    stotra: "",
    puja_vidhi: `मंगल/शनिवार सिंदूर चढ़ाएं।
चालीसा पाठ करें।`
  },

  ram: {
    id: "ram",
    name: "श्रीराम",
    category: "देव",
    mantra: ["ॐ श्री रामाय नमः"],
    aarti: `श्री रामचन्द्र कृपालु भजु मन।
हरण भव भय दारुणम्॥`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `तुलसी पत्र अर्पण।
राम नाम जप।`
  },

  krishna: {
    id: "krishna",
    name: "श्रीकृष्ण",
    category: "देव",
    mantra: ["ॐ नमो भगवते वासुदेवाय"],
    aarti: `आरती कुंजबिहारी की।
श्री गिरिधर कृष्ण मुरारी की॥`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `तुलसी दल, माखन-मिश्री भोग।`
  },

  ganesh: {
    id: "ganesh",
    name: "श्री गणेश",
    category: "देव",
    mantra: ["ॐ गं गणपतये नमः"],
    aarti: `जय गणेश जय गणेश जय गणेश देवा।
माता जाकी पार्वती पिता महादेवा॥`,
    chalisa: `जय गणपति सद्गुण सदन।
कविवर बदन कृपालु॥`,
    stotra: "",
    puja_vidhi: `दूर्वा, मोदक अर्पित करें।`
  },

  // ====== 6–15 ======
  durga: {
    id: "durga",
    name: "माता दुर्गा",
    category: "देवी",
    mantra: ["ॐ दुं दुर्गायै नमः"],
    aarti: `जय अम्बे गौरी, मैया जय श्यामा गौरी।`,
    chalisa: `नमो नमो दुर्गे सुख करनी।`,
    stotra: `या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता।`,
    puja_vidhi: `लाल पुष्प, दीप, दुर्गा सप्तशती।`
  },

  lakshmi: {
    id: "lakshmi",
    name: "माता लक्ष्मी",
    category: "देवी",
    mantra: ["ॐ श्रीं महालक्ष्म्यै नमः"],
    aarti: `ॐ जय लक्ष्मी माता।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `कमल पुष्प, खीर भोग।`
  },

  saraswati: {
    id: "saraswati",
    name: "माता सरस्वती",
    category: "देवी",
    mantra: ["ॐ ऐं सरस्वत्यै नमः"],
    aarti: `जय सरस्वती माता।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `पुस्तक, वीणा पूजन।`
  },

  kali: {
    id: "kali",
    name: "माता काली",
    category: "देवी",
    mantra: ["ॐ क्रीं कालिकायै नमः"],
    aarti: `जय काली माता।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `रात्रि पूजन, दीप प्रज्वलन।`
  },

  parvati: {
    id: "parvati",
    name: "माता पार्वती",
    category: "देवी",
    mantra: ["ॐ पार्वत्यै नमः"],
    aarti: "",
    chalisa: "",
    stotra: "",
    puja_vidhi: `शिव संग पूजन।`
  },

  // ====== 16–25 ======
  vishnu: {
    id: "vishnu",
    name: "भगवान विष्णु",
    category: "देव",
    mantra: ["ॐ नमो नारायणाय"],
    aarti: `ॐ जय जगदीश हरे।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `पीत वस्त्र, तुलसी।`
  },

  shani: {
    id: "shani",
    name: "शनि देव",
    category: "देव",
    mantra: ["ॐ शं शनैश्चराय नमः"],
    aarti: `जय जय श्री शनिदेव।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `शनिवार तिल तेल दीप।`
  },

  surya: {
    id: "surya",
    name: "सूर्य देव",
    category: "देव",
    mantra: ["ॐ घृणि सूर्याय नमः"],
    aarti: `जय जय सूर्य देव।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `प्रातः जल अर्घ्य।`
  },

  chandra: {
    id: "chandra",
    name: "चंद्र देव",
    category: "देव",
    mantra: ["ॐ सोम सोमाय नमः"],
    aarti: "",
    chalisa: "",
    stotra: "",
    puja_vidhi: `दूध, श्वेत पुष्प।`
  },

  kubera: {
    id: "kubera",
    name: "कुबेर",
    category: "देव",
    mantra: ["ॐ यक्षाय कुबेराय नमः"],
    aarti: "",
    chalisa: "",
    stotra: "",
    puja_vidhi: `धन स्थान पूजन।`
  },

  // ====== 26–35 ======
  navagraha: {
    id: "navagraha",
    name: "नवग्रह",
    category: "देव",
    mantra: ["ॐ नवग्रहाय नमः"],
    aarti: "",
    chalisa: "",
    stotra: "",
    puja_vidhi: `नवग्रह शांति।`
  },

  dattatreya: {
    id: "dattatreya",
    name: "दत्तात्रेय",
    category: "देव",
    mantra: ["ॐ द्रां दत्तात्रेयाय नमः"],
    aarti: "",
    chalisa: "",
    stotra: "",
    puja_vidhi: `गुरु पूजन।`
  },

  sai: {
    id: "sai",
    name: "साईं बाबा",
    category: "संत",
    mantra: ["ॐ साईं राम"],
    aarti: `जय साईं राम।`,
    chalisa: "",
    stotra: "",
    puja_vidhi: `धूप, दीप, श्रद्धा।`
  },

  tulsi: {
    id: "tulsi",
    name: "तुलसी माता",
    category: "देवी",
    mantra: ["ॐ तुलस्यै नमः"],
    aarti: "",
    chalisa: "",
    stotra: "",
    puja_vidhi: `संध्या पूजन।`
  }

};

export default bhaktiMaster;
