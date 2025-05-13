import type { RouteRecordRaw } from 'vue-router';
import { BasicLayout, IFrameView } from '#/layouts';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:globe',
      order: 2,
      title: $t('page.official.title', { defaultValue: '官网' }),
    },
    name: 'Official',
    path: '/official',
    children: [
      {
        name: 'Loreal',
        path: '/official/loreal',
        component: IFrameView,
        meta: {
          icon: 'mdi:lipstick',
          link: 'https://www.loreal-boutique.com/',
          title: $t('page.official.loreal'),
        },
      },
      {
        name: 'Estee',
        path: '/official/estee',
        component: IFrameView,
        meta: {
          icon: 'mdi:flower-outline',
          link: 'https://elc.vipsale.cn/',
          title: $t('page.official.estee'),
        },
      },
      {
        name: 'Loccitane',
        path: '/official/loccitane',
        component: IFrameView,
        meta: {
          icon: 'lucide:sparkles',
          link: 'https://loccitane.vipsale.cn/',
          title: $t('page.official.loccitane'),
        },
      },
    ],
  },
];

export default routes;
