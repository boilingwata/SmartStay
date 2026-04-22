import { createContext } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { ContractWizardSchema } from './contractWizardShared';

export interface ContractWizardContextType {
  step: number;
  setStep: (step: number | ((prev: number) => number)) => void;
  form: UseFormReturn<ContractWizardSchema>;
  isLastStep: boolean;
  canNavigateNext: boolean;
  setCanNavigateNext: (can: boolean) => void;
}

export const ContractWizardContext = createContext<ContractWizardContextType | undefined>(undefined);
