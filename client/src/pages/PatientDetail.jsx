import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { Button } from "../components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { IssueFormSection } from "./patient-detail/issue-form-section";
import { AssignmentRowActions } from "./patient-detail/assignment-row-actions";
import { toast } from "sonner";

export default function PatientDetailPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [fetching, setFetching] = React.useState(true);

  const fetchPatientDetails = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error("Failed to load patient profile");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
      toast.error("Patient profile not found or unauthorized.");
      navigate("/dashboard/patients");
    } finally {
      setFetching(false);
    }
  }, [id, navigate]);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user && id) {
      fetchPatientDetails();
    }
  }, [user, loading, id, navigate, fetchPatientDetails]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user || !data) return null;

  const { patientData, availableForms, versionSchemaById = {} } = data;

  return (
    <AppShell active="patients">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 space-y-6 text-ink dark:text-white">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/patients">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="stamp text-[10px] text-clinical-sage">Patient Clinical File</p>
            <h1 className="text-xl font-semibold tracking-tight">
              {patientData.firstName} {patientData.lastName}
            </h1>
          </div>
        </div>

        <div className="rounded-md border border-ink/10 bg-white p-5 dark:border-white/10 dark:bg-paper-darkdim shadow-panel">
          <p className="text-xs font-mono text-ink-soft">
            Email: <span className="text-ink dark:text-white font-medium">{patientData.email}</span>
          </p>
          {patientData.phone && (
            <p className="text-xs font-mono text-ink-soft mt-1">
              Phone: <span className="text-ink dark:text-white font-medium">{patientData.phone}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-sage">Intake History Ledger</h3>
            <div className="rounded-md border border-ink/10 bg-white divide-y divide-ink/8 dark:bg-paper-darkdim dark:border-white/10 overflow-hidden shadow-panel">
              {patientData.assignments.map((asg) => {
                const formTitle = asg.formTitle ?? asg.formId;
                return (
                  <div key={asg.id} className="p-4 flex sm:items-center justify-between flex-col sm:flex-row gap-3 text-sm">
                    <div>
                      <h4 className="font-medium text-ink dark:text-white">{formTitle}</h4>
                      <p className="text-xs text-ink-soft/70 mt-0.5">Issued: {new Date(asg.sentAt).toLocaleDateString()}</p>
                    </div>
                    
                    <AssignmentRowActions 
                      assignment={{
                        id: asg.id,
                        status: asg.status,
                        formTitle: formTitle,
                        payload: asg.payload,
                        formVersionId: asg.formVersionId
                      }}
                      formVersionSchema={versionSchemaById[asg.formVersionId]}
                      onSuccess={fetchPatientDetails}
                    />
                  </div>
                );
              })}
              {patientData.assignments.length === 0 && (
                <p className="p-6 text-xs italic text-ink-soft/50 text-center bg-white dark:bg-paper-darkdim">
                  No digital forms have been issued to this profile yet.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-sage">Issue Document</h3>
            <IssueFormSection
              patientId={patientData.id}
              patientEmail={patientData.email}
              patientName={`${patientData.firstName ?? ""} ${patientData.lastName ?? ""}`.trim()}
              availableForms={availableForms}
              onSuccess={fetchPatientDetails}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
