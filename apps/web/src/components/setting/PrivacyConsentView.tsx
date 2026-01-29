'use client';

import { useEffect, useState } from 'react';
import { PrivacyConsentForm } from '../modals/PrivacyConsentModal';
import { toast } from 'react-toastify';
import { ConsentType } from '@repo/dto/values';
import LoadingSpinner from '../LoadingSpinner';
import { getRecentConsents } from '@/api';

interface ConsentState {
  terms: boolean;
  privacy: boolean;
}

export default function PrivacyConsentView() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialConsentState, setInitialConsentStates] = useState<ConsentState>({ terms: false, privacy: false });

  useEffect(() => {
    const fetchConsentStatus = async () => {
      try {
        const { items } = await getRecentConsents();
        setInitialConsentStates((prev) =>
          items.reduce<ConsentState>((acc, { type, agreed }) => {
            if (type === ConsentType.TERMS_OF_SERVICE) acc.terms = agreed;
            if (type === ConsentType.PRIVACY_POLICY) acc.privacy = agreed;
            return acc;
          }, prev),
        );
      } catch (e) {
        console.error(e);
        toast.error('동의 정보를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsentStatus();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto px-8 py-14 max-w-4xl">
      <h1 className="mb-12 text-2xl font-semibold text-center">서비스 이용 약관 확인 및 철회</h1>
      {/* 약관 본문 
        <section className="space-y-6 leading-relaxed text-gray-800">
          <p>
            본 서비스는 이용자에게 보다 적합한 음악 게시물 및 콘텐츠를 추천하기 위하여 서비스 이용 과정에서 발생하는 <strong>이용 기록(행동 로그)</strong>을
            수집·이용하고자 합니다.
          </p>
  
          <p>
            본 동의는 선택 사항이며, 동의하지 않더라도 회원가입 및 서비스의 기본 기능은 이용하실 수 있습니다.
            <br/><span className="underline">다만, 개인화된 콘텐츠 추천 기능은 제한되거나 비개인화된 방식으로 제공될 수 있습니다.</span>
          </p>
  
          <div>
            <h2 className="font-medium text-gray-900">1. 수집·이용 목적</h2>
            <p className="mt-2">본 서비스는 다음의 목적을 위하여 이용자의 서비스 이용 기록을 수집·이용합니다.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>이용자의 음악 취향 및 관심사 분석</li>
              <li>개인화된 음악 게시물 및 피드 추천 제공</li>
              <li>추천 알고리즘 고도화 및 서비스 품질 개선</li>
            </ul>
          </div>
  
          <div>
            <h2 className="font-medium text-gray-900">2. 수집하는 이용 기록 항목</h2>
            <p className="mt-2">본 서비스는 서비스 이용 과정에서 아래와 같은 이용 기록을 수집할 수 있습니다.</p>
  
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium">① 게시물 열람 및 콘텐츠 소비 정보</p>
                <ul className="mt-1 list-disc pl-5">
                  <li>이용자가 열어본 게시글 정보 및 열람 시간</li>
                  <li>서비스 내에서 재생한 음악의 개수 및 각 음악별 청취 시간</li>
                </ul>
              </div>
  
              <div>
                <p className="font-medium">② 이용자의 반응 및 상호작용 정보</p>
                <ul className="mt-1 list-disc pl-5">
                  <li>이용자가 좋아요를 누른 게시글</li>
                  <li>좋아요를 취소한 게시글</li>
                  <li>게시글에 대한 댓글 작성 여부 및 댓글 내용</li>
                </ul>
              </div>
  
              <div>
                <p className="font-medium">③ 음악 이용 관련 정보</p>
                <ul className="mt-1 list-disc pl-5">
                  <li>이용자가 재생한 음악 정보</li>
                  <li>이용자의 개인 플레이리스트에 추가한 음악 정보</li>
                </ul>
              </div>
  
              <div>
                <p className="font-medium">④ 소셜 활동 정보</p>
                <ul className="mt-1 list-disc pl-5">
                  <li>이용자가 팔로우한 사용자 정보</li>
                </ul>
              </div>
            </div>
  
            <p className="mt-3 text-sm text-gray-600">※ 상기 이용 기록은 이용자 계정 식별 정보와 결합되어 처리될 수 있습니다.</p>
          </div>
  
          <div>
            <h2 className="font-medium text-gray-900">3. 보유 및 이용 기간</h2>
            <p className="mt-2">본 동의에 따라 수집된 이용 기록은 동의 철회 시 또는 회원 탈퇴 시까지 보유·이용됩니다.</p>
            <p className="mt-1">단, 관계 법령에 따라 일정 기간 보관이 필요한 경우에는 해당 법령에서 정한 기간 동안 보관됩니다.</p>
          </div>
  
          <div>
            <h2 className="font-medium text-gray-900">4. 동의 거부에 따른 불이익 안내</h2>
            <p className="mt-2">이용자는 본 이용 기록 수집·이용에 대한 동의를 거부할 권리가 있습니다.</p>
            <p className="mt-1">동의를 거부하더라도 서비스 이용에는 제한이 없습니다. <span className="underline">다만, 개인 맞춤형 음악 게시물 추천, 피드 개인화 기능은 제공되지 않거나 제한될 수 있습니다.</span></p>
          </div>
  
          <div>
            <h2 className="font-medium text-gray-900">5. 동의 철회 및 처리 방법</h2>
            <p className="mt-2">이용자는 언제든지 본 동의를 철회할 수 있으며, 동의 철회는 다음의 방법을 통해 가능합니다.</p>
            <ul className="mt-1 list-disc pl-5">
              <li>서비스 내 [설정 &gt; 이용 약관 확인 및 철회] 페이지를 통한 직접 철회</li>
            </ul>
            <p className="mt-2">동의 철회 시, 개인화 추천을 위하여 수집·이용된 이용 기록은 관계 법령에 따라 지체 없이 파기되거나 비식별 처리됩니다.</p>
          </div>
  
          <div>
            <h2 className="font-medium text-gray-900">6. 기타 사항</h2>
            <p className="mt-2">본 동의는 개인화 추천 및 서비스 개선 목적에 한하여 적용됩니다.</p>
            <p className="mt-1">본 서비스는 본 동의와 관련된 이용 기록을 광고 목적의 제3자에게 제공하지 않습니다.</p>
            <p className="mt-1">본 서비스는 관련 법령을 준수하며, 이용자의 개인정보 및 이용 기록을 안전하게 관리합니다.</p>
          </div>
        </section>*/}
      <PrivacyConsentForm submitButtonText="동의 변경하기" initialState={initialConsentState} />
    </div>
  );
}
