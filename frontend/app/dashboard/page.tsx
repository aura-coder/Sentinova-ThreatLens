import { redirect } from "next/navigation";

export default function DashboardRoot() {
  // Automatically bounce users to the Analyst dashboard
  redirect("/dashboard/analyst");
}
