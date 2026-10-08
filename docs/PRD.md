# Product Requirements Document

## 제품 개요

AI Club OS는 인공지능 동아리와 스터디 구성원이 학습, 실험, AI Log, 공유, 프로젝트, 발표, 회고를 한 공간에서 이어 가도록 돕는 작업 공간입니다.

## 문제

동아리 활동의 자료, 출석, 실험 기록, 결과물이 여러 도구에 흩어지면 활동의 맥락과 학습 과정이 사라집니다. 구성원은 무엇을 시도했고 무엇을 배웠는지 다시 찾기 어렵고, 운영자는 활동의 흐름을 파악하기 어렵습니다.

## 제품 목표

- 운영자가 Club, Member, Session, Attendance를 한 공간에서 관리할 수 있게 한다.
- 구성원이 Session의 맥락 안에서 AI Log를 남길 수 있게 한다.
- 활동 기록이 이후 AI Insight, Project, Web Presentation으로 이어질 기반을 만든다.

## 제품 원칙

- Activity -> Knowledge -> Intelligence -> Action
- Record. Understand. Build.
- 기록 기능은 AI 기능 없이도 온전히 사용할 수 있어야 한다.
- AI Log를 핵심 Entity로 삼는다.

## MVP 범위

- Google Login
- Club
- Member
- Session
- Attendance
- AI Log

## MVP 제외 범위

- AI Insight 생성
- Project 관리
- Web Presentation 제작과 공개
- 별도 Spring Boot 서버
- 복잡한 자동화와 여러 AI Agent 조율

## 성공 기준 초안

- 사용자가 Google Login으로 접속할 수 있다.
- 운영자가 Club을 만들고 Member와 Session을 관리할 수 있다.
- 운영자가 Session별 Attendance를 기록할 수 있다.
- 구성원이 Session에 연결된 AI Log를 만들고 다시 확인할 수 있다.
- 다른 Club의 데이터에는 접근할 수 없다.

