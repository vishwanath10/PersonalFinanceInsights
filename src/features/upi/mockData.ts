import type { Transaction } from "../../types/transaction";
import type { UpiStatementMetadata } from "./types";

type SampleTransactionSeed = {
  day: number;
  merchant: string;
  description: string;
  amount: number;
  type: Transaction["type"];
  category: string;
};

type SampleMonthPlan = {
  year: number;
  month: number;
  foodLift: number;
  travelLift: number;
  billLift: number;
  shoppingLift: number;
  transferAmount: number;
  otherLift: number;
  creditLift: number;
  specialDebits?: SampleTransactionSeed[];
  specialCredits?: SampleTransactionSeed[];
};

const FOOD_PRIMARY_MERCHANTS = [
  "Swiggy",
  "Zomato",
  "Swiggy",
  "Swiggy",
  "Zomato",
  "Swiggy",
  "Swiggy Instamart",
  "Zomato",
  "Swiggy",
  "Zomato",
  "Swiggy",
  "Swiggy"
] as const;

const FOOD_SECONDARY_MERCHANTS = [
  "Zomato",
  "Swiggy",
  "EatSure",
  "Zomato",
  "Domino's",
  "Swiggy",
  "Chaayos",
  "Zomato",
  "EatSure",
  "Swiggy",
  "Zomato",
  "Blinkit Cafe"
] as const;

const SHOPPING_PRIMARY_MERCHANTS = [
  "Amazon Pay",
  "Amazon Pay",
  "Flipkart",
  "Amazon Pay",
  "Myntra",
  "Amazon Pay",
  "Flipkart",
  "Amazon Pay",
  "Myntra",
  "Amazon Pay",
  "Flipkart",
  "Amazon Pay"
] as const;

const SHOPPING_SECONDARY_MERCHANTS = [
  "Myntra",
  "Flipkart",
  "Ajio",
  "Nykaa",
  "Amazon Pay",
  "Myntra",
  "Flipkart",
  "Amazon Pay",
  "Ajio",
  "Nykaa",
  "Myntra",
  "Flipkart"
] as const;

const TRAVEL_LOCAL_MERCHANTS = [
  "Uber",
  "Rapido",
  "Uber",
  "Ola",
  "Uber",
  "Rapido",
  "Ola",
  "Uber",
  "Rapido",
  "Uber",
  "Ola",
  "Uber"
] as const;

const TRAVEL_SECONDARY_MERCHANTS = [
  "Namma Metro",
  "IRCTC",
  "Uber",
  "Rapido",
  "IRCTC",
  "Uber",
  "Ola",
  "IRCTC",
  "Uber",
  "Rapido",
  "IRCTC",
  "Uber"
] as const;

const OTHER_MERCHANTS = [
  "Apollo Pharmacy",
  "BookMyShow",
  "PVR Cinemas",
  "Cult Fit",
  "Apollo Pharmacy",
  "BookMyShow",
  "PVR Cinemas",
  "Apollo Pharmacy",
  "Cult Fit",
  "BookMyShow",
  "Apollo Pharmacy",
  "PVR Cinemas"
] as const;

const TRANSFER_CONTACTS = [
  "Kiran",
  "Latha",
  "Maa",
  "Rohit",
  "Neha",
  "Sushila",
  "Kiran",
  "Maa",
  "Latha",
  "Rohit",
  "Neha",
  "Sushila"
] as const;

const CREDIT_CONTACTS = [
  "Ananya",
  "Rohan",
  "Priya",
  "Aarav",
  "Nisha",
  "Siddharth",
  "Ananya",
  "Rohan",
  "Priya",
  "Aarav",
  "Nisha",
  "Siddharth"
] as const;

