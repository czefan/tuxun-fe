<template>
  <view
    :id="`question-card-${item.id}`"
    class="activity-card"
    :class="{ 'activity-card--opening': opening }"
    @tap="$emit('open', item)"
  >
    <view class="activity-card__cover" :style="coverStyle">
      <image
        class="activity-card__image"
        :src="item.cover"
        lazy-load
        mode="aspectFill"
      />
      <view v-if="hasCoverBadge" class="activity-card__cover-mask" />
      <text v-if="item.overlayText" class="activity-card__overlay-text">
        {{ item.overlayText }}
      </text>
    </view>

    <view class="activity-card__body">
      <text class="activity-card__title">{{ item.title }}</text>
      <view class="activity-card__meta">
        <view class="activity-card__author">
          <view class="activity-card__avatar">
            <text class="activity-card__avatar-text">{{ item.avatar }}</text>
          </view>
          <text class="activity-card__author-name">{{ item.author }}</text>
        </view>
        <like-button
          :liked="liked"
          :count="displayedHeat"
          size="sm"
          class="activity-card__like-btn"
          @click="toggleLike"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuestionLikeStore } from '@/store/questionLike'
import type { QuestionCard } from '@/features/questions'
import { useAuth } from '@/composables/useAuth'
import { getDisplayedHeat } from '@/utils'

const props = defineProps<{
  item: QuestionCard
  opening?: boolean
}>()

defineEmits<{
  (event: 'open', item: QuestionCard): void
}>()

const questionLikeStore = useQuestionLikeStore()
const { ensureLogin } = useAuth()
const hasCoverBadge = computed(() => Boolean(props.item.overlayText))
const coverStyle = computed(() => ({
  paddingBottom: `${(props.item.coverHeight / props.item.coverWidth) * 100}%`,
}))
const liked = computed(() => questionLikeStore.getQuestionLiked(props.item.id, props.item.liked))
const displayedHeat = computed(() => getDisplayedHeat(props.item.heat, liked.value))

async function toggleLike() {
  if (!(await ensureLogin())) {
    return
  }

  questionLikeStore.toggleQuestionLiked(props.item.id, props.item.liked)
}
</script>

<style lang="scss">
@import './activity-card.scss';
</style>
