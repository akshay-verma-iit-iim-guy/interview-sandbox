// Mock data so every prototype works with zero setup. Swap fields to fit the prompt.

export type Priority = "High" | "Medium" | "Low";
export type Status = "New" | "In progress" | "Waiting" | "Resolved";

export type CaseRecord = {
  id: string;
  title: string;
  requester: string;
  category: string;
  priority: Priority;
  status: Status;
  channel: "Portal" | "Email" | "Chat";
  createdAt: string; // ISO, fixed so server and client render the same
  slaHoursLeft: number;
  description: string;
};

export const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
export const STATUSES: Status[] = ["New", "In progress", "Waiting", "Resolved"];
export const CATEGORIES = ["Payroll", "Leave", "Benefits", "Onboarding", "Access", "Policy"];

const seed: Array<Omit<CaseRecord, "id" | "createdAt">> = [
  { title: "Salary credited short this month", requester: "Priya Nair", category: "Payroll", priority: "High", status: "New", channel: "Portal", slaHoursLeft: 3, description: "Net pay is lower than last month with no change in deductions shown on the payslip." },
  { title: "How many casual leaves are left?", requester: "Rahul Mehta", category: "Leave", priority: "Low", status: "Resolved", channel: "Chat", slaHoursLeft: 40, description: "Wants to confirm leave balance before planning a trip in December." },
  { title: "Add spouse to health insurance", requester: "Ananya Rao", category: "Benefits", priority: "Medium", status: "In progress", channel: "Email", slaHoursLeft: 18, description: "Recently married and needs to add spouse before the enrolment window closes." },
  { title: "Laptop not delivered for new joiner", requester: "Vikram Singh", category: "Onboarding", priority: "High", status: "Waiting", channel: "Portal", slaHoursLeft: 6, description: "Joiner starts Monday; asset request shows approved but no shipment yet." },
  { title: "Cannot access payroll portal", requester: "Sneha Iyer", category: "Access", priority: "Medium", status: "New", channel: "Chat", slaHoursLeft: 12, description: "Login fails with an SSO error since the password reset." },
  { title: "Work-from-home allowance policy", requester: "Arjun Das", category: "Policy", priority: "Low", status: "In progress", channel: "Email", slaHoursLeft: 30, description: "Asks whether the internet allowance covers a second connection." },
  { title: "Maternity leave start date change", requester: "Kavya Reddy", category: "Leave", priority: "High", status: "In progress", channel: "Portal", slaHoursLeft: 5, description: "Doctor advised an earlier start; needs the leave record updated." },
  { title: "Form 16 not available", requester: "Rohit Kulkarni", category: "Payroll", priority: "Medium", status: "Waiting", channel: "Email", slaHoursLeft: 20, description: "Needs Form 16 for a home loan application." },
  { title: "Gym reimbursement claim rejected", requester: "Meera Joshi", category: "Benefits", priority: "Low", status: "New", channel: "Portal", slaHoursLeft: 36, description: "Claim rejected for missing invoice, but invoice was attached." },
  { title: "Buddy not assigned for new hire", requester: "Farhan Ali", category: "Onboarding", priority: "Medium", status: "New", channel: "Chat", slaHoursLeft: 22, description: "Manager asks for an onboarding buddy for a joiner starting next week." },
  { title: "Need access to analytics workspace", requester: "Divya Menon", category: "Access", priority: "Low", status: "Resolved", channel: "Portal", slaHoursLeft: 48, description: "Requires viewer access for the quarterly review." },
  { title: "Relocation bonus tax treatment", requester: "Siddharth Jain", category: "Policy", priority: "Medium", status: "In progress", channel: "Email", slaHoursLeft: 14, description: "Wants to know if the relocation bonus is taxed in one month or spread out." },
  { title: "Overtime not paid for October", requester: "Lakshmi Pillai", category: "Payroll", priority: "High", status: "New", channel: "Chat", slaHoursLeft: 2, description: "Approved overtime hours are missing from the latest payslip." },
  { title: "Parental leave for adoption", requester: "Nikhil Verma", category: "Leave", priority: "Medium", status: "New", channel: "Portal", slaHoursLeft: 26, description: "Asks how many weeks of leave apply for adoption." },
  { title: "Dental cover for parents", requester: "Pooja Shah", category: "Benefits", priority: "Low", status: "Waiting", channel: "Email", slaHoursLeft: 44, description: "Wants to know if parents can be added for dental cover." },
  { title: "Badge not working at new office", requester: "Karan Malhotra", category: "Access", priority: "High", status: "In progress", channel: "Portal", slaHoursLeft: 4, description: "Transferred to the Hyderabad office; badge not activated there." },
];

const BASE = Date.UTC(2026, 9, 16, 9, 0, 0);

export const mockRecords: CaseRecord[] = seed.map((r, i) => ({
  ...r,
  id: `CS-${String(1042 + i)}`,
  createdAt: new Date(BASE - i * 5 * 3600 * 1000).toISOString(),
}));

export const weeklyVolume = [
  { week: "Aug 24", opened: 182, resolved: 160 },
  { week: "Aug 31", opened: 175, resolved: 171 },
  { week: "Sep 7", opened: 201, resolved: 178 },
  { week: "Sep 14", opened: 214, resolved: 190 },
  { week: "Sep 21", opened: 196, resolved: 205 },
  { week: "Sep 28", opened: 188, resolved: 199 },
  { week: "Oct 5", opened: 209, resolved: 201 },
  { week: "Oct 12", opened: 223, resolved: 214 },
];

export type Suggestion = {
  text: string;
  confidence: number;
  sources: string[];
};

// Simulated model output, one per category. Confidence is deliberately varied so both
// the confident path and the "needs review" path can be shown.
const suggestions: Record<string, Suggestion> = {
  Payroll: { text: "I've checked your payslip. The difference comes from the revised tax projection this month. You'll see the breakdown under Deductions > Income tax. If it still looks wrong, reply here and payroll will review it within two working days.", confidence: 0.62, sources: ["Understanding your payslip", "Monthly tax projection FAQ"] },
  Leave: { text: "You can see your current balance under Leave > My balance. Casual leave resets on January 1 and unused days don't carry forward.", confidence: 0.91, sources: ["Leave policy 2026", "Checking your leave balance"] },
  Benefits: { text: "You can add a spouse within 30 days of marriage. Upload the marriage certificate under Benefits > Life events and the change applies from the next premium cycle.", confidence: 0.84, sources: ["Life events and insurance", "Health insurance enrolment guide"] },
  Onboarding: { text: "I've flagged the asset request to IT with the start date. You'll get a tracking update within one working day.", confidence: 0.55, sources: ["New joiner checklist"] },
  Access: { text: "This SSO error usually clears after a session reset. Sign out of all sessions from the identity portal, wait five minutes, then sign in again.", confidence: 0.78, sources: ["Fixing SSO sign-in errors"] },
  Policy: { text: "The internet allowance covers one connection per employee, up to the monthly limit in the remote work policy.", confidence: 0.69, sources: ["Remote work policy", "Allowances FAQ"] },
};

export function suggestionFor(category: string): Suggestion {
  return suggestions[category] ?? { text: "I couldn't find a matching article for this request.", confidence: 0.3, sources: [] };
}
