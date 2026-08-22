'use client';

import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';

export interface PasswordComplexityStatus {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

export function checkPasswordComplexity(password: string): PasswordComplexityStatus {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar, isValid };
}

interface PasswordRequirementsChecklistProps {
  password: string;
}

export function PasswordRequirementsChecklist({ password }: PasswordRequirementsChecklistProps) {
  const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar } = checkPasswordComplexity(password);

  const requirements = [
    { label: 'At least 8 characters long', met: minLength },
    { label: 'At least 1 uppercase letter (A-Z)', met: hasUppercase },
    { label: 'At least 1 lowercase letter (a-z)', met: hasLowercase },
    { label: 'At least 1 number (0-9)', met: hasNumber },
    { label: 'At least 1 special character (!@#$%^&*)', met: hasSpecialChar }
  ];

  return (
    <div className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-[11px]">
      <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
        <ShieldCheck className="w-4 h-4 text-sky-500" /> Industry Password Security Requirements:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 font-medium transition ${
              req.met ? 'text-emerald-600 font-semibold' : 'text-slate-400'
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3] shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
