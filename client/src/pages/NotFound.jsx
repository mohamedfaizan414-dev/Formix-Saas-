import * as React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center dark:bg-paper-dark font-sans text-ink dark:text-white">
      <div className="max-w-md rounded-lg border border-ink/10 bg-white p-8 dark:border-white/10 dark:bg-paper-darkdim shadow-panel flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clinical-sagelight text-clinical-tealdeep mb-6">
          <FileQuestion className="h-8 w-8" strokeWidth={1.5} />
        </div>
        
        <h1 className="font-display text-4xl font-bold tracking-tight text-clinical-teal">404</h1>
        <h2 className="mt-2 text-xl font-semibold font-display">Page Not Found</h2>
        
        <p className="mt-3 text-sm text-ink-soft leading-relaxed">
          The clinical route or document you are trying to access doesn't exist, has been archived, or moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button variant="outline" size="sm" onClick={() => window.history.back()} className="flex items-center gap-1.5 justify-center">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Link to="/">
            <Button size="sm" className="flex items-center gap-1.5 justify-center w-full">
              <Home className="h-4 w-4" /> Back to Safety
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
