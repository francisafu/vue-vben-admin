import type { RouteRecordRaw } from 'vue-router';

import { VBEN_LOGO_URL } from '@vben/constants';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 3,
      title: $t('page.maintain.title', { defaultValue: '运维' }),
    },
    name: 'Maintain',
    path: '/maintain',
    children: [
      {
        name: 'Analytics',
        path: '/maintain/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.maintain.analytics', { defaultValue: '分析页' }),
        },
      },
      {
        name: 'AntDesignDemos',
        path: '/maintain/demos',
        component: () => import('#/views/demos/antd/index.vue'),
        meta: {
          icon: 'ic:baseline-view-in-ar',
          title: $t('page.maintain.demo', { defaultValue: '演示' }),
        },
      },
      {
        name: 'VbenAbout',
        path: '/maintain/about',
        component: () => import('#/views/_core/about/index.vue'),
        meta: {
          icon: 'lucide:copyright',
          title: $t('page.maintain.about', { defaultValue: '关于' }),
        },
      },
    ],
  },
];

export default routes;