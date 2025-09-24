"use client";

import { PlanEditor } from "@/components/editor";
import { SeatPlan } from "@/lib/types";
import { samplePlanWithSeats } from "@/lib/sampleData";

export default function SeatMapCreator() {
  const handlePlanChange = (plan: SeatPlan) => {
    console.log("Plan modifié:", plan);
    // Ici on pourrait sauvegarder automatiquement
  };

  return (
    <main className="h-screen w-full">
      <PlanEditor 
        initialPlan={samplePlanWithSeats}
        onChange={handlePlanChange}
        className="h-full"
      />
    </main>
  );
}
