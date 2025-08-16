<script setup lang="ts">
/**
 * 全局暗水印组件
 * 在应用中自动添加不可见的安全水印
 */
import { useBlindWatermark } from '#/composables/useBlindWatermark';

// 初始化暗水印
useBlindWatermark();
</script>

<template>
  <!-- 暗水印组件无需渲染任何内容 -->
</template>
