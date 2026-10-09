/** Amharic for the auth screens (English text -> Amharic). */
export const auth: Record<string, string> = {
  // Sign in / sign up
  'Join your Sunday School community': 'የሰንበት ትምህርት ቤትዎን ማህበረሰብ ይቀላቀሉ',
  'Signing in…': 'በመግባት ላይ…',
  'Creating account…': 'መለያ በመፍጠር ላይ…',
  'Create account': 'መለያ ፍጠር',
  'Already have an account?': 'መለያ አለዎት?',
  'New here?': 'አዲስ ነዎት?',
  'Show password': 'የይለፍ ቃሉን አሳይ',
  'Hide password': 'የይለፍ ቃሉን ደብቅ',
  'Ethiopian Orthodox Tewahedo Church': 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን',
  'Songbook, attendance and donations in one place.':
    'መዝሙር፣ ክትትል እና መዋጮ በአንድ ቦታ።',

  // Google sign-in
  'Continue with Google': 'በGoogle ይቀጥሉ',
  'Opening Google…': 'Googleን በመክፈት ላይ…',
  or: 'ወይም',
  'Google sign-in was cancelled.': 'በGoogle መግባት ተሰርዟል።',
  'This email already has an account. Sign in with your password and verify your email, then you can use Google.':
    'ይህ ኢሜይል ቀድሞ መለያ አለው። በይለፍ ቃልዎ ገብተው ኢሜይልዎን ያረጋግጡ፤ ከዚያ በGoogle መግባት ይችላሉ።',
  'Google sign-in did not work. Please try again.':
    'በGoogle መግባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።',

  // Forgot password
  'Enter your email to receive a reset link':
    'የይለፍ ቃል ዳግም ማስጀመሪያ ሊንክ ለመቀበል ኢሜይልዎን ያስገቡ',
  'Send reset link': 'ሊንክ ላክ',
  'Sending…': 'በመላክ ላይ…',
  'Remembered it?': 'አስታወሱት?',
  'We sent a reset link to {email}. Tap it to choose a new password.':
    'ወደ {email} ዳግም ማስጀመሪያ ሊንክ ልከናል። አዲስ የይለፍ ቃል ለመምረጥ ይንኩት።',
  'Didn’t get it? Check your spam folder, or':
    'አልደረሰዎትም? የአይፈለጌ (spam) ማህደርዎን ይመልከቱ፣ ወይም',
  'try a different email': 'ሌላ ኢሜይል ይሞክሩ',
  'Back to sign in': 'ወደ መግቢያ ተመለስ',

  // Reset password
  'One moment…': 'ትንሽ ይጠብቁ…',
  'This reset link is invalid or has expired.':
    'ይህ ሊንክ ትክክል አይደለም ወይም ጊዜው አልፏል።',
  'Request a new link': 'አዲስ ሊንክ ይጠይቁ',
  'Choose a strong password': 'ጠንካራ የይለፍ ቃል ይምረጡ',
  'New password': 'አዲስ የይለፍ ቃል',
  'Confirm password': 'የይለፍ ቃሉን ያረጋግጡ',
  'Updating…': 'በማዘመን ላይ…',
  'Update password': 'የይለፍ ቃል አዘምን',

  // Errors (client checks and common Better Auth messages)
  'Something went wrong. Please try again.': 'የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።',
  'Passwords do not match.': 'የይለፍ ቃሎቹ አይመሳሰሉም።',
  'Password must be at least 8 characters.': 'የይለፍ ቃል ቢያንስ 8 ቁምፊዎች መሆን አለበት።',
  'Could not reset the password. Please try again.':
    'የይለፍ ቃሉን ዳግም ማስጀመር አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Invalid email or password': 'ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም',
  'Invalid email': 'ትክክለኛ ያልሆነ ኢሜይል',
  'User already exists': 'ይህ ኢሜይል ቀድሞ ተመዝግቧል',
  'User already exists. Use another email.':
    'ይህ ኢሜይል ቀድሞ ተመዝግቧል። ሌላ ኢሜይል ይጠቀሙ።',
  'Password too short': 'የይለፍ ቃሉ በጣም አጭር ነው',
  'Too many requests. Please try again later.': 'በጣም ብዙ ሙከራዎች። እባክዎ ቆይተው ይሞክሩ።',

  // Verify email (6-digit code)
  'Verify your email': 'ኢሜይልዎን ያረጋግጡ',
  'Enter the 6-digit code we sent to {email}.':
    'ወደ {email} የላክነውን ባለ 6 አሃዝ ኮድ ያስገቡ።',
  'Verify your email to use events, notices and donations.':
    'ዝግጅቶችን፣ ማስታወቂያዎችንና መዋጮን ለመጠቀም ኢሜይልዎን ያረጋግጡ።',
  'Your staff access starts after you verify your email.':
    'የአስተዳደር ፈቃድዎ ኢሜይልዎን ካረጋገጡ በኋላ ይጀምራል።',
  'Verification code': 'የማረጋገጫ ኮድ',
  'Digit {n} of 6': 'ከ6 አሃዞች {n}ኛው',
  'Verify email': 'ኢሜይል አረጋግጥ',
  'Verifying…': 'በማረጋገጥ ላይ…',
  'resend in {s}s': 'ከ{s} ሰከንድ በኋላ እንደገና ይላኩ',
  'resend the code': 'ኮዱን እንደገና ይላኩ',
  'Wrong account?': 'የተሳሳተ መለያ ነው?',
  'We sent you a code.': 'ኮድ ልከንልዎታል።',
  'New code sent.': 'አዲስ ኮድ ተልኳል።',
  'Wrong code. Check the email and try again.':
    'ኮዱ ትክክል አይደለም። ኢሜይሉን አይተው እንደገና ይሞክሩ።',
  'This code has expired. Ask for a new code.':
    'የዚህ ኮድ ጊዜ አልፏል። አዲስ ኮድ ይጠይቁ።',
  'Too many wrong tries. Ask for a new code.':
    'በጣም ብዙ የተሳሳቱ ሙከራዎች። አዲስ ኮድ ይጠይቁ።',
  'Please wait a moment before asking for a new code.':
    'አዲስ ኮድ ከመጠየቅዎ በፊት ትንሽ ይጠብቁ።',
  'Could not send the code. Please try again.':
    'ኮዱን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  'Verify your email first, then request the link.':
    'መጀመሪያ ኢሜይልዎን ያረጋግጡ፣ ከዚያ ማገናኘት ይጠይቁ።',
};
