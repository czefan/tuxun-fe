<script setup lang="ts">
import PhotoFeed from '@/features/photo/components/photo-feed.vue'

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '%page.home%',
    enablePullDownRefresh: true,
  },
})
</script>

<template>
  <PhotoFeed activity-status="active" />
</template>
