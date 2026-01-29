import { useState } from 'react';

export const usePrivacyAgreements = (initialState = { terms: false, privacy: false }) => {
  const [agreements, setAgreements] = useState(initialState);

  const handleCheck = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAllCheck = () => {
    const nextState = !Object.values(agreements).every(Boolean);
    setAgreements({ terms: nextState, privacy: nextState });
  };

  const isRequiredChecked = agreements.terms && agreements.privacy;

  return { agreements, setAgreements, handleCheck, handleAllCheck, isRequiredChecked };
};
