import type { AiSettings } from "@/lib/types";

export const aiSettings: AiSettings = {
  tone: "Warm and friendly",
  neverClinicalAdvice: true,
  escalateWhenUnsure: true,
  escalationKeywords: ["pain", "worse", "swelling", "numb", "dizzy", "bleeding", "emergency", "complaint", "refund"],
  aiSignature: "Harbourside Physio assistant",
  faqs: [
    { id: "faq_parking", question: "Is there parking?", keywords: ["parking", "park", "car"], answer: "Yes, there's free 2-hour parking in the Riverbank Lane car park directly behind our building. We're on Level 2 and there's lift access from the car park. Street parking is also available on Riverbank Lane." },
    { id: "faq_fees", question: "What are your fees?", keywords: ["price", "fees", "fee", "cost", "how much"], answer: "An initial consult is $115 (45 min) and standard consults are $98 (30 min). We have HICAPS, so you can claim with your health fund on the spot and just pay the gap." },
    { id: "faq_hours", question: "What are your opening hours?", keywords: ["hours", "open", "close", "opening"], answer: "We're open Monday to Friday 8am–6pm and Saturday 8am–12pm. We're closed on Sundays and public holidays." },
    { id: "faq_referral", question: "Do I need a referral?", keywords: ["referral", "gp", "doctor"], answer: "No referral needed for private patients. If you're coming under a GP Chronic Disease Management plan, workers compensation or DVA, please bring your referral or claim details." },
    { id: "faq_bring", question: "What should I bring?", keywords: ["bring", "wear", "clothes"], answer: "Please wear comfortable clothing and bring any scans, reports or referral letters. Arrive 5 minutes early for your first visit to complete a short form." },
    { id: "faq_kids", question: "Can I bring my children?", keywords: ["baby", "kids", "children", "child"], answer: "Of course, little ones are very welcome! We have a pram-friendly lift and a change table in the accessible bathroom on Level 2." },
  ],
};
