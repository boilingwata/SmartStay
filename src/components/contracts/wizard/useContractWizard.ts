import { useContext } from 'react';
import { ContractWizardContext } from './contractWizardContext';

export function useContractWizard() {
  const context = useContext(ContractWizardContext);
  if (!context) {
    throw new Error('useContractWizard must be used within a ContractWizardProvider');
  }

  return context;
}
