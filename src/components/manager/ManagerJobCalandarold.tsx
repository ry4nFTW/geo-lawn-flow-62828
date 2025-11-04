// src/components/manager/ManagerJobCalendar.tsx
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import { JobCard } from "../dashboard/JobCard"; // reuse your card component
import { JobEditor } from "../job/JobEditor";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface Job {
  id: string;
  title: string;
  description: string | null;
  address: string;
  estimated_duration: number | null;
  suggested_price: number | null;
  status: string;
  scheduled_date: string | null;
  auto_populated_confidence: number;
  customer_name?: string;
}

const ManagerJobCalendar: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // optional: modal states if you want to edit on click
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    // Replace this with your API call or state
    const fetchJobs = async () => {
      const response = await fetch("/api/jobs"); // adjust to your API
      const data: Job[] = await response.json();
      setJobs(data.filter(job => job.status === "active" || job.status === "pending"));
      setLoading(false);
    };
    fetchJobs();
  }, []);

  if (loading) return <div>Loading calendar...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manager Job Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={jobs.map(job => ({
            id: job.id,
            title: job.title,
            date: job.scheduled_date || new Date().toISOString(), // fallback if no date
            color: job.status === "active" ? "green" : "orange",
          }))}
          eventClick={(info) => {
            setSelectedJobId(info.event.id);
            setShowEditor(true);
          }}
        />
      </CardContent>

      {showEditor && selectedJobId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl z-60">
            <div className="flex justify-between items-center p-3 border-b">
              <h4 className="font-semibold">Edit Job</h4>
              <Button variant="ghost" onClick={() => setShowEditor(false)}>Close</Button>
            </div>
            <div className="p-4">
              <JobEditor
                jobId={selectedJobId}
                onSaved={() => setShowEditor(false)}
                onCancel={() => setShowEditor(false)}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ManagerJobCalendar;

