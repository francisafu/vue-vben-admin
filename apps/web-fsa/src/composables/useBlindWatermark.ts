/**
 * 暗水印管理组合式函数
 * 使用 watermark-js-plus 的 BlindWatermark 实现不可见水印
 */
import { onMounted, onUnmounted, watch } from 'vue';
import type { BlindWatermark as BlindWatermarkType } from 'watermark-js-plus';
import { useUserStore } from '@vben/stores';
import { preferences } from '@vben/preferences';
import type { ExtendedUserInfo } from '#/types/user';
import dayjs from 'dayjs';

let blindWatermarkInstance: BlindWatermarkType | null = null;
let updateTimer: NodeJS.Timeout | null = null;

export function useBlindWatermark() {
  const userStore = useUserStore();

  /**
   * 获取水印内容
   */
  function getWatermarkContent(): string {
    // 使用类型断言，因为后端实际返回了 phone 字段，只是类型定义中没有
    const userInfo = userStore.userInfo as ExtendedUserInfo | null;
    let userText = '未登录';
    
    if (userInfo) {
      const username = userInfo.username || userInfo.realName || '未知用户';
      const phone = userInfo.phone || '未知手机';
      userText = `${username}\n${phone}`;
    }
    
    const currentDate = dayjs().format('YYYY-MM-DD');
    
    // 多行文本格式，每行独立显示
    return `内购助手\n${userText}\n${currentDate}`;
  }

  /**
   * 检查是否为深色主题
   */
  function isDarkTheme(): boolean {
    // 检查 HTML 元素是否有 dark 类
    return document.documentElement.classList.contains('dark') || 
           preferences.theme.mode === 'dark';
  }

  /**
   * 创建或更新暗水印
   */
  async function createOrUpdateWatermark() {
    try {
      // 动态导入 watermark-js-plus
      const { BlindWatermark } = await import('watermark-js-plus');
      
      // 先销毁现有的水印
      if (blindWatermarkInstance) {
        blindWatermarkInstance.destroy();
        blindWatermarkInstance = null;
      }

      // 创建新的暗水印
      blindWatermarkInstance = new BlindWatermark({
        contentType: 'multi-line-text',
        content: getWatermarkContent(),
        fontSize: '30px',  // 增大字号，从14调整到20
        width: 200,    // 增加宽度以适应更大的字
        height: 200,   // 增加高度
        fontColor: isDarkTheme() ? '#fff' : '#000',
        // 暗水印特有参数
        globalAlpha: 0.005, // 极低的透明度，使水印几乎不可见
        mode: 'blind', // 暗水印模式
        onSuccess: () => {
          console.log('暗水印创建成功');
        }
      });

      blindWatermarkInstance.create();
    } catch (error) {
      console.error('加载 watermark-js-plus 失败:', error);
    }
  }

  /**
   * 销毁暗水印
   */
  function destroyWatermark() {
    if (blindWatermarkInstance) {
      blindWatermarkInstance.destroy();
      blindWatermarkInstance = null;
    }
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  }

  /**
   * 初始化暗水印
   */
  function initWatermark() {
    // 创建水印
    createOrUpdateWatermark();
    
    // 每天更新一次日期（午夜更新）
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // 设置定时器在午夜更新
    setTimeout(() => {
      createOrUpdateWatermark();
      // 然后每24小时更新一次
      updateTimer = setInterval(() => {
        createOrUpdateWatermark();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    // 监听用户信息变化
    watch(
      () => userStore.userInfo as ExtendedUserInfo | null,
      () => {
        createOrUpdateWatermark();
      },
      { deep: true }
    );
    
    // 监听主题变化
    watch(
      () => preferences.theme.mode,
      () => {
        createOrUpdateWatermark();
      }
    );
    
    // 监听暗色模式类变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target === document.documentElement) {
            createOrUpdateWatermark();
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // 组件卸载时断开观察
    onUnmounted(() => {
      observer.disconnect();
    });
  }

  // 组件挂载时初始化
  onMounted(() => {
    initWatermark();
  });

  // 组件卸载时清理
  onUnmounted(() => {
    destroyWatermark();
  });

  return {
    createOrUpdateWatermark,
    destroyWatermark,
    getWatermarkContent
  };
}
