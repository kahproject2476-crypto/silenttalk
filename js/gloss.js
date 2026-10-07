/** English gloss and Tulu line for each class in video_features. */
export const GLOSS = {
  alright: { en: "Alright", tulu: "ಆಂಡ್" },
  friday: { en: "Friday", tulu: "ಶುಕ್ರವಾರ" },
  friend: { en: "Friend", tulu: "ಗೆಳಯೆ" },
  good_afternoon: { en: "Good afternoon", tulu: "ಎಡ್ಡೆ ಮಧ್ಯಾಹ್ನ" },
  good_morning: { en: "Good morning", tulu: "ಎಡ್ಡೆ ಕಾಂಡೆ" },
  hello: { en: "Hello", tulu: "ನಮಸ್ಕಾರ" },
  hour: { en: "Hour", tulu: "ಗಂಟೆ" },
  how_are_you: { en: "How are you?", tulu: "ಎಂಚ ಉಲ್ಲರ್?" },
  i: { en: "I", tulu: "ಯಾನ್" },
  minute: { en: "Minute", tulu: "ನಿಮಿಷ" },
  monday: { en: "Monday", tulu: "ಸೋಮವಾರ" },
  month: { en: "Month", tulu: "ತಿಂಗೊಲು" },
  saturday: { en: "Saturday", tulu: "ಶನಿವಾರ" },
  sunday: { en: "Sunday", tulu: "ಐತಾರ" },
  thursday: { en: "Thursday", tulu: "ಗುರುವಾರ" },
  today: { en: "Today", tulu: "ಇನಿ" },
  tomorrow: { en: "Tomorrow", tulu: "ಎನ್ನೆ" },
  tuesday: { en: "Tuesday", tulu: "ಅಂಗಾರೆ" },
  wednesday: { en: "Wednesday", tulu: "ಬುಧವಾರ" },
  week: { en: "Week", tulu: "ವಾರ" },
  year: { en: "Year", tulu: "ವರ್ಸ" },
  yesterday: { en: "Yesterday", tulu: "ನೇನ" },
  you: { en: "You", tulu: "ಈರ್" }
};

export function glossOf(id) {
  return GLOSS[id] || { en: id, tulu: id };
}
