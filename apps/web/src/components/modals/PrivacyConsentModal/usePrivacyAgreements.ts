'use client';

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

  // 초기 상태와 비교했을 때 변경 사항 있으면 제출 버튼 활성화
  const isRequiredChecked = initialState.terms !== agreements.terms || initialState.privacy !== agreements.privacy;

  return { agreements, setAgreements, handleCheck, handleAllCheck, isRequiredChecked };
};
