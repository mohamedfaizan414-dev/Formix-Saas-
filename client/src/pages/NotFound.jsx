import * as React from "react";
import { Link } from "react-router-dom";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center dark:bg-paper-dark font-sans text-ink dark:text-white transition-colors duration-300 selection:bg-clinical-teal/20 selection:text-clinical-teal">
      
      {/* Visual Background Decors */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-clinical-teal/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-clinical-sage/5 blur-3xl" />

      <div className="relative max-w-md w-full rounded-2xl border border-ink/10 bg-white/70 backdrop-blur-md p-8 sm:p-10 dark:border-white/10 dark:bg-paper-darkdim/70 shadow-panel flex flex-col items-center animate-stampIn border-box">
        
        {/* Animated Icon Box */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-clinical-sagelight text-clinical-tealdeep mb-6 shadow-sm border border-clinical-teal/10 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-clinical-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <FileQuestion className="h-10 w-10 text-clinical-teal animate-pulse" strokeWidth={1.5} />
        </div>
        
        {/* Typography */}
        <h1 className="font-display text-7xl font-bold tracking-tight text-clinical-teal select-none drop-shadow-sm">404</h1>
        <h2 className="mt-2 text-xl font-bold font-display text-ink dark:text-white">Page Not Found</h2>
        
        <p className="mt-3 text-xs sm:text-sm text-ink-soft leading-relaxed max-w-xs">
          The clinical route or document you are trying to access doesn't exist, has been archived, or moved.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.history.back()} 
            className="flex items-center gap-1.5 justify-center border-ink/15 text-ink hover:bg-ink/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Link to="/" className="w-full sm:w-auto shrink-0">
            <Button 
              size="sm" 
              className="flex items-center gap-1.5 justify-center w-full bg-clinical-teal text-white hover:bg-clinical-tealdeep"
            >
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
