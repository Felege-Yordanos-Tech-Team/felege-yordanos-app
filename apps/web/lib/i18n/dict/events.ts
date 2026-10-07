/** Amharic for the events screens (English text -> Amharic). */
export const events: Record<string, string> = {
  // My events (member)
  'No attendance records yet.': 'እስካሁን የመገኘት መዝገብ የለም።',
  'No upcoming events': 'የሚመጡ ዝግጅቶች የሉም',
  'Link your member profile to see your attendance history':
    'የመገኘት ታሪክዎን ለማየት የአባልነት መገለጫዎን ያገናኙ',
  'Link member profile': 'የአባልነት መገለጫ ያገናኙ',

  // Events list + calendar (admin)
  'No events yet. Create one to get started.':
    'እስካሁን ዝግጅት የለም። ለመጀመር አንድ ይፍጠሩ።',
  'Edit event': 'ዝግጅት አስተካክል',
  'Open event': 'ዝግጅቱን ክፈት',
  '{n} events': '{n} ዝግጅቶች',
  '+{n} more': '+{n} ተጨማሪ',
  'All day': 'ቀኑን ሙሉ',
  'Add event on {date}': 'በ{date} ዝግጅት ጨምር',
  Repeats: 'ይደጋገማል',
  Unknown: 'ያልታወቀ',

  // Create / edit dialog
  'Create a new event, optionally recurring.':
    'አዲስ ዝግጅት ይፍጠሩ፤ ተደጋጋሚም ሊሆን ይችላል።',
  'Edit this event or manage its recurring series.':
    'ይህን ዝግጅት ያስተካክሉ ወይም ተደጋጋሚ ተከታታዩን ያስተዳድሩ።',
  'e.g. Sunday Service': 'ለምሳሌ፦ የእሁድ ቅዳሴ',
  'Select department (optional)': 'ክፍል ይምረጡ (አማራጭ)',
  Description: 'መግለጫ',
  'Optional details': 'ተጨማሪ ዝርዝር (አማራጭ)',
  'Will create {count} {cadence} from {from} until {until}.':
    'ከ{from} እስከ {until} {cadence} {count} ይፈጥራል።',
  'Creates {count} on {date}.': 'በ{date} {count} ይፈጥራል።',
  'Capped at 12 months from the start date.': 'ከመጀመሪያው ቀን ጀምሮ በ12 ወር የተገደበ።',
  'Recurring series': 'ተደጋጋሚ ተከታታይ',
  'This is one of {n} occurrences. Editing above changes only this one. To move where the series ends, set a new end date. Past and attended events are never touched.':
    'ይህ ከ{n} ድግግሞሾች አንዱ ነው። ከላይ ማስተካከል ይህን ብቻ ይቀይራል። ተከታታዩ የሚያበቃበትን ለመቀየር አዲስ የማብቂያ ቀን ያስገቡ። ያለፉ እና መገኘት የተመዘገበባቸው ዝግጅቶች አይነኩም።',
  'Series ends': 'ተከታታዩ የሚያበቃው',
  'Update end': 'ማብቂያውን አዘምን',
  'Has attendance, cannot delete': 'መገኘት ተመዝግቧል፤ መሰረዝ አይቻልም',
  'Delete this event': 'ይህን ዝግጅት ሰርዝ',
  'Creating…': 'በመፍጠር ላይ…',
  'Create {n} events': '{n} ዝግጅቶች ፍጠር',
  'Saving…': 'በማስቀመጥ ላይ…',
  'Save changes': 'ለውጦችን አስቀምጥ',
  'This event has attendance recorded and is protected from deletion.':
    'ይህ ዝግጅት መገኘት ተመዝግቦበታል፤ ከመሰረዝ የተጠበቀ ነው።',

  // Toasts
  Error: 'ስህተት',
  '{n} events created': '{n} ዝግጅቶች ተፈጥረዋል',
  'Event created': 'ዝግጅቱ ተፈጥሯል',
  'Event updated': 'ዝግጅቱ ተስተካክሏል',
  'No change': 'ምንም ለውጥ የለም',
  'Series already ends there.': 'ተከታታዩ አስቀድሞ እዚያ ያበቃል።',
  'Series updated': 'ተከታታዩ ተዘምኗል',
  '+{n} added.': '+{n} ተጨምሯል።',
  '{n} removed.': '{n} ተወግዷል።',
  '{n} kept (has attendance).': '{n} ተጠብቋል (መገኘት አለው)።',
  'Cannot delete': 'መሰረዝ አይቻልም',
  'This event already has attendance recorded.': 'ይህ ዝግጅት አስቀድሞ መገኘት ተመዝግቦበታል።',
  'Event deleted': 'ዝግጅቱ ተሰርዟል',

  // Server action errors (shown in toasts)
  'You do not have permission to do this.': 'ይህን ለማድረግ ፈቃድ የለዎትም።',
  'Invalid event.': 'ልክ ያልሆነ ዝግጅት።',
  'Enter a valid date.': 'ትክክለኛ ቀን ያስገቡ።',
  'Enter a valid time.': 'ትክክለኛ ሰዓት ያስገቡ።',
  'Title is required.': 'ርዕስ ያስፈልጋል።',
  'Title must be at most 200 characters.': 'ርዕሱ ከ200 ፊደላት መብለጥ የለበትም።',
  'Description must be at most 2000 characters.':
    'መግለጫው ከ2000 ፊደላት መብለጥ የለበትም።',
  'Choose when the series ends.': 'ተከታታዩ መቼ እንደሚያበቃ ይምረጡ።',
  'Unknown department.': 'ያልታወቀ ክፍል።',
  'Could not save the event. Please try again.':
    'ዝግጅቱን ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Event not found.': 'ዝግጅቱ አልተገኘም።',
  'Could not delete the event. Please try again.':
    'ዝግጅቱን መሰረዝ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Invalid date.': 'ልክ ያልሆነ ቀን።',
  'This event is not part of a series.': 'ይህ ዝግጅት የተከታታይ አካል አይደለም።',
  'Invalid input.': 'ልክ ያልሆነ ግብዓት።',
  'Member not found.': 'አባሉ አልተገኘም።',
  'Could not save attendance. Please try again.':
    'መገኘቱን ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',

  // Check-in
  'Members present': 'አባላት ተገኝተዋል',
  QR: 'QR',
  'Not found': 'አልተገኘም',
  'Member ID not found': 'የአባል መታወቂያው አልተገኘም',
  'Already checked in': 'አስቀድሞ ተመዝግቧል',
  'last {n}': 'የመጨረሻ {n}',
  '{status} for {name}': '{name}፦ {status}',
  'Search members': 'አባላትን ፈልግ',
  'Search members…': 'አባላትን ፈልግ…',
  '1 match': '1 ተገኝቷል',
  '{n} matches': '{n} ተገኝተዋል',
  'No check-ins yet. Enter a member ID above.':
    'እስካሁን የተመዘገበ የለም። ከላይ የአባል መታወቂያ ያስገቡ።',
  'No check-ins yet.': 'እስካሁን የተመዘገበ የለም።',
  'Enter member ID…': 'የአባል መታወቂያ ያስገቡ…',
  'Member ID': 'የአባል መታወቂያ',
  'No members found': 'አባላት አልተገኙም',
  'Member number or ID': 'የአባል ቁጥር ወይም መታወቂያ',
  'Check-in opens at {time}.': 'መግቢያ በ{time} ይከፈታል።',
  'Check-in closed at {time}.': 'መግቢያ በ{time} ተዘግቷል።',
  'Check-in is open until {time}.': 'መግቢያ እስከ {time} ክፍት ነው።',
  'Check-in is closed': 'መግቢያ ዝግ ነው',
  'Department heads can check people in from {from} to {to}.':
    'የክፍል ኃላፊዎች ከ{from} እስከ {to} ድረስ መመዝገብ ይችላሉ።',
  'Outside the check-in window. As an admin you can still check people in.':
    'ከመግቢያ ሰዓቱ ውጭ ነው። እንደ አስተዳዳሪ አሁንም መመዝገብ ይችላሉ።',
  'Check-in for this event has not opened yet.': 'የዚህ መርሃ ግብር መግቢያ ገና አልተከፈተም።',
  'Check-in for this event has closed.': 'የዚህ መርሃ ግብር መግቢያ ተዘግቷል።',
  'Check-in opens (min before start)': 'መግቢያ ይከፈታል (ከመጀመሪያው በፊት በደቂቃ)',
  'Check-in closes (min after start)': 'መግቢያ ይዘጋል (ከመጀመሪያው በኋላ በደቂቃ)',
  'Department heads can only check people in during this window. Admins can at any time.':
    'የክፍል ኃላፊዎች መመዝገብ የሚችሉት በዚህ ጊዜ ውስጥ ብቻ ነው። አስተዳዳሪዎች በማንኛውም ጊዜ ይችላሉ።',
  'Enter whole minutes.': 'ሙሉ ደቂቃ ያስገቡ።',
  'Minutes cannot be negative.': 'ደቂቃ ከዜሮ በታች መሆን አይችልም።',
  'At most 720 minutes.': 'ቢበዛ 720 ደቂቃ።',
  'Mark each member present (P), late (L) or absent (A) in the member list.':
    'በአባላት ዝርዝሩ ውስጥ እያንዳንዱን አባል ተገኝቷል (P)፣ ዘግይቷል (L) ወይም ቀርቷል (A) ብለው ይመዝግቡ።',
  '{from}–{to} of {total}': 'ከ{total} {from}–{to}',
  'Previous page': 'ቀዳሚ ገጽ',
  'Next page': 'ቀጣይ ገጽ',
  'Already marked present': 'አስቀድሞ ተገኝቷል ተብሏል',
  'Invalid QR code': 'ልክ ያልሆነ QR ኮድ',
  'Not a Felege Yordanos member ID': 'የፈለገ ዮርዳኖስ የአባል መታወቂያ አይደለም',
  'Scan a QR · ready for the next member': 'QR ይቃኙ · ለቀጣዩ አባል ዝግጁ',
  'Unknown camera error': 'ያልታወቀ የካሜራ ስህተት',
  'Starting camera…': 'ካሜራ በመክፈት ላይ…',
  'Allow camera access if prompted': 'ሲጠየቁ የካሜራ ፈቃድ ይስጡ',
  'Camera permission required': 'የካሜራ ፈቃድ ያስፈልጋል',
  'Allow camera in your browser, then retry.':
    'በአሳሽዎ ካሜራን ይፍቀዱ፣ ከዚያ እንደገና ይሞክሩ።',
  Retry: 'እንደገና ሞክር',
  'Scanner unavailable': 'ስካነሩ አይገኝም',
  'Your browser may not support camera access.': 'አሳሽዎ ካሜራን ላይደግፍ ይችላል።',

  // Check-in hub
  'Select an event…': 'ዝግጅት ይምረጡ…',
  'Search events…': 'ዝግጅቶችን ፈልግ…',
  'No events found': 'ዝግጅቶች አልተገኙም',
  'All events': 'ሁሉም ዝግጅቶች',
  'Select an event above to start check-in.': 'መመዝገብ ለመጀመር ከላይ ዝግጅት ይምረጡ።',
  'Pick an event, then scan or mark members present.':
    'ዝግጅት ይምረጡ፣ ከዚያ አባላትን ይቃኙ ወይም ተገኝተዋል ብለው ይመዝግቡ።',
};
