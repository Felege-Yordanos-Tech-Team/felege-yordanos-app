/**
 * Amharic for the SMS screens (messages, event reminders, profile and user
 * settings). English text -> Amharic. Needs a native speaker's review.
 */
export const messages: Record<string, string> = {
  // Navigation and headings
  Messages: 'መልዕክቶች',
  'New message': 'አዲስ መልዕክት',
  'Open messages': 'መልዕክቶችን ክፈት',
  'Send SMS notices and see event reminders and their delivery.':
    'የSMS ማሳወቂያዎችን ይላኩ፤ የመርሃ ግብር ማስታወሻዎችንና መድረሳቸውን ይመልከቱ።',
  'SMS notices and event reminders sent from the app.':
    'ከመተግበሪያው የተላኩ የSMS ማሳወቂያዎችና የመርሃ ግብር ማስታወሻዎች።',
  'Your SMS notices and event reminders.':
    'የእርስዎ የSMS ማሳወቂያዎችና የመርሃ ግብር ማስታወሻዎች።',
  'Sent as SMS from SMSHub’s shared sender name, signed FYSS.':
    'በSMSHub የጋራ የላኪ ስም በSMS ይላካል፤ መጨረሻው «FYSS» ይላል።',
  'No messages yet': 'እስካሁን መልዕክት የለም',
  Automatic: 'በራስ-ሰር',

  // Statuses
  Starting: 'በመጀመር ላይ',
  Sending: 'በመላክ ላይ',
  Paused: 'ቆሟል',
  Done: 'ተጠናቋል',
  Cancelled: 'ተሰርዟል',
  Waiting: 'በመጠበቅ ላይ',
  'In progress': 'በሂደት ላይ',
  Sent: 'ተልኳል',
  Failed: 'አልተሳካም',
  Skipped: 'የተዘለሉ',
  'Missed (time had passed)': 'አልተላከም (ሰዓቱ አልፎ ነበር)',
  '{sent} sent · {failed} failed · {skipped} skipped':
    '{sent} ተልኳል · {failed} አልተሳካም · {skipped} ተዘሏል',
  '{done} of {total} people': 'ከ{total} ሰዎች {done}',

  // Audiences
  'Expected at an event': 'በመርሃ ግብር የሚጠበቁ',
  'Who gets it?': 'ማን ይቀበላል?',
  'People expected at {title}, same as its check-in list.':
    'በ«{title}» የሚጠበቁ ሰዎች፤ ከመግቢያ ዝርዝሩ ጋር አንድ ነው።',

  // Compose
  Channel: 'መንገድ',
  'Coming soon': 'በቅርቡ',
  'Telegram is coming soon.': 'ቴሌግራም በቅርቡ ይመጣል።',
  Message: 'መልዕክት',
  Text: 'ጽሑፍ',
  'Start with ፈለገ ዮርዳኖስ so people know who it is from.':
    'ከማን እንደሆነ እንዲታወቅ በ«ፈለገ ዮርዳኖስ» ይጀምሩ።',
  'Never ask people to reply with a code: the provider blocks it.':
    'ሰዎች በኮድ እንዲመልሱ በፍጹም አይጠይቁ፤ አቅራቢው ያግደዋል።',
  'Send a test to myself': 'ለራሴ ሙከራ ላክ',
  'The test goes to your number {phone}.': 'ሙከራው ወደ ቁጥርዎ {phone} ይሄዳል።',
  'Test to yourself needs a phone number on your linked member or pre-member record.':
    'ለራስ ሙከራ ለመላክ በተገናኘው የአባል ወይም የቅድመ አባል መዝገብዎ ላይ ስልክ ቁጥር ያስፈልጋል።',
  'Your profile has no phone number for SMS.': 'መገለጫዎ ለSMS የሚሆን ስልክ ቁጥር የለውም።',
  Continue: 'ቀጥል',
  'Checking…': 'በማረጋገጥ ላይ…',
  'Test sent': 'ሙከራ ተልኳል',
  'Development: printed in the server log, not sent.':
    'የሙከራ አካባቢ፦ በሰርቨሩ መዝገብ ታትሟል፤ አልተላከም።',
  'Sent to {phone}': 'ወደ {phone} ተልኳል',
  'The preview appears as you type.': 'ሲጽፉ ቅድመ እይታው ይታያል።',
  'Too long: at most {max} SMS parts. Remove 1 character, or post it on the notice board.':
    'በጣም ረጅም ነው፦ ቢበዛ {max} የSMS ክፍሎች። 1 ፊደል ያስወግዱ ወይም በማስታወቂያ ሰሌዳው ላይ ይለጥፉት።',
  'Too long: at most {max} SMS parts. Remove {n} characters, or post it on the notice board.':
    'በጣም ረጅም ነው፦ ቢበዛ {max} የSMS ክፍሎች። {n} ፊደላት ያስወግዱ ወይም በማስታወቂያ ሰሌዳው ላይ ይለጥፉት።',
  '{chars} characters, 1 SMS part, {credits} credit per person ({safaricom} on Safaricom)':
    '{chars} ፊደላት፣ 1 የSMS ክፍል፣ ለአንድ ሰው {credits} ክሬዲት (በሳፋሪኮም {safaricom})',
  '{chars} characters, {parts} SMS parts, {credits} credits per person ({safaricom} on Safaricom)':
    '{chars} ፊደላት፣ {parts} የSMS ክፍሎች፣ ለአንድ ሰው {credits} ክሬዲት (በሳፋሪኮም {safaricom})',
  'Arrives as one message; charged per SMS part.':
    'እንደ አንድ መልዕክት ይደርሳል፤ ክፍያው በእያንዳንዱ የSMS ክፍል ነው።',
  'Amharic: 70 characters for one SMS, 67 per part':
    'አማርኛ፦ ለአንድ SMS 70 ፊደላት፣ ከዚያ በላይ በእያንዳንዱ ክፍል 67',
  'Latin only: 160 characters for one SMS, 153 per part':
    'ላቲን ብቻ፦ ለአንድ SMS 160 ፊደላት፣ ከዚያ በላይ በእያንዳንዱ ክፍል 153',
  '1 message, 1 SMS part': '1 መልዕክት፣ 1 የSMS ክፍል',
  '1 message, {p} SMS parts': '1 መልዕክት፣ {p} የSMS ክፍሎች',
  '{n} messages, {p} SMS parts': '{n} መልዕክቶች፣ {p} የSMS ክፍሎች',
  'Enter a message.': 'መልዕክት ያስገቡ።',

  // Estimate
  Recipients: 'ተቀባዮች',
  'SMS parts per person': 'የSMS ክፍሎች ለአንድ ሰው',
  'Estimated credits': 'የሚገመት ክሬዲት',
  Credits: 'ክሬዲት',
  Balance: 'ቀሪ ሂሳብ',
  'Balance: {n} credits': 'ቀሪ ሂሳብ፦ {n} ክሬዲት',
  'n/a': 'የለም',
  'Development: nothing is sent': 'የሙከራ አካባቢ፦ ምንም አይላክም',
  '{n} Safaricom': '{n} ሳፋሪኮም',
  'Child member': 'ህጻናት መደበኛ አባል',
  'Children (ህጻናት መደበኛ) do not get SMS.': 'ህጻናት (ህጻናት መደበኛ) SMS አይላክላቸውም።',
  'No phone number': 'ስልክ ቁጥር የለም',
  'Not a mobile number': 'የሞባይል ቁጥር አይደለም',
  'Turned off SMS': 'SMS አጥፍተዋል',
  'Same number as someone else': 'ከሌላ ሰው ጋር ተመሳሳይ ቁጥር',
  'Not enough SMS credits for this message.': 'ለዚህ መልዕክት በቂ የSMS ክሬዲት የለም።',

  // Confirm
  'Send this SMS?': 'ይህ SMS ይላክ?',
  'Checked by SMSHub. Nothing has been sent yet.': 'በSMSHub ተረጋግጧል። እስካሁን ምንም አልተላከም።',
  'Send to {n} people': 'ለ{n} ሰዎች ላክ',
  'Starting…': 'በመጀመር ላይ…',
  'Sending started': 'መላክ ተጀምሯል',
  'The messages go out in the background.': 'መልዕክቶቹ ከበስተጀርባ ይላካሉ።',

  // Detail
  'Event reminder': 'የመርሃ ግብር ማስታወሻ',
  'SMS message': 'የSMS መልዕክት',
  Sender: 'ላኪ',
  Created: 'የተፈጠረበት',
  Started: 'የጀመረበት',
  Finished: 'ያለቀበት',
  Resume: 'ቀጥል',
  'Cancel sending': 'መላክ አቁም',
  'Yes, stop sending': 'አዎ፣ መላክ አቁም',
  'Keep sending': 'መላኩን ቀጥል',

  // Errors (server)
  'SMS is not configured.': 'SMS አልተዋቀረም።',
  'SMS is not configured. Messages cannot be sent until the SMSHub key is set.':
    'SMS አልተዋቀረም። የSMSHub ቁልፍ እስኪገባ መልዕክት መላክ አይቻልም።',
  'SMS is not configured. The reminder will pause until the SMSHub key is set.':
    'SMS አልተዋቀረም። የSMSHub ቁልፍ እስኪገባ ማስታወሻው ይቆማል።',
  'Choose an event.': 'መርሃ ግብር ይምረጡ።',
  'Nobody in this audience has a phone number for SMS.':
    'ከእነዚህ ሰዎች ለSMS የሚሆን ስልክ ቁጥር ያለው የለም።',
  'Too many checks. Please wait a while and try again.':
    'በጣም ብዙ ማረጋገጫዎች። ትንሽ ቆይተው እንደገና ይሞክሩ።',
  'At most 5 messages per hour. Please wait a while.':
    'በሰዓት ቢበዛ 5 መልዕክቶች። እባክዎ ትንሽ ይጠብቁ።',
  'At most 5 test messages per hour. Please wait a while.':
    'በሰዓት ቢበዛ 5 የሙከራ መልዕክቶች። እባክዎ ትንሽ ይጠብቁ።',
  'Could not read the SMS balance. Try again.': 'የSMS ቀሪ ሂሳቡን ማንበብ አልተቻለም። እንደገና ይሞክሩ።',
  'This message has already finished.': 'ይህ መልዕክት ቀድሞ ተጠናቋል።',
  'This message is not paused.': 'ይህ መልዕክት አልቆመም።',
  'Message not found.': 'መልዕክቱ አልተገኘም።',

  // Event reminder
  'SMS reminder': 'የSMS ማስታወሻ',
  'Send an SMS reminder': 'የSMS ማስታወሻ ላክ',
  'To everyone expected at the event with a phone number, once, at the time you choose.':
    'በመርሃ ግብሩ ለሚጠበቁና ስልክ ቁጥር ላላቸው ሁሉ፣ አንድ ጊዜ፣ በመረጡት ሰዓት።',
  'Days before': 'ከስንት ቀን በፊት',
  'Between 0 and {max} days.': 'ከ0 እስከ {max} ቀናት።',
  'Goes out {date} at {time} ({eth}).': '{date} {eth} ({time}) ይላካል።',
  '{n} days before': 'ከ{n} ቀን በፊት',
  'Use the default text': 'መደበኛውን ጽሑፍ ተጠቀም',
  'Fill in the title and date first.': 'መጀመሪያ ርዕሱንና ቀኑን ይሙሉ።',
  'Default text: follows the event’s title, date and time.':
    'መደበኛ ጽሑፍ፦ የመርሃ ግብሩን ርዕስ፣ ቀንና ሰዓት ይከተላል።',
  'The people expected on the day get it; today’s count is an estimate.':
    'በዕለቱ የሚጠበቁ ሰዎች ይቀበሉታል፤ የዛሬው ቁጥር ግምት ነው።',
  'Only people who may send messages can change the reminder.':
    'ማስታወሻውን መቀየር የሚችሉት መልዕክት የመላክ ፈቃድ ያላቸው ብቻ ናቸው።',
  'This reminder has already been sent.': 'ይህ ማስታወሻ ቀድሞ ተልኳል።',
  'The reminder would be sent after the event starts.':
    'ማስታወሻው መርሃ ግብሩ ከጀመረ በኋላ ይላካል።',
  'Days before must be between 0 and 14.': 'ቀናቱ ከ0 እስከ 14 መሆን አለባቸው።',
  'Enter the reminder text.': 'የማስታወሻውን ጽሑፍ ያስገቡ።',
  'The reminder text is too long: at most 10 SMS parts. Shorten it.':
    'የማስታወሻው ጽሑፍ በጣም ረጅም ነው፦ ቢበዛ 10 የSMS ክፍሎች። ያሳጥሩት።',
  'Enter whole days.': 'ሙሉ ቀናት ያስገቡ።',

  // Users and profile
  'Can send messages': 'መልዕክት መላክ ይችላል',
  'SMS notices and event reminders to members and pre-members. Ends when the person is no longer a department head.':
    'ለአባላትና ለቅድመ አባላት የSMS ማሳወቂያዎችና የመርሃ ግብር ማስታወሻዎች። ሰውዬው የክፍል ኃላፊ መሆኑ ሲያበቃ ይቋረጣል።',
  'Receive SMS notices': 'የSMS ማሳወቂያዎችን ተቀበል',
  'Event reminders and notices from the Sunday School, sent to the phone number on your record.':
    'ከሰንበት ትምህርት ቤቱ የሚላኩ የመርሃ ግብር ማስታወሻዎችና ማሳወቂያዎች፣ በመዝገብዎ ላይ ወዳለው ስልክ ቁጥር።',
  'You will receive SMS notices and event reminders.':
    'የSMS ማሳወቂያዎችንና የመርሃ ግብር ማስታወሻዎችን ይቀበላሉ።',
  'You will not receive SMS notices any more.': 'ከእንግዲህ የSMS ማሳወቂያዎችን አይቀበሉም።',

  // Scheduling (#143)
  'This time has already passed. Choose a later time.':
    'ይህ ሰዓት አልፏል። ከዚህ በኋላ ያለ ሰዓት ይምረጡ።',
  'Choose a time at most 60 days ahead.': 'ቢበዛ ከ60 ቀን በኋላ ያለ ሰዓት ይምረጡ።',
  'Choose a time.': 'ሰዓት ይምረጡ።',
  'Choose a date and time.': 'ቀንና ሰዓት ይምረጡ።',
  'When?': 'መቼ?',
  Later: 'በኋላ',
  'Ethiopian time. Recipients are worked out when it goes out.':
    'በኢትዮጵያ ሰዓት። ተቀባዮቹ የሚወሰኑት በሚላክበት ጊዜ ነው።',
  'Recipients are worked out when it goes out.': 'ተቀባዮቹ የሚወሰኑት በሚላክበት ጊዜ ነው።',
  'Recipients are worked out when it goes out: people who join, leave or turn off SMS before then are handled.':
    'ተቀባዮቹ የሚወሰኑት በሚላክበት ጊዜ ነው፤ እስከዚያ የሚቀላቀሉ፣ የሚለቁ ወይም SMS የሚያጠፉ በትክክል ይስተናገዳሉ።',
  'Schedule this SMS?': 'ይህ SMS በቀጠሮ ይያዝ?',
  'Schedule the message': 'መልዕክቱን በቀጠሮ ያዝ',
  'Counted as of today; people are counted again when it goes out.':
    'ቁጥሩ የዛሬ ነው፤ በሚላክበት ጊዜ እንደገና ይቆጠራል።',
  'Changes saved': 'ለውጦቹ ተቀምጠዋል',
  'Goes out {when}.': '{when} ይላካል።',
  'Scheduled for': 'የሚላክበት',
  'Not sent (too late)': 'አልተላከም (ጊዜው አልፏል)',
  'Not sent: the server was down at the time.': 'አልተላከም፦ በዚያ ሰዓት አገልጋዩ ቆሞ ነበር።',
  'Nobody received this message.': 'ይህን መልዕክት ማንም አልተቀበለም።',
  'Yes, cancel it': 'አዎ፣ ሰርዘው',
  'Edit scheduled message': 'የታቀደ መልዕክት ማስተካከያ',
  'Change the text, who gets it or when it goes out.':
    'ጽሑፉን፣ ተቀባዮቹን ወይም የሚላክበትን ጊዜ ይቀይሩ።',
  'This message has already started.': 'ይህ መልዕክት መላክ ጀምሯል።',
  'The event was deleted.': 'መርሃ ግብሩ ተሰርዟል።',
  '{name} can now send messages.': '{name} አሁን መልዕክት መላክ ይችላል።',
  '{name} can no longer send messages.': '{name} ከእንግዲህ መልዕክት መላክ አይችልም።',

  // Selected people (#147)
  'Selected people': 'የተመረጡ ሰዎች',
  'Selected people ({n})': 'የተመረጡ ሰዎች ({n})',
  'No longer active': 'አሁን ንቁ አይደሉም',
  Regular: 'መደበኛ',
  'Children (regular)': 'ህጻናት መደበኛ',
  'Special regular': 'ልዩ መደበኛ',
  Honorary: 'የክብር',
  'Type at least 2 letters of a name, a father’s name or an ID.':
    'የስም፣ የአባት ስም ወይም የመለያ ቁጥር ቢያንስ 2 ፊደላት ይጻፉ።',
  'Searching…': 'በመፈለግ ላይ…',
  'Nobody found.': 'ማንም አልተገኘም።',
  'The first 20. Type more to narrow it down.': 'የመጀመሪያዎቹ 20። ለማጥበብ ተጨማሪ ይጻፉ።',
  '{n} found': '{n} ተገኝተዋል',
  'Name, father’s name or ID…': 'ስም፣ የአባት ስም ወይም መለያ ቁጥር…',
  'Search people': 'ሰዎችን ይፈልጉ',
  Kind: 'ዓይነት',
  'Member type': 'የአባልነት ዓይነት',
  'All member types': 'ሁሉም የአባልነት ዓይነቶች',
  'Chosen people': 'የተመረጡ ሰዎች',
  Chosen: 'የተመረጡ',
  'Clear all': 'ሁሉንም አጽዳ',
  'Nobody chosen yet.': 'እስካሁን ማንም አልተመረጠም።',
  'Remove {name}': '{name}ን አስወግድ',
  'At most 200 people per message.': 'በአንድ መልዕክት ቢበዛ 200 ሰዎች።',
  'Choose at least one person.': 'ቢያንስ አንድ ሰው ይምረጡ።',
  'Some of the chosen people were not found.': 'ከተመረጡት ሰዎች አንዳንዶቹ አልተገኙም።',
  'Some of the chosen people cannot get SMS. Remove them and try again.':
    'ከተመረጡት ሰዎች አንዳንዶቹ SMS ሊላክላቸው አይችልም። ያስወግዷቸውና እንደገና ይሞክሩ።',
  'Type at least 2 letters.': 'ቢያንስ 2 ፊደላት ይጻፉ።',
  'Too many searches. Please wait a minute.': 'በጣም ብዙ ፍለጋ። እባክዎ አንድ ደቂቃ ይጠብቁ።',
  'Each person is checked again when it goes out.': 'ሲላክ እያንዳንዱ ሰው እንደገና ይረጋገጣል።',
  'Ethiopian time. Each person is checked again when it goes out.':
    'የኢትዮጵያ ሰዓት። ሲላክ እያንዳንዱ ሰው እንደገና ይረጋገጣል።',
  'Each person is checked again when it goes out: anyone who has left, turned off SMS, lost their number or is a child member by then is skipped.':
    'ሲላክ እያንዳንዱ ሰው እንደገና ይረጋገጣል፤ እስከዚያ የለቀቀ፣ SMS ያጠፋ፣ ስልክ ቁጥሩ የሌለ ወይም ህጻናት መደበኛ አባል የሆነ ይዘለላል።',
  'and {n} more': 'እና ሌሎች {n}',
};
