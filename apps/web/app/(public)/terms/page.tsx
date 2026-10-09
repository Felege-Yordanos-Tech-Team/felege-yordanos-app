import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '../_components/legal-page';

export const metadata: Metadata = {
  title: 'Terms of Use · የአጠቃቀም ደንቦች — Felege Yordanos Sunday School',
  description: 'The rules for using the Felege Yordanos Sunday School app.',
};

const SECTIONS: LegalSection[] = [
  {
    title: 'About these terms',
    blocks: [
      'These terms apply to the Felege Yordanos Sunday School app. By using the app, you agree to them. Our [Privacy Policy](/privacy) explains how we handle your data.',
    ],
  },
  {
    title: 'Who may use it',
    blocks: [
      'The app is for members of Felege Yordanos Sunday School and the people it serves. Anyone can create an account; most features open once your account is linked to your member record.',
    ],
  },
  {
    title: 'Your account',
    blocks: [
      [
        'Give accurate information and keep it up to date.',
        'Keep your password safe and do not share your account. If you think someone else has used it, tell us at privacy@felegeyordanos.org.',
        'You are responsible for what is done with your account.',
      ],
    ],
  },
  {
    title: 'Acceptable use',
    blocks: [
      [
        "Do not try to see or change other members' data, or to get around the app's permissions.",
        'Do not disrupt or overload the app, or use it to send spam or harmful content.',
        "Use other members' information only for the Sunday School's work.",
      ],
    ],
  },
  {
    title: 'Donations',
    blocks: [
      'Donations are voluntary. The app does not take payments: you pay by bank transfer or another method and upload the receipt. The Budget & Asset Management department reviews each receipt by hand and verifies or rejects it.',
    ],
  },
  {
    title: 'Content',
    blocks: [
      'Songs, notices and other content in the app belong to the Sunday School. You may use them for worship and personal study; ask us before republishing them.',
    ],
  },
  {
    title: 'The service',
    blocks: [
      'The Sunday School provides the app as is. We work to keep it available and correct, but we cannot promise that it will always be available or free of errors.',
    ],
  },
  {
    title: 'Suspension',
    blocks: [
      'We may suspend or close an account that misuses the app or breaks these terms.',
    ],
  },
  {
    title: 'Changes to these terms',
    blocks: [
      'We may update these terms and will then change the effective date at the top. If you keep using the app, you accept the updated terms.',
    ],
  },
  {
    title: 'Contact',
    blocks: ['Questions about these terms: privacy@felegeyordanos.org.'],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      sub="The rules for using the Felege Yordanos Sunday School app."
      sections={SECTIONS}
    />
  );
}
