/** Amharic for the people screens (English text -> Amharic). */
export const people: Record<string, string> = {
  // Common actions and toasts
  Error: 'ስህተት',
  Saved: 'ተቀምጧል',
  Updated: 'ተዘምኗል',
  'Saving…': 'በማስቀመጥ ላይ…',
  'Save changes': 'ለውጦችን አስቀምጥ',
  'Try again': 'እንደገና ይሞክሩ',
  'Invalid input.': 'ልክ ያልሆነ ግብዓት።',
  'You do not have permission to do this.': 'ይህን ለማድረግ ፈቃድ የለዎትም።',

  // Profile
  'Your profile has been updated.': 'መገለጫዎ ተዘምኗል።',
  'Display name must be at most 100 characters.':
    'የሚታይ ስም ከ100 ፊደላት መብለጥ የለበትም።',
  'Enter your name': 'ስምዎን ያስገቡ',
  'Signing out…': 'በመውጣት ላይ…',
  Link: 'አገናኝ',
  'Link your member profile': 'የአባልነት መለያዎን ያገናኙ',
  'Required to get your check-in QR code': 'የመግቢያ QR ኮድ ለማግኘት ያስፈልጋል',
  'Link your member profile to get a check-in QR code.':
    'የመግቢያ QR ኮድ ለማግኘት የአባልነት መለያዎን ያገናኙ።',
  'Member check-in QR code': 'የአባል የመግቢያ QR ኮድ',
  'My check-in code': 'የእኔ የመግቢያ ኮድ',
  'QR not ready': 'QR ኮዱ ገና አልተዘጋጀም',
  'Save failed': 'ማስቀመጥ አልተሳካም',
  'Share failed': 'ማጋራት አልተሳካም',
  'Sharing…': 'በማጋራት ላይ…',
  'Copied to clipboard': 'ተቀድቷል',

  // Claim (link member record)
  'Enter your Sunday School member ID to connect your account with your existing member record.':
    'መለያዎን ካለው የአባልነት መዝገብዎ ጋር ለማገናኘት የሰንበት ትምህርት ቤት የአባልነት መታወቂያዎን ያስገቡ።',
  'Member ID': 'የአባልነት መታወቂያ',
  'e.g. {id}': 'ለምሳሌ፦ {id}',
  'Link member record': 'የአባል መዝገብ አገናኝ',
  'Linking…': 'በማገናኘት ላይ…',
  'Skip for now': 'ለአሁን ይዝለሉ',
  'Profile linked!': 'መገለጫዎ ተገናኝቷል!',
  'Welcome, {name}!': 'እንኳን ደህና መጡ፣ {name}!',
  'Failed to link your profile. Please try again.':
    'መገለጫዎን ማገናኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Please enter your member ID.': 'እባክዎ የአባልነት መታወቂያዎን ያስገቡ።',
  'Member ID not found. Please check your ID and try again.':
    'የአባልነት መታወቂያው አልተገኘም። እባክዎ መታወቂያዎን አረጋግጠው እንደገና ይሞክሩ።',
  'This member ID is already linked to another account. Contact an admin.':
    'ይህ የአባልነት መታወቂያ ቀድሞ ከሌላ መለያ ጋር ተገናኝቷል። አስተዳዳሪን ያነጋግሩ።',
  'Your account is already linked to a member record. Contact an admin.':
    'መለያዎ ቀድሞ ከአባል መዝገብ ጋር ተገናኝቷል። አስተዳዳሪን ያነጋግሩ።',

  // Manage users
  'Access denied': 'መዳረሻ ተከልክሏል',
  'Only super admins can manage user roles.':
    'የተጠቃሚ ሚናዎችን ማስተዳደር የሚችሉት ዋና አስተዳዳሪዎች ብቻ ናቸው።',
  'Assign roles and departments · super admin only':
    'ሚናዎችንና ክፍሎችን ይመድቡ · ለዋና አስተዳዳሪ ብቻ',
  'Search users': 'ተጠቃሚዎችን ፈልግ',
  'Search by name or email…': 'በስም ወይም በኢሜይል ፈልግ…',
  'No users found': 'ምንም ተጠቃሚ አልተገኘም',
  User: 'ተጠቃሚ',
  'Edit user': 'ተጠቃሚውን አስተካክል',
  'Edit user role': 'የተጠቃሚ ሚና አስተካክል',
  'Select department': 'ክፍል ይምረጡ',
  '{name} is now {role}.': '{name} አሁን {role} ነው።',
  'You cannot remove your own super admin role.':
    'የራስዎን የዋና አስተዳዳሪ ሚና ማስወገድ አይችሉም።',
  'User not found.': 'ተጠቃሚው አልተገኘም።',
  'Department not found.': 'ክፍሉ አልተገኘም።',
  'A department is required for department heads.':
    'ለክፍል ኃላፊዎች ክፍል መመደብ ያስፈልጋል።',
  'Invalid role.': 'ልክ ያልሆነ ሚና።',
  'Invalid department.': 'ልክ ያልሆነ ክፍል።',

  // Notices
  'Announcements from the parish council and departments will appear here.':
    'ከሰበካ ጉባኤው እና ከክፍሎች የሚተላለፉ ማስታወቂያዎች እዚህ ይታያሉ።',

  // Member links (claim requests and admin approval)
  'Request sent': 'ጥያቄው ተልኳል',
  'An admin will confirm it soon.': 'አስተዳዳሪ በቅርቡ ያረጋግጣል።',
  'Your account is linked': 'መለያዎ ተገናኝቷል',
  'Go to dashboard': 'ወደ ዋና ገጽ',
  'Waiting for approval': 'ማረጋገጫ በመጠባበቅ ላይ',
  'Requested member ID': 'የተጠየቀው የአባልነት መለያ',
  'An admin will confirm it soon. Events and donations open once it is approved.':
    'አስተዳዳሪ በቅርቡ ያረጋግጣል። ከጸደቀ በኋላ መርሃ ግብሮች እና መዋጮዎች ይከፈታሉ።',
  'Cancel request': 'ጥያቄውን ሰርዝ',
  'Open the songbook meanwhile': 'እስከዚያው መዝሙር ይክፈቱ',
  'Link your member ID first to use events and donations.':
    'መርሃ ግብሮችን እና መዋጮዎችን ለመጠቀም መጀመሪያ የአባልነት መለያዎን ያገናኙ።',
  'Your last request was not approved': 'የመጨረሻው ጥያቄዎ አልጸደቀም',
  'Enter your Sunday School member ID. You can type just the number, for example 42. An admin confirms the link before it becomes active.':
    'የሰንበት ትምህርት ቤት የአባልነት መለያዎን ያስገቡ። ቁጥሩን ብቻ (ለምሳሌ 42) መጻፍ ይችላሉ። ማገናኛው ከመሥራቱ በፊት አስተዳዳሪ ያረጋግጣል።',
  'Sending…': 'በመላክ ላይ…',
  'Request link': 'ማገናኛ ጠይቅ',
  'Your account is already linked to a member record.':
    'መለያዎ አስቀድሞ ከአባልነት መዝገብ ጋር ተገናኝቷል።',
  'An admin will confirm your member link soon.':
    'አስተዳዳሪ የአባልነት ማገናኛዎን በቅርቡ ያረጋግጣል።',
  'Required for events and donations': 'ለመርሃ ግብሮች እና ለመዋጮዎች ያስፈልጋል',
  View: 'ይመልከቱ',
  'Only admins can approve member links.':
    'የአባልነት ማገናኛዎችን ማጽደቅ የሚችሉት አስተዳዳሪዎች ብቻ ናቸው።',
  'Confirm which account belongs to which member':
    'የትኛው መለያ የየትኛው አባል እንደሆነ ያረጋግጡ',
  'Confirm which account belongs to which registered member.':
    'የትኛው መለያ የየትኛው የተመዘገበ አባል እንደሆነ ያረጋግጡ።',
  'Member links': 'የአባልነት ማገናኛዎች',
  'Review requests': 'ጥያቄዎችን ይመልከቱ',
  Requests: 'ጥያቄዎች',
  'Not linked': 'ያልተገናኙ',
  Linked: 'ተገናኝቷል',
  'Search name, email or member ID': 'ስም፣ ኢሜይል ወይም የአባልነት መለያ ይፈልጉ',
  'No open requests.': 'ክፍት ጥያቄ የለም።',
  Account: 'መለያ',
  'phone ends in': 'ስልኩ የሚያልቀው በ',
  Approve: 'አጽድቅ',
  Reject: 'አትቀበል',
  'Reason shown to the member (optional)': 'ለአባሉ የሚታይ ምክንያት (አማራጭ)',
  'Confirm reject': 'አለመቀበሉን አረጋግጥ',
  'Request rejected': 'ጥያቄው ተቀባይነት አላገኘም',
  'Accounts without a member link and without a request. Link one by typing the member ID (the number is enough).':
    'ማገናኛ እና ጥያቄ የሌላቸው መለያዎች። የአባልነት መለያውን (ቁጥሩ በቂ ነው) በመጻፍ ያገናኙ።',
  'Every account is linked or has a request.':
    'ሁሉም መለያዎች ተገናኝተዋል ወይም ጥያቄ አላቸው።',
  'Signed up': 'የተመዘገበው',
  'No linked accounts yet.': 'እስካሁን የተገናኘ መለያ የለም።',
  'Remove this member link?': 'ይህን የአባልነት ማገናኛ ያስወግዱ?',
  'Link removed': 'ማገናኛው ተወግዷል',
  Unlink: 'አቋርጥ',
  'This member record is already linked to another account.':
    'ይህ የአባልነት መዝገብ አስቀድሞ ከሌላ መለያ ጋር ተገናኝቷል።',
  'This account is already linked to a member record.':
    'ይህ መለያ አስቀድሞ ከአባልነት መዝገብ ጋር ተገናኝቷል።',
  'This request was already handled.': 'ይህ ጥያቄ አስቀድሞ ተስተናግዷል።',
  'Request not found.': 'ጥያቄው አልተገኘም።',
  'Enter a member ID.': 'የአባልነት መለያ ያስገቡ።',
  'Member ID not found.': 'የአባልነት መለያው አልተገኘም።',
  'Account not found.': 'መለያው አልተገኘም።',
  'This account is not linked.': 'ይህ መለያ አልተገናኘም።',
  'Linked to another account. Contact an admin if this is your member ID.':
    'ከሌላ መለያ ጋር ተገናኝቷል። ይህ የእርስዎ የአባልነት መለያ ከሆነ አስተዳዳሪን ያነጋግሩ።',
};
