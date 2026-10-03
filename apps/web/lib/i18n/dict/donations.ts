/** Amharic for the donations screens (English text -> Amharic). */
export const donations: Record<string, string> = {
  // Member donate form
  'Submitting…': 'በማስገባት ላይ…',
  'File too large': 'ፋይሉ በጣም ትልቅ ነው',
  'Receipt must be under 5MB.': 'ደረሰኙ ከ5MB በታች መሆን አለበት።',
  Error: 'ስህተት',
  'Donation submitted': 'መዋጮው ገብቷል',
  'Your donation is pending verification.': 'መዋጮዎ ማረጋገጫ በመጠባበቅ ላይ ነው።',
  'No donations yet. Your giving history will appear here.':
    'እስካሁን መዋጮ የለም። የመዋጮ ታሪክዎ እዚህ ይታያል።',
  'No donations yet': 'እስካሁን መዋጮ የለም',
  Reason: 'ምክንያት',

  // Server messages (createDonation)
  'Enter a valid amount (up to 2 decimals).': 'ትክክለኛ መጠን ያስገቡ (እስከ 2 አስርዮሽ)።',
  'Amount must be greater than zero.': 'መጠኑ ከዜሮ በላይ መሆን አለበት።',
  'Amount must be at most 10,000,000 ETB.': 'መጠኑ ቢበዛ 10,000,000 ብር መሆን አለበት።',
  'Notes must be at most 500 characters.': 'ማስታወሻው ቢበዛ 500 ፊደላት መሆን አለበት።',
  'Invalid donation.': 'ልክ ያልሆነ መዋጮ።',
  'Could not upload the receipt.': 'ደረሰኙን መጫን አልተቻለም።',
  'Could not save your donation. Please try again.':
    'መዋጮዎን ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Could not submit your donation. Please try again.':
    'መዋጮዎን ማስገባት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Only images (JPG, PNG, WEBP, HEIC) and PDF files are allowed.':
    'ምስሎች (JPG፣ PNG፣ WEBP፣ HEIC) እና PDF ፋይሎች ብቻ ይፈቀዳሉ።',
  'File is larger than 5 MB.': 'ፋይሉ ከ5 MB በላይ ነው።',

  // Admin review queue
  Unknown: 'ያልታወቀ',
  donor: 'ለጋሽ',
  '{count} pending · {amount} awaiting review':
    '{count} በመጠባበቅ ላይ · {amount} ግምገማ እየጠበቀ',
  'No donations found': 'ምንም መዋጮ አልተገኘም',
  'Select a donation to review.': 'ለመገምገም መዋጮ ይምረጡ።',
  'Donation verified': 'መዋጮው ተረጋግጧል',
  'Donation rejected': 'መዋጮው ውድቅ ተደርጓል',
  'Reject donation': 'መዋጮውን ውድቅ አድርግ',
  "e.g. Receipt is unclear, amount doesn't match…":
    'ለምሳሌ፦ ደረሰኙ ግልጽ አይደለም፣ መጠኑ አይዛመድም…',
  'Rejecting…': 'ውድቅ በማድረግ ላይ…',

  // Server messages (verify / reject)
  'Something went wrong. Please try again.': 'የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።',
  'You do not have permission to do this.': 'ይህን ለማድረግ ፈቃድ የለዎትም።',
  'Please give a reason for rejecting this donation.':
    'እባክዎ መዋጮውን ውድቅ የሚያደርጉበትን ምክንያት ይግለጹ።',
  'Reason must be at most 500 characters.': 'ምክንያቱ ቢበዛ 500 ፊደላት መሆን አለበት።',
  'Invalid reason.': 'ልክ ያልሆነ ምክንያት።',
  'Donation not found.': 'መዋጮው አልተገኘም።',
  'This donation is already verified.': 'ይህ መዋጮ አስቀድሞ ተረጋግጧል።',
  'This donation is already rejected.': 'ይህ መዋጮ አስቀድሞ ውድቅ ተደርጓል።',
  'This donation was already reviewed by someone else.':
    'ይህ መዋጮ አስቀድሞ በሌላ ሰው ተገምግሟል።',
};
