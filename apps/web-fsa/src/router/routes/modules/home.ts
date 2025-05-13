import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:home',
      order: 1,
      title: $t('page.home.title', { defaultValue: '主页' }),
    },
    name: 'Home',
    path: '/home',
    children: [
      {
        name: 'Workspace',
        path: '/home/workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.home.workspace', { defaultValue: '工作台' }),
        },
      },
      {
        name: 'AccountManage',
        path: '/home/account',
        component: () => import('#/views/home/account/index.vue'),
        meta: {
          icon: 'lucide:user-circle',
          title: $t('page.home.accountManage', { defaultValue: '个人中心' }),
        },
      },
      {
        name: 'UserManage',
        path: '/home/user',
        component: () => import('#/views/home/user/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('page.home.userManage', { defaultValue: '用户管理' }),
        },
      },
      {
        name: 'ActivityManage',
        path: '/home/activity',
        component: () => import('#/views/home/activity/index.vue'),
        meta: {
          icon: 'lucide:calendar',
          title: $t('page.home.activityManage', { defaultValue: '活动管理' }),
        },
      },
      {
        name: 'TaskManage',
        path: '/home/task',
        component: () => import('#/views/home/task/index.vue'),
        meta: {
          icon: 'lucide:list-todo',
          title: $t('page.home.taskManage', { defaultValue: '任务管理' }),
        },
      },
    ],
  },
];

export default routes;
