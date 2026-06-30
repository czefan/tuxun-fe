import type { QuestionTransitionFlight, QuestionTransitionQuestion } from './store'
import {
  getMyQuestionAnswerRecords,
  getQuestionAnswerRecords,
  myAnswerRecordLimit,
} from '@/features/questions'
import type { AnswerRecord } from '@/features/questions'
import { useAnswerRecordLikeStore } from '@/store/questionLike'
import { getDisplayedHeat, getScaledRecordImageSize, rpxToPx } from '@/utils'

const transitionAnswerRecordPreviewLimit = 2

export function renderQuestionTransitionMarkup(
  currentFlight: QuestionTransitionFlight,
  navBarStyle: string,
) {
  const question = currentFlight.question
  const cardMarkup = renderActivityCard(question)
  const pageMarkup = currentFlight.viewportSnapshot?.html || renderQuestionDetailPage(question, navBarStyle)
  const contentScrollTop = currentFlight.mode === 'leave' ? Math.max(0, currentFlight.scrollTop) : 0
  const scrollStyle = contentScrollTop
    ? `transform: translate3d(0, -${contentScrollTop}px, 0);`
    : ''

  return `
    <div class="question-global-transition__backdrop"></div>
    <div class="question-global-transition__frame">
      <div class="question-global-transition__page">
        <div class="question-global-transition__scroll" style="${escapeAttribute(scrollStyle)}">
          ${pageMarkup}
        </div>
      </div>
      <div class="question-global-transition__clone">
        ${cardMarkup}
      </div>
    </div>
    ${renderBottomBar(question)}
  `
}

function renderActivityCard(question: QuestionTransitionQuestion) {
  const cardLiked = Boolean(question.liked)
  const cardHeat = getDisplayedHeat(question.heat, cardLiked)
  const cover = escapeAttribute(question.cover)
  const heroStyle = getRatioStyle(question.coverWidth, question.coverHeight)
  const hasOverlay = Boolean(question.overlayText || question.isVideo)

  return `
    <div class="activity-card">
      <div class="activity-card__cover" style="${escapeAttribute(heroStyle)}">
        <img class="activity-card__image" src="${cover}" />
        ${hasOverlay ? '<div class="activity-card__cover-mask"></div>' : ''}
        ${
          question.overlayText
            ? `<span class="activity-card__overlay-text">${escapeHtml(question.overlayText)}</span>`
            : ''
        }
        ${
          question.isVideo
            ? '<div class="activity-card__video"><span class="activity-card__play">▶</span></div>'
            : ''
        }
      </div>
      <div class="activity-card__body">
        <span class="activity-card__title">${escapeHtml(question.title)}</span>
          <div class="activity-card__meta">
            <div class="activity-card__author">
              <div class="activity-card__avatar">
                <span class="activity-card__avatar-text">${escapeHtml(question.avatar)}</span>
              </div>
              <span class="activity-card__author-name">${escapeHtml(question.author)}</span>
            </div>
            ${renderLikeMount({
              liked: cardLiked,
              count: cardHeat,
              size: 'sm',
              className: 'activity-card__like-btn',
            })}
          </div>
        </div>
      </div>
    `
}

function renderQuestionDetailPage(question: QuestionTransitionQuestion, navBarStyle: string) {
  const answerRecords = getQuestionAnswerRecords(
    question.id,
    question.cover,
    question.coverWidth,
    question.coverHeight,
  )
  const myAnswerRecords = getMyQuestionAnswerRecords(
    question.id,
    question.cover,
    question.coverWidth,
    question.coverHeight,
  )
  const visibleAnswerRecords = answerRecords.slice(0, transitionAnswerRecordPreviewLimit)
  const heroStyle = getRatioStyle(question.coverWidth, question.coverHeight)
  const hasOverlay = Boolean(question.overlayText || question.isVideo)

  return `
    <div class="page-question-detail">
      <div class="question-detail__stage">
        <div class="question-global-transition__nav" style="${escapeAttribute(navBarStyle)}">
          <div class="question-global-transition__back">
            <div class="question-global-transition__back-arrow"></div>
          </div>
          <span class="question-global-transition__title">题目详情</span>
          <div class="question-global-transition__nav-side"></div>
        </div>

        <div class="question-detail__hero" style="${escapeAttribute(heroStyle)}">
          <img class="question-detail__hero-image" src="${escapeAttribute(question.cover)}" />
          ${hasOverlay ? '<div class="question-detail__hero-mask"></div>' : ''}
          ${
            question.overlayText
              ? `<span class="question-detail__overlay-text">${escapeHtml(question.overlayText)}</span>`
              : ''
          }
        </div>

        <div class="question-detail__content">
          <span class="question-detail__title">${escapeHtml(question.title)}</span>
          <div class="question-detail__author">
            <div class="question-detail__avatar">
              <span class="question-detail__avatar-text">${escapeHtml(question.avatar)}</span>
            </div>
            <div class="question-detail__author-info">
              <span class="question-detail__author-name">${escapeHtml(question.author)}</span>
            </div>
          </div>
          <span class="question-detail__body">${escapeHtml(question.body)}</span>
        </div>

        <div class="answer-records">
          <div class="answer-records__tabs">
            <div class="answer-records__tab answer-records__tab--active">
              <span class="answer-records__tab-title">作答成功</span>
              <span class="answer-records__tab-count">${answerRecords.length} 人</span>
              <div class="answer-records__tab-line"></div>
            </div>
            <div class="answer-records__tab">
              <span class="answer-records__tab-title">作答记录</span>
              <span class="answer-records__tab-count">${myAnswerRecords.length}/${myAnswerRecordLimit}</span>
            </div>
          </div>
          ${visibleAnswerRecords.map(record => renderAnswerRecord(record)).join('')}
        </div>
      </div>
    </div>
  `
}

