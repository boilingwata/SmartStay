import type { ReactNode } from 'react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ContractWizardContext } from './contractWizardContext';
import type { ContractWizardSchema } from './contractWizardShared';

interface ContractWizardProviderProps {
  children: ReactNode;
  form: UseFormReturn<ContractWizardSchema>;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function ContractWizardProvider({ children, form, currentStep, onStepChange }: ContractWizardProviderProps) {
  const [canNavigateNext, setCanNavigateNext] = useState(true);

  const value = {
    step: currentStep,
    setStep: (newStep: number | ((prev: number) => number)) => {
      const nextStep = typeof newStep === 'function' ? newStep(currentStep) : newStep;
      onStepChange(nextStep);
    },
    form,
    isLastStep: currentStep === 4,
    canNavigateNext,
    setCanNavigateNext,
  };

  return <ContractWizardContext.Provider value={value}>{children}</ContractWizardContext.Provider>;
}
