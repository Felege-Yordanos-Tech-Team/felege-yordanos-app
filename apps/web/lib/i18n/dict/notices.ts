/** Amharic for the notice board (English text -> Amharic). */
export const notices: Record<string, string> = {
  // Board and cards
  Everyone: 'ለሁሉም',
  Expired: 'ጊዜው ያለፈ',
  'Show less': 'አሳንስ',
  'No notices for this department.': 'ለዚህ ክፍል ማስታወቂያ የለም።',

  // Admin list
  'Manage notices': 'ማስታወቂያዎችን አስተዳድር',
  'Post announcements for everyone or for your department.':
    'ለሁሉም ወይም ለክፍልዎ ማስታወቂያ ያውጡ።',
  'Post announcements for everyone or for any department.':
    'ለሁሉም ወይም ለማንኛውም ክፍል ማስታወቂያ ያውጡ።',
  'Post announcements for your department.': 'ለክፍልዎ ማስታወቂያ ያውጡ።',
  'No notices yet. Post the first one.':
    'እስካሁን ማስታወቂያ የለም። የመጀመሪያውን ያውጡ።',
  'Delete notice': 'ማስታወቂያ ሰርዝ',
  'Notice deleted': 'ማስታወቂያው ተሰርዟል',

  // Form
  'Edit notice': 'ማስታወቂያ አስተካክል',
  For: 'ለማን',
  'Show until': 'እስከ መቼ ይታይ',
  'Members no longer see it after this day.':
    'ከዚህ ቀን በኋላ አባላት አያዩትም።',
  Image: 'ምስል',
  'Current image': 'አሁን ያለው ምስል',
  'Add an image': 'ምስል ያክሉ',
  'JPG, PNG or WEBP · max 5 MB': 'JPG፣ PNG ወይም WEBP · ቢበዛ 5 MB',
  'Pin to the top': 'ከላይ ሰካ',
  'Pinned notices stay above the others; the newest is featured.':
    'የተሰኩ ማስታወቂያዎች ከሌሎቹ በላይ ይቆያሉ፤ አዲሱ በዋናነት ይታያል።',
  'Notice posted': 'ማስታወቂያው ወጥቷል',
  'Notice updated': 'ማስታወቂያው ተዘምኗል',

  // Server action messages (shown in toasts)
  'Message is required.': 'መልዕክት ያስፈልጋል።',
  'Title must be at most 120 characters.': 'ርዕሱ ከ120 ፊደላት መብለጥ የለበትም።',
  'Message must be at most 4000 characters.':
    'መልዕክቱ ከ4000 ፊደላት መብለጥ የለበትም።',
  'Choose a department.': 'ክፍል ይምረጡ።',
  'Enter a valid date.': 'ትክክለኛ ቀን ያስገቡ።',
  'The end date cannot be in the past.': 'የማብቂያ ቀኑ ያለፈ ቀን መሆን አይችልም።',
  'Notice not found.': 'ማስታወቂያው አልተገኘም።',
  'Only JPG, PNG and WEBP images are allowed.':
    'የሚፈቀዱት JPG፣ PNG እና WEBP ምስሎች ብቻ ናቸው።',
  'Image is larger than 5 MB.': 'ምስሉ ከ5 MB ይበልጣል።',
  'Could not upload the image.': 'ምስሉን መጫን አልተቻለም።',
};
