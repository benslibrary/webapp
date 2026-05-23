# 국립중앙도서관 Open API 통합 레퍼런스

원본 마크다운을 하나로 합친 문서입니다. **중복된「Open API 개요」는 한 번만** 수록했고, API별 고유 내용은 빠짐없이 유지했습니다.

| 원본 파일 | 개정/날짜(원문 표기) |
|-----------|---------------------|
| OPENAPI_GUIDE.md | 2020. 3. — 소장 검색 + ISBN 서지(SearchApi) |
| 소장자료.md | 2024. 4. — 소장 검색(갱신본) |
| 국가자료종합.md | 2020. 3. |
| 사서추천.md | 2020. 8. |
| 서지.md | 2021. 8. — 대한민국 국가서지(사서지원) |

---

## 통합 목차

1. [Open API 개요 (공통)](#1-open-api-개요-공통)
2. [API 종류 한눈에 보기](#2-api-종류-한눈에-보기)
3. [소장자료 검색 `search.do`](#3-소장자료-검색-searchdo)
4. [ISBN 서지정보 `SearchApi.do`](#4-isbn-서지정보-searchapido)
5. [국가자료종합목록 `searchKolisNet.do`](#5-국가자료종합목록-searchkolisnetdo)
6. [사서추천도서 `saseoApi.do`](#6-사서추천도서-saseoapido)
7. [대한민국 국가서지 `seojiSearch.do`](#7-대한민국-국가서지-seojisearchdo)
8. [에러 코드 통합 참고](#8-에러-코드-통합-참고)

---

## 1. Open API 개요 (공통)

### 1.1 Open API 정의

Open API란 일반적으로 웹 서비스(Web Services)형태로써 특정 기능 혹은 콘텐츠 서비스를 위해 외부에 접근 방법을 공개한 형태를 개방형 인터페이스(이하 OPEN API)라 합니다.

### 1.2 Open API 동작원리

API의 동작 단계는 이용자 입장에서 요청(request)하는 단계와, 결과(response)값을 받아 해석(parse)하는 단계로 구성됩니다.

이용자는 해당 Open API 주소 뒤에 매개변수 값을 붙이는 GET 방식 또는 페이지 폼 안의 변수에 대한 POST 전달방식을 통하여 API 매개변수 값을 전달하고, 서버에서 처리 수행한 결과를 반환 받습니다.

- GET 방식 매개변수 구성 예시: `URL?변수=변수값1&변수2=변수값2` … (`&`로 변수 구분)

### 1.3 Open API 표 (원문 분류 요약)

| 분류 | API |
|------|-----|
| 자료검색 | 일반검색, 상세정보요청 |
| 자료검색 (국가자료종합목록) | 일반검색, 상세정보요청 |
| 사서추천도서 | 기간별 / 분류별 조회 |
| 대한민국 국가서지 | 일반검색, 상세정보요청 |
| ISBN 서지(출판예정 등) | SearchApi |

---

## 2. API 종류 한눈에 보기

| 구분 | 기본 URL |
|------|----------|
| 소장자료 검색 | `https://www.nl.go.kr/NL/search/openApi/search.do` |
| ISBN 서지정보 | `https://www.nl.go.kr/seoji/SearchApi.do` |
| 국가자료종합목록 | `https://www.nl.go.kr/NL/search/openApi/searchKolisNet.do` |
| 사서추천도서 | `https://nl.go.kr/NL/search/openApi/saseoApi.do` |
| 대한민국 국가서지 | `https://librarian.nl.go.kr/LI/search/openApi/seojiSearch.do` |

---

## 3. 소장자료 검색 (`search.do`)

> **권장 본문**: `소장자료.md`(2024.4) 기준. 아래는 해당 파일 전체를 정리한 형태이며, 2020 가이드와 다른 점은 [3.A](#3a-2020-가이드와-2024-소장자료-문서-차이)에 모았습니다.

### 3.1 일반검색

소장 자료를 조회할 수 있는 기능을 제공합니다.

※ utf-8 인코딩  
※ Kwd 값과 상세검색 값은 혼용하여 사용이 불가능 합니다.  
※ 검색조건 및 맵핑되는 검색어가 하나이상 들어가야 합니다.

#### 3.1.1 일반검색 요청 URL (request url)

`https://www.nl.go.kr/NL/search/openApi/search.do`

- 온프라인자료(구:소장정보)  
  `https://www.nl.go.kr/NL/search/openApi/search.do?systemType=오프라인자료`
- 온라인자료(구:디지털화자료)  
  `https://www.nl.go.kr/NL/search/openApi/search.do?systemType=온라인자료`
- 정부간행물(구:정부간행물) 자료검색  
  `https://www.nl.go.kr/NL/search/openApi/search.do?govYn=Y`

#### 3.1.2 소장정보 요청 변수 (request parameter)

| NO | 변수명 | TYPE | 값 설명 |
|----|--------|------|---------|
| 1 | key | String(필수) | 발급키 |
| 2 | srchTarget | | total (전체), title (제목), author (저자), publisher (발행자), cheonggu (청구기호), 생략시 전체 |
| 3 | kwd | String | 검색어 |
| 4 | pageNum | Integer(필수) | 현재페이지 |
| 5 | pageSize | Integer(필수) | 쪽당출력건수 (기본 10건) |
| 6 | systemType | String | 오프라인자료 (구: 소장정보), 온라인자료 (구: 디지털화자료) |
| 7 | category | String | [카테고리(자료유형)] 도서, 고서/고문서, 학위논문, 잡지/학술지, 신문, 기사, 멀티미디어, 장애인자료, 외부연계자료, 웹사이트 수집, 기타, 해외한국관련기록물 |
| 8 | lnbTypeName (멀티미디어,장애인자료) | String | [멀티미디어 하위분류] 오디오북, 음악자료, 지도자료, 이미지/사진, 컴퓨터파일, 영상자료, 마이크로자료 / [장애인자료 하위분류] 점자자료, 장애인대체자료 |
| 9 | offerDcode2s (소장원문) | String | [자료제공DB별 자체분류 2차_명] CH4G (한국고문헌종합목록), CH4A (고지도), CH48 (신문학대표소설), CH4Q (학술회원자료), CH4E (어린이, 청소년 관련 자료), CH47 (문화체육관광부 발간자료), CH4M (독도관련자료), CH4I (우수학술도서), CH43 (관보(1894~1945)), CH44 (한글판 고전소설), CH4R (교과서]), CH4B (연속간행물 귀중본), CH49 (신문(~1950)), CH4P (정부간행물), CH4T (악보), CH4F (일본어자료(~1945)), CH45 (단행자료), CH41 (고서), CH4L (한국관련외국어자료), CH4D (인문과학분야 박사학위논문), CH4J (한국고전백선), CH4K (국내발간 한국관련 외국어자료) |
| 10 | sort | | 정렬 (생략시 : 정확도순) ititle (제목), iauthor (저자), ipublisher (발행처), ipub_year (발행년도), cheonggu (청구기호) |
| 11 | order | | asc (오름차순), desc (내림차순) — *2020 가이드에서는 변수명 `desc`로 동일 의미 기술* |
| 12 | apiType | | xml, json |
| 13 | licYn | | 원문이용방법(원문저작권) S, F, Y, L, N, C, U, T, R, D, A (각각 원문에 상세) |
| 14 | govYn | String | Y (정부간행물) |

**licYn** 상세 (2024 소장자료 원문):

- S ([국립중앙도서관,협약도서관]-인쇄 시 과금)
- F ([국립중앙도서관,협약도서관]-열람,인쇄시 과금)
- Y ([국립중앙도서관,협약공공도서관,정기이용증소지자]-무료)
- L ([국립중앙도서관]-무료)
- N ([관외이용]-무료)
- C ([국립중앙도서관,작은도서관]-무료)
- U ([국립중앙도서관,국립어린이청소년도서관]-무료)
- T ([국립중앙도서관,국립어린이청소년도서관,작은도서관]-무료)
- R ([국립중앙도서관,정기이용증소지자]-무료)
- D ([국립중앙도서관,국립어린이청소년도서관,국립세종도서관]-무료)
- A ([국립중앙도서관,국립어린이청소년도서관,국립세종도서관,정기이용증소지자]-무료)

**예시 (2024 소장자료)**

- Example1> 검색어 : ‘토지’, 카테고리 도서  
  `https://www.nl.go.kr/NL/search/openApi/search.do?key=[발급된키값]&apiType=xml&srchTarget=total&kwd=%ED%86%A0%EC%A7%80&pageSize=10&pageNum=1&sort=&category=%EB%8F%84%EC%84%9C`
- Example2> 검색어 : ‘토지’, 원문이용방법 관외이용(무료)  
  `https://www.nl.go.kr/NL/search/openApi/search.do?key=[발급된키값]&apiType=xml&srchTarget=total&kwd=%ED%86%A0%EC%A7%80&pageSize=10&pageNum=1&licYn=N`
- Example3> 자료제공DB별 자체분류 2차_명 신문대표소설 (`offerDcode2s`, 2024 문서)  
  `https://www.nl.go.kr/NL/search/openApi/search.do?key=[발급된키값]&apiType=xml&detailSearch=true&offerDcode2s=CH48&pageSize=10&pageNum=1`

### 3.2 상세검색

#### 3.2.1 소장정보 요청 변수 (request parameter) — 공통

| NO | 변수명 | TYPE | 값 설명 |
|----|--------|------|---------|
| 1 | detailSearch | boolean | [상세검색 사용유무] true / false(기본) |
| 2 | f1 | String | 검색조건1: total (전체), title (표제/논문명), keyword (키워드), author (저자), publisher (발행자) |
| 3 | v1 | String | 키워드1 |
| 4 | and1 | String | AND / OR / NOT (검색어 연결조건1) |
| 5 | f2 | String | 검색조건2 (동일 후보) |
| 6 | v2 | String | 키워드2 |
| 7 | and2 | String | AND / OR / NOT (검색어 연결조건2) |
| 8 | f3 | String | 검색조건3 (동일 후보) |
| 9 | v3 | String | 키워드3 |
| 10 | and3 | String | AND / OR / NOT (검색어 연결조건3) |
| 11 | f4 | String | 검색조건4: total, title, keyword, author, publisher, abs_keyword (초록), toc_keyword (목차) |
| 12 | v4 | String | 키워드4 |
| 13 | and4 | String | AND / OR / NOT (검색어 연결조건4) |
| 14 | isbnOp | | isbn, issn (isbn 구분) |
| 15 | isbnCode | | isbn(issn) 코드값 |
| 16 | guCode3 | | 별치기호 |
| 17 | guCode4 | | 분류기호 |
| 18 | guCode5 | | 도서 |
| 19 | guCode6 | | 권책 |
| 20 | guCode7 | | 한국대학명 |
| 21 | guCode8 | | 한국정부기관명 |
| 22 | gu10 | | 판종유형/판종 |
| 23 | guCode11 | | CIP제어번호 |
| 24 | gu12 | | 본문언어 |
| 25 | gu13 | | 요약언어 |
| 26 | gu14 | | 간행빈도 |
| 27 | sYear | | 발행년도 시작일 |
| 28 | eYear | | 발행년도 종료일 |
| 29 | gu2 | | [분류기호] kdc, kdcp, ddc, cec, cwc, coc, gpo |
| 30 | guCode2 | | 분류코드값 |

**예시**

- Example1> 제목: ’토지’, 저자: ’박경리’  
  `https://www.nl.go.kr/NL/search/openApi/search.do?key=[발급된키값]&kwd=%ED%86%A0%EC%A7%80&detailSearch=true&f1=title&v1=%ED%86%A0%EC%A7%80&f2=author&v2=%EB%B0%95%EA%B2%BD%EB%A6%AC`
- Example1> ISBN 검색  
  `https://www.nl.go.kr/NL/search/openApi/search.do?key=[발급된키값]&detailSearch=true&isbnOp=isbn&isbnCode=8984993727`

### 3.3 출력 결과 필드 (response field)

#### 3.3.1 소장정보 출력 결과 필드

| NO | 결과 | 설명 |
|----|------|------|
| 1 | kwd | 검색어 |
| 2 | category | 카테고리 |
| 3 | pageNum | 현재페이지 |
| 4 | pageSize | 쪽당출력건수 (기본 10건) |
| 5 | sort | 정렬 |
| 6 | total | 검색건수 |
| 7 | title_info | 표제 리스트 |
| 8 | type_name | 자료유형 |
| 9 | place_info | 자료있는곳명칭(본관) |
| 10 | author_info | 저작자 |
| 11 | pub_info | 발행자 |
| 12 | menu_name | 메뉴명 |
| 13 | media_name | 매체구분 |
| 14 | manage_name | 자료있는곳 명 |
| 15 | pub_year_info | 발행년도사항 |
| 16 | control_no | 제어번호 |
| 17 | doc_yn | 원문유무 |
| 18 | org_link | 원문링크 |
| 19 | id | 종키 |
| 20 | type_code | 자료유형코드 |
| 21 | lic_yn | 저작권유무 |
| 22 | lic_text | 저작권설명 |
| 23 | reg_date | 비치일 |
| 24 | detail_link | 상세페이지경로 |
| 25 | isbn | ISBN |
| 26 | call_no | 청구기호 |
| 27 | kdc_code_1s | 동양서분류기호 대분류 코드 |
| 28 | kdc_name_1s | 동양서분류기호 대분류 명칭 |

### 3.4 에러 메시지 (소장자료 검색)

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 000 | SYSTEM ERROR | SYSTEM 오류 |
| 010 | NO KEY VALUE | 인증키값 누락 |
| 011 | INVALID KEY | 유효하지 않은 인증키 |
| 012 | DATA LIMIT 500 | 검색결과 이동시 500건 제한(500건 이후 데이터 조회불가) |
| 013 | CATEGORY ERROR | 카테고리값 입력오류 |
| 014 | PARAMETER VALIDATION ERROR | 파라메터 입력값 오류 |
| 015 | REQUIRED PARAMETER MISSING | 필수 파라메터 입력 오류(검색어 or 상세검색) |
| 101 | SEARCH ERROR | 검색서버 오류 |

### 3.A 2020 가이드와 2024 소장자료 문서 차이

다음은 **원본 두 파일에만** 있던 차이를 빠짐없이 남긴 것입니다.

1. **정렬 방향 파라미터 이름**  
   - OPENAPI_GUIDE(2020): 변수명 `desc` — 값 asc (오름차순), desc (내림차순)  
   - 소장자료(2024): 변수명 `order` — 값 asc, desc  

2. **자료제공DB 코드 예시 URL의 쿼리 키**  
   - OPENAPI_GUIDE Example3: `offerDbcode2s=CH48`  
   - 소장자료 Example3: `offerDcode2s=CH48`  
   - 변수 표에는 `offerDcode2s`로 기술되어 있으나, 구 가이드 예시만 `offerDbcode2s`이므로 **실연동 시 공식 문서/응답으로 확인**할 것.

3. **CH4G 설명 문자열**  
   - OPENAPI_GUIDE: `CH4G (한국고전적종합목록)`  
   - 소장자료: `CH4G (한국고문헌종합목록)`  
   - 위 3.1.2 표는 2024 소장자료 문구를 따랐고, 2020 표기는 이 각주로 보존.

---

## 4. ISBN 서지정보 (`SearchApi.do`)

(출처: OPENAPI_GUIDE.md — 자료검색과 별도 엔드포인트)

일반검색 요청 URL:

`https://www.nl.go.kr/seoji/SearchApi.do`

- 미납본 목록 (구:출판예정도서):  
  `https://www.nl.go.kr/seoji/SearchApi.do?deposit_yn=N`

### 4.1 요청 변수 (request parameter)

| NO | 요청변수 | TYPE | 색인방법 | 값 설명 |
|----|----------|------|----------|---------|
| 1 | cert_key | String(필수) | | 인증키 |
| 2 | result_style | String(필수) | | 결과 형식 (json, xml) |
| 3 | page_no | Integer(필수) | | 현재 쪽번호(페이지 1부터 시작) |
| 4 | page_size | Integer(필수) | | 쪽당 출력건수 |
| 5 | isbn | String | 우절단 검색 | ISBN |
| 6 | set_isbn | String | 우절단 검색 | SET ISBN |
| 7 | ebook_yn | String | 일치검색 | 전자책여부 Y, N |
| 8 | title | String | 형태소 + ngram | 본표제 |
| 9 | start_publish_date | String | 범위검색 | 발행예정일 시작(8자리, yyyymmdd) |
| 10 | end_publish_date | String | 범위검색 | 발행예정일 끝(8자리, yyyymmdd) |
| 11 | cip_yn | String | 일치검색 | CIP 신청여부 Y, N |
| 12 | deposit_yn | String | 일치검색 | 납본유무 Y, N |
| 13 | series_title | String | 형태소 + ngram | 총서명 |
| 14 | publisher | String | 형태소 + ngram | 발행처명 |
| 15 | author | String | 형태소 + ngram | 저자 |
| 16 | form | String | 일치검색 | 형태사항 (종이책, 혼합자료, 전자책, 오디오북, 기타 전자출판물, 다양한 제본형태, 다양한 형식혼합 세트) |
| 17 | sort | String | | 정렬 PUBLISH_PREDATE, INPUT_DATE, INDEX_TITLE, INDEX_PUBLISHER |
| 18 | order_by | String | | 정렬방식 ASC, DESC |

※ API 샘플 URL:

`https://www.nl.go.kr/seoji/SearchApi.do?cert_key=[발급된키값]&result_style=json&page_no=1&page_size=10&start_publish_date=20220509&end_publish_date=20220509`

### 4.2 출력 결과 항목

| NO | 출력항목 | TYPE | 값 설명 |
|----|----------|------|---------|
| 1 | PAGE_NO | String | 현재 쪽번호 |
| 2 | TOTAL_COUNT | String | 전체 출력수 |
| 3 | TITLE | String | 표제 |
| 4 | VOL | String | 권차 |
| 5 | SERIES_TITLE | String | 총서명 |
| 6 | SERIES_NO | String | 총서편차 |
| 7 | AUTHOR | String | 저자 |
| 8 | EA_ISBN | String | ISBN |
| 9 | EA_ADD_CODE | String | ISBN 부가기호 |
| 10 | SET_ISBN | String | 세트 ISBN |
| 11 | SET_ADD_CODE | String | 세트 ISBN 부가기호 |
| 12 | SET_EXPRESSION | String | 세트표현 (세트, 전2권.) |
| 13 | PUBLISHER | String | 발행처 |
| 14 | EDITION_STMT | String | 판사항 |
| 15 | PRE_PRICE | String | 예정가격 |
| 16 | KDC | String | 한국십진분류 |
| 17 | DDC | String | 듀이십진분류 |
| 18 | PAGE | String | 페이지 |
| 19 | BOOK_SIZE | String | 책크기 |
| 20 | FORM | String | 발행제본형태 |
| 21 | PUBLISH_PREDATE | String | 출판예정일 |
| 22 | SUBJECT | String | 주제 |
| 23 | EBOOK_YN | String | 전자책여부 (Y: 전자책, N : 인쇄책) |
| 24 | CIP_YN | String | CIP 신청여부 (Y: CIP신청, N: CIP신청안함) |
| 25 | CONTROL_NO | String | CIP 제어번호 |
| 26 | TITLE_URL | String | 표지이미지 URL |
| 27 | BOOK_TB_CNT_URL | String | 목차 |
| 28 | BOOK_INTRODUCTION_URL | String | 책소개 |
| 29 | BOOK_SUMMARY_URL | String | 책요약 |
| 30 | PUBLISHER_URL | String | 출판사 홈페이지 URL |
| 31 | INPUT_DATE | String | 등록날짜 |
| 32 | UPDATE_DATE | String | 수정날짜 |

※ 제공서비스에 따라 출력결과 필드는 제한될 수 있습니다.

### 4.3 에러 메시지 (ISBN 서지)

| 에러코드 | 설명 |
|----------|------|
| 000 | 시스템오류 |
| 010 | 인증키값 누락 |
| 011 | 유효하지 않은 인증키 |
| 015 | 필수 파라메터 입력 누락 |

---

## 5. 국가자료종합목록 (`searchKolisNet.do`)

(출처: 국가자료종합.md, 2020. 3.)

### 5.1 일반검색

국가자료종합목록을 조회할 수 있는 기능을 제공합니다.

※ utf-8 인코딩  
※ Kwd 값과 상세검색 값은 혼용하여 사용이 불가능 합니다.  
※ 검색조건 및 맵핑되는 검색어가 하나이상 들어가야 합니다.

#### 5.1.1 일반검색 요청 URL

`https://www.nl.go.kr/NL/search/openApi/searchKolisNet.do`

#### 5.1.2 국가자료종합목록 요청 변수

| NO | 변수명 | TYPE | 값 설명 |
|----|--------|------|---------|
| 1 | key | String(필수) | 발급키 |
| 2 | srchTarget | | total (전체), title (제목), author (저자), publisher (발행자), 생략시 전체 |
| 3 | kwd | String | 검색어 |
| 4 | pageNum | Integer(필수) | 현재페이지 |
| 5 | pageSize | Integer(필수) | 쪽당출력건수 (기본 10건) |
| 9 | sort | | [정렬 (생략시 : 정확도순)] ititle (제목), iauthor (저자), ipublisher (발행처), ipub_year (발행년도), cheonggu (청구기호) |
| 10 | desc | | asc (오름차순), desc (내림차순) |

*원문 표에 NO 6~8 부재(원본 그대로).*

Example1> 검색어 : ‘정보’

`https://www.nl.go.kr/NL/search/openApi/searchKolisNet.do?key=[발급된키값]&kwd=%EC%A0%95%EB%B3%B4&apiType=xml&searchType=&sort=`

### 5.2 상세검색

#### 5.2.1 국가자료종합목록 요청 변수 — 공통

| NO | 변수명 | TYPE | 값 설명 |
|----|--------|------|---------|
| 1 | detailSearch | boolean | 상세검색 사용유무 : true / false(기본) |
| 2 | f1 | String | 검색조건1: total, title, keyword, author, publisher |
| 3 | v1 | String | 키워드1 |
| 4 | and1 | String | 검색어 연결조건1 ( AND / OR / NOT ) |
| 5 | f2 | String | 검색조건2 |
| 6 | v2 | String | 키워드2 |
| 7 | and2 | String | AND / OR / NOT (검색어 연결조건2) |
| 8 | f3 | String | 검색조건3 |
| 9 | v3 | String | 키워드3 |
| 10 | and3 | String | AND / OR / NOT (검색어 연결조건3) |
| 11 | f4 | String | 검색조건4 |
| 12 | v4 | String | 키워드4 |
| 13 | and4 | String | AND / OR / NOT (검색어 연결조건4) |
| 14 | f5 | | 검색조건5: total, title, keyword, author, publisher |
| 15 | v5 | | 키워드5 |
| 16 | isbnOp | | isbn, issn (isbn 구분) |
| 17 | isbnCode | | isbn(issn) 코드값 |
| 18 | sYear | | 발행년도 시작일 |
| 19 | eYear | | 발행년도 종료일 |
| 20 | guCode8 | | 한국정부기관명 |

Example1> 제목: ’토지’, 저자: ’박경리’

`https://www.nl.go.kr/NL/search/openApi/searchKolisNet.do?key=[발급된키값]&kwd=%ED%86%A0%EC%A7%80&detailSearch=true&f1=title&v1=%ED%86%A0%EC%A7%80&f2=author&v2=%EB%B0%95%EA%B2%BD%EB%A6%AC`

### 5.3 출력 결과 필드

#### 5.3.1 국가자료종합목록 출력 결과 필드

| NO | 결과 | 설명 |
|----|------|------|
| 1 | kwd | 검색어 |
| 2 | category | 카테고리 |
| 3 | pageNum | 현재페이지 |
| 4 | pageSize | 쪽당출력건수 (기본 10건) |
| 5 | sort | 정렬 |
| 6 | total | 검색건수 |
| 7 | title_info | 표제 리스트 |
| 8 | type_name | 자료유형 |
| 9 | place_info | 자료있는곳명칭(본관) |
| 10 | author_info | 저작자 |
| 11 | pub_info | 발행자 |
| 12 | menu_name | 메뉴명 |
| 13 | media_name | 매체구분 |
| 14 | manage_name | 자료있는곳 명 |
| 15 | pub_year_info | 발행년도사항 |
| 16 | control_no | 제어번호 |
| 17 | doc_yn | 원문유무 |
| 18 | org_link | 원문링크 |
| 19 | id | 종키 |
| 20 | type_code | 자료유형코드 |
| 21 | lic_yn | 저작권유무 |
| 22 | lic_text | 저작권설명 |
| 23 | reg_date | 비치일 |
| 24 | isbn | ISBN |
| 25 | call_no | 청구기호 |
| 26 | kdc_code_1s | 동양서분류기호 대분류 코드 |
| 27 | kdc_name_1s | 동양서분류기호 대분류 명칭 |

*소장자료 응답에 있는 `detail_link` 등은 이 API 원문 표에 없음.*

### 5.4 에러 메시지 (국가자료종합)

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 000 | SYSTEM ERROR | SYSTEM 오류 |
| 010 | NO KEY VALUE | 인증키값 누락 |
| 011 | INVALID KEY | 유효하지 않은 인증키 |
| 015 | REQUIRED PARAMETER MISSING | 필수 파라메터 입력 오류(검색어) |
| 101 | SEARCH ERROR | 검색서버 오류 |

---

## 6. 사서추천도서 (`saseoApi.do`)

(출처: 사서추천.md, 2020. 8.)

### 6.1 일반검색

기간별/분류별 사서추천도서를 조회할 수 있는 기능을 제공합니다.

#### 6.1.1 요청 변수 (원문 표제「채용정보 요청 변수」— 내용은 사서추천 API)

호출 URL: `https://nl.go.kr/NL/search/openApi/saseoApi.do`

| 번호 | 항목 | 설명 | 타입 | 필수 |
|------|------|------|------|------|
| 1 | Key | API 발급키 | STRING | Y |
| 2 | startRowNumApi | 시작번호 (1부터 시작) | INT | N |
| 3 | endRowNumApi | 종료번호 | INT | N |
| 4 | start_date | 검색 시작일 | INT | N |
| 5 | end_date | 검색 종료일 | INT | N |
| 6 | drCode | 분류번호(11:문학, 6:인문과학, 5:사회과학 4:자연과학) | INT | N |

### 6.2 출력 결과 필드

| 번호 | 항목 | 설명 |
|------|------|------|
| 1 | `<totalCount>` | 전체 데이터 건수 |
| 2 | `<list>` | 사서추천 도서목록 |

`<list>` 항목 내부:

| 번호 | 항목 | 설명 |
|------|------|------|
| 1 | recomNo | 게시물 추천 번호(sequence) |
| 2 | drcode | 분류번호 |
| 3 | decodeName | 분류명 |
| 4 | recomtitle | 추천도서 제목 |
| 5 | recomauthor | 추천도서 작가 |
| 6 | recompublisher | 추천도서 자료출판사 |
| 7 | rcomcallno | 추천도서 청구기호 |
| 8 | recomfilepath | 추천도서 이미지 경로 |
| 9 | recommokcha | 추처도서 목차 *(원문 오기)* |
| 10 | recomcontents | 추천도서 자료내용 |
| 11 | Regdate | 추천도서 등록일 |
| 12 | controlNo | 추천도서 제어번호 |
| 13 | publishYear | 추천도서 발행년도 |
| 14 | recomYear | 추천도서 추천년도 |
| 15 | recomMonth | 추천도서 추천월 |
| 16 | mokchFilePath | 목차 이미지 경로 |
| 17 | recome_isbn | 추천도서 ISBN |

### 6.3 샘플 XML (원문 그대로)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<channel>
<totalCount>1737</totalCount>
<list>
<item>
<recomNo>20191204111046556100</recomNo>
<drCode>4</drCode>
<drCodeName>자연과학</drCodeName>
<recomtitle>어른답게 삽시다 : 미운 백 살이 되고 싶지 않은 어른들을 위하여 : 이시형 에세이</recomtitle>
<recomauthor>지은이·그린이: 이시형</recomauthor>
<recompublisher>특별한서재</recompublisher>
<recomcallno>818-19-819</recomcallno>
<recomisbn>9788937473005 9788937473272</recomisbn>
<recomfilepath>http://www.nl.go.kr/afile/fileDownload/vtmmn</recomfilepath>
<recommokcha><p>test</p></recommokcha>
<recomcontens><p>test</p></recomcontens>
<regdate>2019.12.04</regdate>
<controlNo>KMO201936389</controlNo>
<publishYear>2019</publishYear>
<recomYear>2019</recomYear>
<recomMonth>11</recomMonth>
<mokchFilePath>http://mokcha.nl.go.kr/kolis/2019/KMO201936389_thumbnail.jpg</mokchFilePath>
</item>
</list>
</channel>
```

*샘플에 `recomcontens`, 표에는 `recomcontents` — 원문 불일치 그대로 보존.*

### 6.4 에러 메시지 (사서추천)

| 에러코드 | 설명 |
|----------|------|
| 010 | 인증키값 누락 |
| 011 | 유효하지 않은 인증키 |

---

## 7. 대한민국 국가서지 (`seojiSearch.do`)

(출처: 서지.md, 2021. 8. — 호스트 `librarian.nl.go.kr`)

### 7.1 일반검색

사서지원서비스 대한민국 국가서지를 조회할 수 있는 기능을 제공합니다.

※ utf-8 인코딩  
※ Kwd 값과 상세검색 값은 혼용하여 사용이 불가능 합니다.  
※ 검색조건 및 맵핑되는 검색어가 하나이상 들어가야 합니다.

#### 7.1.1 일반검색 요청 URL

`https://librarian.nl.go.kr/LI/search/openApi/seojiSearch.do`

#### 7.1.2 국가서지 요청 변수

| NO | 변수명 | TYPE | 값 설명 |
|----|--------|------|---------|
| 1 | key | String(필수) | 발급키 |
| 2 | kwd | String | 검색어 |
| 3 | pageNum | Integer(필수) | 현재페이지 |
| 4 | pageSize | Integer(필수) | 쪽당출력건수 (기본 10건) |
| 5 | sort | | 정렬 (생략시 : 정확도순) title_asc, title_desc, author_asc, author_desc, pub_asc, pub_desc, pubyear_asc, pubyear_desc |
| 6 | apiType | | xml, json |

Example1> 검색어 : ‘토지’ *(URL 인코딩은 원문이 `kwd=%EC%A0%95%EB%B3%B4` 로 되어 있음 — 원문 보존)*

`https://librarian.nl.go.kr/LI/search/openApi/seojiSearch.do?key=[발급된키값]&kwd=%EC%A0%95%EB%B3%B4&pageNum=1&pageSize=10`

Example2> 검색어 : ‘토지’, 정렬 제목(ㄱ~ㅎ순) *(원문 동일 인코딩)*

`https://librarian.nl.go.kr/LI/search/openApi/seojiSearch.do?key=[발급된키값]&kwd=%EC%A0%95%EB%B3%B4&sort=title_asc&pageNum=1&pageSize=10`

### 7.2 상세검색

#### 7.2.1 국가서지 요청 변수 — 공통

| NO | 변수명 | TYPE | 값 설명 |
|----|--------|------|---------|
| 1 | detailSearch | boolean | [상세검색 사용유무] true / false(기본) |
| 2 | seoji_year | String | 수록연도 |
| 3 | f1 | | 검색조건1 ( 값이 없는 경우 : 전체 ) title, author, publisher, keyword |
| 4 | v1 | String | 키워드1 |
| 5 | and1 | String | AND / OR / NOT (검색어 연결조건1) |
| 6 | f2 | String | 검색조건2 |
| 7 | v2 | String | 키워드2 |
| 8 | and2 | String | AND / OR / NOT (검색어 연결조건2) |
| 9 | f3 | String | 검색조건3 |
| 10 | v3 | String | 키워드3 |
| 11 | isbnOp | | isbn, issn (isbn 구분) |
| 12 | isbnCode | | isbn(issn) 코드값 |
| 13 | kdcOp | | 분류기호: kdc, ddc, kdcp, cec, coc, cwc |
| 14 | kdcCode | | 분류기호 |
| 15 | typeCode | | 자료구분: 일반도서, 학위논문, 정부간행물, 아동도서, 교과서, 학습참고서, 한장본, 점자도서, 비도서, 연속간행물, (국외발행)한국관련자료, 온라인자료 |

Example1> 제목: ’토지’, 저자: ’박경리’

`https://librarian.nl.go.kr/LI/search/openApi/seojiSearch.do?key=[발급된키값]&detailSearch=true&f1=title&v1=%ED%86%A0%EC%A7%80&f2=author&v2=%EB%B0%95%EA%B2%BD%EB%A6%AC`

Example1> 자료구분 ‘아동도서’ 검색

`https://librarian.nl.go.kr/LI/search/openApi/seojiSearch.do?key=[발급된키값]&detailSearch=true&typeCode=%EC%95%84%EB%8F%99%EB%8F%84%EC%84%9C`

### 7.3 출력 결과 필드

#### 7.3.1 국가서지 출력 결과 필드

| NO | 결과 | 설명 |
|----|------|------|
| 1 | kwd | 검색어 |
| 3 | pageNum | 현재페이지 |
| 4 | pageSize | 쪽당출력건수 (기본 10건) |
| 5 | sort | 정렬 |
| 6 | total | 검색건수 |
| 7 | title_info | 표제 리스트 |
| 8 | author_info | 저작자 |
| 9 | pub_info | 발행자 |
| 10 | pub_year_info | 발행년도사항 |
| 11 | category | 제어번호 |
| 12 | doc_yn | 원문유무 |
| 13 | seoji_year | 수록연도 |
| 14 | page_info | 형태사항 |
| 15 | detail_link | 상세페이지경로 |

*원문 표에 NO 2 없음.*

### 7.4 에러 메시지 (국가서지)

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 000 | SYSTEM ERROR | SYSTEM 오류 |
| 010 | NO KEY VALUE | 인증키값 누락 |
| 011 | INVALID KEY | 유효하지 않은 인증키 |
| 012 | DATA LIMIT 500 | 검색결과 이동시 500건 제한(500건 이후 데이터 조회불가) |
| 101 | SEARCH ERROR | 검색서버 오류 |

---

## 8. 에러 코드 통합 참고

API마다 코드 집합이 다릅니다. 위 각 절에 전체를 두었고, 여기서는 **등장한 코드만** 묶었습니다.

| 코드 | 의미(요약) | 나타나는 API |
|------|------------|----------------|
| 000 | 시스템 오류 | 소장, ISBN서지, 국가자료종합, 국가서지 |
| 010 | 인증키 누락 | 전부 |
| 011 | 유효하지 않은 인증키 | 전부 |
| 012 | 500건 제한 | 소장, 국가서지 |
| 013 | 카테고리 오류 | 소장 |
| 014 | 파라메터 검증 오류 | 소장 |
| 015 | 필수 파라메터 누락 | 소장, ISBN서지, 국가자료종합 |
| 101 | 검색 서버 오류 | 소장, 국가자료종합, 국가서지 |

---

*끝. 개별 원본(`OPENAPI_GUIDE.md`, `소장자료.md`, `국가자료종합.md`, `사서추천.md`, `서지.md`)과 충돌 시에는 이 파일의「3.A」 및 각주를 우선 확인하세요.*