const SAMPLE_MONTHS: SampleMonthPlan[] = [
  {
    year: 2025,
    month: 4,
    foodLift: 40,
    travelLift: 60,
    billLift: 50,
    shoppingLift: 180,
    transferAmount: 1850,
    otherLift: 40,
    creditLift: 120,
    specialDebits: [
      {
        day: 24,
        merchant: "IRCTC",
        description: "Paid to IRCTC weekend train tickets",
        amount: 1480,
        type: "debit",
        category: "Travel"
      }
    ]
  },
  {
    year: 2025,
    month: 5,
    foodLift: 60,
    travelLift: 80,
    billLift: 70,
    shoppingLift: 240,
    transferAmount: 1920,
    otherLift: 30,
    creditLift: 140
  },
  {
    year: 2025,
    month: 6,
    foodLift: 35,
    travelLift: 130,
    billLift: 40,
    shoppingLift: 190,
    transferAmount: 1980,
    otherLift: 55,
    creditLift: 110,
    specialCredits: [
      {
        day: 26,
        merchant: "Amazon Pay",
        description: "Refund from Amazon Pay",
        amount: 620,
        type: "credit",
        category: "Others"
      }
    ]
  },
  {
    year: 2025,
    month: 7,
    foodLift: 70,
    travelLift: 110,
    billLift: 90,
    shoppingLift: 280,
    transferAmount: 2050,
    otherLift: 65,
    creditLift: 150
  },
  {
    year: 2025,
    month: 8,
    foodLift: 55,
    travelLift: 180,
    billLift: 80,
    shoppingLift: 260,
    transferAmount: 2140,
    otherLift: 45,
    creditLift: 140,
    specialDebits: [
      {
        day: 27,
        merchant: "Ixigo",
        description: "Paid to Ixigo flight booking",
        amount: 5240,
        type: "debit",
        category: "Travel"
      }
    ]
  },
  {
    year: 2025,
    month: 9,
    foodLift: 65,
    travelLift: 90,
    billLift: 60,
    shoppingLift: 460,
    transferAmount: 2180,
    otherLift: 55,
    creditLift: 130,
    specialDebits: [
      {
        day: 25,
        merchant: "Amazon Pay",
        description: "Paid to Amazon Pay festive electronics",
        amount: 4120,
        type: "debit",
        category: "Shopping"
      }
    ]
  },
  {
    year: 2025,
    month: 10,
    foodLift: 80,
    travelLift: 100,
    billLift: 70,
    shoppingLift: 720,
    transferAmount: 2240,
    otherLift: 70,
    creditLift: 180,
    specialDebits: [
      {
        day: 24,
        merchant: "Flipkart",
        description: "Paid to Flipkart festival order",
        amount: 6180,
        type: "debit",
        category: "Shopping"
      }
    ],
    specialCredits: [
      {
        day: 27,
        merchant: "Amazon Pay",
        description: "Refund from Amazon Pay",
        amount: 780,
        type: "credit",
        category: "Others"
      }
    ]
  },
  {
    year: 2025,
    month: 11,
    foodLift: 45,
    travelLift: 70,
    billLift: 60,
    shoppingLift: 230,
    transferAmount: 2080,
    otherLift: 40,
    creditLift: 110
  },
  {
    year: 2025,
    month: 12,
    foodLift: 75,
    travelLift: 220,
    billLift: 90,
    shoppingLift: 310,
    transferAmount: 2300,
    otherLift: 80,
    creditLift: 200,
    specialDebits: [
      {
        day: 23,
        merchant: "MakeMyTrip",
        description: "Paid to MakeMyTrip holiday hotel",
        amount: 7640,
        type: "debit",
        category: "Travel"
      }
    ],
    specialCredits: [
      {
        day: 28,
        merchant: "Rohan",
        description: "Received from Rohan trip split",
        amount: 1680,
        type: "credit",
        category: "Transfers"
      }
    ]
  },
  {
    year: 2026,
    month: 1,
    foodLift: 60,
    travelLift: 110,
    billLift: 150,
    shoppingLift: 420,
    transferAmount: 2360,
    otherLift: 70,
    creditLift: 160,
    specialDebits: [
      {
        day: 22,
        merchant: "ACKO",
        description: "Paid to ACKO annual insurance",
        amount: 2940,
        type: "debit",
        category: "Bills"
      }
    ]
  },
  {
    year: 2026,
    month: 2,
    foodLift: 30,
    travelLift: 60,
    billLift: 40,
    shoppingLift: 170,
    transferAmount: 1900,
    otherLift: 35,
    creditLift: 120,
    specialCredits: [
      {
        day: 24,
        merchant: "Priya",
        description: "Received from Priya dinner split",
        amount: 740,
        type: "credit",
        category: "Transfers"
      }
    ]
  },
  {
    year: 2026,
    month: 3,
    foodLift: 70,
    travelLift: 140,
    billLift: 60,
    shoppingLift: 360,
    transferAmount: 2140,
    otherLift: 60,
    creditLift: 170,
    specialDebits: [
      {
        day: 26,
        merchant: "Amazon Pay",
        description: "Paid to Amazon Pay home office upgrade",
        amount: 2860,
        type: "debit",
        category: "Shopping"
      }
    ]
  }
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function roundAmount(value: number): number {
  return Math.round(value / 10) * 10;
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number
): number {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (weekday - firstDay + 7) % 7;
  return 1 + offset + (occurrence - 1) * 7;
}

function createTransaction(
  id: number,
  year: number,
  month: number,
  seed: SampleTransactionSeed
): Transaction {
  return {
    id: `upi-sample-${id}`,
    date: toIsoDate(year, month, seed.day),
    description: seed.description,
    merchant: seed.merchant,
    amount: roundAmount(seed.amount),
    type: seed.type,
    category: seed.category,
    source: "UPI"
  };
}

function buildBaseMonthSeeds(plan: SampleMonthPlan, monthIndex: number): SampleTransactionSeed[] {
  const primaryFood = FOOD_PRIMARY_MERCHANTS[monthIndex];
  const secondaryFood = FOOD_SECONDARY_MERCHANTS[monthIndex];
  const primaryShopping = SHOPPING_PRIMARY_MERCHANTS[monthIndex];
  const secondaryShopping = SHOPPING_SECONDARY_MERCHANTS[monthIndex];
  const localTravel = TRAVEL_LOCAL_MERCHANTS[monthIndex];
  const secondaryTravel = TRAVEL_SECONDARY_MERCHANTS[monthIndex];
  const otherMerchant = OTHER_MERCHANTS[monthIndex];
  const transferContact = TRANSFER_CONTACTS[monthIndex];
  const creditContact = CREDIT_CONTACTS[monthIndex];

  return [
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 6, 1),
      merchant: primaryFood,
      description: `Paid to ${primaryFood} weekend dinner`,
      amount: 260 + plan.foodLift + monthIndex * 8,
      type: "debit",
      category: "Food"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 0, 1),
      merchant: secondaryFood,
      description: `Paid to ${secondaryFood} Sunday order`,
      amount: 190 + plan.foodLift * 0.75 + (monthIndex % 3) * 20,
      type: "debit",
      category: "Food"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 2, 2),
      merchant: localTravel,
      description: `Paid to ${localTravel} city rides`,
      amount: 140 + plan.travelLift * 0.35 + (monthIndex % 4) * 18,
      type: "debit",
      category: "Travel"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 4, 1),
      merchant: "Airtel",
      description: "Paid to Airtel mobile recharge",
      amount: 320 + plan.billLift * 0.3 + (monthIndex % 2) * 20,
      type: "debit",
      category: "Bills"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 3, 2),
      merchant: "BESCOM",
      description: "Paid to BESCOM electricity bill",
      amount: 980 + plan.billLift + (monthIndex % 3) * 40,
      type: "debit",
      category: "Bills"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 5, 2),
      merchant: primaryShopping,
      description: `Paid to ${primaryShopping} home and lifestyle order`,
      amount: 1050 + plan.shoppingLift + (monthIndex % 3) * 90,
      type: "debit",
      category: "Shopping"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 6, 2),
      merchant: "Chaayos",
      description: "Paid to Chaayos snacks and tea",
      amount: 110 + plan.foodLift * 0.28 + (monthIndex % 2) * 15,
      type: "debit",
      category: "Food"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 1, 3),
      merchant: transferContact,
      description: `Paid to ${transferContact} household transfer`,
      amount: 1220 + plan.transferAmount * 0.18 + (monthIndex % 3) * 35,
      type: "debit",
      category: "Transfers"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 5, 3),
      merchant: secondaryTravel,
      description: `Paid to ${secondaryTravel} travel booking`,
      amount: 420 + plan.travelLift * 0.8 + (monthIndex % 4) * 30,
      type: "debit",
      category: "Travel"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 6, 3),
      merchant: secondaryShopping,
      description: `Paid to ${secondaryShopping} fashion and essentials`,
      amount: 760 + plan.shoppingLift * 0.58 + (monthIndex % 4) * 55,
      type: "debit",
      category: "Shopping"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 0, 3),
      merchant: otherMerchant,
      description: `Paid to ${otherMerchant}`,
      amount: 360 + plan.otherLift + (monthIndex % 3) * 35,
      type: "debit",
      category: "Others"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 1, 4),
      merchant: "Kiran",
      description: "Paid to Kiran monthly share transfer",
      amount: plan.transferAmount,
      type: "debit",
      category: "Transfers"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 3, 4),
      merchant: "ACT Fibernet",
      description: "Paid to ACT Fibernet broadband bill",
      amount: 760 + plan.billLift * 0.45 + (monthIndex % 3) * 35,
      type: "debit",
      category: "Bills"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 2, 4),
      merchant: "Amazon Pay",
      description: "Paid to Amazon Pay groceries and home restock",
      amount: 620 + plan.shoppingLift * 0.42 + (monthIndex % 3) * 45,
      type: "debit",
      category: "Shopping"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 0, 4),
      merchant: "Swiggy Instamart",
      description: "Paid to Swiggy Instamart quick grocery run",
      amount: 230 + plan.foodLift * 0.48 + (monthIndex % 2) * 20,
      type: "debit",
      category: "Food"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 5, 4),
      merchant: creditContact,
      description: `Received from ${creditContact} shared expense settlement`,
      amount: 320 + plan.creditLift + (monthIndex % 4) * 35,
      type: "credit",
      category: "Transfers"
    },
    {
      day: getNthWeekdayOfMonth(plan.year, plan.month, 6, 4),
      merchant: "PhonePe",
      description: "Cashback from PhonePe",
      amount: 80 + plan.creditLift * 0.18 + (monthIndex % 3) * 12,
      type: "credit",
      category: "Others"
    }
  ];
}

function buildSampleTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  let nextId = 1;

  SAMPLE_MONTHS.forEach((plan, monthIndex) => {
    const seeds = [
      ...buildBaseMonthSeeds(plan, monthIndex),
      ...(plan.specialDebits ?? []),
      ...(plan.specialCredits ?? [])
    ].sort((first, second) => first.day - second.day);

    seeds.forEach((seed) => {
      transactions.push(createTransaction(nextId, plan.year, plan.month, seed));
      nextId += 1;
    });
  });

  return transactions;
}

export const upiMockTransactions: Transaction[] = buildSampleTransactions();

export const upiMockStatementMetadata: UpiStatementMetadata = {
  provider: "PhonePe",
  statementPeriod: "01 Apr 2025 to 31 Mar 2026",
  sourceAccounts: ["XXXXXX9600", "XXXX912082"],
  fileType: "sample",
  transactionCount: upiMockTransactions.length
};
