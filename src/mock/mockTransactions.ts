import type { Transaction } from "../types/transaction";
import type { StatementMetadata } from "../types/statement";

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-01-02",
    description: "Amazon Pay India",
    amount: 2499,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "2",
    date: "2026-01-03",
    description: "BigBasket Grocery",
    amount: 1860,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "3",
    date: "2026-01-04",
    description: "Uber Trip Bangalore",
    amount: 345,
    type: "debit",
    category: "Transportation"
  },
  {
    id: "4",
    date: "2026-01-05",
    description: "Swiggy Order 1287",
    amount: 620,
    type: "debit",
    category: "Food and Dining"
  },
  {
    id: "5",
    date: "2026-01-06",
    description: "Reliance Retail Smart",
    amount: 1345,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "6",
    date: "2026-01-07",
    description: "Netflix Subscription",
    amount: 649,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "7",
    date: "2026-01-08",
    description: "Electricity Bill BESCOM",
    amount: 1875,
    type: "debit",
    category: "Utilities"
  },
  {
    id: "8",
    date: "2026-01-09",
    description: "IRCTC Train Booking",
    amount: 1420,
    type: "debit",
    category: "Travel"
  },
  {
    id: "9",
    date: "2026-01-10",
    description: "Apollo Pharmacy",
    amount: 780,
    type: "debit",
    category: "Health"
  },
  {
    id: "10",
    date: "2026-01-12",
    description: "Amazon Marketplace",
    amount: 3199,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "11",
    date: "2026-01-13",
    description: "Zomato Online Order",
    amount: 460,
    type: "debit",
    category: "Food and Dining"
  },
  {
    id: "12",
    date: "2026-01-14",
    description: "BookMyShow Movie",
    amount: 990,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "13",
    date: "2026-01-16",
    description: "Fuel IndianOil",
    amount: 2300,
    type: "debit",
    category: "Transportation"
  },
  {
    id: "14",
    date: "2026-01-18",
    description: "Amazon Pay Refund",
    amount: 450,
    type: "credit",
    category: "Others"
  },
  {
    id: "15",
    date: "2026-01-19",
    description: "Myntra Fashion",
    amount: 2899,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "16",
    date: "2026-01-21",
    description: "ACT Fibernet Bill",
    amount: 999,
    type: "debit",
    category: "Utilities"
  },
  {
    id: "17",
    date: "2026-01-22",
    description: "Uber Eats",
    amount: 720,
    type: "debit",
    category: "Food and Dining"
  },
  {
    id: "18",
    date: "2026-01-24",
    description: "Flipkart Online",
    amount: 1799,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "19",
    date: "2026-01-25",
    description: "Card Payment Received",
    amount: 35000,
    type: "credit",
    category: "Others"
  },
  {
    id: "20",
    date: "2026-01-27",
    description: "Swiggy Instamart",
    amount: 510,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "21",
    date: "2026-01-28",
    description: "Google Play Subscription",
    amount: 299,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "22",
    date: "2026-02-01",
    description: "Air India Booking",
    amount: 8740,
    type: "debit",
    category: "Travel"
  },
  {
    id: "23",
    date: "2026-02-02",
    description: "Amazon Pay India",
    amount: 1260,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "24",
    date: "2026-02-03",
    description: "BigBasket Grocery",
    amount: 1725,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "25",
    date: "2026-02-04",
    description: "Uber Trip Bangalore",
    amount: 390,
    type: "debit",
    category: "Transportation"
  },
  {
    id: "26",
    date: "2026-02-05",
    description: "Cult Fit Membership",
    amount: 1499,
    type: "debit",
    category: "Health"
  },
  {
    id: "27",
    date: "2026-02-06",
    description: "Electricity Bill BESCOM",
    amount: 1980,
    type: "debit",
    category: "Utilities"
  },
  {
    id: "28",
    date: "2026-02-08",
    description: "PharmEasy Order",
    amount: 920,
    type: "debit",
    category: "Health"
  },
  {
    id: "29",
    date: "2026-02-09",
    description: "Reliance Retail Fresh",
    amount: 1160,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "30",
    date: "2026-02-10",
    description: "Swiggy Order 4382",
    amount: 680,
    type: "debit",
    category: "Food and Dining"
  },
  {
    id: "31",
    date: "2026-02-12",
    description: "Amazon Marketplace",
    amount: 4570,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "32",
    date: "2026-02-13",
    description: "IRCTC Train Booking",
    amount: 1660,
    type: "debit",
    category: "Travel"
  },
  {
    id: "33",
    date: "2026-02-15",
    description: "Card Payment Received",
    amount: 28000,
    type: "credit",
    category: "Others"
  },
  {
    id: "34",
    date: "2026-02-16",
    description: "Netflix Subscription",
    amount: 649,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "35",
    date: "2026-02-18",
    description: "Amazon Pay Refund",
    amount: 620,
    type: "credit",
    category: "Others"
  },
  {
    id: "36",
    date: "2026-02-19",
    description: "MakeMyTrip Hotel",
    amount: 5420,
    type: "debit",
    category: "Travel"
  },
  {
    id: "37",
    date: "2026-02-21",
    description: "Myntra Fashion",
    amount: 2390,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "38",
    date: "2026-02-23",
    description: "Uber Trip Bangalore",
    amount: 355,
    type: "debit",
    category: "Transportation"
  },
  {
    id: "39",
    date: "2026-02-24",
    description: "ACT Fibernet Bill",
    amount: 999,
    type: "debit",
    category: "Utilities"
  },
  {
    id: "40",
    date: "2026-02-26",
    description: "BookMyShow Concert",
    amount: 2150,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "41",
    date: "2026-03-01",
    description: "BigBasket Grocery",
    amount: 1940,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "42",
    date: "2026-03-02",
    description: "Spotify Premium",
    amount: 119,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "43",
    date: "2026-03-03",
    description: "Uber Trip Bangalore",
    amount: 335,
    type: "debit",
    category: "Transportation"
  },
  {
    id: "44",
    date: "2026-03-04",
    description: "Swiggy Order 8911",
    amount: 530,
    type: "debit",
    category: "Food and Dining"
  },
  {
    id: "45",
    date: "2026-03-06",
    description: "Amazon Pay India",
    amount: 1720,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "46",
    date: "2026-03-08",
    description: "Fuel Bharat Petroleum",
    amount: 2550,
    type: "debit",
    category: "Transportation"
  },
  {
    id: "47",
    date: "2026-03-09",
    description: "Electricity Bill BESCOM",
    amount: 1765,
    type: "debit",
    category: "Utilities"
  },
  {
    id: "48",
    date: "2026-03-10",
    description: "Apollo Pharmacy",
    amount: 640,
    type: "debit",
    category: "Health"
  },
  {
    id: "49",
    date: "2026-03-12",
    description: "Card Payment Received",
    amount: 32000,
    type: "credit",
    category: "Others"
  },
  {
    id: "50",
    date: "2026-03-13",
    description: "Amazon Marketplace",
    amount: 5199,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "51",
    date: "2026-03-15",
    description: "IRCTC Train Booking",
    amount: 1245,
    type: "debit",
    category: "Travel"
  },
  {
    id: "52",
    date: "2026-03-16",
    description: "Netflix Subscription",
    amount: 649,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "53",
    date: "2026-03-18",
    description: "Zomato Online Order",
    amount: 585,
    type: "debit",
    category: "Food and Dining"
  },
  {
    id: "54",
    date: "2026-03-20",
    description: "Reliance Retail Smart",
    amount: 1480,
    type: "debit",
    category: "Groceries"
  },
  {
    id: "55",
    date: "2026-03-22",
    description: "Amazon Pay Refund",
    amount: 730,
    type: "credit",
    category: "Others"
  },
  {
    id: "56",
    date: "2026-03-24",
    description: "MakeMyTrip Flight",
    amount: 11250,
    type: "debit",
    category: "Travel"
  },
  {
    id: "57",
    date: "2026-03-25",
    description: "Google Play Subscription",
    amount: 299,
    type: "debit",
    category: "Entertainment"
  },
  {
    id: "58",
    date: "2026-03-26",
    description: "Card Cashback Credit",
    amount: 420,
    type: "credit",
    category: "Others"
  },
  {
    id: "59",
    date: "2026-03-27",
    description: "ACT Fibernet Bill",
    amount: 999,
    type: "debit",
    category: "Utilities"
  },
  {
    id: "60",
    date: "2026-03-28",
    description: "Myntra Fashion",
    amount: 1725,
    type: "debit",
    category: "Shopping"
  },
  {
    id: "61",
    date: "2026-02-20",
    description: "IRCTC Refund Credit",
    amount: 1660,
    type: "credit",
    category: "Others"
  },
  {
    id: "62",
    date: "2026-02-25",
    description: "BESCOM Bill Reversal",
    amount: 1980,
    type: "credit",
    category: "Others"
  },
  {
    id: "63",
    date: "2026-02-27",
    description: "Amazon Order Refund",
    amount: 4570,
    type: "credit",
    category: "Others"
  },
  {
    id: "64",
    date: "2026-03-07",
    description: "Amazon Pay Refund Credit",
    amount: 1720,
    type: "credit",
    category: "Others"
  }
];

export const mockStatementMetadata: StatementMetadata = {
  bankName: "Demo Bank",
  totalBillAmount: 68432.75,
  minimumAmountDue: 3420,
  paymentDueDate: "05 Apr 2026",
  statementPeriod: "01 Jan - 31 Mar 2026"
};