function renderBottomBar(question: QuestionTransitionQuestion) {
  const cardLiked = Boolean(question.liked)
  const cardHeat = getDisplayedHeat(question.heat, cardLiked)
  const isAnswerEnded = Boolean(question.answerEnded)
  const answerButtonClass = [
    'question-detail__button',
    'question-global-transition__button',
    isAnswerEnded ? 'question-detail__button--ended' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const answerButtonText = isAnswerEnded ? '答题已结束' : '我要答题'

  return `
    <div class="question-global-transition__bottom">
      <div class="question-detail__bottom">
        <div class="${escapeAttribute(answerButtonClass)}">
          <span class="question-detail__button-text">${answerButtonText}</span>
        </div>
        ${renderLikeMount({
          liked: cardLiked,
          count: cardHeat,
          size: 'lg',
          className: 'question-detail__like',
        })}
      </div>
    </div>
  `
}

function renderAnswerRecord(record: AnswerRecord, briefMode = false) {
  const imageStyle = getAnswerRecordImageStyle(record)
  const answerRecordLikeStore = useAnswerRecordLikeStore()
  const liked = answerRecordLikeStore.getAnswerRecordLiked(record.id)
  const likes = liked ? record.likes + 1 : record.likes

  return `
    <div class="answer-record">
      <div class="answer-record__top">
        <div class="answer-record__avatar">
          <span class="answer-record__avatar-text">${escapeHtml(record.avatar)}</span>
        </div>
        <div class="answer-record__user">
          <span class="answer-record__name">${escapeHtml(record.userName)}</span>
        </div>
      </div>
      ${
        briefMode
          ? ''
          : `
      <div class="answer-record__body">
        <div class="answer-record__image-wrap" style="${escapeAttribute(imageStyle)}">
          <img class="answer-record__image" src="${escapeAttribute(record.image)}" />
        </div>
      <div class="answer-record__meta">
        <span class="answer-record__time">${escapeHtml(record.answeredAt)}</span>
      </div>
      </div>
      ${renderLikeMount({
        liked,
        count: likes,
        size: 'sm',
        className: 'answer-record__likes',
        iconSize: '34rpx',
        fontSize: '26rpx',
      })}
      `
      }
    </div>
  `
}

function renderLikeMount(options: {
  liked: boolean
  count: string | number
  size: 'sm' | 'md' | 'lg'
  className?: string
  iconSize?: string
  fontSize?: string
}) {
  return `
    <div
      class="question-global-transition__like-mount"
      data-transition-like="1"
      data-liked="${options.liked ? '1' : '0'}"
      data-count="${escapeAttribute(options.count)}"
      data-size="${options.size}"
      data-button-class="${escapeAttribute(options.className ?? '')}"
      ${options.iconSize ? `data-icon-size="${escapeAttribute(options.iconSize)}"` : ''}
      ${options.fontSize ? `data-font-size="${escapeAttribute(options.fontSize)}"` : ''}
    ></div>
  `
}

function getRatioStyle(width: number, height: number) {
  const ratio = width > 0 && height > 0 ? (height / width) * 100 : 75

  return `padding-bottom: ${ratio}%;`
}

function getAnswerRecordImageStyle(record: AnswerRecord) {
  const size = getScaledRecordImageSize(record.imageWidth, record.imageHeight)

  return `width: ${rpxToPx(size.width)}px; height: ${rpxToPx(size.height)}px;`
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: string | number | null | undefined) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}
