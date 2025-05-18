"use client";

import { useState } from "react";
import { Calendar } from "cally";
import "cally/dist/style.css";

export default function MyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold mb-4">📅 Calendrier des paiements</h2>
      <Calendar
        onDateSelect={(date) => setSelectedDate(date)}
        className="rounded-lg shadow-md bg-base-100 p-4"
      />
      {selectedDate && (
        <p className="mt-4 text-lg">
          Date sélectionnée : {selectedDate.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

