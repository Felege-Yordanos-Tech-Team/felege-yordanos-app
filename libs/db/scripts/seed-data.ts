/**
 * Development seed data. Safe to commit: contains no real member data.
 * Departments, categories and songs come from supabase/migrations 003 and 005.
 */
export const seedDepartments = [
  {
    id: 1,
    nameEn: 'Planning, Implementation & Monitoring',
    nameAm: 'እቅድ ትግበራ እና ክትትል ክፍል',
  },
  {
    id: 2,
    nameEn: 'Education & Training',
    nameAm: 'ትምህርት እና ስልጠና ክፍል',
  },
  {
    id: 3,
    nameEn: 'Programs & Events',
    nameAm: 'መርሐ ግብር እና ጉባኤያት ክፍል',
  },
  {
    id: 4,
    nameEn: 'Human Resources / People Operations',
    nameAm: 'የሰው ሀብት አስተዳደር ክፍል',
  },
  {
    id: 5,
    nameEn: 'Information & Internal Communications',
    nameAm: 'የመረጃ እና ውስጥ ግንኙነት ክፍል',
  },
  {
    id: 6,
    nameEn: 'Songs & Celebrations',
    nameAm: 'የመዝሙር እና በዓላት ክፍል',
  },
  {
    id: 7,
    nameEn: 'Arts & Culture',
    nameAm: 'የኪነጥበብ እና ሥነጥበብ ክፍል',
  },
  {
    id: 8,
    nameEn: 'Development & Charity',
    nameAm: 'የልማት እና በጎ አድራጎት ክፍል',
  },
  {
    id: 9,
    nameEn: 'Budget & Asset Management',
    nameAm: 'የበጀት እና ንብረት አስተዳደር ክፍል',
  },
];

export const seedCategories = [
  {
    name: 'ምስጋና',
    emoji: '🙏',
    color: 'blue',
    sortOrder: 1,
  },
  {
    name: 'ዝማሬ',
    emoji: '🎵',
    color: 'purple',
    sortOrder: 2,
  },
  {
    name: 'ተስፋ',
    emoji: '✨',
    color: 'amber',
    sortOrder: 3,
  },
];

export const seedSongs = [
  {
    number: 1,
    title: 'እግዚአብሔር ታላቅ ነው',
    titleEn: 'God is Great',
    category: 'ምስጋና',
    lyrics:
      'እግዚአብሔር ታላቅ ነው\nስሙን እናመስግን\nበክብሩ የሞላ\nለዘላለም ይኑር\n\nሰማይና ምድር ያመሰግኑት\nፍጥረት ሁሉ ይውደሱት\nታላቅ ነው ታላቅ ነው\nአምላካችን ታላቅ ነው',
  },
  {
    number: 2,
    title: 'ቅዱስ ቅዱስ ቅዱስ',
    titleEn: 'Holy Holy Holy',
    category: 'ዝማሬ',
    lyrics:
      'ቅዱስ ቅዱስ ቅዱስ\nሁሉን ቻይ አምላክ\nማልዶ ማልዶ ዝማሬያችን\nወደ አንተ ይደርሳል\n\nቅዱስ ቅዱስ ቅዱስ\nምህረት የበዛ አምላክ\nሦስትነት አንድነት\nቅዱስ አምላክ',
  },
  {
    number: 3,
    title: 'ተስፋዬ አንተ ነህ',
    titleEn: 'You Are My Hope',
    category: 'ተስፋ',
    lyrics:
      'ተስፋዬ አንተ ነህ\nበጨለማ ብርሃኔ\nመንገዴን ታበራለህ\nዘላለም ተስፋዬ\n\nበችግር ጊዜ ረዳቴ\nበሐዘን ጊዜ መጽናኛዬ\nተስፋዬ አንተ ነህ\nአምላኬ ተስፋዬ',
  },
  {
    number: 4,
    title: 'ወደ አንተ እጮሃለሁ',
    titleEn: 'I Cry Out to You',
    category: 'ምስጋና',
    lyrics:
      'ወደ አንተ እጮሃለሁ\nጌታዬ ስማኝ\nልባዊ ጸሎቴን\nተቀበለኝ\n\nከጥልቅ ስፍራ\nድምፄን አሰማለሁ\nእግዚአብሔር ሆይ\nወደ አንተ እጮሃለሁ',
  },
  {
    number: 5,
    title: 'አዲስ ዝማሬ',
    titleEn: 'A New Song',
    category: 'ዝማሬ',
    lyrics:
      'አዲስ ዝማሬ እዘምራለሁ\nለአምላኬ ለፈጣሪዬ\nድንቅ ስራውን ሳስብ\nልቤ በደስታ ይሞላል\n\nአዲስ ዝማሬ አዲስ ውዳሴ\nለጌታ ለአምላኬ\nዛሬም ነገም ዘላለም\nእዘምርልሃለሁ',
  },
];
