<script setup lang="ts">
import { $t } from '#/locales';
// 活动管理页面逻辑
</script>

<template>
  <div class="p-4">
    <h1 class="mb-4 text-2xl font-bold">{{ $t('page.activity.title') }}</h1>
    <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <p>{{ $t('page.activity.content') }}</p>
    </div>
  </div>
</template>
