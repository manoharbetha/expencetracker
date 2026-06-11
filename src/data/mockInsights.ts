import { Insight } from '../types';

export const mockInsights: Insight[] = [
  { id: 'i1', type: 'positive', title: 'Savings momentum', message: 'June is tracking at a 37% savings rate, your strongest month this quarter.' },
  { id: 'i2', type: 'warning', title: 'Shopping spike', message: 'Shopping is 22% above your usual pattern. Pause non-essential purchases for 10 days.' },
  { id: 'i3', type: 'suggestion', title: 'Budget coach', message: 'Reducing food delivery by ₹1,000/month adds ₹12,000 to your MacBook fund this year.' },
  { id: 'i4', type: 'warning', title: 'EMI caution', message: 'A ₹5,000 purchase now could tighten cash flow before your July EMI cycle.' },
  { id: 'i5', type: 'positive', title: 'Goal acceleration', message: 'Your Emergency Fund can finish 3 weeks early with the current contribution pace.' },
  { id: 'i6', type: 'suggestion', title: 'Subscription trim', message: 'Two low-use subscriptions can be cancelled to free ₹778 every month.' },
  { id: 'i7', type: 'positive', title: 'Debt progress', message: 'You have paid down 31% of your tracked debt principal.' },
  { id: 'i8', type: 'suggestion', title: 'Travel planning', message: 'Book Goa flights before August to keep the trip under your ₹75,000 target.' }
];
