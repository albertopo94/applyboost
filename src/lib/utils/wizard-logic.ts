export interface WizardState {
  cvFile: File | null;
  cvText: string;
  jobUrl: string;
  jobText: string;
}

export interface WizardInputStates {
  isCvFileDisabled: boolean;
  isCvTextDisabled: boolean;
  isJobUrlDisabled: boolean;
  isJobTextDisabled: boolean;
}

/**
 * Pure function to determine which inputs should be disabled based on current content.
 * Follows mutual exclusivity rules defined in Specs.
 */
export function getWizardInputStates(state: WizardState): WizardInputStates {
  const { cvFile, cvText, jobUrl, jobText } = state;

  return {
    isCvFileDisabled: cvText.trim().length > 0,
    isCvTextDisabled: cvFile !== null,
    isJobUrlDisabled: jobText.trim().length > 0,
    isJobTextDisabled: jobUrl.trim().length > 0,
  };
}
