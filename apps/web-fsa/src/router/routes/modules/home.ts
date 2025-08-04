import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:home',
      order: 1,
      title: $t('page.home.title'),
    },
    name: 'Home',
    path: '/home',
    children: [
      {
        name: 'Workspace',
        path: '/home/workspace',
        component: () => import('#/views/home/workspace/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.home.workspace'),
        },
      },
      {
        name: 'AccountManage',
        path: '/home/account',
        component: () => import('#/views/home/account/index.vue'),
        meta: {
          icon: 'lucide:user-circle',
          title: $t('page.home.accountManage'),
        },
      },
      {
        name: 'UserManage',
        path: '/home/user',
        component: () => import('#/views/home/user/index.vue'),
        meta: {
          authority: ['ADMIN'],
          icon: 'lucide:users',
          title: $t('page.home.userManage'),
        },
      },
      {
        name: 'ActivityManage',
        path: '/home/activity',
        component: () => import('#/views/home/activity/index.vue'),
        meta: {
          authority: ['ADMIN'],
          icon: 'lucide:calendar',
          title: $t('page.home.activityManage'),
        },
      },
      {
        name: 'AccountInfoManage',
        path: '/home/account-info',
        component: () => import('#/views/home/account-info/index.vue'),
        meta: {
          icon: 'lucide:list-todo',
          title: $t('page.home.accountInfoManage'),
        },
      },
      {
        name: 'LorealDatabase',
        path: '/home/loreal-database',
        component: () => import('#/views/home/loreal-database/index.vue'),
        meta: {
          authority: ['ADMIN'],
          icon: 'lucide:database',
          title: $t('page.home.lorealDatabase'),
        },
      },
    ],
  },
];

export default routes;
