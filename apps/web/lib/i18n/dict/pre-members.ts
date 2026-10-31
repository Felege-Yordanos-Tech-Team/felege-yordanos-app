/** Amharic for pre-members (ቅድመ አባላት), audience and pre-member check-in. */
export const preMembers: Record<string, string> = {
  // Names of things
  'Pre-member': 'ቅድመ አባል',
  'Pre-members': 'ቅድመ አባላት',
  'Members & pre-members': 'አባላትና ቅድመ አባላት',
  'Pre-member ID': 'የቅድመ አባል መታወቂያ',
  'Pre-member record': 'የቅድመ አባል መዝገብ',
  'Pre-member check-in QR code': 'የቅድመ አባል የመግቢያ QR ኮድ',
  'Check-in list': 'የመግቢያ ዝርዝር',

  // Audience (events and notices)
  'Who is it for?': 'ለማን ነው?',
  'Registered members only.': 'የተመዘገቡ አባላት ብቻ።',
  'Pre-members (ቅድመ አባላት) only.': 'ቅድመ አባላት ብቻ።',
  'Members and pre-members.': 'አባላትና ቅድመ አባላት።',
  'Choose who it is for.': 'ለማን እንደሆነ ይምረጡ።',
  'Filter by type': 'በዓይነት አጣራ',
  '{a} on time · {b} late · {c} absent': '{a} በሰዓቱ · {b} ያረፈዱ · {c} የቀሩ',

  // Statuses
  Active: 'ንቁ',
  Promoted: 'ወደ አባልነት የተዛወረ',
  Withdrawn: 'የወጣ',
  'Withdrawn / Rejected': 'የወጡ / ውድቅ የተደረጉ',
  Approved: 'ጸድቋል',
  Reinstated: 'ተመልሷል',
  'Account linked': 'መለያ ተገናኝቷል',
  'Account unlinked': 'የመለያው ግንኙነት ተቋርጧል',
  'Self-registered': 'በራሳቸው የተመዘገቡ',
  'Registered by an admin': 'በአስተዳዳሪ የተመዘገቡ',
  'Details changed': 'መረጃ ተቀይሯል',
  'Promoted to member': 'ወደ አባልነት ተዛውሯል',
  'Promotion undone': 'ዝውውሩ ተሰርዟል',

  // Admin list and details
  'People learning at the school who are not registered members yet':
    'በትምህርት ቤቱ የሚማሩ፣ ገና በአባልነት ያልተመዘገቡ ሰዎች',
  Register: 'መዝግብ',
  Registered: 'የተመዘገበበት',
  'Phone / email': 'ስልክ / ኢሜይል',
  'Name, ID, phone or email…': 'ስም፣ መታወቂያ፣ ስልክ ወይም ኢሜይል…',
  'Search pre-members': 'ቅድመ አባላትን ፈልግ',
  'No pre-members here yet.': 'እዚህ ገና ቅድመ አባላት የሉም።',
  'No pre-members match your search.': 'ከፍለጋዎ ጋር የሚዛመድ ቅድመ አባል የለም።',
  'Showing the first {n}. Search to narrow the list.':
    'የመጀመሪያዎቹ {n} ብቻ ይታያሉ። ዝርዝሩን ለማጥበብ ይፈልጉ።',
  'No ID yet': 'ገና መታወቂያ የለም',
  'No ID yet (assigned on approval)': 'ገና መታወቂያ የለም (ሲጸድቅ ይሰጣል)',
  'ID {code}': 'መታወቂያ {code}',
  'Member ID {id}': 'የአባል መታወቂያ {id}',
  'Promoted → {id}': 'ወደ አባልነት ተዛውሯል → {id}',
  "Father's name": 'የአባት ስም',
  "Grandfather's name": 'የአያት ስም',
  Note: 'ማስታወሻ',
  'Possible duplicates': 'ሊደገሙ የሚችሉ መዝገቦች',
  'Check these before approving. This is a warning, not a block.':
    'ከማጽደቅዎ በፊት እነዚህን ይመልከቱ። ይህ ማስጠንቀቂያ ብቻ ነው፤ አያግድም።',
  'same names': 'ተመሳሳይ ስሞች',
  'same phone': 'ተመሳሳይ ስልክ',
  'same email': 'ተመሳሳይ ኢሜይል',
  'This record is read-only since the promotion.':
    'ከአባልነት ዝውውሩ ወዲህ ይህ መዝገብ ለንባብ ብቻ ነው።',
  'No account linked. The pre-member signs up, then chooses “I am a ቅድመ አባል” on the link page and enters their ID; you approve it under Member links.':
    'ምንም መለያ አልተገናኘም። ቅድመ አባሉ ይመዘገባል፣ ከዚያም በማገናኛ ገጹ ላይ “ቅድመ አባል ነኝ” መርጦ መታወቂያውን ያስገባል፤ እርስዎ በአባልነት ማገናኛዎች ውስጥ ያጸድቃሉ።',
  Download: 'አውርድ',
  'Withdrawn: this code does not check in.': 'የወጣ፦ ይህ ኮድ ለመግቢያ አይሠራም።',
  'by {name}': 'በ{name}',
  'by the pre-member': 'በቅድመ አባሉ',
  'through the registration QR': 'በምዝገባ QR',
  'Back to {status}': 'ወደ «{status}» ተመልሷል',

  // Register (admin)
  'Register a pre-member': 'ቅድመ አባል መመዝገብ',
  'For walk-ins at the desk. Email and phone are optional here.':
    'በጠረጴዛው ለሚመጡ። እዚህ ኢሜይልና ስልክ አማራጭ ናቸው።',
  'Approve now': 'አሁኑኑ አጽድቅ',
  'The ID (FYP-…) is assigned at once. Untick to approve later.':
    'መታወቂያው (FYP-…) ወዲያውኑ ይሰጣል። በኋላ ለማጽደቅ ምልክቱን ያንሱ።',
  'Pre-member registered': 'ቅድመ አባል ተመዝግቧል',

  // Actions
  'Reject this registration?': 'ይህ ምዝገባ ውድቅ ይደረግ?',
  'No ID is given. You can reinstate it later.': 'መታወቂያ አይሰጥም። በኋላ መመለስ ይችላሉ።',
  'Edit details': 'መረጃ አስተካክል',
  'Changes are recorded in the history (old → new).':
    'ለውጦች በታሪኩ ውስጥ ይመዘገባሉ (የቀድሞ → አዲስ)።',
  'Unlink account': 'መለያ አላቅቅ',
  'Unlink the account?': 'መለያው ይላቀቅ?',
  'The person keeps their ID and QR but can no longer use the app with this account.':
    'ሰውየው መታወቂያውንና QR ኮዱን ይዞ ይቆያል፤ ነገር ግን በዚህ መለያ መተግበሪያውን መጠቀም አይችልም።',
  Withdraw: 'አስወጣ',
  'Withdraw this pre-member?': 'ይህ ቅድመ አባል ይውጣ?',
  'Their QR stops working and they lose access to the app. You can reinstate them later.':
    'QR ኮዳቸው መሥራት ያቆማል፤ መተግበሪያውንም መጠቀም አይችሉም። በኋላ መመለስ ይችላሉ።',
  Reinstate: 'መልስ',
  'Reinstate?': 'ይመለስ?',
  'Back to active, with the same ID and QR.': 'በዚያው መታወቂያና QR ወደ ንቁ ይመለሳል።',
  'Back to pending, to be approved again.':
    'እንደገና እንዲጸድቅ ወደ «በመጠባበቅ ላይ» ይመለሳል።',

  // Admin home
  'Register, approve and promote people who are not registered members yet.':
    'ገና በአባልነት ያልተመዘገቡ ሰዎችን ይመዝግቡ፣ ያጽድቁ፣ ወደ አባልነት ያዛውሩ።',
  'Manage pre-members': 'ቅድመ አባላትን አስተዳድር',

  // Server messages
  'Pre-member not found.': 'ቅድመ አባሉ አልተገኘም።',
  'This record was changed meanwhile. Reload and try again.':
    'ይህ መዝገብ በመሃል ተቀይሯል። ገጹን አድሰው እንደገና ይሞክሩ።',
  'Could not save. Please try again.': 'ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Could not approve. Please try again.': 'ማጽደቅ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'A promoted record cannot be changed.': 'ወደ አባልነት የተዛወረ መዝገብ መቀየር አይቻልም።',
  'This record has no linked account.': 'ይህ መዝገብ የተገናኘ መለያ የለውም።',
  'Note must be at most 300 characters.': 'ማስታወሻው ከ300 ፊደላት መብለጥ የለበትም።',
  'Name is required.': 'ስም ያስፈልጋል።',
  "Father's name is required.": 'የአባት ስም ያስፈልጋል።',
  "Grandfather's name is required.": 'የአያት ስም ያስፈልጋል።',
  'Name must be at most 60 characters.': 'ስም ከ60 ፊደላት መብለጥ የለበትም።',
  "Father's name must be at most 60 characters.":
    'የአባት ስም ከ60 ፊደላት መብለጥ የለበትም።',
  "Grandfather's name must be at most 60 characters.":
    'የአያት ስም ከ60 ፊደላት መብለጥ የለበትም።',
  'Enter a valid phone number.': 'ትክክለኛ ስልክ ቁጥር ያስገቡ።',
  'Enter a valid email address.': 'ትክክለኛ የኢሜይል አድራሻ ያስገቡ።',
  'This pre-member record is already linked to another account.':
    'ይህ የቅድመ አባል መዝገብ ቀድሞውኑ ከሌላ መለያ ጋር ተገናኝቷል።',
  'This account is already linked to a pre-member record.':
    'ይህ መለያ ቀድሞውኑ ከቅድመ አባል መዝገብ ጋር ተገናኝቷል።',
  'Linked to another account. Contact an admin if this is your ID.':
    'ከሌላ መለያ ጋር ተገናኝቷል። ይህ የእርስዎ መታወቂያ ከሆነ አስተዳዳሪን ያነጋግሩ።',

  // Check-in
  'Not part of this event.': 'የዚህ ዝግጅት አካል አይደሉም።',
  'Now a member. Please use the member QR.':
    'አሁን አባል ሆነዋል። እባክዎ የአባልነት QR ይጠቀሙ።',
  'This registration is not approved yet.': 'ይህ ምዝገባ ገና አልጸደቀም።',
  'This registration was rejected.': 'ይህ ምዝገባ ውድቅ ተደርጓል።',
  'This pre-member has been withdrawn.': 'ይህ ቅድመ አባል ወጥቷል።',
  'Pre-member ID not found': 'የቅድመ አባል መታወቂያው አልተገኘም',
  'Person not found.': 'ሰውየው አልተገኘም።',

  // Claim (/claim) and profile
  'I am a': 'እኔ',
  'I am a member': 'አባል ነኝ',
  'I am a ቅድመ አባል': 'ቅድመ አባል ነኝ',
  'Requested pre-member ID': 'የተጠየቀው የቅድመ አባል መታወቂያ',
  'Enter the pre-member ID you received by email, for example FYP-2019-0001. An admin confirms the link before it becomes active.':
    'በኢሜይል የደረሰዎትን የቅድመ አባል መታወቂያ ያስገቡ፤ ለምሳሌ FYP-2019-0001። ግንኙነቱ ከመሥራቱ በፊት አስተዳዳሪ ያረጋግጣል።',
  'An admin will confirm it soon. Your events and notices open once it is approved.':
    'አስተዳዳሪ በቅርቡ ያረጋግጣል። ከጸደቀ በኋላ የእርስዎ መርሃ ግብሮችና ማስታወቂያዎች ይከፈታሉ።',
  'This pre-member record is not active. Please ask a volunteer at the desk.':
    'ይህ የቅድመ አባል መዝገብ ንቁ አይደለም። እባክዎ በጠረጴዛው ያሉትን አገልጋዮች ይጠይቁ።',
  'Your account is linked to a pre-member record. An admin promotes it once you have a member ID.':
    'መለያዎ ከቅድመ አባል መዝገብ ጋር ተገናኝቷል። የአባልነት መታወቂያ ሲያገኙ አስተዳዳሪ ወደ አባልነት ያዛውረዋል።',
  'Pre-member ID not found. Please check your ID and try again.':
    'የቅድመ አባል መታወቂያው አልተገኘም። እባክዎ መታወቂያዎን አረጋግጠው እንደገና ይሞክሩ።',
  'This pre-member ID is already linked to another account. Contact an admin.':
    'ይህ የቅድመ አባል መታወቂያ ቀድሞውኑ ከሌላ መለያ ጋር ተገናኝቷል። አስተዳዳሪን ያነጋግሩ።',
  'This pre-member is now a member. Link your member ID instead.':
    'ይህ ቅድመ አባል አሁን አባል ሆኗል። በምትኩ የአባልነት መታወቂያዎን ያገናኙ።',
  'This pre-member ID is not active. Please ask a volunteer at the desk.':
    'ይህ የቅድመ አባል መታወቂያ ንቁ አይደለም። እባክዎ በጠረጴዛው ያሉትን አገልጋዮች ይጠይቁ።',
  'As registered for your pre-member ID. Changes are recorded.':
    'ለቅድመ አባልነት መታወቂያዎ እንደተመዘገበው። ለውጦች ይመዘገባሉ።',
  'Your details were updated.': 'መረጃዎ ተዘምኗል።',
};
